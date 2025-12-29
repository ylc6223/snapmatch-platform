# Admin 会话失效（A+B1）交互与 UI 设计规格

# DESIGN SPECIFICATION

1. Purpose Statement:
   - 当用户被踢下线或登录态不可恢复时（refresh 也失败），避免“突然跳登录页”的割裂体验。
   - 在 **SSR/刷新** 场景下提供一个安全落地页承载“会话失效”提示与用户决策；在 **页面停留** 场景下用同一套 Dialog 交互保持一致。

2. Aesthetic Direction:
   - Industrial/utilitarian（工业/实用主义）：信息明确、层级克制、交互直接，强调“可解释的失败”。

3. Color Palette (hex):
   - #0F172A（文本主色/强调）
   - #334155（次级文本）
   - #F8FAFC（背景浅灰，保持与现有 error page 一致）
   - #E2E8F0（边界/分割线）
   - #B42318（错误强调，仅用于标题/提示关键字）

4. Typography:
   - 标题：Source Han Sans SC（思源黑体）Semibold
   - 正文：Noto Sans SC Regular
   - 说明：Noto Sans SC Regular（更浅的颜色与更紧凑行高）
   - 注：本次改造优先复用项目现有排版与 Tailwind token，不额外强行注入字体文件。

5. Layout Strategy:
   - 复用现有 404/500 错误页的双栏结构：左侧信息与按钮，右侧插画（大屏展示）。
   - “会话失效”采用 Dialog（shadcn）作为顶层交互层：页面作为安全容器，Dialog 默认自动打开；用户可关闭 Dialog 查看页面说明并再次触发“重新登录”。
