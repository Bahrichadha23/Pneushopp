"use client";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  History,
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

interface ImportFileEntry {
  job_id: string;
  filename: string;
  status: "uploaded" | "queued" | "processing" | "completed" | "failed";
  created_at: string;
  summary: {
    total_rows: number;
    created: number;
    errors: number;
  };
  message: string;
}

export default function ImportPage() {
  const [files, setFiles] = useState<ImportFileEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
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

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/products/import/files/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const data: ImportFileEntry[] = await res.json();
      if (isMountedRef.current) setFiles(data);
    } catch {}
  };

  useEffect(() => {
    fetchFiles();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Only allow admin
  if (user && user.role !== "admin") {
    router.push("/admin"); // or show "Access Denied"
    return null;
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    const input = event.target;
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/products/import/upload/`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Le téléversement a échoué");
      }

      await fetchFiles();
      showNotice("success", `Fichier "${selectedFile.name}" ajouté à la liste. Cliquez sur "Importer" pour l'extraire.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue pendant le téléversement");
      showNotice("error", err instanceof Error ? err.message : "Le téléversement a échoué");
    } finally {
      setIsUploading(false);
      if (input) input.value = "";
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
        const result: ImportResult = {
          message: statusData.message || "Import terminé",
          summary: {
            total_rows: statusData.summary.total_rows,
            created: statusData.summary.created,
            updated: 0,
            errors: statusData.summary.errors,
          },
          created_products: (statusData as any).created_names || [],
          updated_products: [],
          errors: statusData.errors || [],
        };
        setImportResult(result);
        setIsPolling(false);
        setActiveJobId(null);
        await fetchFiles();
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

  const handleRunImport = async (jobId: string) => {
    setActiveJobId(jobId);
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setImportResult(null);
    setJobStatus(null);
    setJobMessage(null);
    setLiveSummary(null);
    setNotice(null);
    processingNotifiedRef.current = false;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/products/import/files/${jobId}/run/`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "L'import a échoué");
      }

      const result: ImportStartResponse = await response.json();
      setJobStatus(result.status);
      setJobMessage(result.message || "Import en cours");
      setUploadProgress(15);
      await fetchFiles();

      await pollImportStatus(jobId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue pendant l'import"
      );
      setJobStatus("failed");
      showNotice("error", "Un problème est survenu pendant l'import. Vérifiez les erreurs affichées.");
      await fetchFiles();
    } finally {
      setIsUploading(false);
      setIsPolling(false);
      setActiveJobId(null);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDeleteFile = async (jobId: string, filename: string) => {
    if (!confirm(`Supprimer le fichier "${filename}" ? Les produits créés à partir de ce fichier seront retirés du catalogue (front et back).`)) {
      return;
    }
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/products/import/files/${jobId}/`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "La suppression a échoué");
      }
      const data = await response.json();
      showNotice("success", data.message || "Fichier supprimé.");
      await fetchFiles();
    } catch (err) {
      showNotice("error", err instanceof Error ? err.message : "La suppression a échoué");
    }
  };

  const downloadTemplate = () => {
    // Build CSV template with the expected columns
    const rows = [
      ["CATÉGORIE", "REFERENCE", "PRIX TTC", "DESCRIPTION", "IMAGE"],
      [
        "Tourisme",
        "Pneu CONTINENTAL 195/65R15 91H ULTRA CONTACT",
        "299.238",
        "Pneu été haute performance, kilométrage élevé",
        "",
      ],
      [
        "SUV",
        "Pneu MICHELIN 225/45R17 94W PILOT SPORT 4",
        "430.000",
        "Pneu sport haute performance pour SUV",
        "",
      ],
    ];

    const csvContent = rows
      .map((row) => row.map((cell) => `"${cell}"`).join(";"))
      .join("\n");

    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modele_import_pneushop.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="fixed right-4 top-4 z-[9999] max-w-md">
          <Alert
            className={
              notice.type === "success"
                ? "border-yellow-300 bg-yellow-50 shadow-lg"
                : notice.type === "error"
                ? "border-gray-300 bg-gray-50 shadow-lg"
                : "border-yellow-200 bg-yellow-50 shadow-lg"
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
              ? "border-yellow-200 bg-yellow-50"
              : notice.type === "error"
              ? "border-gray-300 bg-gray-50"
              : "border-yellow-200 bg-yellow-50"
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
              ? "border-yellow-200 bg-yellow-50"
              : statusBanner.type === "error"
              ? "border-gray-300 bg-gray-50"
              : "border-yellow-200 bg-yellow-50"
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
              <h3 className="font-medium mb-2">Colonnes attendues :</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • <strong>CATÉGORIE</strong> : catégorie / category / famille…
                </li>
                <li>
                  • <strong>RÉFÉRENCE</strong> : reference / designation / article…
                </li>
                <li>
                  • <strong>PRIX TTC</strong> : prix ttc / prix / tarif…
                </li>
                <li>
                  • <strong>DESCRIPTION</strong> (optionnel)
                </li>
                <li>
                  • <strong>IMAGE</strong> : url ou chemin de l'image (optionnel)
                </li>
              </ul>
            </div>
          </div>

          <Alert className="border-yellow-300 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-900 font-semibold">Important</AlertTitle>
            <AlertDescription className="text-yellow-800">
              <p className="leading-relaxed">
                L'import Excel met à jour uniquement le <strong className="font-semibold text-yellow-900">catalogue</strong> (descriptions,
                prix, images). Il n'ajoute <strong className="font-semibold text-yellow-900">aucun stock</strong> — le stock est géré
                exclusivement via la section <strong className="font-semibold text-yellow-900">Achats</strong>.
              </p>
            </AlertDescription>
          </Alert>

          <Alert className="bg-gray-50 border-gray-200">
            <AlertCircle className="h-4 w-4 text-gray-500" />
            <AlertDescription className="text-gray-600">
              <p className="leading-relaxed">
                Les noms de colonnes sont insensibles à la casse (majuscules/minuscules) et aux espaces supplémentaires.
                La marque, la taille et la saison sont extraites automatiquement du nom du produit.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* ===== RECAP après import ===== */}
      {importResult && (
        <Card className="border-2 border-yellow-300">
          <CardHeader className="bg-yellow-50 rounded-t-lg">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <CheckCircle className="h-6 w-6 text-yellow-600" />
                  Import terminé — Récapitulatif
                </CardTitle>
                <p className="text-sm text-yellow-700 mt-1">{importResult.message}</p>
              </div>
              <button
                onClick={() => setImportResult(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4"
                title="Fermer"
              >✕</button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">

            {/* Compteurs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-100 rounded-xl border border-gray-200">
                <div className="text-3xl font-bold text-gray-700">{importResult.summary.total_rows}</div>
                <div className="text-sm text-gray-600 mt-1">Lignes lues</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <div className="text-3xl font-bold text-yellow-700">{importResult.summary.created}</div>
                <div className="text-sm text-yellow-600 mt-1">Produits créés</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <div className="text-3xl font-bold text-yellow-700">{importResult.summary.updated}</div>
                <div className="text-sm text-yellow-600 mt-1">Mis à jour</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="text-3xl font-bold text-red-700">{importResult.summary.errors}</div>
                <div className="text-sm text-red-600 mt-1">Erreurs</div>
              </div>
            </div>

            {/* Liste des produits créés */}
            {importResult.created_products?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-yellow-500" />
                  Produits ajoutés au catalogue ({importResult.created_products.length})
                </h3>
                <div className="border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 text-gray-600 font-medium w-10">#</th>
                        <th className="text-left px-4 py-2 text-gray-600 font-medium">Nom du produit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.created_products.map((name, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                          <td className="px-4 py-2 text-gray-800">{name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Erreurs */}
            {importResult.errors.length > 0 && (
              <div>
                <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Lignes ignorées ({importResult.errors.length})
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {importResult.errors.map((err, i) => (
                    <div key={i} className="text-sm text-red-700 bg-red-50 border border-red-100 rounded px-3 py-2">
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      )}

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
                    {isUploading && !activeJobId ? "Téléversement en cours..." : "Cliquez pour sélectionner un fichier Excel"}
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    className="sr-only"
                    onChange={handleFileSelect}
                    disabled={isUploading || isPolling}
                  />
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Le fichier apparaîtra dans la liste ci-dessous. Cliquez ensuite sur "Importer" pour l'extraire.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des fichiers uploadés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Fichiers ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun fichier téléversé pour le moment.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-gray-600 font-medium">Nom du fichier</th>
                    <th className="text-left px-4 py-2 text-gray-600 font-medium">Statut</th>
                    <th className="text-left px-4 py-2 text-gray-600 font-medium">Date</th>
                    <th className="text-right px-4 py-2 text-gray-600 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f, i) => {
                    const isActive = activeJobId === f.job_id;
                    const statusLabel: Record<string, string> = {
                      uploaded: "En attente d'import",
                      queued: "En file d'attente",
                      processing: "Import en cours...",
                      completed: "Importé",
                      failed: "Échec",
                    };
                    const statusClass: Record<string, string> = {
                      uploaded: "text-gray-600",
                      queued: "text-yellow-600",
                      processing: "text-yellow-600",
                      completed: "text-green-600",
                      failed: "text-red-600",
                    };
                    return (
                      <tr key={f.job_id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                            <span className="font-medium text-gray-800">{f.filename}</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 font-medium ${statusClass[isActive && isPolling ? "processing" : f.status] || "text-gray-600"}`}>
                          {isActive && isPolling ? statusLabel.processing : (statusLabel[f.status] || f.status)}
                          {f.status === "completed" && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {f.summary.created} produit(s), {f.summary.errors} erreur(s)
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(f.created_at).toLocaleString("fr-FR", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleRunImport(f.job_id)}
                              disabled={isUploading || isPolling}
                              className="bg-yellow-500 hover:bg-yellow-600 text-black gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Importer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteFile(f.job_id, f.filename)}
                              disabled={isUploading || isPolling}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-1"
                            >
                              <X className="h-4 w-4" />
                              Supprimer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {(isUploading || isPolling) && activeJobId && (
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span>
                  {jobStatus === "queued"
                    ? "Fichier reçu, en attente de traitement..."
                    : "Traitement en cours..."}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
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

    </div>
  );
}
