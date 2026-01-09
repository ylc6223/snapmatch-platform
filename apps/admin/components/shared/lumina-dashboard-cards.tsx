"use client";

import React from "react";
import {
  Folder,
  HardDrive,
  TrendingUp,
  ImageIcon,
  CheckCircle,
  Database,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Progress, Badge } from "./lumina-ui";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer } from "recharts";

// --- Card 1: Project Stats ---
const ProjectStatsCard = () => (
  <Card className="flex flex-col h-full">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
      <CardTitle className="text-sm font-medium text-muted-foreground">项目统计</CardTitle>
      <Folder className="h-4 w-4 text-cyan-500" />
    </CardHeader>
    <CardContent className="flex-1 flex flex-col justify-between">
      <div>
        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">项目总数</div>
        <div className="text-[3.5rem] font-bold font-mono text-cyan-500 leading-none tracking-tighter">
          128
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="flex flex-col bg-secondary/50 p-2 rounded border border-border/50">
          <span className="text-[10px] text-muted-foreground uppercase">待处理</span>
          <span className="text-xl font-mono font-semibold text-foreground">24</span>
        </div>
        <div className="flex flex-col bg-secondary/50 p-2 rounded border border-border/50">
          <span className="text-[10px] text-muted-foreground uppercase">选片中</span>
          <span className="text-xl font-mono font-semibold text-cyan-500">18</span>
        </div>
        <div className="flex flex-col bg-secondary/50 p-2 rounded border border-border/50">
          <span className="text-[10px] text-muted-foreground uppercase">已提交</span>
          <span className="text-xl font-mono font-semibold text-foreground">42</span>
        </div>
        <div className="flex flex-col bg-secondary/50 p-2 rounded border border-border/50">
          <span className="text-[10px] text-muted-foreground uppercase">已交付</span>
          <span className="text-xl font-mono font-semibold text-green-500">44</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

// --- Card 2: Selection Progress ---
const SelectionProgressCard = () => (
  <Card className="flex flex-col h-full">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
      <CardTitle className="text-sm font-medium text-muted-foreground">选片监控</CardTitle>
      <CheckCircle className="h-4 w-4 text-blue-500" />
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="flex gap-2 mb-2">
        <Badge variant="cyan" className="flex-1 justify-center py-1">
          待选: 24
        </Badge>
        <Badge variant="outline" className="flex-1 justify-center py-1 border-blue-500/30 text-blue-500">
          选片中: 18
        </Badge>
        <Badge variant="amber" className="flex-1 justify-center py-1">
          待确认: 8
        </Badge>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">待客选</span>
          <span className="font-mono text-foreground">24</span>
        </div>
        <Progress value={25} indicatorColor="bg-blue-500" />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">正在选片</span>
          <span className="font-mono text-foreground">18</span>
        </div>
        <Progress value={18} indicatorColor="bg-cyan-500" />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">等待确认</span>
          <span className="font-mono text-foreground">8</span>
        </div>
        <Progress value={10} indicatorColor="bg-amber-500" />
      </div>

      <div className="pt-2 border-t border-border mt-2">
        <div className="flex justify-between items-end">
          <span className="text-xs text-muted-foreground">整体完成率</span>
          <span className="text-xl font-mono font-bold text-cyan-500">65.6%</span>
        </div>
        <Progress value={65.6} className="mt-2 h-1" indicatorColor="bg-gradient-to-r from-blue-500 to-cyan-500" />
      </div>
    </CardContent>
  </Card>
);

// --- Card 3: Photo Data ---
const PhotoDataCard = () => (
  <Card className="flex flex-col h-full">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
      <CardTitle className="text-sm font-medium text-muted-foreground">照片数据</CardTitle>
      <HardDrive className="h-4 w-4 text-purple-500" />
    </CardHeader>
    <CardContent className="flex-1 flex flex-col justify-between">
      <div>
        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">照片总数</div>
        <div className="text-[2.5rem] font-bold font-mono text-foreground leading-none">
          15,847
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            R2 存储空间
          </span>
          <span className="text-xs font-mono text-foreground">49.6%</span>
        </div>
        <Progress value={49.6} indicatorColor="bg-purple-500" className="h-3" />
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>247.8 GB</span>
          <span>500 GB</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">本月新增</div>
          <div className="text-lg font-mono font-bold text-foreground">1,234</div>
        </div>
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
          <TrendingUp className="w-3 h-3" />
          +12.3%
        </Badge>
      </div>
    </CardContent>
  </Card>
);

// --- Card 4: Portfolio Data ---
const portfolioData = [
  { name: "1月", views: 400 },
  { name: "2月", views: 300 },
  { name: "3月", views: 600 },
  { name: "4月", views: 800 },
  { name: "5月", views: 500 },
  { name: "6月", views: 900 },
  { name: "7月", views: 1000 },
  { name: "8月", views: 1200 },
  { name: "9月", views: 1100 },
  { name: "10月", views: 1300 },
  { name: "11月", views: 1200 },
  { name: "12月", views: 1500 },
];

const portfolioChartConfig = {
  views: {
    label: "浏览量",
    color: "#00cae0",
  },
} satisfies ChartConfig;

const PortfolioDataCard = () => (
  <Card className="flex flex-col h-full">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
      <CardTitle className="text-sm font-medium text-muted-foreground">作品集统计</CardTitle>
      <ImageIcon className="h-4 w-4 text-pink-500" />
    </CardHeader>
    <CardContent className="flex-1 flex flex-col">
      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">作品集总数</div>
        <div className="text-[2.5rem] font-bold font-mono text-foreground leading-none">
          86
        </div>
      </div>

      <div className="h-[80px] w-full mt-auto mb-4">
        <ChartContainer config={portfolioChartConfig} className="h-full w-full">
          <BarChart data={portfolioData}>
            <ChartTooltip cursor={{ fill: "var(--color-secondary)" }} content={<ChartTooltipContent />} />
            <Bar dataKey="views" fill="var(--color-views)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div>
          <div className="text-xs text-muted-foreground">本月浏览量</div>
          <div className="text-lg font-mono font-bold text-foreground">12,345</div>
        </div>
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
          +8.5%
        </Badge>
      </div>
    </CardContent>
  </Card>
);

// --- Card 5: Selection Rate ---
const pieData = [
  { name: "已完成", value: 84, color: "#00cae0" },
  { name: "进行中", value: 44, color: "#666" },
];

const pieChartConfig = {
  completed: {
    label: "已完成",
    color: "#00cae0",
  },
  inProgress: {
    label: "进行中",
    color: "#666",
  },
} satisfies ChartConfig;

const SelectionRateCard = () => (
  <Card className="flex flex-col h-full">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">完成率</CardTitle>
      <Database className="h-4 w-4 text-cyan-500" />
    </CardHeader>
    <CardContent className="flex-1 flex flex-col items-center justify-center relative">
      <div className="h-[160px] w-full relative">
        <ChartContainer config={pieChartConfig} className="h-full w-full">
          <PieChart>
            <Pie
              data={pieData}
              innerRadius={55}
              outerRadius={70}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-mono text-foreground">65.6%</span>
          <span className="text-[10px] text-muted-foreground uppercase">已完成</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full mt-2">
        <div className="text-center p-2 bg-secondary/30 rounded">
          <div className="text-[10px] text-muted-foreground">已完成</div>
          <div className="text-lg font-mono font-bold text-cyan-500">84</div>
        </div>
        <div className="text-center p-2 bg-secondary/30 rounded">
          <div className="text-[10px] text-muted-foreground">进行中</div>
          <div className="text-lg font-mono font-bold text-foreground">44</div>
        </div>
      </div>
      <div className="w-full mt-3 pt-3 border-t border-border flex justify-between items-center">
        <span className="text-xs text-muted-foreground">平均用时</span>
        <span className="text-sm font-mono font-bold text-foreground">5.2 天</span>
      </div>
    </CardContent>
  </Card>
);

// --- Card 6: Monthly Overview ---
const MonthlyOverviewCard = () => (
  <Card className="flex flex-col h-full">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
      <CardTitle className="text-sm font-medium text-muted-foreground">月度概览 (1月)</CardTitle>
      <Eye className="h-4 w-4 text-foreground" />
    </CardHeader>
    <CardContent className="flex-1 p-0">
      <div className="grid grid-cols-2 h-full divide-x divide-y divide-border border-t border-border">
        <div className="p-4 flex flex-col justify-center">
          <span className="text-[10px] text-muted-foreground uppercase mb-1">新项目</span>
          <span className="text-2xl font-mono font-bold text-foreground">12</span>
        </div>
        <div className="p-4 flex flex-col justify-center">
          <span className="text-[10px] text-muted-foreground uppercase mb-1">已完成</span>
          <span className="text-2xl font-mono font-bold text-foreground">8</span>
        </div>
        <div className="p-4 flex flex-col justify-center">
          <span className="text-[10px] text-muted-foreground uppercase mb-1">上传量</span>
          <span className="text-2xl font-mono font-bold text-cyan-500">1,234</span>
        </div>
        <div className="p-4 flex flex-col justify-center">
          <span className="text-[10px] text-muted-foreground uppercase mb-1">修图量</span>
          <span className="text-2xl font-mono font-bold text-foreground">95</span>
        </div>
        <div className="p-4 flex flex-col justify-center">
          <span className="text-[10px] text-muted-foreground uppercase mb-1">新作品</span>
          <span className="text-2xl font-mono font-bold text-foreground">6</span>
        </div>
        <div className="p-4 flex flex-col justify-center">
          <span className="text-[10px] text-muted-foreground uppercase mb-1">新订单</span>
          <span className="text-2xl font-mono font-bold text-green-500">3</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const DashboardCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-[minmax(240px,auto)]">
      <ProjectStatsCard />
      <SelectionProgressCard />
      <PhotoDataCard />
      <PortfolioDataCard />
      <SelectionRateCard />
      <MonthlyOverviewCard />
    </div>
  );
};
