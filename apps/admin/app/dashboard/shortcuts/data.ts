// Project status enum matching backend
export enum ProjectStatus {
  PENDING = 'pending',                  // 待选片
  SELECTING = 'selecting',              // 选片中
  SUBMITTED = 'submitted',              // 已提交
  RETOUCHING = 'retouching',            // 修图中
  PENDING_CONFIRMATION = 'pending_confirmation', // 待确认
  DELIVERED = 'delivered',              // 已交付
  CANCELLED = 'cancelled',              // 已取消
}

// Status color mapping for visual indicators
export const statusColors: Record<ProjectStatus, string> = {
  // 待选片 - 琥珀色 (警告/等待)
  [ProjectStatus.PENDING]: 'text-amber-500',

  // 选片中 - 蓝色 (进行中/活跃)
  [ProjectStatus.SELECTING]: 'text-blue-500',

  // 已提交 - 靛蓝色 (已提交待处理)
  [ProjectStatus.SUBMITTED]: 'text-indigo-500',

  // 修图中 - 青色 (修图工作)
  [ProjectStatus.RETOUCHING]: 'text-cyan-500',

  // 待确认 - 橙色 (需要用户确认)
  [ProjectStatus.PENDING_CONFIRMATION]: 'text-orange-500',

  // 已交付 - 绿色 (成功完成)
  [ProjectStatus.DELIVERED]: 'text-green-500',

  // 已取消 - 灰色 (无效状态)
  [ProjectStatus.CANCELLED]: 'text-gray-400',
};

// Status label mapping for Chinese display
export const statusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.PENDING]: '待选片',
  [ProjectStatus.SELECTING]: '选片中',
  [ProjectStatus.SUBMITTED]: '已提交',
  [ProjectStatus.RETOUCHING]: '修图中',
  [ProjectStatus.PENDING_CONFIRMATION]: '待确认',
  [ProjectStatus.DELIVERED]: '已交付',
  [ProjectStatus.CANCELLED]: '已取消',
};

export interface Project {
  id: string;
  title: string;
  client: string;
  type: string;
  status: ProjectStatus;
  date: string;
  photoCount: number;
  coverImage: string;
}

export const projects: Project[] = [
  {
    id: '1',
    title: '夏季草坪婚礼',
    client: '张伟 & 李娜',
    type: '婚礼跟拍',
    status: ProjectStatus.SELECTING,
    date: '2026年1月14日',
    photoCount: 1240,
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  },
  {
    id: '2',
    title: '时尚杂志封面',
    client: 'Vogue China',
    type: '时尚',
    status: ProjectStatus.SELECTING,
    date: '2026年1月10日',
    photoCount: 450,
    coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
  },
  {
    id: '3',
    title: '极简镜头产品图',
    client: 'Sony',
    type: '商业产品',
    status: ProjectStatus.RETOUCHING,
    date: '2026年1月05日',
    photoCount: 120,
    coverImage: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
  },
  {
    id: '4',
    title: '现代建筑艺术',
    client: 'ArchDaily',
    type: '建筑摄影',
    status: ProjectStatus.DELIVERED,
    date: '2025年12月28日',
    photoCount: 85,
    coverImage: 'https://images.unsplash.com/photo-1486718448742-163732cd1544?w=800&q=80',
  },
  {
    id: '5',
    title: '咖啡生活方式',
    client: 'Blue Bottle',
    type: '生活方式',
    status: ProjectStatus.SELECTING,
    date: '2026年1月15日',
    photoCount: 300,
    coverImage: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80',
  },
  {
    id: '6',
    title: '影棚布光教学',
    client: '大师班',
    type: '工作坊',
    status: ProjectStatus.DELIVERED,
    date: '2025年12月15日',
    photoCount: 600,
    coverImage: 'https://images.unsplash.com/photo-1604975999044-188783d54fb3?w=800&q=80',
  },
  {
    id: '7',
    title: '婚纱摄影系列',
    client: '王明 & 刘芳',
    type: '婚纱摄影',
    status: ProjectStatus.PENDING,
    date: '2026年1月16日',
    photoCount: 890,
    coverImage: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80',
  },
  {
    id: '8',
    title: '商业产品拍摄',
    client: 'Apple Store',
    type: '商业产品',
    status: ProjectStatus.RETOUCHING,
    date: '2026年1月08日',
    photoCount: 56,
    coverImage: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
  },
];
