"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

type SeasonalityData = {
  month: number;
  monthlySales: number;
  feFactor: number;
};

export function SeasonalityChart({ data }: { data: SeasonalityData[] }) {
  const chartData = data.map((d) => ({
    name: MONTH_NAMES[d.month - 1],
    fe: Number(d.feFactor.toFixed(2)),
    sales: d.monthlySales,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
          <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 12 }} />
          <YAxis tick={{ fill: "#94A3B8", fontSize: 12 }} domain={[0, "auto"]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0F172A",
              border: "1px solid #1E293B",
              borderRadius: "8px",
              color: "#F8FAFC",
              fontSize: 12,
            }}
            formatter={(value) => [`FE: ${value}`, ""]}
          />
          <ReferenceLine y={1} stroke="#94A3B8" strokeDasharray="3 3" label={{ value: "FE=1", fill: "#94A3B8", fontSize: 10 }} />
          <Bar dataKey="fe" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fe > 1.1 ? "#22C55E" : entry.fe < 0.9 ? "#F59E0B" : "#3B82F6"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
