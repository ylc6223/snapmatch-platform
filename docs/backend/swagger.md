# Backend：Swagger / OpenAPI 规范（必须遵守）

目标：让后端接口在 Swagger UI 中可以**直接可视化调试**，并且**默认带参数模板**、**字段级注释完整**，方便前后端（同一个人也一样）快速联调与回归。

## 1. 访问地址

后端（直连）：

- `http://localhost:3002/api/v1/docs`

Admin（通过 `/api/*` 代理到后端 `/api/v1/*`）：

- `http://localhost:3001/api/docs`

> 说明：默认非生产环境开启 Swagger；生产环境需要设置 `ENABLE_SWAGGER=true`。

## 2. 必须的标注要求（每个新接口都要做）

### 2.1 Controller 级别

- `@ApiTags("xxx")`：必须，用于分组展示
- `@ApiBearerAuth()`：只要是需要登录的接口必须加（public 接口不加）

### 2.2 Route 级别

- `@ApiOperation({ summary, description })`：必须（summary 简短、description 说明鉴权/边界/副作用）
- 请求体：
  - DTO 字段必须用 `@ApiProperty({ description, example })`
  - 同时建议在 `@ApiBody({ examples: { ... } })` 提供「一键可用」的模板（例如 seed 账号、典型业务示例）
- 响应体：
  - 本项目所有成功响应会被全局 `ResponseEnvelopeInterceptor` 包装成：
    - `{ code:200, message:"success", data:..., timestamp }`
  - Swagger 必须按 envelope 形态描述返回值，避免接口文档与真实响应不一致

## 3. Envelope 响应的写法（推荐）

为避免每个接口都手写 schema，本仓库提供了 helper：

- `apps/backend/src/common/swagger/api-response.decorators.ts`
  - `ApiOkEnvelope(DataDto)`
  - `ApiOkEnvelopeNullable(DataDto)`（当实际 `data` 可能为 `null` 时）

示例（返回 `data` 为对象）：

```ts
@ApiOkEnvelope(AuthMeDataDto)
@Get("me")
me() { ... }
```

示例（返回 `data` 为 null）：

```ts
@ApiOkEnvelopeNullable(EmptyDto)
@Post("logout")
logout() { return null }
```

## 4. DTO 规范（字段注释 + 示例是硬性要求）

所有请求/响应 DTO 必须：

- 每个字段都有 `@ApiProperty()`（或可选字段用 `@ApiPropertyOptional()`）
- 必须包含 `description`
- 必须包含 `example`（Swagger UI 会据此生成默认参数模板）

## 5. 新接口开发 Checklist（提交前自检）

- [ ] Swagger UI 中能看到接口且分组正确（`@ApiTags`）
- [ ] 接口点开后默认 body/example 可直接点击试跑（`example` / `@ApiBody.examples`）
- [ ] 需要登录的接口有 `@ApiBearerAuth`，并且 Swagger UI 顶部授权可用
- [ ] 响应结构与真实返回一致（envelope）
- [ ] `pnpm -C apps/backend lint` / `pnpm -C apps/backend type-check` 通过

