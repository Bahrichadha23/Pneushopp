"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Store, Bell, Shield, Mail, Globe, Database, Users } from "lucide-react"

// Mock data pour demo académique
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
    // Simulation de sauvegarde
    alert("Paramètres sauvegardés avec succès!")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres système</h1>
        <Button onClick={handleSave}>
          <Settings className="h-4 w-4 mr-2" />
          Sauvegarder
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="boutique" className="flex items-center space-x-2">
            <Store className="h-4 w-4" />
            <span>Boutique</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="securite" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Sécurité</span>
          </TabsTrigger>
          <TabsTrigger value="systeme" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Système</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="boutique" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="h-5 w-5 mr-2" />
                Informations de la boutique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Préférences de notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Notifications email pour nouvelles commandes</Label>
                  <p className="text-sm text-gray-500">Recevoir un email à chaque nouvelle commande</p>
                </div>
                <Switch
                  checked={parametres.notifications.emailCommandes}
                  onCheckedChange={(checked) => setParametres({
                    ...parametres,
                    notifications: { ...parametres.notifications, emailCommandes: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Alertes de stock bas</Label>
                  <p className="text-sm text-gray-500">Notification quand le stock descend en dessous du seuil</p>
                </div>
                <Switch
                  checked={parametres.notifications.emailStock}
                  onCheckedChange={(checked) => setParametres({
                    ...parametres,
                    notifications: { ...parametres.notifications, emailStock: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">SMS aux clients</Label>
                  <p className="text-sm text-gray-500">Envoyer des SMS de confirmation aux clients</p>
                </div>
                <Switch
                  checked={parametres.notifications.smsClients}
                  onCheckedChange={(checked) => setParametres({
                    ...parametres,
                    notifications: { ...parametres.notifications, smsClients: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Notifications push admin</Label>
                  <p className="text-sm text-gray-500">Notifications push dans l'interface admin</p>
                </div>
                <Switch
                  checked={parametres.notifications.pushAdmin}
                  onCheckedChange={(checked) => setParametres({
                    ...parametres,
                    notifications: { ...parametres.notifications, pushAdmin: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="securite" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Paramètres de sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Mot de passe fort obligatoire</Label>
                  <p className="text-sm text-gray-500">Exiger des mots de passe complexes</p>
                </div>
                <Switch
                  checked={parametres.securite.motDePasseForce}
                  onCheckedChange={(checked) => setParametres({
                    ...parametres,
                    securite: { ...parametres.securite, motDePasseForce: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Authentification à double facteur</Label>
                  <p className="text-sm text-gray-500">Sécurité renforcée avec 2FA</p>
                </div>
                <Switch
                  checked={parametres.securite.authentificationDouble}
                  onCheckedChange={(checked) => setParametres({
                    ...parametres,
                    securite: { ...parametres.securite, authentificationDouble: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Journal des activités</Label>
                  <p className="text-sm text-gray-500">Enregistrer toutes les actions administratives</p>
                </div>
                <Switch
                  checked={parametres.securite.journalisation}
                  onCheckedChange={(checked) => setParametres({
                    ...parametres,
                    securite: { ...parametres.securite, journalisation: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="systeme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Configuration système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Mode maintenance</Label>
                  <p className="text-sm text-gray-500">Désactiver temporairement le site</p>
                </div>
                <Switch
                  checked={parametres.systeme.maintenanceMode}
                  onCheckedChange={(checked) => setParametres({
                    ...parametres,
                    systeme: { ...parametres.systeme, maintenanceMode: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Sauvegarde automatique</Label>
                  <p className="text-sm text-gray-500">Sauvegarde automatique de la base de données</p>
                </div>
                <Switch
                  checked={parametres.systeme.sauvegaudeAuto}
                  onCheckedChange={(checked) => setParametres({
                    ...parametres,
                    systeme: { ...parametres.systeme, sauvegaudeAuto: checked }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="langue">Langue principale</Label>
                <Input
                  id="langue"
                  value={parametres.systeme.languePrincipale}
                  onChange={(e) => setParametres({
                    ...parametres,
                    systeme: { ...parametres.systeme, languePrincipale: e.target.value }
                  })}
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-4">Actions système</h3>
                <div className="flex space-x-4">
                  <Button variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Sauvegarder maintenant
                  </Button>
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Exporter données clients
                  </Button>
                  <Button variant="destructive" disabled>
                    <Settings className="h-4 w-4 mr-2" />
                    Réinitialiser système
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}