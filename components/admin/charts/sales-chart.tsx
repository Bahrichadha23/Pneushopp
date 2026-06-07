"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp } from "lucide-react"

interface SalesData {
  mois: string
  ventes: number
  commandes: number
}

interface SalesChartProps {
  data: SalesData[]
  title: string
}

// Brand colors: Ventes → Orange (#FF8C00), Commandes → Blue (#0066CC)
const VENTES_COLOR = "#FF8C00"
const COMMANDES_COLOR = "#0066CC"

export default function SalesChart({ data, title }: SalesChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + " DT"
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-1">{payload[0].payload.mois}</p>
          {payload[0] && (
            <p className="text-sm" style={{ color: VENTES_COLOR }}>
              Ventes: {formatCurrency(payload[0].value)}
            </p>
          )}
          {payload[1] && (
            <p className="text-sm" style={{ color: COMMANDES_COLOR }}>
              Commandes: {payload[1].value}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#FF8C00]" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={VENTES_COLOR} stopOpacity={0.25}/>
                <stop offset="95%" stopColor={VENTES_COLOR} stopOpacity={0.02}/>
              </linearGradient>
              <linearGradient id="colorCommandes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COMMANDES_COLOR} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={COMMANDES_COLOR} stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="mois"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
              tickFormatter={formatCurrency}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
              iconType="circle"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="ventes"
              stroke={VENTES_COLOR}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorVentes)"
              name="Ventes (DT)"
              dot={{ fill: VENTES_COLOR, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: VENTES_COLOR }}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="commandes"
              stroke={COMMANDES_COLOR}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorCommandes)"
              name="Commandes"
              dot={{ fill: COMMANDES_COLOR, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: COMMANDES_COLOR }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
