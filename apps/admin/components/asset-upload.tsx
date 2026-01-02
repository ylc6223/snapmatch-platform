"use client";

import * as React from "react";
import { AlertTriangle, Check, FileImage, FileVideo, RefreshCw, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { apiFetch, ApiError, getApiErrorMessage } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/response";
import { withAdminBasePath } from "@/lib/routing/base-path";
import { cn } from "@/lib/utils";

type UploadPurpose = "portfolio-asset" | "delivery-photo";

type UploadStatus =
  | "queued"
  | "signing"
  | "uploading"
  | "confirming"
  | "success"
  | "error"
  | "canceled";

type UploadMode = "auto" | "manual";

type SignAssetData = {
  token: string;
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
};

type ConfirmResult = {
  raw: unknown;
};

type UploadItem = {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  objectKey: string | null;
  errorMessage: string | null;
  confirm: ConfirmResult | null;
};

type State = {
  items: UploadItem[];
  isDragActive: boolean;
};

type Action =
  | { type: "drag_active"; value: boolean }
  | { type: "add_files"; files: File[]; purpose: UploadPurpose }
  | { type: "remove"; id: string }
  | { type: "clear_finished" }
  | {
      type: "update";
      id: string;
      patch: Partial<
        Pick<UploadItem, "status" | "progress" | "objectKey" | "errorMessage" | "confirm">
      >;
    };

function fileKind(contentType: string) {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  return "unknown";
}

function validateFile(purpose: UploadPurpose, file: File) {
  const kind = fileKind(file.type);

  const allowed =
    purpose === "portfolio-asset"
      ? [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "image/gif",
          "video/mp4",
          "video/mpeg",
          "video/quicktime",
          "video/x-msvideo"
        ]
      : ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (!allowed.includes(file.type)) {
    return `不支持的文件类型：${file.type || "unknown"}`;
  }

  const maxSize =
    purpose === "portfolio-asset"
      ? kind === "image"
        ? 20 * 1024 * 1024
        : 200 * 1024 * 1024
      : 50 * 1024 * 1024;

  if (file.size > maxSize) {
    const maxMb = Math.round(maxSize / 1024 / 1024);
    const currentMb = (file.size / 1024 / 1024).toFixed(2);
    return `文件过大：${currentMb}MB，最大允许 ${maxMb}MB`;
  }

  return null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "drag_active":
      return { ...state, isDragActive: action.value };
    case "add_files": {
      const next = action.files.map((file) => {
        const error = validateFile(action.purpose, file);
        return {
          id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
          file,
          status: error ? ("error" as const) : ("queued" as const),
          progress: 0,
          objectKey: null,
          errorMessage: error,
          confirm: null
        };
      });
      return { ...state, items: [...next, ...state.items] };
    }
    case "remove":
      return { ...state, items: state.items.filter((item) => item.id !== action.id) };
    case "clear_finished":
      return {
        ...state,
        items: state.items.filter((item) => !["success", "canceled"].includes(item.status))
      };
    case "update":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, ...action.patch } : item
        )
      };
    default:
      return state;
  }
}

async function signAsset(input: {
  purpose: UploadPurpose;
  filename: string;
  contentType: string;
  size: number;
  projectId?: string;
  workId?: string;
}) {
  const payload = await apiFetch<ApiResponse<SignAssetData>>(
    withAdminBasePath("/api/assets/sign"),
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    }
  );
  const data = payload.data;
  if (!data?.token || !data.uploadUrl || !data.objectKey) {
    throw new Error("Invalid sign response: missing token/uploadUrl/objectKey");
  }
  return data;
}

function uploadToQiniu(input: {
  uploadUrl: string;
  token: string;
  objectKey: string;
  file: File;
  onProgress: (percent: number) => void;
  signal?: AbortSignal;
}) {
  const xhr = new XMLHttpRequest();

  const promise = new Promise<{ xhr: XMLHttpRequest; response: unknown }>((resolve, reject) => {
    xhr.open("POST", input.uploadUrl, true);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
      input.onProgress(percent);
    };

    xhr.onload = () => {
      const status = xhr.status;
      const text = xhr.responseText ?? "";
      let parsed: unknown = null;
      if (text) {
        try {
          parsed = JSON.parse(text) as unknown;
        } catch {
          parsed = text;
        }
      }
      if (status >= 200 && status < 300) {
        resolve({ xhr, response: parsed });
        return;
      }
      reject(new Error(`Upload failed: ${status}${text ? ` ${text}` : ""}`));
    };

    xhr.onerror = () => reject(new Error("Upload failed: network error"));
    xhr.onabort = () => reject(new Error("Upload canceled"));

    const formData = new FormData();
    formData.append("token", input.token);
    formData.append("key", input.objectKey);
    formData.append("file", input.file);
    xhr.send(formData);
  });

  const abort = () => xhr.abort();
  if (input.signal) {
    if (input.signal.aborted) abort();
    input.signal.addEventListener("abort", abort, { once: true });
  }

  return { xhr, promise };
}

async function confirmAsset(input: {
  purpose: UploadPurpose;
  objectKey: string;
  file: File;
  projectId?: string;
  workId?: string;
}) {
  if (input.purpose === "delivery-photo") {
    if (!input.projectId) throw new Error("delivery-photo 需要 projectId");
    return apiFetch<ApiResponse<unknown>>(withAdminBasePath("/api/photos/confirm"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId: input.projectId,
        objectKey: input.objectKey,
        filename: input.file.name,
        size: input.file.size,
        contentType: input.file.type
      })
    });
  }

  if (!input.workId) throw new Error("portfolio-asset 需要 workId");
  const kind = fileKind(input.file.type);
  if (kind !== "image" && kind !== "video")
    throw new Error("无法识别文件类型（仅支持 image/video）");

  return apiFetch<ApiResponse<unknown>>(
    withAdminBasePath(`/api/works/${input.workId}/assets/confirm`),
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        objectKey: input.objectKey,
        filename: input.file.name,
        size: input.file.size,
        contentType: input.file.type,
        type: kind
      })
    }
  );
}

export type AssetUploadProps = {
  purpose: UploadPurpose;
  workId?: string;
  projectId?: string;
  multiple?: boolean;
  concurrency?: number;
  mode?: UploadMode;
  className?: string;
  onAllComplete?: (items: UploadItem[]) => void;
};

export function AssetUpload({
  purpose,
  workId,
  projectId,
  multiple = true,
  concurrency = 3,
  mode = "auto",
  className,
  onAllComplete
}: AssetUploadProps) {
  const [state, dispatch] = React.useReducer(reducer, { items: [], isDragActive: false });
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const controllersRef = React.useRef(new Map<string, AbortController>());
  const xhRsRef = React.useRef(new Map<string, XMLHttpRequest>());
  const inFlightIdsRef = React.useRef(new Set<string>());
  const activeCountRef = React.useRef(0);
  const pumpScheduledRef = React.useRef(false);
  const schedulePumpRef = React.useRef<() => void>(() => {});
  const itemsRef = React.useRef<UploadItem[]>([]);
  const purposeRef = React.useRef(purpose);
  const workIdRef = React.useRef(workId);
  const projectIdRef = React.useRef(projectId);
  const onAllCompleteRef = React.useRef(onAllComplete);

  const effectiveConcurrency = Math.max(1, Math.min(6, Math.floor(concurrency)));

  const canAcceptFiles = purpose === "portfolio-asset" ? "image/*,video/*" : "image/*";

  React.useEffect(() => {
    itemsRef.current = state.items;
  }, [state.items]);
  React.useEffect(() => {
    purposeRef.current = purpose;
    workIdRef.current = workId;
    projectIdRef.current = projectId;
    onAllCompleteRef.current = onAllComplete;
  }, [onAllComplete, projectId, purpose, workId]);

  const pump = React.useCallback(async () => {
    while (activeCountRef.current < effectiveConcurrency) {
      const next = itemsRef.current.find(
        (item) => item.status === "queued" && !inFlightIdsRef.current.has(item.id)
      );
      if (!next) {
        if (
          activeCountRef.current === 0 &&
          itemsRef.current.some((i) => i.status === "success") &&
          itemsRef.current.every(
            (i) => !["queued", "signing", "uploading", "confirming"].includes(i.status)
          )
        ) {
          onAllCompleteRef.current?.(itemsRef.current);
        }
        return;
      }

      activeCountRef.current += 1;
      inFlightIdsRef.current.add(next.id);
      dispatch({ type: "update", id: next.id, patch: { status: "signing", errorMessage: null } });

      const controller = new AbortController();
      controllersRef.current.set(next.id, controller);
      (async () => {
        try {
          const signed = await signAsset({
            purpose: purposeRef.current,
            filename: next.file.name,
            contentType: next.file.type,
            size: next.file.size,
            projectId: purposeRef.current === "delivery-photo" ? projectIdRef.current : undefined,
            workId: purposeRef.current === "portfolio-asset" ? workIdRef.current : undefined
          });

          dispatch({
            type: "update",
            id: next.id,
            patch: { status: "uploading", progress: 0, objectKey: signed.objectKey }
          });

          const { xhr, promise } = uploadToQiniu({
            uploadUrl: signed.uploadUrl,
            token: signed.token,
            objectKey: signed.objectKey,
            file: next.file,
            signal: controller.signal,
            onProgress: (percent) =>
              dispatch({ type: "update", id: next.id, patch: { progress: percent } })
          });
          xhRsRef.current.set(next.id, xhr);

          await promise;

          dispatch({ type: "update", id: next.id, patch: { status: "confirming", progress: 100 } });
          const confirmed = await confirmAsset({
            purpose: purposeRef.current,
            objectKey: signed.objectKey,
            file: next.file,
            projectId: projectIdRef.current,
            workId: workIdRef.current
          });

          dispatch({
            type: "update",
            id: next.id,
            patch: { status: "success", confirm: { raw: confirmed }, errorMessage: null }
          });
        } catch (error) {
          const message =
            error instanceof ApiError
              ? getApiErrorMessage(error, "上传失败")
              : error instanceof Error
                ? error.message
                : "上传失败";
          const canceled = controller.signal.aborted || /canceled/i.test(message);
          dispatch({
            type: "update",
            id: next.id,
            patch: {
              status: canceled ? "canceled" : "error",
              errorMessage: canceled ? "已取消" : message
            }
          });
        } finally {
          controllersRef.current.delete(next.id);
          xhRsRef.current.delete(next.id);
          activeCountRef.current -= 1;
          inFlightIdsRef.current.delete(next.id);
          schedulePumpRef.current();
        }
      })();
    }
  }, [effectiveConcurrency]);

  schedulePumpRef.current = () => {
    if (pumpScheduledRef.current) return;
    pumpScheduledRef.current = true;
    queueMicrotask(() => {
      pumpScheduledRef.current = false;
      void pump();
    });
  };

  const startPump = React.useCallback(() => schedulePumpRef.current(), []);

  const pickFiles = React.useCallback(() => fileInputRef.current?.click(), []);

  const onFiles = React.useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      dispatch({ type: "add_files", files: multiple ? files : files.slice(0, 1), purpose });
      if (mode === "auto") startPump();
    },
    [mode, multiple, purpose, startPump]
  );

  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = Array.from(event.target.files ?? []);
    onFiles(files);
    event.target.value = "";
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    dispatch({ type: "drag_active", value: false });
    const files = Array.from(event.dataTransfer.files ?? []);
    onFiles(files);
  };

  const cancel = (id: string) => {
    controllersRef.current.get(id)?.abort();
    xhRsRef.current.get(id)?.abort();
  };

  const retry = (id: string) => {
    dispatch({
      type: "update",
      id,
      patch: { status: "queued", progress: 0, errorMessage: null, confirm: null }
    });
    startPump();
  };

  const queuedCount = state.items.filter((i) => i.status === "queued").length;
  const uploadingCount = state.items.filter((i) =>
    ["signing", "uploading", "confirming"].includes(i.status)
  ).length;
  const hasBlockingConfig =
    (purpose === "delivery-photo" && !projectId) || (purpose === "portfolio-asset" && !workId);

  return (
    <div className={cn("grid gap-4 lg:grid-cols-[1.05fr_0.95fr]", className)}>
      <Card
        className={cn(
          "relative overflow-hidden border-dashed",
          state.isDragActive ? "border-primary/60 bg-primary/5" : "border-border/60"
        )}
      >
        <div
          className="relative flex min-h-[220px] flex-col justify-between p-5"
          onDragEnter={() => dispatch({ type: "drag_active", value: true })}
          onDragOver={(event) => {
            event.preventDefault();
            dispatch({ type: "drag_active", value: true });
          }}
          onDragLeave={() => dispatch({ type: "drag_active", value: false })}
          onDrop={onDrop}
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background:repeating-linear-gradient(135deg,rgba(0,0,0,0.6)_0,rgba(0,0,0,0.6)_1px,transparent_1px,transparent_10px)] dark:[background:repeating-linear-gradient(135deg,rgba(255,255,255,0.65)_0,rgba(255,255,255,0.65)_1px,transparent_1px,transparent_10px)]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary grid size-10 place-items-center rounded-md">
                  <Upload className="size-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold tracking-tight">拖拽文件到此处上传</div>
                  <div className="text-muted-foreground text-xs leading-relaxed">
                    {purpose === "portfolio-asset"
                      ? "支持图片/视频，建议批量上传时保持并发 ≤ 3。"
                      : "仅支持图片上传，建议批量上传时保持并发 ≤ 3。"}
                  </div>
                </div>
              </div>
              <div className="text-muted-foreground text-xs font-medium tabular-nums">
                队列 {state.items.length}
              </div>
            </div>
          </div>

          <div className="relative mt-5 flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple={multiple}
              accept={canAcceptFiles}
              onChange={onInputChange}
            />

            <Button
              type="button"
              variant="default"
              onClick={pickFiles}
              disabled={hasBlockingConfig}
            >
              选择文件
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => dispatch({ type: "clear_finished" })}
              disabled={state.items.every((i) => !["success", "canceled"].includes(i.status))}
            >
              清理已完成
            </Button>
            {mode === "manual" ? (
              <Button
                type="button"
                variant="secondary"
                onClick={startPump}
                disabled={hasBlockingConfig || queuedCount === 0 || uploadingCount > 0}
              >
                开始上传
              </Button>
            ) : null}

            <div className="ml-auto flex items-center gap-2">
              <div className="text-muted-foreground text-[11px] font-semibold tracking-[0.2em] uppercase">
                {mode === "auto" ? "AUTO" : "MANUAL"}
              </div>
              <div className="text-muted-foreground text-xs tabular-nums">
                并发 {effectiveConcurrency}
              </div>
            </div>
          </div>

          {hasBlockingConfig ? (
            <div className="relative mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-100">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div className="leading-relaxed">
                {purpose === "delivery-photo"
                  ? "当前缺少 projectId，无法生成交付照片上传路径。"
                  : null}
                {purpose === "portfolio-asset" ? "当前缺少 workId，无法确认作品集素材归属。" : null}
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold tracking-tight">上传队列</div>
          <div className="text-muted-foreground text-xs tabular-nums">
            进行中 {uploadingCount} / 待上传 {queuedCount}
          </div>
        </div>
        <Separator className="my-3" />

        {state.items.length === 0 ? (
          <div className="text-muted-foreground grid min-h-[180px] place-items-center text-sm">
            还没有文件
          </div>
        ) : (
          <div className="max-h-[360px] space-y-3 overflow-auto pr-2">
            {state.items.map((item) => {
              const isImage = item.file.type.startsWith("image/");
              const isVideo = item.file.type.startsWith("video/");

              return (
                <div key={item.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <div className="text-muted-foreground mt-0.5 grid size-8 place-items-center rounded-md border">
                        {isImage ? <FileImage className="size-4" /> : null}
                        {isVideo ? <FileVideo className="size-4" /> : null}
                        {!isImage && !isVideo ? <AlertTriangle className="size-4" /> : null}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{item.file.name}</div>
                        <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums">
                          <span>{formatBytes(item.file.size)}</span>
                          <span className="truncate">{item.file.type || "unknown"}</span>
                          {item.objectKey ? (
                            <span className="truncate">{item.objectKey}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {item.status === "uploading" ||
                      item.status === "signing" ||
                      item.status === "confirming" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => cancel(item.id)}
                        >
                          <X className="size-4" />
                        </Button>
                      ) : null}
                      {item.status === "error" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => retry(item.id)}
                        >
                          <RefreshCw className="size-4" />
                        </Button>
                      ) : null}
                      {item.status !== "uploading" &&
                      item.status !== "signing" &&
                      item.status !== "confirming" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => dispatch({ type: "remove", id: item.id })}
                        >
                          <X className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <Progress value={item.progress} />
                    <div className="flex items-center justify-between text-xs">
                      <div className="text-muted-foreground flex items-center gap-2">
                        {item.status === "success" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Check className="size-3.5" />
                            已完成
                          </span>
                        ) : (
                          <span>{statusLabel(item.status)}</span>
                        )}
                        {item.errorMessage ? (
                          <span className="text-destructive inline-flex items-center gap-1">
                            <AlertTriangle className="size-3.5" />
                            {item.errorMessage}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-muted-foreground tabular-nums">{item.progress}%</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function statusLabel(status: UploadStatus) {
  switch (status) {
    case "queued":
      return "待上传";
    case "signing":
      return "签名中";
    case "uploading":
      return "上传中";
    case "confirming":
      return "确认中";
    case "success":
      return "已完成";
    case "error":
      return "失败";
    case "canceled":
      return "已取消";
    default:
      return "未知状态";
  }
}
