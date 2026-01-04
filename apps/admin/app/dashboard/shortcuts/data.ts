export interface Project {
  id: string;
  title: string;
  client: string;
  type: string;
  status: 'active' | 'selection' | 'editing' | 'delivered';
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
    status: 'active',
    date: '2026年1月14日',
    photoCount: 1240,
    coverImage: 'https://images.unsplash.com/photo-1519331379826-b10a524e66c4?w=800&q=80',
  },
  {
    id: '2',
    title: '时尚杂志封面',
    client: 'Vogue China',
    type: '时尚',
    status: 'selection',
    date: '2026年1月10日',
    photoCount: 450,
    coverImage: 'https://images.unsplash.com/photo-1551298370119-f7b64c9d518c?w=800&q=80',
  },
  {
    id: '3',
    title: '极简镜头产品图',
    client: 'Sony',
    type: '商业产品',
    status: 'editing',
    date: '2026年1月05日',
    photoCount: 120,
    coverImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
  },
  {
    id: '4',
    title: '现代建筑艺术',
    client: 'ArchDaily',
    type: '建筑摄影',
    status: 'delivered',
    date: '2025年12月28日',
    photoCount: 85,
    coverImage: 'https://images.unsplash.com/photo-1486718448742-163732cd1544?w=800&q=80',
  },
  {
    id: '5',
    title: '咖啡生活方式',
    client: 'Blue Bottle',
    type: '生活方式',
    status: 'active',
    date: '2026年1月15日',
    photoCount: 300,
    coverImage: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80',
  },
  {
    id: '6',
    title: '影棚布光教学',
    client: '大师班',
    type: '工作坊',
    status: 'delivered',
    date: '2025年12月15日',
    photoCount: 600,
    coverImage: 'https://images.unsplash.com/photo-1495704907664-81f74bc7c679?w=800&q=80',
  },
];
