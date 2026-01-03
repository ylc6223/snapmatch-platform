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
  IconPlayerPlay,
  IconPlayerStop,
  IconChevronRight,
  IconChevronDown,
  IconFolder,
  IconRefresh,
  IconAlertTriangle,
  IconCheck,
  IconDashboard,
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

  // 定时执行配置
  const [scheduledInterval, setScheduledInterval] = React.useState<string>("60");
  const [isScheduledRunning, setIsScheduledRunning] = React.useState(false);
  const scheduledTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastExecutionTimeRef = React.useRef<Date | null>(null);
  const lastExecutionResultRef = React.useRef<string>("");

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

  // 清理定时器
  React.useEffect(() => {
    return () => {
      if (scheduledTimerRef.current) {
        clearInterval(scheduledTimerRef.current);
      }
    };
  }, []);

  // 执行定时任务
  const performScheduledTask = async () => {
    const results: string[] = [];
    const startTime = new Date();

    try {
      if (enableAutoCleanup) {
        const cleanupThreshold = getCleanupThresholdSeconds();
        const cleanupResponse = await apiFetch<CleanupResult>(
          withAdminBasePath("/api/assets/multipart/cleanup-incomplete"),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cleanupThreshold ? { olderThanSeconds: cleanupThreshold } : {}),
          },
        );

        const cleanupResult = cleanupResponse.data || cleanupResponse;
        if (cleanupResult.cleaned > 0) {
          results.push(`清理：成功 ${cleanupResult.cleaned} 个`);
        }
        if (cleanupResult.failed > 0) {
          results.push(`清理失败：${cleanupResult.failed} 个`);
        }
      }

      if (enableAutoAbort) {
        const abortThreshold = getAbortThresholdSeconds();
        const abortResponse = await apiFetch<CleanupResult>(
          withAdminBasePath("/api/assets/multipart/cleanup-incomplete"),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(abortThreshold ? { olderThanSeconds: abortThreshold } : {}),
          },
        );

        const abortResult = abortResponse.data || abortResponse;
        if (abortResult.cleaned > 0) {
          results.push(`中止：成功 ${abortResult.cleaned} 个`);
        }
        if (abortResult.failed > 0) {
          results.push(`中止失败：${abortResult.failed} 个`);
        }
      }

      lastExecutionTimeRef.current = startTime;
      const resultSummary = results.length > 0 ? results.join("，") : "无需操作（未启用自动化规则）";
      lastExecutionResultRef.current = resultSummary;

      if (results.length === 0) {
        toast.info("定时任务执行完成：未启用任何自动化规则");
      } else if (results.some((r) => r.includes("失败"))) {
        toast.warning("定时任务执行完成：部分操作失败", { description: resultSummary });
      } else {
        toast.success("定时任务执行完成", { description: resultSummary });
      }
    } catch (error) {
      console.error("Scheduled task failed:", error);
      toast.error("定时任务执行失败：" + (error instanceof Error ? error.message : String(error)));
      lastExecutionResultRef.current = "执行失败";
    }
  };

  // 切换定时任务
  const toggleScheduledTask = () => {
    if (isScheduledRunning) {
      // 停止定时任务
      if (scheduledTimerRef.current) {
        clearInterval(scheduledTimerRef.current);
        scheduledTimerRef.current = null;
      }
      setIsScheduledRunning(false);
      toast.info("定时任务已停止");
    } else {
      // 启动定时任务
      if (!enableAutoCleanup && !enableAutoAbort) {
        toast.error("请先启用至少一个自动化规则");
        return;
      }

      const intervalMs = Number.parseInt(scheduledInterval, 10) * 60 * 1000;
      if (Number.isNaN(intervalMs) || intervalMs < 60000) {
        toast.error("执行间隔必须大于等于 1 分钟");
        return;
      }

      // 立即执行一次
      performScheduledTask();

      // 设置定时器
      scheduledTimerRef.current = setInterval(performScheduledTask, intervalMs);
      setIsScheduledRunning(true);
      toast.success(`定时任务已启动，每 ${scheduledInterval} 分钟执行一次`);
    }
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

      const result = response.data || response;
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
      const response = await apiFetch<CleanupResult>(
        withAdminBasePath("/api/assets/multipart/cleanup-incomplete"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );

      const result = response.data || response;
      setCleanupResult(result);

      if (result.failed > 0) {
        toast.warning(`清理完成：成功 ${result.cleaned} 个，失败 ${result.failed} 个`);
      } else {
        toast.success(`清理完成：成功 ${result.cleaned} 个`);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">分片上传管理</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              管理和清理未完成的 Cloudflare R2 分片上传
            </p>
          </div>
        </div>

        {/* 上传测试工具 */}
        <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCloudUpload className="size-5" />
              上传测试
            </CardTitle>
            <CardDescription>
              测试文件上传功能和分片上传流程
            </CardDescription>
          </CardHeader>
          <div className="space-y-4 px-6 pb-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workId">作品 ID</Label>
                <Input
                  id="workId"
                  placeholder="work_xxxxx"
                  value={workId}
                  onChange={(e) => setWorkId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectId">项目 ID</Label>
                <Input
                  id="projectId"
                  placeholder="proj_xxxxx"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                />
              </div>
            </div>
            <Tabs defaultValue="portfolio">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="portfolio">作品集素材</TabsTrigger>
                <TabsTrigger value="delivery">交付照片</TabsTrigger>
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

        {/* 自动化规则配置 */}
        <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconAutomation className="size-5" />
              自动化规则
            </CardTitle>
            <CardDescription>
              配置自动清理和中止未完成上传的规则
            </CardDescription>
          </CardHeader>
          <div className="space-y-6 px-6 pb-6">
            {/* 自动清理 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconTrash className="text-muted-foreground size-4" />
                  <Label className="text-sm font-medium">自动清理</Label>
                </div>
                <Switch checked={enableAutoCleanup} onCheckedChange={setEnableAutoCleanup} />
              </div>
              {enableAutoCleanup && (
                <div className="ml-6 space-y-3 rounded-lg border bg-card/50 p-4">
                  <div className="flex items-center gap-2">
                    <IconClock className="text-muted-foreground size-4" />
                    <Label className="text-sm">清理超过以下时间的未完成上传：</Label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">预设时间</Label>
                      <Select value={cleanupThresholdPreset} onValueChange={setCleanupThresholdPreset}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
                        <Label className="text-xs text-muted-foreground">自定义小时数</Label>
                        <Input
                          type="number"
                          min="1"
                          max="720"
                          value={cleanupThresholdCustom}
                          onChange={(e) => setCleanupThresholdCustom(e.target.value)}
                          className="h-9"
                          placeholder="24"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {cleanupThresholdPreset === "custom"
                      ? `将删除超过 ${cleanupThresholdCustom} 小时的未完成上传`
                      : `将删除超过 ${
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

            {/* 自动中止 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconPlayerStop className="text-muted-foreground size-4" />
                  <Label className="text-sm font-medium">自动中止</Label>
                </div>
                <Switch checked={enableAutoAbort} onCheckedChange={setEnableAutoAbort} />
              </div>
              {enableAutoAbort && (
                <div className="ml-6 space-y-3 rounded-lg border bg-card/50 p-4">
                  <div className="flex items-center gap-2">
                    <IconClock className="text-muted-foreground size-4" />
                    <Label className="text-sm">中止超过以下时间的上传：</Label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">预设时间</Label>
                      <Select value={abortThresholdPreset} onValueChange={setAbortThresholdPreset}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
                        <Label className="text-xs text-muted-foreground">自定义分钟数</Label>
                        <Input
                          type="number"
                          min="1"
                          max="1440"
                          value={abortThresholdCustom}
                          onChange={(e) => setAbortThresholdCustom(e.target.value)}
                          className="h-9"
                          placeholder="60"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {abortThresholdPreset === "custom"
                      ? `将中止超过 ${abortThresholdCustom} 分钟的未完成上传`
                      : `将中止超过 ${
                          abortThresholdPreset === "30m"
                            ? "30"
                            : abortThresholdPreset === "1h"
                              ? "60"
                              : abortThresholdPreset === "6h"
                                ? "360"
                                : "1440"
                        } 分钟的未完成上传`}
                  </p>
                </div>
              )}
            </div>

            {/* 定时执行 */}
            <div className="rounded-lg border border-lumina-border-default bg-lumina-block p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconDashboard className="text-lumina-primary size-4" />
                  <div>
                    <div className="text-sm font-medium">定时执行自动化任务</div>
                    <div className="text-muted-foreground text-xs">
                      {enableAutoCleanup || enableAutoAbort
                        ? "已启用自动化规则，可配置定时执行"
                        : "请先启用至少一个自动化规则"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">执行间隔（分钟）</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1440"
                    value={scheduledInterval}
                    onChange={(e) => setScheduledInterval(e.target.value)}
                    className="h-9"
                    placeholder="60"
                    disabled={isScheduledRunning}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant={isScheduledRunning ? "destructive" : "default"}
                    size="sm"
                    onClick={toggleScheduledTask}
                    className="w-full"
                    disabled={!enableAutoCleanup && !enableAutoAbort}
                  >
                    {isScheduledRunning ? (
                      <>
                        <IconPlayerStop className="mr-2 size-4" />
                        停止定时任务
                      </>
                    ) : (
                      <>
                        <IconPlayerPlay className="mr-2 size-4" />
                        启动定时任务
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {isScheduledRunning && (
                <div className="mt-3 rounded-md bg-lumina-panel p-3">
                  <div className="text-lumina-primary text-sm font-medium">● 定时任务运行中</div>
                  <div className="text-muted-foreground text-xs">
                    每 {scheduledInterval} 分钟执行一次
                    {lastExecutionTimeRef.current &&
                      `（上次执行：${lastExecutionTimeRef.current.toLocaleTimeString()}）`}
                    {lastExecutionResultRef.current && ` - ${lastExecutionResultRef.current}`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 未完成上传列表 */}
        {showUploadsList && incompleteUploads.length > 0 && (
          <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <IconFolder className="size-5" />
                  未完成的分片上传
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{incompleteUploads.length} 个</Badge>
                  {viewMode === "directory" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={expandAllDirectories} className="h-8 text-xs">
                        全部展开
                      </Button>
                      <Button variant="ghost" size="sm" onClick={collapseAllDirectories} className="h-8 text-xs">
                        全部折叠
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <CardDescription>
                发现 {incompleteUploads.length} 个未完成的分片上传，分布在 {directoryUploads.length} 个目录中
              </CardDescription>
            </CardHeader>
            <div className="space-y-2 px-6 pb-6">
              {viewMode === "directory" ? (
                // 目录视图
                directoryUploads.map((dir, index) => (
                  <div
                    key={dir.path}
                    className="overflow-hidden rounded-lg border border-lumina-border-default bg-lumina-block"
                  >
                    <button
                      onClick={() => toggleDirectory(index)}
                      className="flex w-full items-center justify-between p-3 transition-colors hover:bg-lumina-block-hover"
                    >
                      <div className="flex items-center gap-3">
                        {dir.expanded ? (
                          <IconChevronDown className="size-4" />
                        ) : (
                          <IconChevronRight className="size-4" />
                        )}
                        <IconFolder className="text-lumina-primary size-4" />
                        <span className="font-mono text-sm">
                          {dir.path === "" ? "根目录" : dir.path.replace(/\//g, " / ")}
                        </span>
                      </div>
                      <Badge variant="secondary">{dir.count}</Badge>
                    </button>
                    {dir.expanded && (
                      <div className="border-t border-lumina-graphite p-3">
                        <div className="space-y-2">
                          {dir.uploads.map((upload) => (
                            <div
                              key={upload.uploadId}
                              className="rounded-md border bg-lumina-slate p-3 text-xs"
                            >
                              <div className="font-mono text-lumina-paper">{upload.objectKey}</div>
                              <div className="text-lumina-muted mt-1">
                                上传 ID: {upload.uploadId.slice(0, 20)}...
                              </div>
                              <div className="text-lumina-muted mt-1">
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
                    className="rounded-md border bg-lumina-slate p-4"
                  >
                    <div className="font-mono text-sm text-lumina-paper">{upload.objectKey}</div>
                    <div className="text-lumina-muted mt-2 text-xs">
                      上传 ID: {upload.uploadId}
                    </div>
                    <div className="text-lumina-muted mt-1 text-xs">
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
        <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSettings className="size-5" />
              快速操作
            </CardTitle>
            <CardDescription>管理和清理未完成上传</CardDescription>
          </CardHeader>
          <div className="space-y-3 px-6 pb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleListIncomplete}
              disabled={isLoadingUploads || isCleaning}
              className="w-full"
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
                className="w-full"
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
          </div>
        </Card>

        {/* 状态统计 */}
        <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardTitle>当前状态</CardTitle>
            <CardDescription>自动化规则和定时任务状态</CardDescription>
          </CardHeader>
          <div className="space-y-4 px-6 pb-6">
            {enableAutoCleanup || enableAutoAbort ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">已启用规则</div>
                <div className="flex flex-wrap gap-2">
                  {enableAutoCleanup && (
                    <Badge variant="default" className="bg-blue-500">
                      自动清理
                    </Badge>
                  )}
                  {enableAutoAbort && (
                    <Badge variant="default" className="bg-orange-500">
                      自动中止
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">手动模式</div>
            )}

            {isScheduledRunning && (
              <>
                <div className="h-px bg-border" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    定时任务运行中
                  </div>
                  <div className="text-muted-foreground text-xs">
                    每 {scheduledInterval} 分钟执行一次
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* 清理结果 */}
        {cleanupResult && (
          <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader>
              <CardTitle>清理结果</CardTitle>
              <CardDescription>上次清理操作的详细信息</CardDescription>
            </CardHeader>
            <div className="space-y-4 px-6 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-2xl font-semibold tabular-nums text-emerald-600">
                    {cleanupResult.cleaned}
                  </div>
                  <div className="text-muted-foreground text-xs">成功</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-semibold tabular-nums text-red-600">
                    {cleanupResult.failed}
                  </div>
                  <div className="text-muted-foreground text-xs">失败</div>
                </div>
              </div>
              <div className="text-muted-foreground text-xs">
                总计处理 {cleanupResult.total} 个未完成上传
              </div>
            </div>
          </Card>
        )}

        {/* 帮助信息 */}
        <Card className="bg-gradient-to-t from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <IconAlertTriangle className="size-5" />
              注意事项
            </CardTitle>
          </CardHeader>
          <div className="space-y-2 px-6 pb-6 text-xs text-amber-800 dark:text-amber-200">
            <p>• 因 CORS 配置错误或网络中断可能导致未完成的分片上传占用存储空间</p>
            <p>• 清理操作不可逆，请谨慎操作</p>
            <p>• 建议在低峰期执行批量清理操作</p>
            <p>• 定时任务会在后台自动执行，不需要手动干预</p>
          </div>
        </Card>
      </div>

      {/* 确认对话框 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清理未完成的分片上传</AlertDialogTitle>
            <AlertDialogDescription>
              确定要清理 <strong>{pendingCleanupCount}</strong> 个未完成的分片上传吗？
              <br />
              <span className="text-destructive">此操作不可逆！</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCleanup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认清理
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
