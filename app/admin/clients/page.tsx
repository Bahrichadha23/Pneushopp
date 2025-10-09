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
import { Users, Search, Mail, Phone, MapPin, Star } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function ClientsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Only allow admin or sales
  if (user && user.role !== "admin" && user.role !== "sales") {
    router.push("/admin"); // or show "Access Denied"
    return null;
  }
  const [clients, setClients] = useState<any[]>([]); // 👈 start empty
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("tous");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  // useEffect(() => {
  //   const fetchClients = async () => {
  //     try {
  //       const token = localStorage.getItem("access_token");
  //       if (!token) {
  //         console.error("No access token found");
  //         return;
  //       }

  //       const res = await fetch("http://127.0.0.1:8000/api/clients/", {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //       });


  //       if (!res.ok) {
  //         throw new Error(`Erreur: ${res.status} ${res.statusText}`);
  //       }

  //       const data = await res.json();
  //       console.log(data);
  //       setClients(data);
  //     } catch (error) {
  //       console.error("Erreur lors du chargement des clients:", error);
  //     }
  //   };
  //   fetchClients();
  // }, []);
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          console.error("No access token found");
          return;
        }

        const res = await fetch("http://127.0.0.1:8000/api/clients/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Erreur: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log("All users:", data);

        // ✅ Filter only users with role = "customer"
        const customers = data.filter((user) => user.role === "customer");
        console.log("Filtered customers:", customers);

        setClients(customers);
      } catch (error) {
        console.error("Erreur lors du chargement des clients:", error);
      }
    };

    fetchClients();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: "TND",
    }).format(amount);

  const getClientTypeBadge = (role: string) =>
    role === "admin" ? (
      <Badge className="bg-blue-500">Admin</Badge>
    ) : (
      <Badge variant="secondary">Customer</Badge>
    );

  const filteredClients = clients.filter((client) => {
    const fullName = `${client.firstName} ${client.lastName}`.trim();
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "tous" || client.role === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleViewClient = (client: any) => {
    setSelectedClient(client);
    setShowClientDetails(true);
  };

  const handleCloseClientDetails = () => {
    setSelectedClient(null);
    setShowClientDetails(false);
  };
  const professionnels = clients.filter(
    (c) => c.type === "professionnel"
  ).length;
  const particuliers = clients.filter((c) => c.type === "particulier").length;
  const totalCA = clients.reduce((sum, client) => sum + client.montantTotal, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Gestion des clients
        </h1>
        <Badge variant="secondary" className="text-sm">
          {filteredClients.length} clients
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Total clients</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">
              Professionnels
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {professionnels}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Particuliers</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {particuliers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">CA Total</CardTitle>
            <span className="h-4 w-4 text-green-500">€</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalCA)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <select
          className="rounded border border-gray-300 px-3 py-2"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="tous">Tous les types</option>
          <option value="professionnel">Professionnels</option>
          <option value="particulier">Particuliers</option>
        </select>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 sm:hidden">
        {filteredClients.map((client) => (
          <Card key={client.id} className="p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">
                {`${client.firstName} ${client.lastName}`.trim()}
              </div>
              {getClientTypeBadge(client.type)}
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <div className="flex items-center">
                <Mail className="h-3 w-3 mr-1" /> {client.email}
              </div>
              <div className="flex items-center">
                <Phone className="h-3 w-3 mr-1" /> {client.telephone}
              </div>
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />{" "}
                <span className="truncate">{client.adresse}</span>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Inscription: {client.dateInscription}</span>
                <span>Commandes: {client.totalCommandes}</span>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>CA: {formatCurrency(client.montantTotal)}</span>
                <span>Dernière: {client.derniereCommande}</span>
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewClient(client)}
              >
                Voir détails
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <Card>
          <CardHeader>
            <CardTitle>Liste des clients</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom/Entreprise</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>CA Total</TableHead>
                  <TableHead>Dernière commande</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {`${client.firstName} ${client.lastName}`.trim()}
                    </TableCell>
                    <TableCell>{getClientTypeBadge(client.type)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm space-y-1">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" /> {client.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" /> {client.telephone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex items-center text-sm">
                        <MapPin className="h-3 w-3 mr-1" />{" "}
                        <span className="truncate">{client.adresse}</span>
                      </div>
                    </TableCell>
                    <TableCell>{client.dateInscription}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{client.totalCommandes}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(client.montantTotal)}
                    </TableCell>
                    <TableCell>{client.derniereCommande}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewClient(client)}
                      >
                        Voir détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {/* Client Details Modal */}
      {showClientDetails && selectedClient && (
        <div className="fixed inset-0  bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Détails du client
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseClientDetails}
              >
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Nom complet
                    </label>
                    <p className="text-lg">
                      {`${selectedClient.firstName} ${selectedClient.lastName}`.trim()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Email
                    </label>
                    <p className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {selectedClient.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Téléphone
                    </label>
                    <p className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {selectedClient.telephone || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Type de client
                    </label>
                    <p>{getClientTypeBadge(selectedClient.type)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adresse</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-2 mt-1" />
                    <p>{selectedClient.adresse || "Adresse non renseignée"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Informations du compte
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Date d'inscription
                    </label>
                    <p>{selectedClient.dateInscription}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Statut du compte
                    </label>
                    <p>
                      {selectedClient.is_verified ? (
                        <Badge className="bg-green-500">Vérifié</Badge>
                      ) : (
                        <Badge variant="secondary">Non vérifié</Badge>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Statistiques des commandes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Nombre de commandes
                    </label>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedClient.totalCommandes}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Chiffre d'affaires total
                    </label>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedClient.montantTotal)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Dernière commande
                    </label>
                    <p>{selectedClient.derniereCommande}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseClientDetails}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
