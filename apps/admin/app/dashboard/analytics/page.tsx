import type { Metadata } from "next";

import { ChartAreaInteractive } from "@/components/shared/charts/chart-area-interactive";
import { ExampleDataTable } from "@/components/data-table";
import { SectionCards } from "@/components/shared/cards/section-cards";
import { generateMeta } from "@/lib/utils";

import data from "../data.json";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "数据概览",
    description: "查看关键指标、趋势图表与数据明细。",
  });
}

export default function Page() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">数据概览</h1>
      </div>
      <SectionCards />
      <ChartAreaInteractive />
      <ExampleDataTable data={data} />
    </>
  );
}
