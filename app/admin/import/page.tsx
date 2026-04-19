"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

interface ImportResult {
  message: string;
  summary: {
    total_rows: number;
    created: number;
    updated: number;
    errors: number;
  };
  created_products: string[];
  updated_products: string[];
  errors: string[];
}

interface ImportStartResponse {
  message: string;
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  status_endpoint?: string;
}

interface ImportStatusResponse {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  message: string;
  summary: {
    total_rows: number;
    created: number;
    errors: number;
    images_processed: boolean;
  };
  errors: string[];
}

interface LiveSummary {
  total_rows: number;
  created: number;
  errors: number;
}

type NoticeType = "success" | "info" | "error";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [jobStatus, setJobStatus] = useState<
    "queued" | "processing" | "completed" | "failed" | null
  >(null);
  const [jobMessage, setJobMessage] = useState<string | null>(null);
  const [liveSummary, setLiveSummary] = useState<LiveSummary | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: NoticeType; text: string } | null>(
    null
  );
  const isMountedRef = useRef(true);
  const processingNotifiedRef = useRef(false);
  const { user } = useAuth();
  const router = useRouter();

  const statusBanner = (() => {
    if (jobStatus === "queued") {
      return {
        type: "info" as NoticeType,
        text: "Téléversement terminé : le fichier a été reçu et placé dans la file de traitement.",
      };
    }
    if (jobStatus === "processing") {
      return {
        type: "info" as NoticeType,
        text: "Traitement en cours : extraction et création des produits...",
      };
    }
    if (jobStatus === "completed") {
      return {
        type: "success" as NoticeType,
        text: "Terminé : extraction finalisée, produits créés avec succès.",
      };
    }
    if (jobStatus === "failed") {
      return {
        type: "error" as NoticeType,
        text: "Échec de l'import : consultez les détails dans la section des erreurs.",
      };
    }
    return null;
  })();

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Only allow admin
  if (user && user.role !== "admin") {
    router.push("/admin"); // or show "Access Denied"
    return null;
  }
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
      setError(null);
      setJobStatus(null);
      setJobMessage(null);
      setLiveSummary(null);
    }
  };

  const sleep = (ms: number) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  const showNotice = (type: NoticeType, text: string) => {
    setNotice({ type, text });

    setTimeout(() => {
      setNotice((current) => (current?.text === text ? null : current));
    }, 6000);
  };

  const pollImportStatus = async (jobId: string) => {
    setIsPolling(true);
    const maxAttempts = 300; // ~10 minutes (300 * 2s)

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const statusToken = localStorage.getItem("access_token");
      const statusResponse = await fetch(
        `${API_URL}/products/import/status/${jobId}/`,
        {
          method: "GET",
          headers: statusToken ? { Authorization: `Bearer ${statusToken}` } : {},
        }
      );

      if (!statusResponse.ok) {
        throw new Error("Impossible de récupérer le statut de l'import");
      }

      const statusData: ImportStatusResponse = await statusResponse.json();

      if (!isMountedRef.current) {
        return;
      }

      setJobStatus(statusData.status);
      setJobMessage(statusData.message || null);
      setLiveSummary({
        total_rows: statusData.summary.total_rows,
        created: statusData.summary.created,
        errors: statusData.summary.errors,
      });

      const processedRows = statusData.summary.created + statusData.summary.errors;
      const totalRows = statusData.summary.total_rows;
      if (totalRows > 0) {
        const calculated = Math.min(
          98,
          Math.max(20, Math.round((processedRows / totalRows) * 100))
        );
        setUploadProgress(calculated);
      }

      if (statusData.status === "queued") {
        setUploadProgress(20);
      }

      if (statusData.status === "processing" && !processingNotifiedRef.current) {
        processingNotifiedRef.current = true;
        showNotice("info", "Téléversement validé. L'extraction et la création des produits ont commencé.");
      }

      if (statusData.status === "completed") {
        setUploadProgress(100);
        showNotice("success", "Extraction terminée. Les produits ont été créés avec succès.");
        setImportResult({
          message: statusData.message || "Import terminé",
          summary: {
            total_rows: statusData.summary.total_rows,
            created: statusData.summary.created,
            updated: 0,
            errors: statusData.summary.errors,
          },
          created_products: [],
          updated_products: [],
          errors: statusData.errors || [],
        });
        setIsPolling(false);
        return;
      }

      if (statusData.status === "failed") {
        const firstError = statusData.errors?.[0];
        showNotice("error", "L'import a échoué. Consultez les détails dans la section des erreurs.");
        throw new Error(firstError || statusData.message || "L'import a échoué");
      }

      await sleep(2000);
    }

    throw new Error("L'import prend trop de temps. Veuillez réessayer dans un moment.");
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setImportResult(null);
    setJobStatus(null);
    setJobMessage(null);
    setLiveSummary(null);
    setNotice(null);
    processingNotifiedRef.current = false;

    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/products/import/excel/`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "L'import a échoué");
      }

      const result: ImportStartResponse = await response.json();

      if (!result.job_id) {
        throw new Error("Aucun identifiant de job reçu du serveur");
      }

      setJobStatus(result.status);
      setJobMessage(result.message || "Import en file d'attente");
      setUploadProgress(15);
      showNotice("success", "Fichier téléversé avec succès. Traitement en file d'attente côté serveur.");

      await pollImportStatus(result.job_id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue pendant l'import"
      );
      setJobStatus("failed");
      showNotice("error", "Un problème est survenu pendant l'import. Vérifiez les erreurs affichées.");
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setIsUploading(false);
      setIsPolling(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const downloadTemplate = () => {
    // Create sample Excel template data
    const templateData = [
      ["Product Name", "PRIX TTC", "DESCRIPTION", "IMAGE"],
      [
        "Pneu CONTINENTAL 195/65R15 91H ULTRA CONTACT",
        "299.238",
        "Points forts: Kilométrage ultra-élevé...",
        "",
      ],
      [
        "Pneu CONTINENTAL 205/55 R16 91V Conti Premium Contact2",
        "310.474",
        "Points forts: Freinage réactif...",
        "",
      ],
    ];

    alert(
      "Template download would start here. For now, use the Excel file format: Product Name, PRIX TTC, DESCRIPTION, IMAGE"
    );
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="fixed right-4 top-4 z-[9999] max-w-md">
          <Alert
            className={
              notice.type === "success"
                ? "border-green-300 bg-green-50 shadow-lg"
                : notice.type === "error"
                ? "border-red-300 bg-red-50 shadow-lg"
                : "border-blue-300 bg-blue-50 shadow-lg"
            }
          >
            {notice.type === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription className="font-medium">{notice.text}</AlertDescription>
          </Alert>
        </div>
      )}

      {notice && (
        <Alert
          className={
            notice.type === "success"
              ? "border-green-200 bg-green-50"
              : notice.type === "error"
              ? "border-red-200 bg-red-50"
              : "border-blue-200 bg-blue-50"
          }
        >
          {notice.type === "error" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertDescription className="font-medium">{notice.text}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Import des produits
        </h1>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger modèle
        </Button>
      </div>

      {statusBanner && (
        <Alert
          className={
            statusBanner.type === "success"
              ? "border-green-200 bg-green-50"
              : statusBanner.type === "error"
              ? "border-red-200 bg-red-50"
              : "border-blue-200 bg-blue-50"
          }
        >
          {statusBanner.type === "error" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertDescription className="font-medium">{statusBanner.text}</AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="h-5 w-5 mr-2" />
            Instructions d'import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Format de fichier supporté :</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Excel (.xlsx, .xls)</li>
                <li>• Plusieurs feuilles acceptées (toutes seront fusionnées)</li>
                <li>• Pas de limite de lignes</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Colonnes reconnues :</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • <strong>Nom</strong> : NOM, REFERENCE, DESIGNATION, LIBELLE, ARTICLE…
                </li>
                <li>
                  • <strong>Prix</strong> : PRIX TTC, PRIX, PRIX VENTE, TARIF…
                </li>
                <li>
                  • <strong>DESCRIPTION</strong> (optionnel)
                </li>
                <li>
                  • <strong>STOCK</strong> (optionnel, défaut : 10)
                </li>
              </ul>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Les noms de colonnes sont insensibles à la casse (majuscules/minuscules) et aux espaces supplémentaires.
              La marque, la taille et la saison sont extraites automatiquement du nom du produit.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Sélectionner le fichier Excel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Cliquez pour sélectionner un fichier Excel
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    className="sr-only"
                    onChange={handleFileSelect}
                  />
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Ou glissez-déposez votre fichier ici
                </p>
              </div>
            </div>
          </div>

          {file && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                onClick={handleImport}
                disabled={isUploading || isPolling}
                className="ml-4"
              >
                {isUploading || isPolling ? "Import en cours..." : "Importer"}
              </Button>
            </div>
          )}

          {(isUploading || isPolling) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {jobStatus === "queued"
                    ? "Fichier reçu, en attente de traitement..."
                    : "Traitement en cours..."}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              {jobStatus && (
                <div className="text-xs text-gray-600">
                  Statut: <strong>{jobStatus}</strong>
                </div>
              )}
              {liveSummary && liveSummary.total_rows > 0 && (
                <div className="text-xs text-gray-600">
                  Produits créés en direct: <strong>{liveSummary.created}</strong>
                  {" / "}
                  <strong>{liveSummary.total_rows}</strong>
                  {" | Erreurs: "}
                  <strong>{liveSummary.errors}</strong>
                </div>
              )}
              {jobMessage && (
                <div className="text-xs text-gray-600">{jobMessage}</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Résultats de l'import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.summary.total_rows}
                </div>
                <div className="text-sm text-blue-600">Lignes traitées</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.summary.created}
                </div>
                <div className="text-sm text-green-600">Produits créés</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {importResult.summary.updated}
                </div>
                <div className="text-sm text-yellow-600">
                  Produits mis à jour
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.summary.errors}
                </div>
                <div className="text-sm text-red-600">Erreurs</div>
              </div>
            </div>

            {importResult.created_products?.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">
                  Produits créés (premiers 10):
                </h3>
                <div className="space-y-1">
                  {importResult.created_products.map((product, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="mr-2 mb-1"
                    >
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {importResult.updated_products?.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">
                  Produits mis à jour (premiers 10):
                </h3>
                <div className="space-y-1">
                  {importResult.updated_products.map((product, index) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-1">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Erreurs (premières 10):</h3>
                <div className="space-y-1">
                  {importResult.errors.map((error, index) => (
                    <Alert key={index} variant="destructive" className="mb-2">
                      <AlertDescription className="text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
