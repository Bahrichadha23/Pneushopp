"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building,
  Search,
  Mail,
  Phone,
  Star,
  Package,
  Pencil,
  Trash,
} from "lucide-react";
import type { Supplier } from "@/types/supplier";
import {
  fetchSuppliers,
  createSupplier,
  deleteSupplier,
  updateSupplier,
} from "@/lib/services/supplier";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  if (user && user.role !== "admin" && user.role !== "purchasing") {
    router.push("/admin"); // or show "Access Denied"
    return null;
  }
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          console.error("No token found in localStorage");
          return;
        }
        const data = await fetchSuppliers(token);
        setFournisseurs(data);
      } catch (err) {
        console.error("Erreur lors du fetch fournisseurs:", err);
      }
    };
    loadSuppliers();
  }, []);
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };
  const handleCreate = async (data: Supplier) => {
    try {
      const newSupplier = await createSupplier(data);
      setFournisseurs([...fournisseurs, newSupplier]);
      setShowCreateModal(false);
    } catch (err) {
      console.error("Erreur création fournisseur:", err);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowCreateModal(true);
  };

  const handleUpdate = async (id: number, data: Partial<Supplier>) => {
    try {
      const updated = await updateSupplier(id, data);
      setFournisseurs(fournisseurs.map((f) => (f.id === id ? updated : f)));
      setEditingSupplier(null);
      setShowCreateModal(false);
    } catch (err) {
      console.error("Erreur modification fournisseur:", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSupplier(id);
      setFournisseurs(fournisseurs.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Erreur suppression fournisseur:", err);
    }
  };

  const filteredFournisseurs = fournisseurs.filter(
    (f) =>
      (f.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.contact_person ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const moyenneEvaluation =
    fournisseurs.reduce((sum, f) => sum + f.rating, 0) / fournisseurs.length;
  function formatDate(date: { toISOString: () => string }) {
    return date.toISOString().split("T")[0]; // gives YYYY-MM-DD
  }
  const handleCreatePurchaseOrder = async (supplierId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      console.log("Token:", token);
      const res = await fetch(`${API_URL}/purchase-orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          fournisseur: supplierId,
          statut: "en_attente",
          priorite: "normale",
          articles: [
            { id: 1, nom: "Article par défaut", quantite: 1, prix_unitaire: 0 },
          ],
          total_ht: 0,
          total_ttc: 0,
          date_commande: formatDate(new Date()), // current date
          date_livraison_prevue: formatDate(
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          ), // +7 days
        }),
      });
      console.log("Response status:", res.status);
      if (!res.ok) throw new Error("Erreur création commande");
      const newBon = await res.json();
      console.log("Bon créé:", newBon);

      // optional: redirect to bons page
      window.location.href = "/admin/bons-commande";
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestion des fournisseurs
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {filteredFournisseurs.length} fournisseurs
          </Badge>
          <Button
            size="sm"
            onClick={() => {
              setEditingSupplier(null);
              setShowCreateModal(true);
            }}
          >
            Ajouter un fournisseur
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">
              Fournisseurs actifs
            </CardTitle>
            <Building className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fournisseurs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">
              Évaluation moyenne
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {moyenneEvaluation.toFixed(1)}/5
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Délai moyen</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3-5 jours</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 sm:hidden">
        {filteredFournisseurs.map((f) => (
          <Card key={f.id} className="p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">{f.name}</div>
              <Badge
                variant={f.status === "active" ? "default" : "destructive"}
              >
                {f.status}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex items-center">
                <Mail className="h-3 w-3 mr-1" /> {f.email}
              </div>
              <div className="flex items-center">
                <Phone className="h-3 w-3 mr-1" /> {f.phone}
              </div>
              <div className="flex items-center">
                <Package className="h-3 w-3 mr-1" /> {f.delivery_time}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {Array.isArray(f.specialties) &&
                  f.specialties.map((s, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {s}
                    </Badge>
                  ))}
              </div>
              <div className="flex mt-1">{renderStars(f.rating)}</div>
            </div>
            <div className="mt-2 flex justify-end">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(f)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(f.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCreatePurchaseOrder(f.id)}
                >
                  Commander
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <Card>
          <CardHeader>
            <CardTitle>Liste des fournisseurs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Coordonnées</TableHead>
                  <TableHead>Spécialités</TableHead>
                  <TableHead>Évaluation</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Délai livraison</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFournisseurs.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell>{f.contact_person}</TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1 text-sm">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" /> {f.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" /> {f.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {f.specialties.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex">{renderStars(f.rating)}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{f.orders_count}</Badge>
                    </TableCell>
                    <TableCell>{f.delivery_time}</TableCell>
                    <TableCell className="flex gap-2">
                      <div className="mt-2 flex justify-end">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(f)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(f.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreatePurchaseOrder(f.id)}
                      >
                        Commander
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSupplier
                ? "Modifier le fournisseur"
                : "Nouveau fournisseur"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);

              const data: Supplier = {
                id: editingSupplier?.id ?? 0,
                name: formData.get("nom") as string,

                contact_person: formData.get("contact") as string,
                email: formData.get("email") as string,
                address: formData.get("adresse") as string,
                phone: formData.get("telephone") as string,
                status: formData.get("statut") as "active" | "inactive",
                rating: Number(formData.get("evaluation")) || 0,
                orders_count: editingSupplier?.orders_count ?? 0, // backend may override this
                delivery_time: formData.get("delaiLivraison") as string,
                specialties:
                  (formData.get("specialites") as string)
                    ?.split(",")
                    .map((s) => s.trim()) ?? [],
              };

              if (editingSupplier) {
                handleUpdate(editingSupplier.id, data);
              } else {
                handleCreate(data);
              }
            }}
            className="space-y-3"
          >
            {/* Nom entreprise */}
            <Input
              name="nom"
              placeholder="Nom entreprise"
              defaultValue={editingSupplier?.name}
              required
            />

            {/* Contact */}
            <Input
              name="contact"
              placeholder="Nom du contact"
              defaultValue={editingSupplier?.contact_person}
              required
            />

            {/* Email */}
            <Input
              name="email"
              type="email"
              placeholder="Email"
              defaultValue={editingSupplier?.email}
              required
            />

            {/* Adresse */}
            <Input
              name="adresse"
              placeholder="Adresse"
              defaultValue={editingSupplier?.address}
            />

            {/* Téléphone */}
            <Input
              name="telephone"
              placeholder="Téléphone"
              defaultValue={editingSupplier?.phone}
            />

            {/* Statut (dropdown actif/inactif) */}
            <select
              name="statut"
              defaultValue={editingSupplier?.status ?? "actif"}
              className="w-full border rounded p-2"
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>

            {/* Évaluation */}
            <Input
              name="evaluation"
              type="number"
              min={0}
              max={5}
              step={1}
              placeholder="Évaluation (0-5)"
              defaultValue={editingSupplier?.rating}
            />

            {/* Délai de livraison */}
            <Input
              name="delaiLivraison"
              placeholder="Délai de livraison (ex: 3-5 jours)"
              defaultValue={editingSupplier?.delivery_time}
            />

            {/* Spécialités (comma separated) */}
            <Input
              name="specialites"
              placeholder="Spécialités (séparées par des virgules)"
              defaultValue={editingSupplier?.specialties?.join(", ")}
            />

            <div className="flex justify-end">
              <Button type="submit">
                {editingSupplier ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
