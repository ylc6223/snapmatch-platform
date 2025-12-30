# Photos

来源：`https://www.pexels.com/api/documentation/#photos`

## Base URL

`https://api.pexels.com/v1/`

## Photo 资源（核心字段）

Photo 对象通常包含：

- `id`：照片 ID
- `width` / `height`
- `url`：Pexels 照片页面 URL（用于署名回链很重要）
- `photographer` / `photographer_url` / `photographer_id`
- `avg_color`
- `src`：不同尺寸/裁剪的图片直链（`original/large2x/large/medium/small/portrait/landscape/tiny`）
- `alt`：替代文本

## Search for Photos

`GET /v1/search`

### 参数（主要）

- `query`（必填）：关键词，例如 `ocean`
- `orientation`：`landscape` / `portrait` / `square`
- `size`：`large`（24MP）/ `medium`（12MP）/ `small`（4MP）
- `color`：颜色名（如 `red/blue/white/...`）或十六进制（如 `#ffffff`）
- `locale`：语言地区（如 `zh-CN`、`en-US`）
- `page` / `per_page`：分页（`per_page` 最大 80）

### 示例

```bash
curl -H "Authorization: YOUR_API_KEY" \
  "https://api.pexels.com/v1/search?query=ocean&per_page=2&page=1"
```

## Curated Photos

`GET /v1/curated`

### 参数（主要）

- `page` / `per_page`

### 示例

```bash
curl -H "Authorization: YOUR_API_KEY" \
  "https://api.pexels.com/v1/curated?page=1&per_page=15"
```

## Get a Photo

`GET /v1/photos/:id`

### 示例响应（单张照片）

```json
{
  "id": 4147875,
  "width": 6000,
  "height": 4000,
  "url": "https://www.pexels.com/photo/food-dinner-lunch-meal-4147875/",
  "photographer": "Daria",
  "photographer_url": "https://www.pexels.com/@daria",
  "photographer_id": 1085254,
  "avg_color": "#736B59",
  "src": {
    "original": "https://images.pexels.com/photos/4147875/pexels-photo-4147875.jpeg",
    "large2x": "https://images.pexels.com/photos/4147875/pexels-photo-4147875.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "large": "https://images.pexels.com/photos/4147875/pexels-photo-4147875.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    "medium": "https://images.pexels.com/photos/4147875/pexels-photo-4147875.jpeg?auto=compress&cs=tinysrgb&h=350&w=500",
    "small": "https://images.pexels.com/photos/4147875/pexels-photo-4147875.jpeg?auto=compress&cs=tinysrgb&h=130&w=250",
    "portrait": "https://images.pexels.com/photos/4147875/pexels-photo-4147875.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    "landscape": "https://images.pexels.com/photos/4147875/pexels-photo-4147875.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    "tiny": "https://images.pexels.com/photos/4147875/pexels-photo-4147875.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=200"
  },
  "liked": false,
  "alt": "Close up of delicious meal"
}
```
