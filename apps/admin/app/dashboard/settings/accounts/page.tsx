import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { generateMeta } from "@/lib/utils";
import { AccountsManager } from "./accounts-manager";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "账号与权限",
    description: "管理业务系统用户账号：新增、编辑、禁用、角色分配。",
  });
}

export default function Page() {
  return (
    <div className="space-y-6 pt-4">
      <Card className="border-border/60 bg-gradient-to-b from-primary/5 to-card shadow-xs">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <ShieldCheck className="size-4 text-muted-foreground" />
              <CardTitle className="text-base sm:text-lg">账号与权限</CardTitle>
              <Badge variant="outline" className="h-6">
                RBAC
              </Badge>
            </div>
            <CardDescription className="max-w-[72ch]">
              维护业务系统用户账号与角色，用于登录与权限控制。
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
      <Separator />
      <AccountsManager />
    </div>
  );
}
