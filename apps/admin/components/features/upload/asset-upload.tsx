/**
 * 资产上传组件
 *
 * 支持功能：
 * - 拖拽上传和文件选择
 * - 多文件并发上传（可配置并发数）
 * - 支持 S3 分片上传和预签名 URL 上传
 * - 自动/手动上传模式
 * - 断点续传（分片上传）
 * - 上传进度实时显示
 * - 失败重试
 */

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

// ==================== 类型定义 ====================

/** 上传目的类型 */
type UploadPurpose = "portfolio-asset" | "delivery-photo";

/** 上传状态 */
type UploadStatus =
  | "queued"       // 排队中
  | "signing"      // 获取签名中
  | "uploading"    // 上传中
  | "confirming"   // 确认中
  | "success"      // 成功
  | "error"        // 失败
  | "canceled";    // 已取消

/** 上传模式：自动上传或手动触发 */
type UploadMode = "auto" | "manual";

/** 上传策略：S3 预签名 PUT 或 S3 分片上传 */
type UploadStrategy = "s3-presigned-put" | "s3-multipart";

/** 签名响应数据 */
type SignAssetData = {
  token: string;              // 上传令牌
  uploadUrl: string;          // 预签名上传 URL（用于 presigned-put 策略）
  objectKey: string;          // 对象存储键名
  expiresIn: number;          // 过期时间（秒）
  uploadStrategy?: UploadStrategy;  // 上传策略
  uploadId?: string;          // 分片上传 ID（用于 multipart 策略）
  partSize?: number;          // 分片大小（字节，用于 multipart 策略）
};

/** 确认结果 */
type ConfirmResult = {
  raw: unknown;               // 原始响应数据
};

/** 上传项 */
type UploadItem = {
  id: string;                 // 唯一标识
  file: File;                 // 文件对象
  status: UploadStatus;       // 当前状态
  progress: number;           // 上传进度（0-100）
  objectKey: string | null;   // 对象存储键名
  errorMessage: string | null;// 错误信息
  confirm: ConfirmResult | null;  // 确认结果
};

/** 组件状态 */
type State = {
  items: UploadItem[];        // 上传队列
  isDragActive: boolean;      // 是否正在拖拽
};

/** 状态管理 Action */
type Action =
  | { type: "drag_active"; value: boolean }  // 更新拖拽状态
  | { type: "add_files"; files: File[]; purpose: UploadPurpose }  // 添加文件
  | { type: "remove"; id: string }          // 移除文件
  | { type: "clear_finished" }              // 清理已完成项
  | {
      type: "update";                       // 更新上传项状态
      id: string;
      patch: Partial<
        Pick<UploadItem, "status" | "progress" | "objectKey" | "errorMessage" | "confirm">
      >;
    };

// ==================== 工具函数 ====================

/**
 * 根据内容类型获取文件种类
 * @param contentType - 文件的 MIME 类型
 * @returns 文件种类：image | video | unknown
 */
function fileKind(contentType: string) {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  return "unknown";
}

/**
 * 验证文件是否符合上传要求
 * @param purpose - 上传目的
 * @param file - 待验证的文件
 * @returns 验证错误信息，null 表示通过验证
 */
function validateFile(purpose: UploadPurpose, file: File) {
  // 根据上传目的定义允许的文件类型
  const allowed =
    purpose === "portfolio-asset"
      ? ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]  // 支持动图
      : ["image/jpeg", "image/jpg", "image/png", "image/webp"];             // 交付照片不支持动图

  if (!allowed.includes(file.type)) {
    return `不支持的文件类型：${file.type || "unknown"}`;
  }

  // 根据上传目的定义文件大小限制
  const maxSize = purpose === "portfolio-asset" ? 20 * 1024 * 1024 : 50 * 1024 * 1024;  // 20MB vs 50MB

  if (file.size > maxSize) {
    const maxMb = Math.round(maxSize / 1024 / 1024);
    const currentMb = (file.size / 1024 / 1024).toFixed(2);
    return `文件过大：${currentMb}MB，最大允许 ${maxMb}MB`;
  }

  return null;
}

/**
 * 格式化字节为可读的大小
 * @param bytes - 字节数
 * @returns 格式化后的字符串（如 "1.5 MB"）
 */
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

// ==================== 状态管理 ====================

/**
 * Reducer: 管理组件状态
 */
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "drag_active":
      return { ...state, isDragActive: action.value };
    case "add_files": {
      // 验证并添加文件到队列
      const next = action.files.map((file) => {
        const error = validateFile(action.purpose, file);
        return {
          id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,  // 生成唯一 ID
          file,
          status: error ? ("error" as const) : ("queued" as const),  // 验证失败则为错误状态
          progress: 0,
          objectKey: null,
          errorMessage: error,
          confirm: null
        };
      });
      return { ...state, items: [...next, ...state.items] };
    }
    case "remove":
      // 移除指定文件
      return { ...state, items: state.items.filter((item) => item.id !== action.id) };
    case "clear_finished":
      // 清理已完成或已取消的文件
      return {
        ...state,
        items: state.items.filter((item) => !["success", "canceled"].includes(item.status))
      };
    case "update":
      // 更新文件状态
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

// ==================== API 函数 ====================

/**
 * 请求资产上传签名
 * 根据文件信息和上传目的，获取上传所需的签名信息
 */
async function signAsset(input: {
  purpose: UploadPurpose;
  filename: string;
  contentType: string;
  size: number;
  projectId?: string;     // 交付照片需要
  workId?: string;        // 作品集素材需要
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
  if (!data?.objectKey) throw new Error("Invalid sign response: missing objectKey");

  // 验证响应数据的完整性
  const strategy: UploadStrategy = data.uploadStrategy ?? "s3-multipart";
  if (strategy === "s3-multipart") {
    if (!data.uploadId || !data.partSize) {
      throw new Error("Invalid sign response: missing uploadId/partSize for multipart upload");
    }
  } else if (strategy === "s3-presigned-put") {
    if (!data.uploadUrl) {
      throw new Error("Invalid sign response: missing uploadUrl for presigned put");
    }
  }
  return data;
}

/**
 * 列出已上传的分片（用于断点续传）
 */
async function listUploadedParts(input: { objectKey: string; uploadId: string }) {
  const payload = await apiFetch<ApiResponse<{ parts: { partNumber: number; etag: string }[] }>>(
    withAdminBasePath("/api/assets/multipart/list-parts"),
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    }
  );
  return payload.data?.parts ?? [];
}

/**
 * 请求分片上传的预签名 URL
 */
async function signUploadPart(input: { objectKey: string; uploadId: string; partNumber: number }) {
  const payload = await apiFetch<ApiResponse<{ url: string }>>(
    withAdminBasePath("/api/assets/multipart/sign-part"),
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    }
  );
  const url = payload.data?.url;
  if (!url) throw new Error("Invalid sign-part response: missing url");
  return url;
}

/**
 * 完成分片上传，合并所有分片
 */
async function completeMultipartUpload(input: {
  objectKey: string;
  uploadId: string;
  parts: { partNumber: number; etag: string }[];
}) {
  await apiFetch<ApiResponse<{ ok: true }>>(withAdminBasePath("/api/assets/multipart/complete"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
}

// ==================== 上传逻辑 ====================

/**
 * 使用 XMLHttpRequest 上传单个文件/分片
 * 提供进度回调和取消能力
 */
function uploadPartWithXhr(input: {
  url: string;
  body: Blob;
  onProgress: (loaded: number) => void;  // 进度回调，参数为已上传字节数
  signal?: AbortSignal;                   // 用于取消上传
}) {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<{ etag: string }>((resolve, reject) => {
    xhr.open("PUT", input.url, true);

    // 监听上传进度
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      input.onProgress(event.loaded);
    };

    // 上传完成
    xhr.onload = () => {
      const status = xhr.status;
      if (status < 200 || status >= 300) {
        reject(
          new Error(`Upload failed: ${status}${xhr.responseText ? ` ${xhr.responseText}` : ""}`)
        );
        return;
      }
      // 从响应头中获取 ETag（用于 S3 分片上传）
      const raw = (xhr.getResponseHeader("etag") ?? xhr.getResponseHeader("ETag") ?? "").trim();
      const etag = raw.startsWith('"') && raw.endsWith('"') ? raw : raw ? `"${raw}"` : "";
      if (!etag) {
        reject(new Error("Upload failed: missing ETag response header"));
        return;
      }
      resolve({ etag });
    };

    xhr.onerror = () => reject(new Error("Upload failed: network error"));
    xhr.onabort = () => reject(new Error("Upload canceled"));

    xhr.send(input.body);
  });

  // 支持通过 AbortSignal 取消上传
  const abort = () => xhr.abort();
  if (input.signal) {
    if (input.signal.aborted) abort();
    input.signal.addEventListener("abort", abort, { once: true });
  }

  return { xhr, promise };
}

/**
 * S3 分片上传
 * 支持断点续传，自动跳过已上传的分片
 */
async function uploadToS3Multipart(input: {
  objectKey: string;
  uploadId: string;
  partSize: number;       // 每个分片的大小（字节）
  file: File;
  onProgress: (percent: number) => void;  // 总体进度百分比
  signal?: AbortSignal;
  onXhr?: (xhr: XMLHttpRequest) => void;  // 用于保存 XHR 引用以便取消
}) {
  const totalParts = Math.ceil(input.file.size / input.partSize);

  // 获取已上传的分片（断点续传）
  const already = await listUploadedParts({ objectKey: input.objectKey, uploadId: input.uploadId });
  const completed = new Map<number, string>();
  for (const p of already) {
    if (p.partNumber > 0 && p.etag) completed.set(p.partNumber, p.etag);
  }

  // 计算已完成的字节数，用于进度计算
  const partBytes = (partNumber: number) => {
    const start = (partNumber - 1) * input.partSize;
    const end = Math.min(input.file.size, partNumber * input.partSize);
    return Math.max(0, end - start);
  };

  const completedBytes = Array.from(completed.keys()).reduce(
    (sum, partNumber) => sum + partBytes(partNumber),
    0
  );
  let uploadedBytes = completedBytes;

  // 收集所有分片信息
  const allParts: { partNumber: number; etag: string }[] = Array.from(completed.entries()).map(
    ([partNumber, etag]) => ({ partNumber, etag })
  );

  // 逐个上传分片
  for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
    if (input.signal?.aborted) throw new Error("Upload canceled");
    if (completed.has(partNumber)) continue;  // 跳过已上传的分片

    // 获取分片上传的预签名 URL
    const url = await signUploadPart({
      objectKey: input.objectKey,
      uploadId: input.uploadId,
      partNumber
    });
    const start = (partNumber - 1) * input.partSize;
    const end = Math.min(input.file.size, partNumber * input.partSize);
    const blob = input.file.slice(start, end);
    const total = blob.size;
    let currentLoaded = 0;

    // 上传分片
    const { xhr, promise } = uploadPartWithXhr({
      url,
      body: blob,
      signal: input.signal,
      onProgress(loaded) {
        currentLoaded = loaded;
        // 计算总体进度（包括已完成的分片）
        const percent = Math.max(
          0,
          Math.min(100, Math.round(((uploadedBytes + currentLoaded) / input.file.size) * 100))
        );
        input.onProgress(percent);
      }
    });
    input.onXhr?.(xhr);

    const result = await promise;
    uploadedBytes += total;
    currentLoaded = 0;
    completed.set(partNumber, result.etag);
    allParts.push({ partNumber, etag: result.etag });
    const percent = Math.max(0, Math.min(100, Math.round((uploadedBytes / input.file.size) * 100)));
    input.onProgress(percent);
  }

  // 完成分片上传，合并所有分片
  await completeMultipartUpload({
    objectKey: input.objectKey,
    uploadId: input.uploadId,
    parts: allParts
  });
}

/**
 * 确认资产上传完成
 * 根据上传目的调用不同的确认接口
 */
async function confirmAsset(input: {
  purpose: UploadPurpose;
  objectKey: string;
  file: File;
  projectId?: string;
  workId?: string;
}) {
  // 交付照片确认
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

  // 作品集素材确认
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

// ==================== 组件定义 ====================

/** 资产上传组件属性 */
export type AssetUploadProps = {
  purpose: UploadPurpose;                        // 上传目的
  workId?: string;                               // 作品 ID（作品集素材需要）
  projectId?: string;                            // 项目 ID（交付照片需要）
  multiple?: boolean;                            // 是否支持多文件选择
  concurrency?: number;                          // 并发上传数（1-6）
  mode?: UploadMode;                             // 上传模式：自动或手动
  className?: string;                            // 自定义样式类名
  onAllComplete?: (items: UploadItem[]) => void;  // 所有文件上传完成回调
};

/**
 * 资产上传组件
 * 提供拖拽上传、文件选择、并发上传、进度显示、失败重试等功能
 */
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
  // 状态管理
  const [state, dispatch] = React.useReducer(reducer, { items: [], isDragActive: false });
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // 并发控制相关的 Ref
  const controllersRef = React.useRef(new Map<string, AbortController>());  // 用于取消上传
  const xhRsRef = React.useRef(new Map<string, XMLHttpRequest>());          // XHR 实例
  const inFlightIdsRef = React.useRef(new Set<string>());                  // 正在上传的文件 ID
  const activeCountRef = React.useRef(0);                                   // 当前活跃上传数
  const pumpScheduledRef = React.useRef(false);                            // 是否已调度 pump
  const schedulePumpRef = React.useRef<() => void>(() => {});              // 调度 pump 的函数

  // 保存最新值的 Ref（避免闭包陷阱）
  const itemsRef = React.useRef<UploadItem[]>([]);
  const purposeRef = React.useRef(purpose);
  const workIdRef = React.useRef(workId);
  const projectIdRef = React.useRef(projectId);
  const onAllCompleteRef = React.useRef(onAllComplete);

  // 限制并发数在 1-6 之间
  const effectiveConcurrency = Math.max(1, Math.min(6, Math.floor(concurrency)));

  const canAcceptFiles = "image/*";

  React.useEffect(() => {
    itemsRef.current = state.items;
  }, [state.items]);
  React.useEffect(() => {
    purposeRef.current = purpose;
    workIdRef.current = workId;
    projectIdRef.current = projectId;
    onAllCompleteRef.current = onAllComplete;
  }, [onAllComplete, projectId, purpose, workId]);

  /**
   * Pump: 上传调度器
   * 负责从队列中取出待上传文件，维持并发数限制，执行完整上传流程
   */
  const pump = React.useCallback(async () => {
    // 循环处理，直到达到并发限制或队列为空
    while (activeCountRef.current < effectiveConcurrency) {
      // 查找下一个待上传的文件
      const next = itemsRef.current.find(
        (item) => item.status === "queued" && !inFlightIdsRef.current.has(item.id)
      );
      if (!next) {
        // 检查是否所有文件都已完成
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

      // 增加活跃计数并标记为处理中
      activeCountRef.current += 1;
      inFlightIdsRef.current.add(next.id);
      dispatch({ type: "update", id: next.id, patch: { status: "signing", errorMessage: null } });

      // 创建取消控制器
      const controller = new AbortController();
      controllersRef.current.set(next.id, controller);

      // 执行上传流程（立即执行，不等待）
      (async () => {
        try {
          // 1. 获取上传签名
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

          // 2. 根据策略上传文件
          const strategy: UploadStrategy = signed.uploadStrategy ?? "s3-multipart";

          if (strategy === "s3-multipart") {
            // 分片上传（大文件）
            await uploadToS3Multipart({
              objectKey: signed.objectKey,
              uploadId: signed.uploadId!,
              partSize: signed.partSize!,
              file: next.file,
              signal: controller.signal,
              onXhr: (xhr) => xhRsRef.current.set(next.id, xhr),
              onProgress: (percent) =>
                dispatch({ type: "update", id: next.id, patch: { progress: percent } })
            });
          } else if (strategy === "s3-presigned-put") {
            // 预签名 URL 上传（小文件）
            const { xhr, promise } = uploadPartWithXhr({
              url: signed.uploadUrl,
              body: next.file,
              signal: controller.signal,
              onProgress(loaded) {
                const percent = Math.max(
                  0,
                  Math.min(100, Math.round((loaded / Math.max(1, next.file.size)) * 100))
                );
                dispatch({ type: "update", id: next.id, patch: { progress: percent } });
              }
            });
            xhRsRef.current.set(next.id, xhr);
            await promise;
          } else {
            throw new Error(`Unsupported upload strategy: ${String(strategy)}`);
          }

          // 3. 确认上传完成
          dispatch({ type: "update", id: next.id, patch: { status: "confirming", progress: 100 } });
          const confirmed = await confirmAsset({
            purpose: purposeRef.current,
            objectKey: signed.objectKey,
            file: next.file,
            projectId: projectIdRef.current,
            workId: workIdRef.current
          });

          // 4. 标记为成功
          dispatch({
            type: "update",
            id: next.id,
            patch: { status: "success", confirm: { raw: confirmed }, errorMessage: null }
          });
        } catch (error) {
          // 错误处理
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
          // 清理资源并触发下一轮调度
          controllersRef.current.delete(next.id);
          xhRsRef.current.delete(next.id);
          activeCountRef.current -= 1;
          inFlightIdsRef.current.delete(next.id);
          schedulePumpRef.current();
        }
      })();
    }
  }, [effectiveConcurrency]);

  // Pump 调度函数（防抖，避免重复执行）
  schedulePumpRef.current = () => {
    if (pumpScheduledRef.current) return;
    pumpScheduledRef.current = true;
    queueMicrotask(() => {
      pumpScheduledRef.current = false;
      void pump();
    });
  };

  const startPump = React.useCallback(() => schedulePumpRef.current(), []);

  // 触发文件选择
  const pickFiles = React.useCallback(() => fileInputRef.current?.click(), []);

  // 处理文件添加
  const onFiles = React.useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      dispatch({ type: "add_files", files: multiple ? files : files.slice(0, 1), purpose });
      if (mode === "auto") startPump();  // 自动模式：立即开始上传
    },
    [mode, multiple, purpose, startPump]
  );

  // 处理文件输入框变化
  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const files = Array.from(event.target.files ?? []);
    onFiles(files);
    event.target.value = "";  // 重置 input，允许重复选择同一文件
  };

  // 处理文件拖放
  const onDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    dispatch({ type: "drag_active", value: false });
    const files = Array.from(event.dataTransfer.files ?? []);
    onFiles(files);
  };

  // 取消上传
  const cancel = (id: string) => {
    controllersRef.current.get(id)?.abort();
    xhRsRef.current.get(id)?.abort();
  };

  // 重试上传
  const retry = (id: string) => {
    dispatch({
      type: "update",
      id,
      patch: { status: "queued", progress: 0, errorMessage: null, confirm: null }
    });
    startPump();
  };

  // 统计数据
  const queuedCount = state.items.filter((i) => i.status === "queued").length;
  const uploadingCount = state.items.filter((i) =>
    ["signing", "uploading", "confirming"].includes(i.status)
  ).length;
  const hasBlockingConfig =
    (purpose === "delivery-photo" && !projectId) || (purpose === "portfolio-asset" && !workId);

  // ==================== 渲染 UI ====================

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

// ==================== 辅助函数 ====================

/**
 * 获取上传状态的中文标签
 */
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
