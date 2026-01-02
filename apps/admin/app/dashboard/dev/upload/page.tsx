"use client";

import * as React from "react";

import { AssetUpload } from "@/components/asset-upload";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Page() {
  const [workId, setWorkId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");

  return (
    <div className="space-y-4 p-6">
      <div className="space-y-1">
        <div className="text-lg font-semibold tracking-tight">上传组件预览</div>
        <div className="text-muted-foreground text-sm">
          用于验证签名、直传、确认三段式流程（不依赖数据库建表）。
        </div>
      </div>

      <Tabs defaultValue="portfolio">
        <TabsList>
          <TabsTrigger value="portfolio">作品集素材</TabsTrigger>
          <TabsTrigger value="delivery">交付照片</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="mt-4 space-y-4">
          <Card className="grid gap-3 p-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="workId">workId（确认接口必填）</Label>
              <Input
                id="workId"
                value={workId}
                onChange={(e) => setWorkId(e.target.value)}
                placeholder="例如：work_123456"
              />
            </div>
            <div className="text-muted-foreground text-xs leading-relaxed">
              直传完成后会调用 `POST /api/works/:workId/assets/confirm`。
            </div>
          </Card>

          <AssetUpload
            purpose="portfolio-asset"
            workId={workId.trim() || undefined}
            concurrency={3}
          />
        </TabsContent>

        <TabsContent value="delivery" className="mt-4 space-y-4">
          <Card className="grid gap-3 p-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="projectId">projectId（签名接口必填）</Label>
              <Input
                id="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="例如：project_123456"
              />
            </div>
            <div className="text-muted-foreground text-xs leading-relaxed">
              直传完成后会调用 `POST /api/photos/confirm`。
            </div>
          </Card>

          <AssetUpload
            purpose="delivery-photo"
            projectId={projectId.trim() || undefined}
            concurrency={3}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
