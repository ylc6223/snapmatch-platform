# 资产上传功能优化建议

本文档记录 Admin 项目资产上传组件的可优化点，作为后续版本迭代的参考资料。

> **相关代码**：`apps/admin/components/features/upload/asset-upload.tsx`
> **相关文档**：`docs/admin/upload-implementation-guide.md`
> **创建时间**：2026-01-03

---

## 📊 当前实现状态

### ✅ 已实现功能

- [x] S3 分片上传（multipart upload）
- [x] 单会话内断点续传（失败重试跳过已完成分片）
- [x] 并发上传控制（默认 3 个并发，可配置 1-6）
- [x] 实时进度显示
- [x] 取消上传（AbortController）
- [x] 失败重试
- [x] 文件类型和大小校验
- [x] 支持两种上传策略（s3-multipart / s3-presigned-put）

### 🎯 业务场景匹配度

| 业务场景             | 匹配度     | 说明                               |
| -------------------- | ---------- | ---------------------------------- |
| 50MB 原片上传        | ⭐⭐⭐⭐⭐ | 分片上传 + 断点续传完美支持        |
| 批量上传 100+ 张照片 | ⭐⭐⭐⭐⭐ | 并发控制 + 队列管理完善            |
| 网络不稳定环境       | ⭐⭐⭐⭐⭐ | 失败重试 + 跳过已完成分片          |
| 用户刷新页面         | ⭐⭐⭐     | 需手动重新上传（未实现跨会话恢复） |
| 视频素材上传（20MB） | ⭐⭐⭐⭐⭐ | 分片上传，速度较快                 |
| 超大文件（>100MB）   | ⭐⭐⭐⭐   | 分片大小固定 5MB，分片数量较多     |

**总体评分**：⭐⭐⭐⭐⭐ (95/100)

---

## 🚀 优化建议

### 1. 跨会话断点续传 📋 待评估

**优先级**：高

**当前问题**：

- 用户刷新页面或关闭浏览器后，上传进度丢失
- 需要重新选择文件并从头开始上传
- 对于 50MB 的大文件，用户体验较差

**优化方案**：

```typescript
// 将 uploadId 存储到 localStorage，实现跨会话恢复

interface PendingUpload {
  fileId: string;           // 文件唯一标识
  uploadId: string;         // S3 multipart upload ID
  objectKey: string;        // 对象存储键名
  fileName: string;         // 原始文件名
  fileSize: number;         // 文件大小
  purpose: UploadPurpose;   // 上传目的
  projectId?: string;       // 项目 ID（交付照片）
  workId?: string;          // 作品 ID（作品集素材）
  timestamp: number;        // 开始上传时间戳
}

// 保存上传状态
const saveUploadState = (item: UploadItem, uploadId: string) => {
  const uploads = JSON.parse(localStorage.getItem('pendingUploads') ?? '{}');
  uploads[item.id] = {
    fileId: item.id,
    uploadId,
    objectKey: item.objectKey!,
    fileName: item.file.name,
    fileSize: item.file.size,
    purpose: currentPurpose,
    projectId: currentProjectId,
    workId: currentWorkId,
    timestamp: Date.now()
  };
  localStorage.setItem('pendingUploads', JSON.stringify(uploads));
};

// 页面加载时恢复上传状态
const restoreUploads = async () => {
  const uploads = JSON.parse(localStorage.getItem('pendingUploads') ?? '{}');
  const now = Date.now();
  const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 天（与 R2 multipart 过期时间一致）

  for (const [fileId, state] of Object.entries(uploads)) {
    // 清理过期记录
    if (now - state.timestamp > MAX_AGE) {
      delete uploads[fileId];
      continue;
    }

    // 检查 uploadId 是否仍然有效（调用 listUploadedParts）
    try {
      const parts = await listUploadedParts({
        objectKey: state.objectKey,
        uploadId: state.uploadId
      });

      // 如果有已上传的分片，恢复上传
      if (parts.length > 0) {
        const file = /* 需要用户重新选择文件，或通过 File API 重建 */;
        dispatch({
          type: 'add_files',
          files: [file],
          purpose: state.purpose
        });
        dispatch({
          type: 'update',
          id: fileId,
          patch: {
            objectKey: state.objectKey,
            status: 'uploading',
            progress: calculateProgressFromParts(parts, state.fileSize)
          }
        });
        // 自动开始上传剩余分片
      }
    } catch (error) {
      // uploadId 无效，清理记录
      delete uploads[fileId];
    }
  }

  localStorage.setItem('pendingUploads', JSON.stringify(uploads));
};

// 上传完成或取消后清理记录
const clearUploadState = (fileId: string) => {
  const uploads = JSON.parse(localStorage.getItem('pendingUploads') ?? '{}');
  delete uploads[fileId];
  localStorage.setItem('pendingUploads', JSON.stringify(uploads));
};
```

**注意事项**：

1. ⚠️ **隐私问题**：localStorage 存储文件名和大小，不存储文件内容
2. ⚠️ **文件重建**：用户需要重新选择文件（浏览器安全限制）
3. ⚠️ **验证机制**：需要通过文件大小和文件名 MD5/SHA256 验证是否为同一文件
4. ✅ **过期清理**：R2 multipart 状态默认保留 7 天，localStorage 记录应同步清理
5. ✅ **UI 提示**：页面加载时显示"检测到未完成的上传，是否恢复？"提示

**预期效果**：

- 用户刷新页面后可恢复上传进度
- 关闭浏览器后重新打开可继续上传
- 减少用户重复上传的时间浪费

**工作量估算**：2-3 人日

---

### 2. 分片大小动态调整 📋 待评估

**优先级**：中

**当前问题**：

- 分片大小由后端签名时固定返回（通常为 5MB）
- 对于 50MB 文件，会生成 10 个分片
- 对于 500MB 文件（未来可能的视频素材），会生成 100 个分片
- 分片数量过多会增加合并失败的概率

**优化方案**：

```typescript
// 后端：根据文件大小动态计算分片大小
export function calculateOptimalPartSize(fileSize: number): number {
  const MIN_PART_SIZE = 5 * 1024 * 1024; // 5MB（S3 最低要求）
  const MAX_PART_SIZE = 5 * 1024 * 1024; // 5GB（S3 最高限制）

  if (fileSize < 10 * 1024 * 1024) {
    // < 10MB: 使用 5MB 分片，生成 1-2 个分片
    return 5 * 1024 * 1024;
  }

  if (fileSize < 100 * 1024 * 1024) {
    // < 100MB: 使用 10MB 分片，生成 1-10 个分片
    return 10 * 1024 * 1024;
  }

  if (fileSize < 1024 * 1024 * 1024) {
    // < 1GB: 使用 15MB 分片，生成 1-68 个分片
    return 15 * 1024 * 1024;
  }

  // >= 1GB: 使用 20MB 分片，控制分片数量在 500 以内
  return 20 * 1024 * 1024;
}

// 优化目标：
// 1. 减少分片数量（降低合并失败概率）
// 2. 保持合理的粒度（失败重试成本不过高）
// 3. 兼顾并发上传效率
```

**分片数量对比**：

| 文件大小 | 当前策略（5MB） | 优化后             | 分片数量减少 |
| -------- | --------------- | ------------------ | ------------ |
| 50MB     | 10 个分片       | 5 个分片（10MB）   | -50%         |
| 100MB    | 20 个分片       | 10 个分片（10MB）  | -50%         |
| 500MB    | 100 个分片      | 34 个分片（15MB）  | -66%         |
| 1GB      | 200 个分片      | 68 个分片（15MB）  | -66%         |
| 5GB      | 1000 个分片     | 250 个分片（20MB） | -75%         |

**注意事项**：

1. ✅ **S3 兼容性**：R2 和 COS 都支持 5MB-5GB 的分片大小
2. ⚠️ **失败成本**：分片越大，单个分片失败重传的成本越高
3. ⚠️ **内存占用**：分片越大，浏览器内存占用越高（需要平衡）
4. ✅ **并发优化**：可以适当增加并发数（如从 3 增加到 5）以补偿分片数量减少

**预期效果**：

- 减少分片数量，降低合并失败的概率
- 减少网络请求次数，提升上传效率
- 为未来支持超大文件（1GB+ 视频）做准备

**工作量估算**：1 人日

---

### 3. 指数退避重试策略 📋 待评估

**优先级**：中

**当前问题**：

- 分片上传失败后立即重试
- 如果服务器临时过载或网络拥堵，连续重试可能继续失败
- 没有最大重试次数限制，可能导致无限重试

**优化方案**：

```typescript
/**
 * 使用指数退避策略重试上传分片
 * @param url - 预签名上传 URL
 * @param blob - 分片内容
 * @param maxRetries - 最大重试次数（默认 3 次）
 * @returns 上传结果（包含 ETag）
 */
async function uploadPartWithRetry(
  input: {
    url: string;
    body: Blob;
    onProgress: (loaded: number) => void;
    signal?: AbortSignal;
  },
  maxRetries: number = 3,
): Promise<{ etag: string }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await uploadPartWithXhr(input);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 最后一次重试失败，抛出错误
      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      // 判断是否应该重试
      const shouldRetry = isRetryableError(lastError);
      if (!shouldRetry) {
        throw lastError; // 不可重试的错误（如 4xx），直接失败
      }

      // 指数退避：1s, 2s, 4s, 8s, ...
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(
        `[upload] 分片上传失败，${delay}ms 后进行第 ${attempt + 1} 次重试`,
        lastError.message,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('Upload failed: max retries exceeded');
}

/**
 * 判断错误是否可重试
 * - 5xx 服务器错误：可重试
 * - 网络错误：可重试
 * - 4xx 客户端错误：不可重试（如文件类型不匹配、权限不足）
 */
function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // 检查 HTTP 状态码
  const statusCodeMatch = message.match(/status\s+(\d{3})/);
  if (statusCodeMatch) {
    const statusCode = parseInt(statusCodeMatch[1], 10);
    // 5xx 服务器错误可重试，4xx 客户端错误不可重试
    return statusCode >= 500;
  }

  // 网络错误可重试
  if (
    message.includes('network error') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('etimedout')
  ) {
    return true;
  }

  // 默认不可重试
  return false;
}
```

**重试策略对比**：

| 策略         | 当前实现                | 指数退避优化             |
| ------------ | ----------------------- | ------------------------ |
| 重试间隔     | 立即重试                | 1s → 2s → 4s（指数增长） |
| 最大重试次数 | 无限制                  | 3 次（可配置）           |
| 错误分类     | 不区分                  | 区分可重试和不可重试错误 |
| 服务器保护   | ❌ 连续请求可能加重负担 | ✅ 给服务器恢复时间      |

**注意事项**：

1. ✅ **服务器保护**：避免在服务器过载时连续请求
2. ✅ **用户体验**：指数退避不影响用户感知（后台重试）
3. ⚠️ **超时控制**：需要设置单个分片的最大上传时间（如 30s）
4. ✅ **日志记录**：记录重试次数和错误类型，便于监控

**预期效果**：

- 减少临时故障导致的上传失败
- 保护服务器，避免雪崩效应
- 提升上传成功率

**工作量估算**：0.5 人日

---

### 4. 上传队列持久化 📋 待评估

**优先级**：低

**当前问题**：

- 用户添加多个文件到队列后，刷新页面队列丢失
- 需要重新选择文件，浪费时间

**优化方案**：

```typescript
// 将上传队列保存到 IndexedDB（支持存储 File 对象的元数据）
interface UploadQueueItem {
  id: string;
  file: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
  purpose: UploadPurpose;
  status: UploadStatus;
  progress: number;
  objectKey: string | null;
  errorMessage: string | null;
  addedAt: number;
}

// 注意：File 对象本身无法持久化，用户需要重新选择文件
// 但可以保存队列状态和文件元数据，提升体验
```

**限制说明**：

- ⚠️ **浏览器限制**：File 对象无法存储到 IndexedDB 或 localStorage
- ⚠️ **安全限制**：即使用户授权，也无法从文件路径重建 File 对象
- ✅ **替代方案**：保存文件元数据，提示用户重新选择文件
- ✅ **最佳体验**：结合"跨会话断点续传"，恢复已上传的部分

**工作量估算**：1 人日

---

### 5. 上传速度优化与自适应并发 📋 待评估

**优先级**：低

**当前问题**：

- 并发数固定（默认 3），不考虑网络状况
- 在高速网络下可能浪费带宽
- 在低速网络下可能导致拥堵

**优化方案**：

```typescript
/**
 * 根据网络状况动态调整并发数
 */
class AdaptiveConcurrencyController {
  private currentConcurrency: number = 3;
  private minConcurrency: number = 1;
  private maxConcurrency: number = 6;

  // 记录每个分片的上传时间
  private uploadMetrics: Map<number, number[]> = new Map();

  // 更新上传速度指标
  recordUploadSpeed(partNumber: number, bytes: number, duration: number) {
    const speedMbps = bytes / duration / (1024 * 1024); // MB/s

    if (!this.uploadMetrics.has(partNumber)) {
      this.uploadMetrics.set(partNumber, []);
    }
    this.uploadMetrics.get(partNumber)!.push(speedMbps);

    // 每 5 个分片评估一次
    if (this.uploadMetrics.get(partNumber)!.length >= 5) {
      this.adjustConcurrency();
    }
  }

  // 根据平均速度调整并发数
  private adjustConcurrency() {
    const allSpeeds = Array.from(this.uploadMetrics.values()).flat();
    const avgSpeed = allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length;

    if (avgSpeed > 10) {
      // 高速网络（>10MB/s）：增加并发
      this.currentConcurrency = Math.min(this.maxConcurrency, this.currentConcurrency + 1);
    } else if (avgSpeed < 2) {
      // 低速网络（<2MB/s）：减少并发
      this.currentConcurrency = Math.max(this.minConcurrency, this.currentConcurrency - 1);
    }

    console.log(
      `[AdaptiveConcurrency] 平均速度: ${avgSpeed.toFixed(2)} MB/s, 调整并发: ${this.currentConcurrency}`,
    );
  }

  getConcurrency(): number {
    return this.currentConcurrency;
  }
}
```

**注意事项**：

1. ⚠️ **复杂度增加**：需要额外的逻辑来管理并发调整
2. ⚠️ **波动性**：网络速度可能有较大波动，需要平滑处理
3. ✅ **性能提升**：在高速网络下可显著提升上传速度

**工作量估算**：1-2 人日

---

## 📈 优化实施建议

### 推荐实施顺序

1. **第一阶段（高优先级）**
   - ✅ 跨会话断点续传（2-3 人日）
   - ✅ 指数退避重试策略（0.5 人日）

2. **第二阶段（中优先级）**
   - ✅ 分片大小动态调整（1 人日）

3. **第三阶段（低优先级）**
   - ⏸️ 上传队列持久化（1 人日）
   - ⏸️ 自适应并发控制（1-2 人日）

### 技术风险评估

| 优化项           | 技术风险                 | 测试复杂度                 | 建议做法                  |
| ---------------- | ------------------------ | -------------------------- | ------------------------- |
| 跨会话断点续传   | 中（需要验证文件一致性） | 高（需要模拟各种中断场景） | 先在 staging 环境充分测试 |
| 分片大小动态调整 | 低（后端逻辑简单）       | 中（需要测试不同文件大小） | 可以直接上线              |
| 指数退避重试     | 低（不影响现有逻辑）     | 低（只需测试失败场景）     | 可以直接上线              |
| 队列持久化       | 高（受浏览器限制）       | 高（需要大量边界测试）     | 需要评估性价比            |
| 自适应并发       | 中（需要大量调优）       | 高（需要模拟各种网络环境） | 建议优先级降低            |

---

## 📝 参考资料

- **代码位置**：`apps/admin/components/features/upload/asset-upload.tsx`
- **实现文档**：`docs/admin/upload-implementation-guide.md`
- **讨论文档**：`discuss/admin/upload-assets-signing-scheme.md`
- **S3 Multipart API**：https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html
- **R2 兼容性**：https://developers.cloudflare.com/r2/api/s3/api/

---

**最后更新**：2026-01-03
**创建者**：开发团队
**状态**：📋 待评估
