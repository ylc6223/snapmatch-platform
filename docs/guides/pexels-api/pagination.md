# Pagination

来源：`https://www.pexels.com/api/documentation/#pagination`

多数列表型接口支持分页；单次最多返回 **80** 条结果。

## 请求参数

- `page`：页码，默认 `1`
- `per_page`：每页数量，默认 `15`，最大 `80`

示例：

```http
GET https://api.pexels.com/v1/curated?page=2&per_page=40
```

## 响应字段

常见分页字段：

- `page`
- `per_page`
- `total_results`
- `prev_page`
- `next_page`

示例（字段演示）：

```json
{
  "page": 2,
  "per_page": 40,
  "total_results": 8000,
  "next_page": "https://api.pexels.com/v1/curated?page=3&per_page=40",
  "prev_page": "https://api.pexels.com/v1/curated?page=1&per_page=40"
}
```
