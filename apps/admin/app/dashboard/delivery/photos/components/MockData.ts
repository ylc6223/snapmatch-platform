export interface MockPhoto {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  photographer: string;
  avgColor: string;
}

// 使用参考设计中的完全相同的图片链接和数据
export const MOCK_PHOTOS: MockPhoto[] = [
  {
    id: "1",
    src: "https://images.unsplash.com/photo-1549620936-aa6278062ba5?w=500&q=80",
    width: 500,
    height: 750,
    alt: "Wedding reception",
    photographer: "Emma Smith",
    avgColor: "#d4d4d4"
  },
  {
    id: "2",
    src: "https://images.unsplash.com/photo-1760461804456-df82b15b07c0?w=500&q=80",
    width: 500,
    height: 333,
    alt: "Indian Wedding",
    photographer: "Rahul Kumar",
    avgColor: "#a35445"
  },
  {
    id: "3",
    src: "https://images.unsplash.com/photo-1692167900605-e02666cadb6d?w=500&q=80",
    width: 500,
    height: 600,
    alt: "Wedding flowers",
    photographer: "Sophie Rose",
    avgColor: "#e6e6e6"
  },
  {
    id: "4",
    src: "https://images.unsplash.com/photo-1629687465907-604f9f95e038?w=500&q=80",
    width: 500,
    height: 500,
    alt: "Wedding cake",
    photographer: "Bakery Art",
    avgColor: "#f0f0f0"
  },
  {
    id: "5",
    src: "https://images.unsplash.com/photo-1598302187096-8a8fc03b1974?w=500&q=80",
    width: 500,
    height: 700,
    alt: "Bride portrait",
    photographer: "John Doe",
    avgColor: "#d9d9d9"
  },
  {
    id: "6",
    src: "https://images.unsplash.com/photo-1749731894795-4eae105fa60a?w=500&q=80",
    width: 500,
    height: 350,
    alt: "Wedding ceremony",
    photographer: "Event Pro",
    avgColor: "#8c8c8c"
  },
  {
    id: "7",
    src: "https://images.unsplash.com/photo-1671183384203-98c6af4f88f7?w=500&q=80",
    width: 500,
    height: 800,
    alt: "Wedding couple",
    photographer: "Love Stories",
    avgColor: "#b3b3b3"
  },
  {
    id: "8",
    src: "https://images.unsplash.com/photo-1529635229076-82fefed713c4?w=500&q=80",
    width: 500,
    height: 750,
    alt: "Groom suit",
    photographer: "Mens Style",
    avgColor: "#222222"
  }
];

// 通过重复生成更多照片（与参考设计相同的方式）
export const GENERATED_MOCK_PHOTOS = Array.from({ length: 24 }).map((_, i) => ({
  ...MOCK_PHOTOS[i % MOCK_PHOTOS.length],
  id: `gen-${i}`,
}));

export const MOCK_TAGS = [
  'wedding', 'love', 'flowers', 'indian wedding', 'couple', 'marriage',
  'bride', 'wedding dress', 'groom', 'party', 'decoration', 'cake',
  'makeup', 'jewelry', 'family', 'friends', 'beach wedding', 'vintage',
  'celebration', 'rings', 'happiness', 'romantic', 'summer', 'nature'
];

export const MOCK_CATEGORIES = [
  { id: '1', label: '婚纱摄影' },
  { id: '2', label: '婚礼现场' },
  { id: '3', label: '人像摄影' },
  { id: '4', label: '产品拍摄' }
];
