# Videos

来源：`https://www.pexels.com/api/documentation/#videos`

## Base URL

`https://api.pexels.com/videos/`

## Video 资源（主要结构）

Video 对象通常包含：

- `id`、`width`、`height`
- `url`：Pexels 视频页面 URL（用于署名回链）
- `image`：预览图
- `duration`
- `user`：上传者信息（`id/name/url`）
- `video_files`：可用清晰度/分辨率的文件列表（含 `quality/file_type/width/height/fps/size/link`）

## Search for Videos

`GET /videos/search`

### 参数（主要）

- `query`（必填）：关键词
- `orientation`：`landscape` / `portrait` / `square`
- `locale`：如 `zh-CN`、`en-US`
- `page` / `per_page`：分页（`per_page` 最大 80）

示例：

```bash
curl -H "Authorization: YOUR_API_KEY" \
  "https://api.pexels.com/videos/search?query=ocean&per_page=2&page=1"
```

## Popular Videos

`GET /videos/popular`

### 参数（主要）

- `min_width` / `min_height`：最小分辨率过滤
- `min_duration` / `max_duration`：时长过滤（秒）
- `page` / `per_page`

示例：

```bash
curl -H "Authorization: YOUR_API_KEY" \
  "https://api.pexels.com/videos/popular?min_width=1920&min_height=1080&per_page=3"
```

## Get a Video

`GET /videos/videos/:id`

示例：

```bash
curl -H "Authorization: YOUR_API_KEY" \
  "https://api.pexels.com/videos/videos/2499611"
```

### 示例响应（字段结构演示）

```json
{
  "id": 2499611,
  "width": 1920,
  "height": 1080,
  "url": "https://www.pexels.com/video/...",
  "image": "https://images.pexels.com/videos/.../pexels-video-2499611.jpeg",
  "duration": 10,
  "user": {
    "id": 123456,
    "name": "John Doe",
    "url": "https://www.pexels.com/@johndoe"
  },
  "video_files": [
    {
      "id": 1234567,
      "quality": "hd",
      "file_type": "mp4",
      "width": 1920,
      "height": 1080,
      "fps": 29.97,
      "size": 12345678,
      "link": "https://videos.pexels.com/videos/.../pexels-video-2499611.mp4"
    }
  ]
}
```
