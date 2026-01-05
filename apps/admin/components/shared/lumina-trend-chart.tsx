"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./lumina-ui";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

export interface TrendData {
  month: string;
  projects: number;
}

const data: TrendData[] = [
  { month: "2月", projects: 12 },
  { month: "3月", projects: 15 },
  { month: "4月", projects: 10 },
  { month: "5月", projects: 18 },
  { month: "6月", projects: 22 },
  { month: "7月", projects: 20 },
  { month: "8月", projects: 25 },
  { month: "9月", projects: 24 },
  { month: "10月", projects: 28 },
  { month: "11月", projects: 26 },
  { month: "12月", projects: 30 },
  { month: "1月", projects: 32 },
];

const chartConfig = {
  projects: {
    label: "项目数",
    color: "#00cae0",
  },
} satisfies ChartConfig;

export const TrendChart: React.FC = () => {
  return (
    <Card className="w-full mt-6 h-[400px] flex flex-col animate-in slide-in-from-bottom duration-700">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          项目趋势 (近12个月)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontFamily: "ui-monospace, monospace" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontFamily: "ui-monospace, monospace" }}
              axisLine={false}
              tickLine={false}
              dx={-10}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--color-projects)", strokeWidth: 1, strokeDasharray: "4 4" }}
              content={<ChartTooltipContent />}
            />
            <Line
              type="monotone"
              dataKey="projects"
              stroke="var(--color-projects)"
              strokeWidth={3}
              dot={{ fill: "var(--color-projects)", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, stroke: "var(--background)", strokeWidth: 2 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
