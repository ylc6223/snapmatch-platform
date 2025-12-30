# 摄影作品与套系数据结构设计

## 一、设计目标

- 明确区分 **作品（展示内容）** 与 **套系（可售服务）**
- 使用「类目 + 标签」双体系
- 支持多风格、多服务、多筛选维度
- 适用于前后端与数据库建模

---

## 二、核心实体概览

```
Category（类目）
Tag（标签）
Work（作品）
Package（套系）
WorkTag（作品-标签）
PackageTag（套系-标签）
```

---

## 三、类目（Category）结构

```ts
Category {
  id: string
  name: string
  type: "work" | "package"
  parentId?: string
  order: number
  status: "active" | "hidden"
}
```

### 示例

**作品类目**
- 人像写真
- 婚纱摄影
- 家庭纪实

**套系类目**
- 写真套系
- 婚礼服务
- 证件服务

---

## 四、标签（Tag）体系

```ts
Tag {
  id: string
  name: string
  group: TagGroup
  applicableTo: ("work" | "package")[]
  order: number
}
```

### TagGroup 枚举

- style（风格）
- emotion（情绪）
- scene（场景）
- people（人物关系）
- clothing（服装）
- service（服务属性）
- time（时间节点）

---

## 五、作品（Work）模型

```ts
Work {
  id: string
  title: string
  categoryId: string
  coverUrl: string
  imageList: string[]
  description?: string
  photographerId: string
  createdAt: string
  isFeatured: boolean
}
```

```ts
WorkTag {
  workId: string
  tagId: string
}
```

作品标签示例：
- 新中式
- 纯欲
- 柔光
- 棚拍

---

## 六、套系（Package）模型

```ts
Package {
  id: string
  name: string
  categoryId: string
  price: number
  coverUrl: string
  description: string
  serviceItems: ServiceItem[]
  shootDuration?: number
  peopleLimit?: number
  createdAt: string
  isAvailable: boolean
}
```

```ts
ServiceItem {
  type: "photo" | "makeup" | "clothing" | "album"
  description: string
}
```

```ts
PackageTag {
  packageId: string
  tagId: string
}
```

套系标签示例：
- 婚礼
- 情侣
- 跟拍
- 含妆造

---

## 七、作品与套系的弱关联（推荐）

```ts
WorkPackageRelation {
  workId: string
  packageId: string
  reason?: string
}
```

用途：
- 作品页推荐可选套系
- 套系页展示参考作品

---

## 八、设计结论

- **作品 = 审美内容**
- **套系 = 服务商品**
- 标签是核心资产
- 类目用于导航，标签用于搜索与推荐

该结构可直接用于：
- 小程序 / App
- 摄影工作室 CMS
- 约拍 / 商业摄影平台

