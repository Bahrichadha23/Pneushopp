"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Store, Bell, Shield, Database, Users } from "lucide-react"

const mockParametres = {
  boutique: {
    nom: "PneuShop Tunisia",
    description: "Votre spécialiste en pneumatiques en Tunisie",
    adresse: "Avenue Habib Bourguiba, Tunis 1000",
    telephone: "+216 71 123 456",
    email: "contact@pneushop.tn",
    horaires: "Lun-Sam: 8h-18h, Dim: 9h-13h"
  },
  notifications: {
    emailCommandes: true,
    emailStock: true,
    smsClients: false,
    pushAdmin: true
  },
  securite: {
    sessionTimeout: 30,
    motDePasseForce: true,
    authentificationDouble: false,
    journalisation: true
  },
  systeme: {
    maintenanceMode: false,
    sauvegaudeAuto: true,
    frequenceSauvegarde: "quotidienne",
    languePrincipale: "fr"
  }
}

export default function ParametresPage() {
  const [parametres, setParametres] = useState(mockParametres)
  const [activeTab, setActiveTab] = useState("boutique")

  const handleSave = () => {
    alert("Paramètres sauvegardés avec succès !")
  }

  // Helper function to render switches
  const renderSwitch = (label: string, description: string, checked: boolean, onChange: (val: boolean) => void) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 p-4 border rounded-md bg-gray-50">
      <div>
        <Label className="text-base font-medium">{label}</Label>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )

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
          <TabsTrigger value="boutique" className="flex items-center justify-center gap-2">
            <Store className="h-5 w-5" /> Boutique
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center justify-center gap-2">
            <Bell className="h-5 w-5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="securite" className="flex items-center justify-center gap-2">
            <Shield className="h-5 w-5" /> Sécurité
          </TabsTrigger>
          <TabsTrigger value="systeme" className="flex items-center justify-center gap-2">
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
                    onChange={(e) => setParametres({
                      ...parametres,
                      boutique: { ...parametres.boutique, nom: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={parametres.boutique.telephone}
                    onChange={(e) => setParametres({
                      ...parametres,
                      boutique: { ...parametres.boutique, telephone: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={parametres.boutique.description}
                  onChange={(e) => setParametres({
                    ...parametres,
                    boutique: { ...parametres.boutique, description: e.target.value }
                  })}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse complète</Label>
                <Textarea
                  id="adresse"
                  value={parametres.boutique.adresse}
                  onChange={(e) => setParametres({
                    ...parametres,
                    boutique: { ...parametres.boutique, adresse: e.target.value }
                  })}
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
                    onChange={(e) => setParametres({
                      ...parametres,
                      boutique: { ...parametres.boutique, email: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaires">Horaires d'ouverture</Label>
                  <Input
                    id="horaires"
                    value={parametres.boutique.horaires}
                    onChange={(e) => setParametres({
                      ...parametres,
                      boutique: { ...parametres.boutique, horaires: e.target.value }
                    })}
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
              }
              const descriptions: Record<string, string> = {
                emailCommandes: "Recevoir un email à chaque nouvelle commande",
                emailStock: "Notification quand le stock descend en dessous du seuil",
                smsClients: "Envoyer des SMS de confirmation aux clients",
                pushAdmin: "Notifications push dans l'interface admin",
              }
              return renderSwitch(labels[key], descriptions[key], value, (checked) => setParametres({
                ...parametres,
                notifications: { ...parametres.notifications, [key]: checked }
              }))
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
                onChange={(e) => setParametres({
                  ...parametres,
                  securite: { ...parametres.securite, sessionTimeout: parseInt(e.target.value) }
                })}
              />
            </div>

            {["motDePasseForce", "authentificationDouble", "journalisation"].map((key) => {
              const labels: Record<string, string> = {
                motDePasseForce: "Mot de passe fort obligatoire",
                authentificationDouble: "Authentification à double facteur",
                journalisation: "Journal des activités"
              }
              const descriptions: Record<string, string> = {
                motDePasseForce: "Exiger des mots de passe complexes",
                authentificationDouble: "Sécurité renforcée avec 2FA",
                journalisation: "Enregistrer toutes les actions administratives"
              }
              return renderSwitch(labels[key], descriptions[key], parametres.securite.authentificationDouble, (checked) => setParametres({
                ...parametres,
                securite: { ...parametres.securite, [key]: checked }
              }))
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
              (checked) => setParametres({ ...parametres, systeme: { ...parametres.systeme, maintenanceMode: checked } })
            )}

            {renderSwitch(
              "Sauvegarde automatique",
              "Sauvegarde automatique de la base de données",
              parametres.systeme.sauvegaudeAuto,
              (checked) => setParametres({ ...parametres, systeme: { ...parametres.systeme, sauvegaudeAuto: checked } })
            )}

            <div className="space-y-2">
              <Label htmlFor="langue">Langue principale</Label>
              <Input
                id="langue"
                value={parametres.systeme.languePrincipale}
                onChange={(e) => setParametres({ ...parametres, systeme: { ...parametres.systeme, languePrincipale: e.target.value } })}
              />
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button variant="outline" className="flex items-center px-4 py-2">
                <Database className="h-5 w-5 mr-2" /> Sauvegarder maintenant
              </Button>
              <Button variant="outline" className="flex items-center px-4 py-2">
                <Users className="h-5 w-5 mr-2" /> Exporter données clients
              </Button>
              <Button variant="destructive" disabled className="flex items-center px-4 py-2">
                <Settings className="h-5 w-5 mr-2" /> Réinitialiser système
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
