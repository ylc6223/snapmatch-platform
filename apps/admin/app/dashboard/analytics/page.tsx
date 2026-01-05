import type { Metadata } from "next";

import { DashboardCards } from "@/components/shared/lumina-dashboard-cards";
import { TrendChart } from "@/components/shared/lumina-trend-chart";
import { TodoSidebar } from "@/components/shared/lumina-todo-sidebar";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "数据概览",
    description: "查看关键指标、趋势图表与数据明细。",
  });
}

export default function Page() {
  return (
    <div className="relative mt-4">
      {/* Main Content Area */}
      <div className="pr-0 xl:pr-[342px]">
        <DashboardCards />
        <TrendChart />
      </div>

      {/* Todo Sidebar - Fixed positioning */}
      <TodoSidebar />
    </div>
  );
}
