# Collections

来源：`https://www.pexels.com/api/documentation/#collections`

Collections 用于将照片/视频组合成集合并以统一画廊方式展示。集合相关接口同样遵循分页规范（`per_page` 最大 80）。

## Base URL

`https://api.pexels.com/v1/`

## Featured Collections

`GET /v1/collections/featured`

### 参数

- `page`（默认 1）
- `per_page`（默认 15，最大 80）

```bash
curl -H "Authorization: YOUR_API_KEY" \
  "https://api.pexels.com/v1/collections/featured?page=1&per_page=15"
```

## My Collections

`GET /v1/collections`

### 参数

- `page`（默认 1）
- `per_page`（默认 15，最大 80）

```bash
curl -H "Authorization: YOUR_API_KEY" \
  "https://api.pexels.com/v1/collections?page=1&per_page=15"
```

## Collection Media

`GET /v1/collections/:collection_id/media`

### 参数（主要）

- `type`：`photos` / `videos`（可选；不传则返回混合）
- `sort`：`ascending` / `descending`（可选）
- `page` / `per_page`

```bash
curl -H "Authorization: YOUR_API_KEY" \
  "https://api.pexels.com/v1/collections/9j7p6tj/media?type=photos&sort=ascending&page=1&per_page=15"
```

### 响应结构（要点）

- 顶层：`page/per_page/total_results/prev_page/next_page`
- `collections` 或 `media` 数组：
  - `media` 中元素可能是 **Photo** 或 **Video** 对象，字段结构与各自资源一致（见 `photos.md` / `videos.md`）。
