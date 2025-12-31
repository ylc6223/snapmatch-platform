import type { Metadata } from "next";
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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">账号与权限</h3>
          <p className="text-sm text-muted-foreground">维护业务系统用户账号与角色，用于登录与权限控制。</p>
        </div>
      </div>
      <Separator />
      <AccountsManager />
    </div>
  );
}
