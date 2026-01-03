import { Photo, PhotoStatus } from './types';

/**
 * Mock数据 - 作品列表
 */
export const MOCK_PHOTOS: Photo[] = [
  {
    id: 'P-1001',
    title: '京都晨雾',
    category: '风光摄影',
    url: 'https://picsum.photos/id/10/800/600',
    gallery: [
      'https://picsum.photos/id/10/800/600',
      'https://picsum.photos/id/11/800/600',
      'https://picsum.photos/id/12/800/600'
    ],
    description: '拍摄于京都岚山清晨，雾气缭绕，充满了静谧的禅意。使用了长焦镜头压缩空间，突出了层次感。',
    isRecommended: true,
    date: '2023-10-24',
    status: PhotoStatus.PUBLISHED,
    tags: ['自然', '日本', '清晨'],
    dimension: '4000x3000',
    size: '4.2 MB',
    isFavorite: true
  },
  {
    id: 'P-1002',
    title: '城市孤独感',
    category: '街头摄影',
    url: 'https://picsum.photos/id/24/800/800',
    gallery: [
      'https://picsum.photos/id/24/800/800',
      'https://picsum.photos/id/25/800/800'
    ],
    description: '在繁忙的都市中捕捉到的孤独瞬间。黑白处理增强了画面的对比和情绪。',
    isRecommended: false,
    date: '2023-10-22',
    status: PhotoStatus.DRAFT,
    tags: ['城市', '黑白', '纪实'],
    dimension: '3500x3500',
    size: '3.1 MB',
    isFavorite: false
  },
  {
    id: 'P-1003',
    title: '落日余晖肖像',
    category: '人像摄影',
    url: 'https://picsum.photos/id/64/800/600',
    description: '利用自然光拍摄的人像作品，暖色调展现了人物的温柔。',
    isRecommended: true,
    date: '2023-10-20',
    status: PhotoStatus.PUBLISHED,
    tags: ['光影', '情绪'],
    dimension: '6000x4000',
    size: '8.5 MB',
    isFavorite: true
  },
  {
    id: 'P-1004',
    title: '抽象建筑线条',
    category: '建筑摄影',
    url: 'https://picsum.photos/id/56/800/600',
    description: '探索现代建筑的几何美感，强调线条与光影的互动。',
    isRecommended: false,
    date: '2023-10-18',
    status: PhotoStatus.PUBLISHED,
    tags: ['线条', '现代主义'],
    dimension: '5200x3400',
    size: '5.6 MB',
    isFavorite: false
  },
  {
    id: 'P-1005',
    title: '狂野海岸线',
    category: '风光摄影',
    url: 'https://picsum.photos/id/58/800/600',
    date: '2023-10-15',
    status: PhotoStatus.DRAFT,
    tags: ['大海', '浪花'],
    dimension: '4500x3000',
    size: '6.2 MB',
    isFavorite: false
  },
  {
    id: 'P-1006',
    title: '极简午后时光',
    category: '生活方式',
    url: 'https://picsum.photos/id/76/800/600',
    date: '2023-10-12',
    status: PhotoStatus.ARCHIVED,
    tags: ['室内', '静物'],
    dimension: '3000x2000',
    size: '2.8 MB',
    isFavorite: false
  },
  {
    id: 'P-1007',
    title: '赛博朋克之夜',
    category: '街头摄影',
    url: 'https://picsum.photos/id/88/800/600',
    date: '2023-10-10',
    status: PhotoStatus.PUBLISHED,
    tags: ['夜景', '霓虹'],
    dimension: '4200x2800',
    size: '7.1 MB',
    isFavorite: true
  },
  {
    id: 'P-1008',
    title: '高山之巅',
    category: '风光摄影',
    url: 'https://picsum.photos/id/28/800/600',
    date: '2023-10-05',
    status: PhotoStatus.PUBLISHED,
    tags: ['探险', '登山'],
    dimension: '6000x4000',
    size: '9.3 MB',
    isFavorite: false
  }
];

/** 分类选项 */
export const CATEGORIES = ['全部', '风光摄影', '人像摄影', '街头摄影', '建筑摄影', '生活方式'];

/** 状态筛选选项 */
export const STATUS_FILTERS = ['全部状态', '已发布', '草稿', '已归档'];
