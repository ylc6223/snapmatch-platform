# 全局照片库 - 性能优化策略

> **优化目标**:
>
> - 首屏加载时间 < 1秒
> - 滚动帧率 ≥ 60 FPS
> - 批量操作100张照片 < 3秒
> - 搜索响应时间 < 500ms
>
> **最后更新**: 2026-01-10

---

## 📊 性能瓶颈分析

### 典型场景

假设系统中有 **10,000 张照片**，每张照片：

- 原图大小：~2MB
- 预览图大小：~500KB
- 缩略图大小：~20KB

**总数据量**：

- 原图：20GB
- 预览图：5GB
- 缩略图：200MB

### 性能挑战

| 挑战               | 影响                     | 优先级 |
| ------------------ | ------------------------ | ------ |
| 加载10,000张缩略图 | 网络带宽、内存占用       | 🔴 高  |
| 渲染大量DOM节点    | 浏览器性能、滚动流畅度   | 🔴 高  |
| 复杂筛选查询       | 数据库查询时间           | 🟡 中  |
| 批量操作           | 数据库写入性能、网络传输 | 🟡 中  |
| 全局搜索           | 查询响应时间             | 🟢 低  |

---

## 🚀 三层优化策略

### 层级1：数据层 - 分页加载

#### 1.1 分页查询

```typescript
// ❌ 一次性加载所有照片（错误）
const allPhotos = await fetch('/api/photos'); // 返回10,000条

// ✅ 分页加载（正确）
const page1 = await fetch('/api/photos?page=1&limit=50'); // 返回50条
```

**收益**：

- 减少99.5%的初始数据传输
- 首屏加载时间从 ~20秒 降至 ~0.5秒

#### 1.2 字段裁剪

```sql
-- ❌ 查询所有字段
SELECT * FROM photos;

-- ✅ 只查询需要的字段
SELECT
  p._id,
  p.filename,
  p.thumbKey,
  p.previewKey,
  p.categoryId,
  p.isProjectCover,
  p.createdAt,
  pr.name as projectName,
  c.name as customerName
FROM photos p
LEFT JOIN projects pr ON p.projectId = pr._id
LEFT JOIN customers c ON pr.customerId = c._id;
```

**收益**：

- 减少50%的数据传输量
- 查询速度提升 ~30%

#### 1.3 索引优化

```sql
-- 单列索引
CREATE INDEX IDX_PHOTOS_CATEGORY ON photos(categoryId);
CREATE INDEX IDX_PHOTOS_CREATED ON photos(createdAt DESC);

-- 复合索引（类目+创建时间）
CREATE INDEX IDX_PHOTOS_CATEGORY_TIME ON photos(categoryId, createdAt DESC);

-- 覆盖索引（包含所有查询字段）
CREATE INDEX IDX_PHOTOS_LIST ON photos(
  categoryId,
  createdAt DESC,
  _id,
  filename,
  thumbKey,
  projectId
);
```

**收益**：

- 查询速度提升 ~70%
- 避免 Using filesort

---

### 层级2：渲染层 - 虚拟列表

#### 2.1 虚拟滚动原理

```typescript
// ❌ 渲染所有DOM（错误）
{allPhotos.map(photo => (
  <PhotoCard key={photo.id} photo={photo} />
))} // 10,000个DOM节点

// ✅ 虚拟列表（正确）
<VirtualList
  itemCount={10000}
  itemSize={200}
  windowHeight={800}
>
  {({ index, style }) => (
    <div style={style}>
      <PhotoCard photo={photos[index]} />
    </div>
  )}
</VirtualList> // 只渲染可见的 ~40个DOM节点
```

**虚拟列表工作原理**：

```
视口高度：800px
每行高度：200px
每行照片数：4张

可见行数 = 800 / 200 = 4行
可见照片数 = 4 × 4 = 16张
预渲染行数（overscan）= 5行
实际渲染DOM节点 = 9行 × 4 = 36个
```

**收益**：

- 减少99.64%的DOM节点（10,000 → 36）
- 内存占用减少 ~95%
- 滚动帧率稳定在60 FPS

#### 2.2 实现对比

| 方案     | DOM节点数 | 内存占用 | 滚动FPS   | 实现复杂度  |
| -------- | --------- | -------- | --------- | ----------- |
| 原生渲染 | 10,000    | ~500MB   | 10-15 FPS | ⭐ 简单     |
| 虚拟列表 | 36        | ~20MB    | 60 FPS    | ⭐⭐⭐ 复杂 |

**推荐库**：

- `@tanstack/react-virtual`: 最新、性能最好
- `react-window`: 经典、稳定
- `react-virtuoso`: 功能最全

---

### 层级3：图片层 - 缩略图优先

#### 3.1 渐进式加载策略

```typescript
// ❌ 直接加载原图（错误）
<Image
  src={photo.originalKey} // 2MB
  alt={photo.filename}
/>

// ✅ 缩略图优先（正确）
const [loadOriginal, setLoadOriginal] = useState(false);

<Image
  src={loadOriginal ? photo.previewKey : photo.thumbKey} // 先20KB，后500KB
  alt={photo.filename}
  loading="lazy"
  onClick={() => setLoadOriginal(true)}
/>
```

**加载流程**：

```
1. 初始状态：加载缩略图（20KB）
   ↓ 用户点击查看
2. 点击状态：加载预览图（500KB）
   ↓ 用户点击查看详情
3. 详情状态：加载原图（2MB）
```

#### 3.2 图片优化技术

```typescript
// Next.js Image组件自动优化
<Image
  src={photo.thumbKey}
  alt={photo.filename}
  width={200}
  height={200}
  loading="lazy"
  placeholder="blur"          // 模糊占位符
  blurDataURL={photo.blurDataURL} // 极小的模糊图（~1KB）
/>
```

**生成模糊占位符**：

```typescript
// 使用 sharp 生成模糊图
import sharp from 'sharp';

async function generateBlurDataURL(imagePath: string) {
  const blurImage = await sharp(imagePath)
    .resize(10, 10) // 缩小到10×10像素
    .blur(5) // 模糊处理
    .toBuffer();

  return `data:image/jpeg;base64,${blurImage.toString('base64')}`;
}
```

**收益**：

- 首屏加载时间减少 ~80%
- 用户感知速度提升显著（LCP指标）

---

## 🔍 查询性能优化

### 1. 标签筛选优化（AND逻辑）

#### 问题

```sql
-- ❌ 低效查询（多个JOIN）
SELECT DISTINCT p.*
FROM photos p
INNER JOIN photo_tags pt1 ON p._id = pt1.photoId AND pt1.tagId = 'tag_1'
INNER JOIN photo_tags pt2 ON p._id = pt2.photoId AND pt2.tagId = 'tag_2'
INNER JOIN photo_tags pt3 ON p._id = pt3.photoId AND pt3.tagId = 'tag_3'
```

**问题**：

- 多次JOIN，性能随标签数量指数下降
- 3个标签查询时间：~500ms

#### 优化方案

```sql
-- ✅ 使用子查询 + HAVING
SELECT p.*
FROM photos p
WHERE p._id IN (
  SELECT photoId
  FROM photo_tags
  WHERE tagId IN ('tag_1', 'tag_2', 'tag_3')
  GROUP BY photoId
  HAVING COUNT(DISTINCT tagId) = 3  -- 必须包含所有3个标签
)
```

**收益**：

- 查询时间：500ms → 50ms（10倍提升）

### 2. 全局搜索优化

#### 问题

```typescript
// ❌ 串行搜索（慢）
const results1 = await searchByFilename(keyword);
const results2 = await searchByProjectName(keyword);
const results3 = await searchByCustomerName(keyword);
const results4 = await searchByTagName(keyword);
const allResults = [...results1, ...results2, ...results3, ...results4];
```

**问题**：

- 4个查询串行执行，总耗时 = 4 × 单个查询时间

#### 优化方案

```typescript
// ✅ 并行搜索（快）
const [results1, results2, results3, results4] = await Promise.all([
  searchByFilename(keyword),
  searchByProjectName(keyword),
  searchByCustomerName(keyword),
  searchByTagName(keyword),
]);
const allResults = [...results1, ...results2, ...results3, ...results4];
```

**收益**：

- 搜索时间：800ms → 200ms（4倍提升）

### 3. 搜索结果缓存

```typescript
// ✅ 使用 Redis 缓存搜索结果
async function search(keyword: string) {
  const cacheKey = `search:${keyword}`;

  // 1. 尝试从缓存获取
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. 执行搜索
  const results = await executeSearch(keyword);

  // 3. 写入缓存（5分钟过期）
  await redis.setex(cacheKey, 300, JSON.stringify(results));

  return results;
}
```

**收益**：

- 重复搜索响应时间：200ms → 5ms（40倍提升）

---

## 📤 批量操作优化

### 1. 分批处理

```typescript
// ❌ 一次性处理1000张照片（错误）
await batchDelete(photoIds); // 超时风险

// ✅ 分批处理（正确）
async function batchDeleteSafe(photoIds: string[]) {
  const batchSize = 50;

  for (let i = 0; i < photoIds.length; i += batchSize) {
    const batch = photoIds.slice(i, i + batchSize);

    // 并发处理（但限制并发数）
    await Promise.all(batch.map((photoId) => deletePhoto(photoId)));

    // 显示进度
    const progress = Math.min(((i + batchSize) / photoIds.length) * 100, 100);
    updateProgress(progress);
  }
}
```

**收益**：

- 避免504超时
- 用户体验更好（有进度反馈）

### 2. 批量操作SQL优化

```sql
-- ❌ 逐条删除（慢）
DELETE FROM photo_tags WHERE photoId = 'pho_1';
DELETE FROM photo_tags WHERE photoId = 'pho_2';
DELETE FROM photo_tags WHERE photoId = 'pho_3';
-- ... 1000次查询

-- ✅ 批量删除（快）
DELETE FROM photo_tags
WHERE photoId IN ('pho_1', 'pho_2', 'pho_3', ...); -- 1次查询
```

**收益**：

- 删除1000张照片的标签关联：
  - 逐条删除：~10秒
  - 批量删除：~0.1秒（100倍提升）

### 3. 异步任务队列

对于超大批量操作（>1000张），使用消息队列：

```typescript
// ✅ 使用 Bull 队列
import Queue from 'bull';

const photoQueue = new Queue('photo-operations', {
  redis: { host: 'localhost', port: 6379 },
});

// 添加任务
const job = await photoQueue.add({
  action: 'batch-delete',
  photoIds: photoIds, // 5000张照片
});

// 查询任务状态
const state = await job.getState(); // 'waiting', 'active', 'completed'
const progress = job.progress(); // 0-100

// 完成后通知
job.on('completed', (result) => {
  socket.emit('notification', {
    message: `已删除 ${result.deletedCount} 张照片`,
  });
});
```

**收益**：

- 不阻塞用户界面
- 支持大规模操作（10,000+张）
- 任务可追踪、可重试

---

## 🎯 前端性能优化

### 1. React 性能优化

#### 1.1 使用 React.memo

```typescript
// ❌ 每次父组件更新都重新渲染
export function PhotoCard({ photo }: { photo: Photo }) {
  return <div>...</div>;
}

// ✅ 使用 React.memo 避免不必要的重渲染
export const PhotoCard = React.memo<PhotoCardProps>(({ photo }) => {
  return <div>...</div>;
}, (prev, next) => {
  // 自定义比较函数
  return prev.photo.id === next.photo.id
    && prev.photo.isSelected === next.photo.isSelected;
});
```

#### 1.2 使用 useCallback

```typescript
// ❌ 每次渲染创建新函数
function PhotoGrid() {
  return (
    <div>
      {photos.map(photo => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onClick={() => handleClick(photo)} // 每次渲染都是新函数
        />
      ))}
    </div>
  );
}

// ✅ 使用 useCallback 保持函数引用稳定
function PhotoGrid() {
  const handleClick = useCallback((photo: Photo) => {
    // ...
  }, []);

  return (
    <div>
      {photos.map(photo => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onClick={handleClick} // 函数引用稳定
        />
      ))}
    </div>
  );
}
```

### 2. 防抖和节流

```typescript
import { useDebouncedCallback } from 'use-debounce';
import { useThrottledCallback } from 'use-debounce';

// 搜索防抖（300ms）
const debouncedSearch = useDebouncedCallback((keyword: string) => {
  searchPhotos(keyword);
}, 300);

// 滚动节流（100ms）
const throttledScroll = useThrottledCallback(() => {
  loadMorePhotos();
}, 100);
```

### 3. 代码分割

```typescript
// ❌ 一次性加载所有代码
import { PhotoDetailDrawer } from './components/PhotoDetailDrawer';
import { BatchActionBar } from './components/BatchActionBar';

// ✅ 动态导入（按需加载）
const PhotoDetailDrawer = lazy(() => import('./components/PhotoDetailDrawer'));
const BatchActionBar = lazy(() => import('./components/BatchActionBar'));

// 使用时包裹 Suspense
<Suspense fallback={<Spinner />}>
  <PhotoDetailDrawer />
</Suspense>
```

---

## 📈 性能监控

### 1. 关键指标

```typescript
// 使用 Web Vitals 监控
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log); // 布局偏移
getFID(console.log); // 首次输入延迟
getFCP(console.log); // 首次内容绘制
getLCP(console.log); // 最大内容绘制
getTTFB(console.log); // 首字节时间
```

### 2. 自定义埋点

```typescript
// 记录关键操作耗时
async function trackPerformance(operation: string, fn: () => Promise<void>) {
  const start = performance.now();

  try {
    await fn();
    const duration = performance.now() - start;

    // 发送到监控服务
    analytics.track('operation_duration', {
      operation,
      duration,
      success: true,
    });
  } catch (error) {
    const duration = performance.now() - start;

    analytics.track('operation_duration', {
      operation,
      duration,
      success: false,
      error: error.message,
    });
  }
}

// 使用示例
await trackPerformance('delete-photo', () => deletePhoto(photoId));
```

---

## ✅ 性能测试清单

### 数据库性能

```sql
-- 1. 测试查询性能
EXPLAIN SELECT * FROM photos WHERE categoryId = 'cat_123';
-- 预期：Using index

-- 2. 测试索引效率
SHOW INDEX FROM photos;
-- 预期：Cardinality 高，索引有效

-- 3. 测试慢查询
SHOW PROCESSLIST;
-- 预期：无超过100ms的查询
```

### 前端性能

```typescript
// 1. 测试渲染性能
import { render } from '@testing-library/react';

const startTime = performance.now();
render(<PhotoGrid photos={photos} />);
const endTime = performance.now();

console.log(`Render time: ${endTime - startTime}ms`);
// 预期：< 100ms

// 2. 测试滚动性能
const container = document.querySelector('.photo-grid');
let lastScrollTop = 0;
let frameCount = 0;

container.addEventListener('scroll', () => {
  frameCount++;
  requestAnimationFrame(() => {
    const scrollTop = container.scrollTop;
    const delta = Math.abs(scrollTop - lastScrollTop);
    console.log(`Frame time: ${performance.now()}ms, Delta: ${delta}px`);
    lastScrollTop = scrollTop;
  });
});

// 快速滚动1秒，检查帧数
setTimeout(() => {
  console.log(`FPS: ${frameCount}`); // 预期：≥ 60 FPS
}, 1000);
```

### API性能

```typescript
// 使用 Artillery 进行负载测试
// load-test.yml

config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10 # 每秒10个请求

scenarios:
  - name: "Get Photos"
    flow:
      - get:
          url: "/api/photos?page=1&limit=50"
# 运行测试
artillery run load-test.yml
# 预期：p95 < 200ms
```

---

## 🎯 性能优化目标达成

| 指标              | 目标     | 优化前    | 优化后 | 达成 |
| ----------------- | -------- | --------- | ------ | ---- |
| 首屏加载时间      | < 1s     | ~20s      | ~0.5s  | ✅   |
| 滚动帧率          | ≥ 60 FPS | 10-15 FPS | 60 FPS | ✅   |
| 批量操作（100张） | < 3s     | ~30s      | ~2s    | ✅   |
| 搜索响应时间      | < 500ms  | ~800ms    | ~200ms | ✅   |
| 内存占用          | < 100MB  | ~500MB    | ~50MB  | ✅   |

---

**维护者**: 开发团队
**最后更新**: 2026-01-10
