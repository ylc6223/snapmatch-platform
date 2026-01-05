"use client";

import React from "react";
import { AlertTriangle, Clock, Timer, Bell, ChevronRight } from "lucide-react";
import { Badge, Separator } from "./lumina-ui";

export interface TodoItem {
  id: string;
  type: "retouch" | "confirm" | "expiring" | "order";
  title: string;
  subtitle: string;
  status: string;
  urgent?: boolean;
}

const todoData: TodoItem[] = [
  {
    id: "1",
    type: "retouch",
    title: "张府婚礼跟拍",
    subtitle: "12张照片待上传 • 逾期2天",
    status: "overdue",
    urgent: true,
  },
  {
    id: "2",
    type: "retouch",
    title: "李氏个人写真",
    subtitle: "8张照片待上传 • 今天到期",
    status: "due",
    urgent: false,
  },
  {
    id: "3",
    type: "confirm",
    title: "王同学毕业照",
    subtitle: "15张照片已上传 • 等待确认",
    status: "waiting",
    urgent: false,
  },
  {
    id: "4",
    type: "expiring",
    title: "赵氏全家福",
    subtitle: "选片链接3天后过期",
    status: "expiring",
    urgent: false,
  },
  {
    id: "5",
    type: "order",
    title: "加片订单 #20240105",
    subtitle: "5张精修 (+¥500) • 未付款",
    status: "new",
    urgent: true,
  },
];

const TodoGroup = ({
  title,
  icon: Icon,
  items,
  colorClass,
}: {
  title: string;
  icon: any;
  items: TodoItem[];
  colorClass: string;
}) => {
  if (items.length === 0) return null;

  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colorClass}`} />
          <span className="text-sm font-semibold text-foreground/80">{title}</span>
        </div>
        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
          {items.length}
        </Badge>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative rounded-lg border border-border bg-card p-3 hover:bg-accent/10 hover:border-cyan-500/30 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-medium text-card-foreground group-hover:text-cyan-500 transition-colors">
                {item.title}
              </h4>
              {item.urgent && <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 animate-pulse" />}
              {item.status === "due" && <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono leading-relaxed">
              {item.subtitle}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TodoSidebar: React.FC = () => {
  return (
    <aside className="w-[320px] shrink-0 fixed right-6 top-30 bottom-4 border-l border-border bg-background z-30 hidden xl:flex flex-col animate-in slide-in-from-right duration-500 transition-colors overflow-hidden rounded-lg border shadow-lg">
      <div className="p-6 pb-2 shrink-0">
        <h2 className="text-lg font-bold tracking-tight text-foreground/90">待办事项</h2>
        <Separator className="mt-4" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-2 min-h-0">
        <TodoGroup
          title="待修图"
          icon={AlertTriangle}
          items={todoData.filter((i) => i.type === "retouch")}
          colorClass="text-destructive"
        />
        <Separator className="my-4 opacity-50" />
        <TodoGroup
          title="客户确认中"
          icon={Clock}
          items={todoData.filter((i) => i.type === "confirm")}
          colorClass="text-cyan-500"
        />
        <Separator className="my-4 opacity-50" />
        <TodoGroup
          title="选片即将过期"
          icon={Timer}
          items={todoData.filter((i) => i.type === "expiring")}
          colorClass="text-amber-500"
        />
        <Separator className="my-4 opacity-50" />
        <TodoGroup
          title="新订单"
          icon={Bell}
          items={todoData.filter((i) => i.type === "order")}
          colorClass="text-orange-500"
        />
      </div>

      <div className="p-4 border-t border-border bg-card/30">
        <button className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-cyan-500 transition-colors">
          <span>查看所有任务</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
};
