/**
 * 作品管理 - 类型定义
 * 参考 lumina-lens 摄影管理系统设计
 */

/** 作品状态枚举 */
export enum PhotoStatus {
  PUBLISHED = 'Published',
  DRAFT = 'Draft',
  ARCHIVED = 'Archived'
}

/** 作品数据结构 */
export interface Photo {
  id: string;
  title: string;
  category: string;
  url: string;
  gallery?: string[]; // 多图支持
  description?: string; // 作品描述
  isRecommended?: boolean; // 首页推荐开关
  date: string;
  status: PhotoStatus;
  tags: string[];
  dimension: string;
  size: string;
  isFavorite: boolean;
}

/** 视图模式 */
export type ViewMode = 'list' | 'grid';
