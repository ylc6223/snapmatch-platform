"use client";

import * as React from "react";

import { AssetUpload } from "@/components/features/upload/asset-upload";
import { apiFetch } from "@/lib/api/client";
import { withAdminBasePath } from "@/lib/routing/base-path";
import {
  IconCloudUpload,
  IconTrash,
  IconClock,
  IconSettings,
  IconPlayerStop,
  IconChevronRight,
  IconChevronDown,
  IconFolder,
  IconRefresh,
  IconAlertTriangle,
  IconCheck,
  IconAutomation,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type IncompleteUpload = {
  objectKey: string;
  uploadId: string;
  initiated: string;
};

type DirectoryUploads = {
  path: string;
  count: number;
  uploads: IncompleteUpload[];
  expanded: boolean;
};

type CleanupResult = {
  cleaned: number;
  failed: number;
  total: number;
  details: Array<{
    objectKey: string;
    uploadId: string;
    success: boolean;
    error?: string;
  }>;
};

export default function Page() {
  const [workId, setWorkId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");

  // 清理相关状态
  const [incompleteUploads, setIncompleteUploads] = React.useState<IncompleteUpload[]>([]);
  const [directoryUploads, setDirectoryUploads] = React.useState<DirectoryUploads[]>([]);
  const [viewMode, setViewMode] = React.useState<"flat" | "directory">("directory");
  const [isLoadingUploads, setIsLoadingUploads] = React.useState(false);
  const [isCleaning, setIsCleaning] = React.useState(false);
  const [isAborting, setIsAborting] = React.useState(false);
  const [cleanupResult, setCleanupResult] = React.useState<CleanupResult | null>(null);
  const [showUploadsList, setShowUploadsList] = React.useState(false);

  // 自动化规则配置
  const [enableAutoCleanup, setEnableAutoCleanup] = React.useState(false);
  const [enableAutoAbort, setEnableAutoAbort] = React.useState(false);
  const [cleanupThresholdPreset, setCleanupThresholdPreset] = React.useState<string>("24h");
  const [cleanupThresholdCustom, setCleanupThresholdCustom] = React.useState<string>("24");
  const [abortThresholdPreset, setAbortThresholdPreset] = React.useState<string>("1h");
  const [abortThresholdCustom, setAbortThresholdCustom] = React.useState<string>("1");

  // 确认对话框状态
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [pendingCleanupCount, setPendingCleanupCount] = React.useState(0);

  // 获取清理时间阈值（秒）
  const getCleanupThresholdSeconds = (): number | undefined => {
    if (!enableAutoCleanup) return undefined;

    if (cleanupThresholdPreset === "custom") {
      const hours = Number.parseInt(cleanupThresholdCustom, 10);
      return Number.isNaN(hours) || hours <= 0 ? undefined : hours * 3600;
    }

    const presetHours: Record<string, number> = {
      "1h": 1,
      "6h": 6,
      "24h": 24,
      "7d": 24 * 7,
      "30d": 24 * 30,
    };
    return (presetHours[cleanupThresholdPreset] || 24) * 3600;
  };

  // 获取中止时间阈值（秒）
  const getAbortThresholdSeconds = (): number | undefined => {
    if (!enableAutoAbort) return undefined;

    if (abortThresholdPreset === "custom") {
      const minutes = Number.parseInt(abortThresholdCustom, 10);
      return Number.isNaN(minutes) || minutes <= 0 ? undefined : minutes * 60;
    }

    const presetMinutes: Record<string, number> = {
      "30m": 30,
      "1h": 60,
      "6h": 6 * 60,
      "24h": 24 * 60,
    };
    return presetMinutes[abortThresholdPreset] || 60 * 60;
  };

  // 将未完成上传按目录分组
  const groupUploadsByDirectory = (uploads: IncompleteUpload[]): DirectoryUploads[] => {
    const dirMap = new Map<string, IncompleteUpload[]>();

    uploads.forEach((upload) => {
      const pathParts = upload.objectKey.split("/");
      pathParts.pop();
      const dirPath = pathParts.join("/");

      if (!dirMap.has(dirPath)) {
        dirMap.set(dirPath, []);
      }
      dirMap.get(dirPath)!.push(upload);
    });

    return Array.from(dirMap.entries())
      .map(([path, uploads]) => ({
        path,
        count: uploads.length,
        uploads,
        expanded: false,
      }))
      .sort((a, b) => a.path.localeCompare(b.path));
  };

  // 查看未完成上传
  const handleListIncomplete = async () => {
    setIsLoadingUploads(true);
    setCleanupResult(null);

    try {
      const response = await apiFetch<{ uploads: IncompleteUpload[]; total: number }>(
        withAdminBasePath("/api/assets/multipart/list-incomplete"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );

      const result = response;
      setIncompleteUploads(result.uploads || []);
      setDirectoryUploads(groupUploadsByDirectory(result.uploads || []));
      setShowUploadsList(true);
      toast.success(`找到 ${result.total} 个未完成的分片上传`);
    } catch (error) {
      console.error("Failed to list incomplete uploads:", error);
      toast.error("查询失败：" + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoadingUploads(false);
    }
  };

  // 清理未完成上传
  const handleCleanup = () => {
    setPendingCleanupCount(incompleteUploads.length);
    setShowConfirmDialog(true);
  };

  // 确认清理
  const confirmCleanup = async () => {
    setIsCleaning(true);
    setShowConfirmDialog(false);

    try {
      // 计算时间阈值（取两者中较小的）
      const cleanupThreshold = getCleanupThresholdSeconds();
      const abortThreshold = getAbortThresholdSeconds();

      // 如果启用了一个或多个限制，使用最小的时间阈值
      const thresholds: number[] = [];
      if (cleanupThreshold !== undefined) thresholds.push(cleanupThreshold);
      if (abortThreshold !== undefined) thresholds.push(abortThreshold);

      const minThreshold = thresholds.length > 0 ? Math.min(...thresholds) : undefined;

      const response = await apiFetch<CleanupResult>(
        withAdminBasePath("/api/assets/multipart/cleanup-incomplete"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            minThreshold ? { olderThanSeconds: minThreshold } : {}
          ),
        },
      );

      const result = response;
      setCleanupResult(result);

      const filterDesc = minThreshold
        ? `超过 ${Math.floor(minThreshold / 3600)} 小时的`
        : "所有";

      if (result.failed > 0) {
        toast.warning(
          `清理完成（${filterDesc}）：成功 ${result.cleaned} 个，失败 ${result.failed} 个`
        );
      } else {
        toast.success(`清理完成（${filterDesc}）：成功 ${result.cleaned} 个`);
      }

      // 刷新列表
      handleListIncomplete();
    } catch (error) {
      console.error("Cleanup failed:", error);
      toast.error("清理失败：" + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsCleaning(false);
    }
  };

  // 切换目录展开状态
  const toggleDirectory = (index: number) => {
    setDirectoryUploads((prev) =>
      prev.map((dir, i) => (i === index ? { ...dir, expanded: !dir.expanded } : dir)),
    );
  };

  // 展开所有目录
  const expandAllDirectories = () => {
    setDirectoryUploads((prev) => prev.map((dir) => ({ ...dir, expanded: true })));
  };

  // 折叠所有目录
  const collapseAllDirectories = () => {
    setDirectoryUploads((prev) => prev.map((dir) => ({ ...dir, expanded: false })));
  };

  return (
    <div className="grid grid-cols-1 gap-6 @xl/main:grid-cols-3">
      {/* 左侧主操作区 */}
      <div className="@xl/main:col-span-2 space-y-6">
        {/* 标题 */}
        <div className="flex items-center justify-between mt-6 sm:mt-8">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight text-foreground">分片上传管理</h1>
            <p className="text-muted-foreground mt-1 text-[15px]">
              管理和清理未完成的 Cloudflare R2 分片上传
            </p>
          </div>
        </div>

        {/* 简化的注意事项 Alert */}
        <Alert className="rounded-lg border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
          <IconAlertTriangle className="text-amber-600 dark:text-amber-400 size-4" />
          <AlertDescription className="text-[13px] text-amber-900 dark:text-amber-200">
            清理操作不可逆，请谨慎操作。建议在低峰期执行批量清理。
          </AlertDescription>
        </Alert>

        {/* 上传测试工具 */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[19px]">
              <IconCloudUpload className="size-5" />
              上传测试
            </CardTitle>
            <CardDescription className="text-[15px]">
              测试文件上传功能和分片上传流程
            </CardDescription>
          </CardHeader>
          <div className="space-y-4 px-6 pb-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workId" className="text-[14px]">作品 ID</Label>
                <Input
                  id="workId"
                  placeholder="work_xxxxx"
                  value={workId}
                  onChange={(e) => setWorkId(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectId" className="text-[14px]">项目 ID</Label>
                <Input
                  id="projectId"
                  placeholder="proj_xxxxx"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="rounded-lg"
                />
              </div>
            </div>
            <Tabs defaultValue="portfolio">
              <TabsList className="grid w-full grid-cols-2 rounded-lg bg-muted/50">
                <TabsTrigger value="portfolio" className="rounded-lg data-[state=active]:bg-background">作品集素材</TabsTrigger>
                <TabsTrigger value="delivery" className="rounded-lg data-[state=active]:bg-background">交付照片</TabsTrigger>
              </TabsList>
              <TabsContent value="portfolio" className="mt-4">
                <AssetUpload purpose="portfolio-asset" workId={workId} />
              </TabsContent>
              <TabsContent value="delivery" className="mt-4">
                <AssetUpload purpose="delivery-photo" projectId={projectId} />
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* 清理配置 */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[19px]">
              <IconAutomation className="size-5" />
              时间限制配置
            </CardTitle>
            <CardDescription className="text-[15px]">
              配置手动清理时的时间过滤规则
            </CardDescription>
          </CardHeader>
          <div className="space-y-6 px-6 pb-6">
            {/* 清理时间限制 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconTrash className="text-muted-foreground size-4" />
                  <Label className="text-[15px] font-medium">启用时间过滤</Label>
                </div>
                <Switch checked={enableAutoCleanup} onCheckedChange={setEnableAutoCleanup} />
              </div>
              {enableAutoCleanup && (
                <div className="ml-6 space-y-3 rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <IconClock className="text-muted-foreground size-4" />
                    <Label className="text-[15px]">只清理超过以下时间的未完成上传：</Label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[13px] text-muted-foreground">预设时间</Label>
                      <Select value={cleanupThresholdPreset} onValueChange={setCleanupThresholdPreset}>
                        <SelectTrigger className="h-10 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[100]" position="popper" align="start">
                          <SelectItem value="1h">1 小时</SelectItem>
                          <SelectItem value="6h">6 小时</SelectItem>
                          <SelectItem value="24h">24 小时</SelectItem>
                          <SelectItem value="7d">7 天</SelectItem>
                          <SelectItem value="30d">30 天</SelectItem>
                          <SelectItem value="custom">自定义</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {cleanupThresholdPreset === "custom" && (
                      <div className="space-y-2">
                        <Label className="text-[13px] text-muted-foreground">自定义小时数</Label>
                        <Input
                          type="number"
                          min="1"
                          max="720"
                          value={cleanupThresholdCustom}
                          onChange={(e) => setCleanupThresholdCustom(e.target.value)}
                          className="h-10 rounded-lg"
                          placeholder="24"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[13px]">
                    {cleanupThresholdPreset === "custom"
                      ? `点击清理按钮时，将只删除超过 ${cleanupThresholdCustom} 小时的未完成上传`
                      : `点击清理按钮时，将只删除超过 ${
                          cleanupThresholdPreset === "1h"
                            ? "1"
                            : cleanupThresholdPreset === "6h"
                              ? "6"
                              : cleanupThresholdPreset === "24h"
                                ? "24"
                                : cleanupThresholdPreset === "7d"
                                  ? "168"
                                  : "720"
                        } 小时的未完成上传`}
                  </p>
                </div>
              )}
            </div>

            {/* 中止时间限制 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconPlayerStop className="text-muted-foreground size-4" />
                  <Label className="text-[15px] font-medium">启用中止限制（额外过滤）</Label>
                </div>
                <Switch checked={enableAutoAbort} onCheckedChange={setEnableAutoAbort} />
              </div>
              {enableAutoAbort && (
                <div className="ml-6 space-y-3 rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <IconClock className="text-muted-foreground size-4" />
                    <Label className="text-[15px]">额外过滤：中止超过以下时间的上传：</Label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[13px] text-muted-foreground">预设时间</Label>
                      <Select value={abortThresholdPreset} onValueChange={setAbortThresholdPreset}>
                        <SelectTrigger className="h-10 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[100]" position="popper" align="start">
                          <SelectItem value="30m">30 分钟</SelectItem>
                          <SelectItem value="1h">1 小时</SelectItem>
                          <SelectItem value="6h">6 小时</SelectItem>
                          <SelectItem value="24h">24 小时</SelectItem>
                          <SelectItem value="custom">自定义</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {abortThresholdPreset === "custom" && (
                      <div className="space-y-2">
                        <Label className="text-[13px] text-muted-foreground">自定义分钟数</Label>
                        <Input
                          type="number"
                          min="1"
                          max="1440"
                          value={abortThresholdCustom}
                          onChange={(e) => setAbortThresholdCustom(e.target.value)}
                          className="h-10 rounded-lg"
                          placeholder="60"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[13px]">
                    {abortThresholdPreset === "custom"
                      ? `将同时应用清理限制，取两者中的较小值（额外过滤 ${abortThresholdCustom} 分钟）`
                      : `将同时应用清理限制，取两者中的较小值（额外过滤 ${
                          abortThresholdPreset === "30m"
                            ? "30"
                            : abortThresholdPreset === "1h"
                              ? "60"
                              : abortThresholdPreset === "6h"
                                ? "360"
                                : "1440"
                        } 分钟）`}
                  </p>
                </div>
              )}
            </div>

            {/* 说明 */}
            <div className="rounded-lg bg-muted/50 p-3 text-[13px] text-muted-foreground">
              💡 如果未启用任何时间限制，点击&ldquo;清理&rdquo;按钮将删除所有未完成的上传
            </div>
          </div>
        </Card>

        {/* 未完成上传列表 */}
        {showUploadsList && incompleteUploads.length > 0 && (
          <Card className="rounded-xl shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-[19px]">
                  <IconFolder className="size-5" />
                  未完成的分片上传
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{incompleteUploads.length} 个</Badge>
                  {viewMode === "directory" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={expandAllDirectories} className="h-9 text-[13px]">
                        全部展开
                      </Button>
                      <Button variant="ghost" size="sm" onClick={collapseAllDirectories} className="h-9 text-[13px]">
                        全部折叠
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <CardDescription className="text-[15px]">
                发现 {incompleteUploads.length} 个未完成的分片上传，分布在 {directoryUploads.length} 个目录中
              </CardDescription>
            </CardHeader>
            <div className="space-y-2 px-6 pb-6">
              {viewMode === "directory" ? (
                // 目录视图
                directoryUploads.map((dir, index) => (
                  <div
                    key={dir.path}
                    className="overflow-hidden rounded-xl border bg-card/50"
                  >
                    <button
                      onClick={() => toggleDirectory(index)}
                      className="flex w-full items-center justify-between p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {dir.expanded ? (
                          <IconChevronDown className="size-4" />
                        ) : (
                          <IconChevronRight className="size-4" />
                        )}
                        <IconFolder className="text-primary size-4" />
                        <span className="font-mono text-[15px]">
                          {dir.path === "" ? "根目录" : dir.path.replace(/\//g, " / ")}
                        </span>
                      </div>
                      <Badge variant="secondary">{dir.count}</Badge>
                    </button>
                    {dir.expanded && (
                      <div className="border-t p-3 bg-muted/20">
                        <div className="space-y-2">
                          {dir.uploads.map((upload) => (
                            <div
                              key={upload.uploadId}
                              className="rounded-lg border bg-card p-3 text-[13px]"
                            >
                              <div className="font-mono text-foreground">{upload.objectKey}</div>
                              <div className="text-muted-foreground mt-1">
                                上传 ID: {upload.uploadId.slice(0, 20)}...
                              </div>
                              <div className="text-muted-foreground mt-1">
                                开始时间: {new Date(upload.initiated).toLocaleString("zh-CN")}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // 平铺视图
                incompleteUploads.map((upload) => (
                  <div
                    key={upload.uploadId}
                    className="rounded-lg border bg-card p-4"
                  >
                    <div className="font-mono text-[15px] text-foreground">{upload.objectKey}</div>
                    <div className="text-muted-foreground mt-2 text-[13px]">
                      上传 ID: {upload.uploadId}
                    </div>
                    <div className="text-muted-foreground mt-1 text-[13px]">
                      开始时间: {new Date(upload.initiated).toLocaleString("zh-CN")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>

      {/* 右侧统计面板 */}
      <div className="@xl/main:col-span-1 space-y-6">
        {/* 快速操作 */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[19px]">
              <IconSettings className="size-5" />
              快速操作
            </CardTitle>
            <CardDescription className="text-[15px]">管理和清理未完成上传</CardDescription>
          </CardHeader>
          <div className="space-y-3 px-6 pb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleListIncomplete}
              disabled={isLoadingUploads || isCleaning}
              className="w-full rounded-lg h-10 text-[15px]"
            >
              {isLoadingUploads ? (
                <>
                  <IconRefresh className="mr-2 size-4 animate-spin" />
                  查询中...
                </>
              ) : (
                <>
                  <IconRefresh className="mr-2 size-4" />
                  查看未完成上传
                </>
              )}
            </Button>

            {incompleteUploads.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCleanup}
                disabled={isCleaning}
                className="w-full rounded-lg h-10 text-[15px]"
              >
                {isCleaning ? (
                  <>
                    <IconRefresh className="mr-2 size-4 animate-spin" />
                    清理中...
                  </>
                ) : (
                  <>
                    <IconTrash className="mr-2 size-4" />
                    清理 {incompleteUploads.length} 个
                  </>
                )}
              </Button>
            )}

            {/* 简化的状态栏 */}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {enableAutoCleanup && (
                <Badge variant="default" className="bg-blue-500 rounded-lg text-[13px]">
                  时间过滤
                </Badge>
              )}
              {enableAutoAbort && (
                <Badge variant="default" className="bg-orange-500 rounded-lg text-[13px]">
                  中止限制
                </Badge>
              )}
              {!enableAutoCleanup && !enableAutoAbort && (
                <span className="text-muted-foreground text-[13px]">清理全部</span>
              )}
            </div>
          </div>
        </Card>

        {/* 清理结果 */}
        {cleanupResult && (
          <Card className="rounded-xl shadow-md">
            <CardHeader>
              <CardTitle className="text-[19px]">清理结果</CardTitle>
              <CardDescription className="text-[15px]">上次清理操作的详细信息</CardDescription>
            </CardHeader>
            <div className="space-y-4 px-6 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-2xl font-semibold tabular-nums text-emerald-600">
                    {cleanupResult.cleaned}
                  </div>
                  <div className="text-muted-foreground text-[13px]">成功</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-semibold tabular-nums text-red-600">
                    {cleanupResult.failed}
                  </div>
                  <div className="text-muted-foreground text-[13px]">失败</div>
                </div>
              </div>
              <div className="text-muted-foreground text-[13px]">
                总计处理 {cleanupResult.total} 个未完成上传
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* 确认对话框 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[19px]">确认清理未完成的分片上传</AlertDialogTitle>
            <AlertDialogDescription className="text-[15px]">
              确定要清理 <strong>{pendingCleanupCount}</strong> 个未完成的分片上传吗？
              <br />
              <br />
              {(() => {
                const cleanupThreshold = getCleanupThresholdSeconds();
                const abortThreshold = getAbortThresholdSeconds();
                const thresholds: number[] = [];
                if (cleanupThreshold !== undefined) thresholds.push(cleanupThreshold);
                if (abortThreshold !== undefined) thresholds.push(abortThreshold);
                const minThreshold = thresholds.length > 0 ? Math.min(...thresholds) : undefined;

                if (minThreshold) {
                  return (
                    <span className="text-muted-foreground">
                      将清理超过 <strong>{Math.floor(minThreshold / 3600)} 小时</strong> 的上传
                    </span>
                  );
                }
                return (
                  <span className="text-muted-foreground">
                    将清理 <strong>所有</strong> 未完成的上传
                  </span>
                );
              })()}
              <br />
              <span className="text-destructive">此操作不可逆！</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCleanup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
            >
              确认清理
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
