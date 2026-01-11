"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Users } from "lucide-react"

interface TopClient {
  nom: string
  commandes: number
  total: number
}

interface TopClientsChartProps {
  data: TopClient[]
}

const COLORS = ['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e']

export default function TopClientsChart({ data }: TopClientsChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: "TND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{payload[0].payload.nom}</p>
          <p className="text-sm text-blue-600">
            Commandes: {payload[0].payload.commandes}
          </p>
          <p className="text-sm text-green-600">
            Total: {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-cyan-600" />
          Top Clients
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="nom" 
              angle={-45}
              textAnchor="end"
              height={100}
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              interval={0}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="total" 
              radius={[8, 8, 0, 0]}
              name="Total dépensé"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
