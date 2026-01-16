"use client";
import React, { forwardRef } from "react";

interface InvoiceTemplateProps {
    order: any;
}

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
    ({ order }, ref) => {
        return (
            <div
                ref={ref}
                className="p-8 text-sm bg-white text-gray-900 w-[210mm] min-h-[297mm]"
            >
                <h2 className="text-2xl font-bold mb-2 text-center">FACTURE</h2>
                <p className="text-right">Le {new Date(order.createdAt).toLocaleDateString("fr-FR")}</p>

                <div className="mt-4 flex justify-between">
                    <div>
                        <p><strong>Client:</strong> {order.customerName}</p>
                        <p><strong>Email:</strong> {order.customerEmail}</p>
                        <p><strong>Téléphone:</strong> {order.customerPhone}</p>
                    </div>
                    <div>
                        <p><strong>Facture #:</strong> {order.orderNumber}</p>
                        <p><strong>Statut:</strong> {order.status}</p>
                        <p><strong>Paiement:</strong> {order.paymentStatus}</p>
                    </div>
                </div>

                <table className="w-full mt-8 border-collapse border border-gray-300 text-xs">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="border border-gray-300 p-1 text-left">Désignation</th>
                            <th className="border border-gray-300 p-1">Qté</th>
                            <th className="border border-gray-300 p-1">Prix Unitaire</th>
                            <th className="border border-gray-300 p-1">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items?.map((item: any, index: number) => (
                            <tr key={index}>
                                <td className="border border-gray-300 p-1">{item.product_name}</td>
                                <td className="border border-gray-300 p-1 text-center">{item.quantity}</td>
                                <td className="border border-gray-300 p-1 text-right">{item.unit_price} TND</td>
                                <td className="border border-gray-300 p-1 text-right">{item.total_price} TND</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-6 text-right">
                    <p><strong>Total HT:</strong> {order.totalAmount} TND</p>
                    <p><strong>TVA (19%):</strong> {(order.totalAmount * 0.19).toFixed(2)} TND</p>
                    <p><strong>Total TTC:</strong> {(order.totalAmount * 1.19).toFixed(2)} TND</p>
                </div>
                <div className="mt-8 text-center">
                    <p className="italic">Cachet et Signature</p>
                </div>
            </div>
        );
    });

InvoiceTemplate.displayName = "InvoiceTemplate";
export default InvoiceTemplate;
