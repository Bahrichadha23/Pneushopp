"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Store, Bell, Shield, Database, Users } from "lucide-react";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function ParametresPage() {
  const [parametres, setParametres] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("boutique");
  const { user } = useAuth();
  const router = useRouter();

  // Only allow admin
  if (user && user.role !== "admin") {
    router.push("/admin"); // or show "Access Denied"
    return null;
  }
  // Fetch settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_URL}/products/site-settings/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Transform backend data to frontend format
          setParametres({
            boutique: {
              nom: data.nom_boutique,
              description: data.description,
              adresse: data.adresse,
              telephone: data.telephone,
              email: data.email,
              horaires: data.horaires,
            },
            notifications: {
              emailCommandes: data.email_commandes,
              emailStock: data.email_stock,
              smsClients: data.sms_clients,
              pushAdmin: data.push_admin,
            },
            securite: {
              sessionTimeout: data.session_timeout,
              motDePasseForce: data.mot_de_passe_force,
              authentificationDouble: data.authentification_double,
              journalisation: data.journalisation,
            },
            systeme: {
              maintenanceMode: data.maintenance_mode,
              sauvegaudeAuto: data.sauvegarde_auto,
              languePrincipale: data.langue_principale,
            },
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle database backup
  const handleBackup = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/admin/backup/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `backup_${new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/:/g, "-")}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log("Sauvegarde téléchargée avec succès !");
      } else {
        console.error("Erreur lors de la création de la sauvegarde");
      }
    } catch (error) {
      console.error("Backup error:", error);
      console.error("Erreur lors de la création de la sauvegarde");
    }
  };

  // Handle customer data export
  const handleExportCustomers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/admin/export-customers/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Export response:", response);
      if (response.ok) {
        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `customers_export_${new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/:/g, "-")}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log("Données clients exportées avec succès !");
      } else {
        console.error("Erreur lors de l'export des données clients");
      }
    } catch (error) {
      console.error("Export error:", error);
      console.error("Erreur lors de l'export des données clients");
    }
  };
  const handleSave = async () => {
    if (!parametres) return;

    try {
      const token = localStorage.getItem("access_token");
      // Transform frontend data to backend format
      const backendData = {
        nom_boutique: parametres.boutique.nom,
        description: parametres.boutique.description,
        adresse: parametres.boutique.adresse,
        telephone: parametres.boutique.telephone,
        email: parametres.boutique.email,
        horaires: parametres.boutique.horaires,
        email_commandes: parametres.notifications.emailCommandes,
        email_stock: parametres.notifications.emailStock,
        sms_clients: parametres.notifications.smsClients,
        push_admin: parametres.notifications.pushAdmin,
        session_timeout: parametres.securite.sessionTimeout,
        mot_de_passe_force: parametres.securite.motDePasseForce,
        authentification_double: parametres.securite.authentificationDouble,
        journalisation: parametres.securite.journalisation,
        maintenance_mode: parametres.systeme.maintenanceMode,
        sauvegarde_auto: parametres.systeme.sauvegaudeAuto,
        langue_principale: parametres.systeme.languePrincipale,
      };

      const response = await fetch(`${API_URL}/products/site-settings/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendData),
      });

      if (response.ok) {
        console.log("Paramètres sauvegardés avec succès !");
      } else {
        alert("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Erreur lors de la sauvegarde");
    }
  };
  // Save settings to backend

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">Chargement...</div>
    );
  }

  if (!parametres) {
    return (
      <div className="flex justify-center items-center h-64">
        Erreur de chargement
      </div>
    );
  }

  // Helper function to render switches
  const renderSwitch = (
    label: string,
    description: string,
    checked: boolean,
    onChange: (val: boolean) => void
  ) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 p-4 border rounded-md bg-gray-50">
      <div>
        <Label className="text-base font-medium">{label}</Label>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  return (
    <div className="space-y-8 p-6 md:p-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Paramètres système</h1>
        <Button onClick={handleSave} className="flex items-center px-4 py-2">
          <Settings className="h-5 w-5 mr-2" />
          Sauvegarder
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <TabsTrigger
            value="boutique"
            className="flex items-center justify-center gap-2"
          >
            <Store className="h-5 w-5" /> Boutique
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center justify-center gap-2"
          >
            <Bell className="h-5 w-5" /> Notifications
          </TabsTrigger>
          <TabsTrigger
            value="securite"
            className="flex items-center justify-center gap-2"
          >
            <Shield className="h-5 w-5" /> Sécurité
          </TabsTrigger>
          <TabsTrigger
            value="systeme"
            className="flex items-center justify-center gap-2"
          >
            <Database className="h-5 w-5" /> Système
          </TabsTrigger>
        </TabsList>

        {/* Boutique */}
        <TabsContent value="boutique" className="space-y-6 pt-6">
          <Card className="p-6 md:p-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-6 w-6" /> Informations de la boutique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom de la boutique</Label>
                  <Input
                    id="nom"
                    value={parametres.boutique.nom}
                    onChange={(e) =>
                      setParametres({
                        ...parametres,
                        boutique: {
                          ...parametres.boutique,
                          nom: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={parametres.boutique.telephone}
                    onChange={(e) =>
                      setParametres({
                        ...parametres,
                        boutique: {
                          ...parametres.boutique,
                          telephone: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={parametres.boutique.description}
                  onChange={(e) =>
                    setParametres({
                      ...parametres,
                      boutique: {
                        ...parametres.boutique,
                        description: e.target.value,
                      },
                    })
                  }
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse complète</Label>
                <Textarea
                  id="adresse"
                  value={parametres.boutique.adresse}
                  onChange={(e) =>
                    setParametres({
                      ...parametres,
                      boutique: {
                        ...parametres.boutique,
                        adresse: e.target.value,
                      },
                    })
                  }
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email de contact</Label>
                  <Input
                    id="email"
                    type="email"
                    value={parametres.boutique.email}
                    onChange={(e) =>
                      setParametres({
                        ...parametres,
                        boutique: {
                          ...parametres.boutique,
                          email: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaires">Horaires d'ouverture</Label>
                  <Input
                    id="horaires"
                    value={parametres.boutique.horaires}
                    onChange={(e) =>
                      setParametres({
                        ...parametres,
                        boutique: {
                          ...parametres.boutique,
                          horaires: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6 pt-6">
          <div className="space-y-4">
            {Object.entries(parametres.notifications).map(([key, value]) => {
              const labels: Record<string, string> = {
                emailCommandes: "Notifications email pour nouvelles commandes",
                emailStock: "Alertes de stock bas",
                smsClients: "SMS aux clients",
                pushAdmin: "Notifications push admin",
              };
              const descriptions: Record<string, string> = {
                emailCommandes: "Recevoir un email à chaque nouvelle commande",
                emailStock:
                  "Notification quand le stock descend en dessous du seuil",
                smsClients: "Envoyer des SMS de confirmation aux clients",
                pushAdmin: "Notifications push dans l'interface admin",
              };
              return renderSwitch(
                labels[key],
                descriptions[key],
                Boolean(value),
                (checked) =>
                  setParametres({
                    ...parametres,
                    notifications: {
                      ...parametres.notifications,
                      [key]: checked,
                    },
                  })
              );
            })}
          </div>
        </TabsContent>

        {/* Sécurité */}
        <TabsContent value="securite" className="space-y-6 pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout de session (minutes)</Label>
              <Input
                id="timeout"
                type="number"
                value={parametres.securite.sessionTimeout}
                onChange={(e) =>
                  setParametres({
                    ...parametres,
                    securite: {
                      ...parametres.securite,
                      sessionTimeout: parseInt(e.target.value),
                    },
                  })
                }
              />
            </div>

            {[
              "motDePasseForce",
              "authentificationDouble",
              "journalisation",
            ].map((key) => {
              const labels: Record<string, string> = {
                motDePasseForce: "Mot de passe fort obligatoire",
                authentificationDouble: "Authentification à double facteur",
                journalisation: "Journal des activités",
              };
              const descriptions: Record<string, string> = {
                motDePasseForce: "Exiger des mots de passe complexes",
                authentificationDouble: "Sécurité renforcée avec 2FA",
                journalisation:
                  "Enregistrer toutes les actions administratives",
              };
              return renderSwitch(
                labels[key],
                descriptions[key],
                parametres.securite[key],
                (checked) =>
                  setParametres({
                    ...parametres,
                    securite: { ...parametres.securite, [key]: checked },
                  })
              );
            })}
          </div>
        </TabsContent>

        {/* Système */}
        <TabsContent value="systeme" className="space-y-6 pt-6">
          <div className="space-y-4">
            {renderSwitch(
              "Mode maintenance",
              "Désactiver temporairement le site",
              parametres.systeme.maintenanceMode,
              (checked) =>
                setParametres({
                  ...parametres,
                  systeme: { ...parametres.systeme, maintenanceMode: checked },
                })
            )}

            {renderSwitch(
              "Sauvegarde automatique",
              "Sauvegarde automatique de la base de données",
              parametres.systeme.sauvegaudeAuto,
              (checked) =>
                setParametres({
                  ...parametres,
                  systeme: { ...parametres.systeme, sauvegaudeAuto: checked },
                })
            )}

            <div className="space-y-2">
              <Label htmlFor="langue">Langue principale</Label>
              <Input
                id="langue"
                value={parametres.systeme.languePrincipale}
                onChange={(e) =>
                  setParametres({
                    ...parametres,
                    systeme: {
                      ...parametres.systeme,
                      languePrincipale: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                variant="outline"
                className="flex items-center px-4 py-2"
                onClick={handleBackup}
              >
                <Database className="h-5 w-5 mr-2" /> Sauvegarder maintenant
              </Button>
              <Button
                variant="outline"
                className="flex items-center px-4 py-2"
                onClick={handleExportCustomers}
              >
                <Users className="h-5 w-5 mr-2" /> Exporter données clients
              </Button>
              <Button
                variant="destructive"
                disabled
                className="flex items-center px-4 py-2"
              >
                <Settings className="h-5 w-5 mr-2" /> Réinitialiser système
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
