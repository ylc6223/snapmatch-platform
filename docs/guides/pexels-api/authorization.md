# Authorization

来源：`https://www.pexels.com/api/documentation/#authorization`

Pexels API 需要授权访问：拥有 Pexels 账号即可申请 API Key（通常即时获得）：`https://www.pexels.com/api`

## 请求头

所有 API 请求都需要携带 `Authorization` 请求头：

```
Authorization: YOUR_API_KEY
```

## 示例

### cURL

```bash
curl -H "Authorization: YOUR_API_KEY" \
  "https://api.pexels.com/v1/search?query=people"
```

### JavaScript（官方库）

```js
import { createClient } from 'pexels';
const client = createClient('YOUR_API_KEY');
```

### Ruby（官方库）

```rb
require "pexels"
Pexels::Client.new("YOUR_API_KEY")
```

### .NET（官方库）

```csharp
import PexelsDotNetSDK.Api;
var pexelsClient = new PexelsClient("YOUR_API_KEY");
```
