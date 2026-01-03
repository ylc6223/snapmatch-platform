"use client";

import * as React from "react";

import { AssetUpload } from "@/components/features/upload/asset-upload";
import { apiFetch } from "@/lib/api/client";
import { withAdminBasePath } from "@/lib/routing/base-path";
import { AlertTriangle, Check, RefreshCw, Trash2, Clock, Settings, Play, Pause, ChevronRight, ChevronDown, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  path: string;  // 目录路径，如 "portfolio/assets/2026/01"
  count: number;  // 该目录下的未完成上传数量
  uploads: IncompleteUpload[];  // 该目录下的所有未完成上传
  expanded: boolean;  // 是否展开
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
  const [directoryUploads, setDirectoryUploads] = React.useState<DirectoryUploads[]>([]);  // 按目录分组
  const [viewMode, setViewMode] = React.useState<"flat" | "directory">("directory");  // 视图模式
  const [isLoadingUploads, setIsLoadingUploads] = React.useState(false);
  const [isCleaning, setIsCleaning] = React.useState(false);
  const [isAborting, setIsAborting] = React.useState(false);  // 中止操作的加载状态
  const [cleanupResult, setCleanupResult] = React.useState<CleanupResult | null>(null);
  const [showUploadsList, setShowUploadsList] = React.useState(false);

  // 自动化规则配置
  const [enableAutoCleanup, setEnableAutoCleanup] = React.useState(false);  // 自动清理
  const [enableAutoAbort, setEnableAutoAbort] = React.useState(false);  // 自动中止
  const [cleanupThresholdPreset, setCleanupThresholdPreset] = React.useState<string>("24h");  // 清理时间阈值预设
  const [cleanupThresholdCustom, setCleanupThresholdCustom] = React.useState<string>("24");  // 清理时间阈值自定义
  const [abortThresholdPreset, setAbortThresholdPreset] = React.useState<string>("1h");  // 中止时间阈值预设
  const [abortThresholdCustom, setAbortThresholdCustom] = React.useState<string>("1");  // 中止时间阈值自定义

  // 定时执行配置
  const [scheduledInterval, setScheduledInterval] = React.useState<string>("60"); // 执行间隔（分钟）
  const [isScheduledRunning, setIsScheduledRunning] = React.useState(false);
  const scheduledTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastExecutionTimeRef = React.useRef<Date | null>(null);
  const lastExecutionResultRef = React.useRef<string>("");  // 上次执行结果

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
      // 提取目录路径（去掉文件名）
      const pathParts = upload.objectKey.split('/');
      pathParts.pop(); // 移除文件名
      const dirPath = pathParts.join('/');

      if (!dirMap.has(dirPath)) {
        dirMap.set(dirPath, []);
      }
      dirMap.get(dirPath)!.push(upload);
    });

    // 转换为数组并排序（按路径字母序）
    return Array.from(dirMap.entries())
      .map(([path, uploads]) => ({
        path,
        count: uploads.length,
        uploads,
        expanded: false,  // 默认折叠
      }))
      .sort((a, b) => a.path.localeCompare(b.path));
  };

  // 清理定时器（组件卸载时）
  React.useEffect(() => {
    return () => {
      if (scheduledTimerRef.current) {
        clearInterval(scheduledTimerRef.current);
      }
    };
  }, []);

  // 执行定时任务（清理和中止）
  const performScheduledTask = async () => {
    const results: string[] = [];
    const startTime = new Date();

    try {
      // 1. 执行清理（如果启用）
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

      // 2. 执行中止（如果启用）
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

      // 根据结果显示 toast
      if (results.length === 0) {
        toast.info("定时任务执行完成：未启用任何自动化规则");
      } else if (results.some(r => r.includes("失败"))) {
        toast.warning("定时任务执行完成：部分操作失败", {
          description: resultSummary,
        });
      } else {
        toast.success("定时任务执行完成", {
          description: resultSummary,
        });
      }
    } catch (error) {
      console.error("Scheduled task failed:", error);
      toast.error("定时任务执行失败：" + (error instanceof Error ? error.message : String(error)));
      lastExecutionResultRef.current = "执行失败";
    }
  };

  // 启动/停止定时任务
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
      // 检查是否至少启用了一个自动化规则
      if (!enableAutoCleanup && !enableAutoAbort) {
        toast.error("请至少启用一个自动化规则（清理或中止）");
        return;
      }

      // 启动定时任务
      const intervalMinutes = Number.parseInt(scheduledInterval, 10);
      if (Number.isNaN(intervalMinutes) || intervalMinutes < 1) {
        toast.error("请输入有效的时间间隔（至少 1 分钟）");
        return;
      }

      performScheduledTask(); // 立即执行一次
      scheduledTimerRef.current = setInterval(performScheduledTask, intervalMinutes * 60 * 1000);
      setIsScheduledRunning(true);

      // 构建任务描述
      const tasks = [];
      if (enableAutoCleanup) {
        tasks.push(`清理超过 ${getCleanupThresholdSeconds()! / 3600} 小时的上传`);
      }
      if (enableAutoAbort) {
        tasks.push(`中止超过 ${getAbortThresholdSeconds()! / 60} 分钟的上传`);
      }

      toast.success(`定时任务已启动，每 ${intervalMinutes} 分钟执行一次`, {
        description: tasks.join("，"),
      });
    }
  };

  // 列出未完成的上传
  const handleListIncomplete = async () => {
    setIsLoadingUploads(true);
    setShowUploadsList(false);
    setCleanupResult(null);

    try {
      // 如果启用了自动化规则，使用清理阈值过滤；否则显示所有
      const filterSeconds = getCleanupThresholdSeconds();
      const response = await apiFetch<{ uploads: IncompleteUpload[]; total: number }>(
        withAdminBasePath("/api/assets/multipart/list-incomplete"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filterSeconds ? { olderThanSeconds: filterSeconds } : {}),
        },
      );
      const uploads = response.data?.uploads || response.uploads || [];
      setIncompleteUploads(uploads);

      // 按目录分组
      const grouped = groupUploadsByDirectory(uploads);
      setDirectoryUploads(grouped);

      setShowUploadsList(true);

      if (uploads.length === 0) {
        toast.info("没有发现符合条件的未完成上传");
      } else {
        const dirCount = grouped.length;
        const filterDesc = filterSeconds
          ? `（超过 ${filterSeconds / 3600} 小时）`
          : "";
        toast.success(`发现 ${uploads.length} 个未完成的分片上传${filterDesc}，分布在 ${dirCount} 个目录中`);
      }
    } catch (error) {
      console.error("Failed to list incomplete uploads:", error);
      toast.error("获取未完成上传失败：" + (error instanceof Error ? error.message : String(error)));
      setIncompleteUploads([]);
      setDirectoryUploads([]);
    } finally {
      setIsLoadingUploads(false);
    }
  };

  // 打开确认对话框
  const openConfirmDialog = () => {
    setPendingCleanupCount(incompleteUploads.length);
    setShowConfirmDialog(true);
  };

  // 确认清理
  const confirmCleanup = async () => {
    setShowConfirmDialog(false);
    setIsCleaning(true);
    setCleanupResult(null);

    try {
      const cleanupThreshold = getCleanupThresholdSeconds();
      const response = await apiFetch<CleanupResult>(
        withAdminBasePath("/api/assets/multipart/cleanup-incomplete"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanupThreshold ? { olderThanSeconds: cleanupThreshold } : {}),
        },
      );
      const result = response.data || response;
      setCleanupResult(result);
      setIncompleteUploads([]);

      if (result.failed === 0) {
        toast.success(`清理成功！已清理 ${result.cleaned} 个未完成的分片上传`);
      } else {
        toast.warning(`清理完成：成功 ${result.cleaned}，失败 ${result.failed}`, {
          description: "详情请查看页面下方",
        });
      }
    } catch (error) {
      console.error("Failed to cleanup incomplete uploads:", error);
      toast.error("清理失败：" + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsCleaning(false);
    }
  };

  // 手动清理的包装函数
  const handleCleanup = () => {
    openConfirmDialog();
  };

  // 切换目录展开/折叠
  const toggleDirectory = (path: string) => {
    setDirectoryUploads((prev) =>
      prev.map((dir) =>
        dir.path === path ? { ...dir, expanded: !dir.expanded } : dir
      )
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

  // 获取目录的显示名称（美化路径）
  const formatDirectoryPath = (path: string): string => {
    if (!path) return "/";
    const parts = path.split('/');
    return parts.join(' / ');
  };

  return (
    <div className="space-y-4 p-6">
      {/* 清理未完成上传区域 */}
      <Card className="border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
        {/* 标题和说明 */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Trash2 className="text-amber-600 size-5 dark:text-amber-500" />
              <div className="font-semibold text-amber-900 dark:text-amber-100">
                清理未完成的分片上传
              </div>
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              因 CORS 配置错误或网络中断可能导致未完成的分片上传占用存储空间。
              点击&ldquo;查看&rdquo;按钮查看详情，点击&ldquo;清理&rdquo;按钮释放存储空间。
            </div>
          </div>
        </div>

        {/* 配置区域 */}
        <div className="mb-4 rounded-md border border-amber-200 bg-white p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 border-b border-amber-200 pb-2 dark:border-amber-800">
            <Settings className="text-amber-600 size-4 dark:text-amber-500" />
            <div className="font-medium text-amber-900 text-sm dark:text-amber-100">
              自动化规则配置
            </div>
          </div>

          <div className="mt-3 space-y-4">
            {/* 自动清理配置 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trash2 className="text-muted-foreground size-4" />
                  <Label className="text-sm font-medium">自动清理未完成上传</Label>
                </div>
                <Switch
                  checked={enableAutoCleanup}
                  onCheckedChange={setEnableAutoCleanup}
                />
              </div>

              {enableAutoCleanup && (
                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="text-muted-foreground size-4" />
                    <Label className="text-sm">清理超过以下时间的未完成上传：</Label>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">预设时间</Label>
                      <Select value={cleanupThresholdPreset} onValueChange={setCleanupThresholdPreset}>
                        <SelectTrigger className="h-8">
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
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">自定义小时数</Label>
                        <Input
                          type="number"
                          min="1"
                          max="720"
                          value={cleanupThresholdCustom}
                          onChange={(e) => setCleanupThresholdCustom(e.target.value)}
                          className="h-8"
                          placeholder="24"
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-muted-foreground text-xs">
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
                  </div>
                </div>
              )}
            </div>

            {/* 自动中止配置 */}
            <div className="space-y-2 border-t border-amber-100 pt-3 dark:border-amber-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pause className="text-muted-foreground size-4" />
                  <Label className="text-sm font-medium">自动中止未完成上传</Label>
                </div>
                <Switch
                  checked={enableAutoAbort}
                  onCheckedChange={setEnableAutoAbort}
                />
              </div>

              {enableAutoAbort && (
                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="text-muted-foreground size-4" />
                    <Label className="text-sm">中止超过以下时间的上传：</Label>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">预设时间</Label>
                      <Select value={abortThresholdPreset} onValueChange={setAbortThresholdPreset}>
                        <SelectTrigger className="h-8">
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
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">自定义分钟数</Label>
                        <Input
                          type="number"
                          min="1"
                          max="1440"
                          value={abortThresholdCustom}
                          onChange={(e) => setAbortThresholdCustom(e.target.value)}
                          className="h-8"
                          placeholder="60"
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-muted-foreground text-xs">
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
                  </div>
                </div>
              )}
            </div>

            {/* 定时执行配置 */}
            <div className="space-y-2 border-t border-amber-100 pt-3 dark:border-amber-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="text-amber-600 size-4 dark:text-amber-500" />
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

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">执行间隔（分钟）</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1440"
                    value={scheduledInterval}
                    onChange={(e) => setScheduledInterval(e.target.value)}
                    className="h-8"
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
                        <Pause className="mr-2 size-4" />
                        停止定时任务
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 size-4" />
                        启动定时任务
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {isScheduledRunning && (
                <div className="rounded-md bg-emerald-50 p-2 dark:bg-emerald-950/20">
                  <div className="text-emerald-900 text-sm font-medium dark:text-emerald-100">
                    ● 定时任务运行中
                  </div>
                  <div className="text-muted-foreground text-xs">
                    每 {scheduledInterval} 分钟执行一次
                    {lastExecutionTimeRef.current && `（上次执行：${lastExecutionTimeRef.current.toLocaleTimeString()}）`}
                    {lastExecutionResultRef.current && ` - ${lastExecutionResultRef.current}`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-xs">
            {enableAutoCleanup || enableAutoAbort ? (
              <span>
                已启用自动化规则：
                {enableAutoCleanup && <span className="text-blue-600 dark:text-blue-400"> 自动清理</span>}
                {enableAutoCleanup && enableAutoAbort && <span> + </span>}
                {enableAutoAbort && <span className="text-orange-600 dark:text-orange-400"> 自动中止</span>}
              </span>
            ) : (
              <span>手动模式：显示所有未完成的分片上传</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleListIncomplete}
              disabled={isLoadingUploads || isCleaning}
            >
              {isLoadingUploads ? (
                <>
                  <RefreshCw className="mr-2 size-4 animate-spin" />
                  查询中...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 size-4" />
                  查看
                </>
              )}
            </Button>

            {incompleteUploads.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCleanup}
                disabled={isCleaning}
              >
                {isCleaning ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                    清理中...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 size-4" />
                    清理 {incompleteUploads.length} 个
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* 未完成上传列表 */}
        {showUploadsList && incompleteUploads.length > 0 && (
          <div className="mt-3 space-y-2">
            {/* 视图切换和操作 */}
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-xs">
                发现 {incompleteUploads.length} 个未完成的分片上传，分布在 {directoryUploads.length} 个目录中
              </div>
              <div className="flex items-center gap-2">
                {viewMode === "directory" && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={expandAllDirectories}
                      className="h-7 text-xs"
                    >
                      全部展开
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={collapseAllDirectories}
                      className="h-7 text-xs"
                    >
                      全部折叠
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* 目录视图（Cloudflare Dashboard 风格） */}
            {viewMode === "directory" && (
              <div className="max-h-96 space-y-1 overflow-auto rounded-md border border-amber-200 bg-white p-2 dark:border-amber-900 dark:bg-amber-950/30">
                {directoryUploads.map((dir) => (
                  <div
                    key={dir.path}
                    className="rounded border border-amber-100 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20"
                  >
                    {/* 目录标题行 */}
                    <div
                      className="flex cursor-pointer items-center justify-between p-2 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                      onClick={() => toggleDirectory(dir.path)}
                    >
                      <div className="flex items-center gap-2">
                        {dir.expanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                        <Folder className="text-amber-600 size-4 dark:text-amber-500" />
                        <span className="font-medium text-sm">{formatDirectoryPath(dir.path)}</span>
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                          {dir.count} 个
                        </span>
                      </div>
                    </div>

                    {/* 目录下的上传列表（展开时显示） */}
                    {dir.expanded && (
                      <div className="ml-6 mt-1 space-y-1 border-l-2 border-amber-200 pl-3 dark:border-amber-800">
                        {dir.uploads.map((upload) => (
                          <div
                            key={upload.uploadId}
                            className="rounded bg-white p-2 text-xs dark:bg-amber-950/40"
                          >
                            <div className="font-mono text-xs">{upload.objectKey.split('/').pop()}</div>
                            <div className="text-muted-foreground mt-1 flex items-center justify-between text-[10px]">
                              <span className="font-mono">{upload.uploadId.slice(0, 16)}...</span>
                              <span>{new Date(upload.initiated).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 扁平视图（原始列表） */}
            {viewMode === "flat" && (
              <div className="max-h-48 space-y-1 overflow-auto rounded-md border border-amber-200 bg-white p-2 dark:border-amber-900 dark:bg-amber-950/30">
                {incompleteUploads.map((upload) => (
                  <div
                    key={upload.uploadId}
                    className="rounded border border-amber-100 bg-amber-50 p-2 text-xs dark:border-amber-900 dark:bg-amber-900/20"
                  >
                    <div className="font-mono">{upload.objectKey}</div>
                    <div className="text-muted-foreground mt-1 flex items-center justify-between">
                      <span>UploadId: {upload.uploadId.slice(0, 20)}...</span>
                      <span>{new Date(upload.initiated).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 清理结果 */}
        {cleanupResult && (
          <Alert className="mt-3">
            {cleanupResult.failed === 0 ? (
              <Check className="text-emerald-600 size-4" />
            ) : (
              <AlertTriangle className="text-amber-600 size-4" />
            )}
            <AlertDescription>
              <div className="font-semibold">
                清理完成：成功 {cleanupResult.cleaned} 个，失败 {cleanupResult.failed} 个
              </div>
              {cleanupResult.failed > 0 && (
                <div className="mt-2 max-h-32 overflow-auto text-xs">
                  <div className="font-semibold mb-1">失败详情：</div>
                  {cleanupResult.details
                    .filter((d) => !d.success)
                    .map((detail, idx) => (
                      <div key={idx} className="text-destructive">
                        • {detail.objectKey}: {detail.error}
                      </div>
                    ))}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {showUploadsList && incompleteUploads.length === 0 && (
          <Alert className="mt-3">
            <Check className="text-emerald-600 size-4" />
            <AlertDescription>✅ 没有发现未完成的分片上传</AlertDescription>
          </Alert>
        )}
      </Card>

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

      {/* 确认清理对话框 */}
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
