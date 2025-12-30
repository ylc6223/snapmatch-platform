# Guidelines

来源：`https://www.pexels.com/api/documentation/#guidelines`

## 署名与回链要求

- 发起 API 请求并展示内容时，需要**显著地链接回 Pexels**（文本链接或 Logo 均可）。
- 尽可能为摄影师署名并回链（例如 “Photo by John Doe on Pexels” 并链接到照片页/摄影师页）。

## 使用限制与滥用

- 不得复制或复刻 Pexels 的核心功能（包括但不限于将 Pexels 内容作为壁纸应用的核心素材库）。
- 默认限额：**200 次/小时**，**20,000 次/月**。
- 可联系 `api@pexels.com` 申请更高额度（通常需提供带署名回链的使用示例或可演示 Demo）。
- 任何绕过限流等滥用行为可能导致 API Key 被终止。

## 回链示例

### 链接回 Pexels

```html
<a href="https://www.pexels.com">Photos provided by Pexels</a>
<!-- or show our white logo -->
<a href="https://www.pexels.com">
  <img src="https://images.pexels.com/lib/api/pexels-white.png" />
</a>
<!-- or show our black logo -->
<a href="https://www.pexels.com">
  <img src="https://images.pexels.com/lib/api/pexels.png" />
</a>
```

### 链接回某张照片

```html
This <a href="https://www.pexels.com/photo/food-dinner-lunch-meal-4147875">Photo</a> was taken by
<a href="https://www.pexels.com/@daria">Daria</a> on Pexels.
```
