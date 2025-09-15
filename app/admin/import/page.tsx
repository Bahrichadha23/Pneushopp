"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Info } from "lucide-react"

interface ImportResult {
  message: string
  summary: {
    total_rows: number
    created: number
    updated: number
    errors: number
  }
  created_products: string[]
  updated_products: string[]
  errors: string[]
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setImportResult(null)
      setError(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('http://localhost:8000/api/products/import/excel/', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Import failed')
      }

      const result = await response.json()
      setImportResult(result)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during import')
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const downloadTemplate = () => {
    // Create sample Excel template data
    const templateData = [
      ['Product Name', 'PRIX TTC', 'DESCRIPTION', 'IMAGE'],
      ['Pneu CONTINENTAL 195/65R15 91H ULTRA CONTACT', '299.238', 'Points forts: Kilométrage ultra-élevé...', ''],
      ['Pneu CONTINENTAL 205/55 R16 91V Conti Premium Contact2', '310.474', 'Points forts: Freinage réactif...', '']
    ]
    
    alert('Template download would start here. For now, use the Excel file format: Product Name, PRIX TTC, DESCRIPTION, IMAGE')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Import des produits</h1>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger modèle
        </Button>
      </div>

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
              <h3 className="font-medium mb-2">Format de fichier supporté:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Excel (.xlsx, .xls)</li>
                <li>• Encodage UTF-8 recommandé</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Colonnes requises:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Nom du produit</strong> (première colonne)</li>
                <li>• <strong>PRIX TTC</strong> (prix en dinars)</li>
                <li>• <strong>DESCRIPTION</strong> (description détaillée)</li>
                <li>• <strong>IMAGE</strong> (optionnel)</li>
              </ul>
            </div>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Les produits seront automatiquement catégorisés selon la marque détectée dans le nom.
              Les tailles de pneus seront extraites automatiquement du nom du produit.
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
                disabled={isUploading}
                className="ml-4"
              >
                {isUploading ? 'Import en cours...' : 'Importer'}
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Import en cours...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
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
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.summary.created}
                </div>
                <div className="text-sm text-green-600">Produits créés</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {importResult.summary.updated}
                </div>
                <div className="text-sm text-yellow-600">Produits mis à jour</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.summary.errors}
                </div>
                <div className="text-sm text-red-600">Erreurs</div>
              </div>
            </div>

            {importResult.created_products.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Produits créés (premiers 10):</h3>
                <div className="space-y-1">
                  {importResult.created_products.map((product, index) => (
                    <Badge key={index} variant="secondary" className="mr-2 mb-1">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {importResult.updated_products.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Produits mis à jour (premiers 10):</h3>
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
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}