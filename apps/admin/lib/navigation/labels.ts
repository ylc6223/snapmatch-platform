const LABELS: Record<string, string> = {
  dashboard: "工作台",
  analytics: "数据概览",
  shortcuts: "快捷入口",

  portfolio: "作品集管理",
  works: "作品列表",
  categories: "分类管理",
  banners: "轮播图配置",

  delivery: "交付与选片",
  projects: "项目",
  new: "新建",
  photos: "照片库",
  "viewer-links": "选片链接",
  retouch: "精修交付",

  crm: "客户与订单",
  customers: "客户档案",
  orders: "订单列表",

  settings: "系统设置",
  accounts: "账号与权限",
  storage: "存储配置",
  miniprogram: "小程序配置",

  dev: "调试工具",
  api: "API 调试",
  "client-viewer": "选片端预览（Lumina）",
}

export function toNavigationLabel(segment: string) {
  if (segment in LABELS) return LABELS[segment]
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
}
