"use client";
// Formulaire de fiche garantie
import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface WarrantyFormProps {
  onSubmit: (warrantyData: WarrantyData) => void;
  onBack: () => void;
}

export interface WarrantyData {
  accepted: boolean;
  clientName?: string;
  vehicleRegistration?: string;
  vehicleMileage?: string;
}

export function WarrantyForm({ onSubmit, onBack }: WarrantyFormProps) {
  const { user } = useAuth();

  const [warrantyData, setWarrantyData] = useState<WarrantyData>({
    accepted: true,
    clientName: "",
    vehicleRegistration: "",
    vehicleMileage: "",
  });

  // Pre-fill client name from authenticated user
  useEffect(() => {
    if (user) {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      setWarrantyData((prev) => ({
        ...prev,
        clientName: fullName,
      }));
    }
  }, [user]);

  const handleSubmitWithWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...warrantyData, accepted: true });
  };

  const handleSubmitWithoutWarranty = () => {
    onSubmit({ accepted: false });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>Fiche Garantie</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitWithWarranty} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientName" className="mb-1">
                Nom complet du client
              </Label>
              <Input
                id="clientName"
                placeholder=""
                value={warrantyData.clientName}
                onChange={(e) =>
                  setWarrantyData((prev) => ({
                    ...prev,
                    clientName: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="vehicleRegistration" className="mb-1">
                Matriculation du véhicule
              </Label>
              <Input
                id="vehicleRegistration"
                placeholder=""
                value={warrantyData.vehicleRegistration}
                onChange={(e) =>
                  setWarrantyData((prev) => ({
                    ...prev,
                    vehicleRegistration: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="vehicleMileage" className="mb-1">
                Kilométrage du véhicule
              </Label>
              <Input
                id="vehicleMileage"
                type="text"
                placeholder=""
                value={warrantyData.vehicleMileage}
                onChange={(e) =>
                  setWarrantyData((prev) => ({
                    ...prev,
                    vehicleMileage: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmitWithoutWarranty}
              className="flex-1"
            >
              Finaliser sans garantie
            </Button>
            <Button type="submit" className="flex-1">
              Finaliser avec garantie
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
