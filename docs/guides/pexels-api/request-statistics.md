# Request Statistics

来源：`https://www.pexels.com/api/documentation/#statistics`

Pexels API 在**成功（2xx）响应**中会返回以下 HTTP Header，用于查看当月剩余额度：

| Header                  | 含义                       |
| ----------------------- | -------------------------- |
| `X-Ratelimit-Limit`     | 当月总请求额度             |
| `X-Ratelimit-Remaining` | 当月剩余请求次数           |
| `X-Ratelimit-Reset`     | 当月额度重置的 UNIX 时间戳 |

注意：这些 Header **只在成功响应**中返回；当触发限流（例如 `429 Too Many Requests`）时，响应中不会包含它们。
