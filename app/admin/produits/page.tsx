// Page de gestion des produits
"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ProductsTable from "@/components/admin/products-table"
import ProductForm from "@/components/admin/product-form"
import { Plus, Download, Upload } from "lucide-react"
import { products as initialProducts } from "@/data/products"
import type { Product } from "@/types/product"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateProduct = () => {
    setEditingProduct(undefined)
    setIsFormOpen(true)
  }

  const handleEditProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  const handleViewProduct = (productId: string) => {
    console.log("Voir produit:", productId)
    // Redirection vers la page de détail du produit
  }

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      setProducts((prev) => prev.filter((p) => p.id !== productId))
    }
  }

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: newStock, inStock: newStock > 0 } : p)))
  }

  const handleSubmitProduct = async (productData: Partial<Product>) => {
    setIsLoading(true)

    try {
      // Simulation d'appel API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (editingProduct) {
        // Mise à jour
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...productData, updatedAt: new Date() } : p)),
        )
      } else {
        // Création
        const newProduct: Product = {
          id: Date.now().toString(),
          ...(productData as Product),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setProducts((prev) => [...prev, newProduct])
      }

      setIsFormOpen(false)
      setEditingProduct(undefined)
      return { success: true }
    } catch (error) {
      return { success: false, error: "Erreur lors de la sauvegarde" }
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportProducts = () => {
    const dataStr = JSON.stringify(products, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `produits-${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const handleImportProducts = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const importedProducts = JSON.parse(e.target?.result as string)
            setProducts((prev) => [...prev, ...importedProducts])
          } catch (error) {
            alert("Erreur lors de l'import du fichier")
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des produits</h1>
          <p className="text-gray-600">Gérez votre catalogue de pneumatiques</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportProducts}>
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button variant="outline" onClick={handleExportProducts}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={handleCreateProduct} className="bg-yellow-500 hover:bg-yellow-600 text-black">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau produit
          </Button>
        </div>
      </div>

      <ProductsTable
        products={products}
        onViewProduct={handleViewProduct}
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleDeleteProduct}
        onUpdateStock={handleUpdateStock}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSubmit={handleSubmitProduct}
            onCancel={() => setIsFormOpen(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
