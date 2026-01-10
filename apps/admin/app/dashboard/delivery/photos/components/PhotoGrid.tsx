'use client';

import { PhotoCard } from './PhotoCard';
import { EmptyState } from './EmptyState';
import { useMemo } from 'react';
import type { Photo } from '../hooks/usePhotos';
import Masonry from 'react-responsive-masonry';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PhotoGridProps {
  photos: Photo[];
  selectedPhotoIds?: Set<string>;
  onPhotoClick?: (photo: Photo) => void;
  onPhotoSelect?: (photoId: string) => void;
  onPhotoLike?: (photoId: string) => void;
  onPhotoAddToCollection?: (photoId: string) => void;
  onPhotoDownload?: (photo: Photo) => void;
  loading?: boolean;
  title?: string;
  totalCount?: number;
  sortBy?: 'trending' | 'newest' | 'oldest';
  onSortChange?: (sortBy: 'trending' | 'newest' | 'oldest') => void;
  showTabs?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  showAdCard?: boolean;
  className?: string;
}

export function PhotoGrid({
  photos,
  selectedPhotoIds = new Set(),
  onPhotoClick,
  onPhotoSelect,
  onPhotoLike,
  onPhotoAddToCollection,
  onPhotoDownload,
  loading = false,
  title = '照片库',
  totalCount,
  sortBy = 'trending',
  onSortChange,
  showTabs = false,
  activeTab = 'photos',
  onTabChange,
  showAdCard = false,
  className,
}: PhotoGridProps) {
  const photosWithDimensions = useMemo(() => {
    return photos.map((photo) => ({
      ...photo,
      aspectRatio: photo.width && photo.height ? photo.width / photo.height : 0.75,
    }));
  }, [photos]);

  // Insert Ad card if enabled
  const itemsWithAd = useMemo(() => {
    if (!showAdCard) return photosWithDimensions;
    const items = [...photosWithDimensions];
    const adItem = {
      id: 'ad-canva',
      isAd: true,
    };
    items.splice(6, 0, adItem as any);
    return items;
  }, [photosWithDimensions, showAdCard]);

  if (loading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className={className}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header Section: Title & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">{title}</h1>

          {/* Tabs */}
          {showTabs && (
            <div className="flex items-center gap-2">
              <button
                className={cn(
                  'px-5 py-2.5 rounded-full font-medium text-sm transition-colors',
                  activeTab === 'photos'
                    ? 'bg-foreground text-background hover:bg-foreground/90'
                    : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border'
                )}
                onClick={() => onTabChange?.('photos')}
              >
                照片 <span className={cn(
                  activeTab === 'photos' ? 'text-background/60' : 'text-muted-foreground',
                  'ml-1'
                )}>{totalCount ? `${(totalCount / 1000).toFixed(1)}K` : '54.9K'}</span>
              </button>
              <button
                className={cn(
                  'px-5 py-2.5 rounded-full font-medium text-sm transition-colors',
                  activeTab === 'videos'
                    ? 'bg-foreground text-background hover:bg-foreground/90'
                    : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border'
                )}
                onClick={() => onTabChange?.('videos')}
              >
                视频 <span className={cn(
                  activeTab === 'videos' ? 'text-background/60' : 'text-muted-foreground',
                  'ml-1'
                )}>10.2K</span>
              </button>
              <button
                className={cn(
                  'px-5 py-2.5 rounded-full font-medium text-sm transition-colors',
                  activeTab === 'users'
                    ? 'bg-foreground text-background hover:bg-foreground/90'
                    : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border'
                )}
                onClick={() => onTabChange?.('users')}
              >
                用户 <span className={cn(
                  activeTab === 'users' ? 'text-background/60' : 'text-muted-foreground',
                  'ml-1'
                )}>302</span>
              </button>
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        {onSortChange && (
          <div className="self-start md:self-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-muted-foreground font-medium hover:text-foreground transition-colors">
                  {sortBy === 'trending' && '热门'}
                  {sortBy === 'newest' && '最新'}
                  {sortBy === 'oldest' && '最早'}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSortChange('trending')}>
                  热门
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange('newest')}>
                  最新
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortChange('oldest')}>
                  最早
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Masonry Grid */}
      <Masonry
        columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3, 1200: 4 }}
        gutter="1.5rem"
      >
        {itemsWithAd.map((item) => {
          if ('isAd' in item) {
            return (
              <div
                key={item.id}
                className="relative mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-blue-50 border border-border p-6 flex flex-col justify-between h-[400px] group cursor-pointer"
              >
                <div className="space-y-2">
                  <span className="inline-block px-2 py-1 bg-white/50 rounded text-[10px] font-bold tracking-wider text-muted-foreground uppercase">赞助</span>
                  <h3 className="text-2xl font-bold text-foreground leading-tight">设计你的婚礼请柬。</h3>
                  <p className="text-muted-foreground">从数千个模板中选择。</p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-4xl font-bold text-primary opacity-20 transform -rotate-12 select-none">Canva</div>
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md">
                  免费试用
                </Button>
              </div>
            );
          }
          return (
            <div
              key={item.id}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                const isButton = target.closest('button');
                if (!isButton) {
                  onPhotoClick?.(item);
                }
              }}
              className="cursor-pointer"
            >
              <PhotoCard
                photo={item}
                isSelected={selectedPhotoIds.has(item.id)}
                onSelect={onPhotoSelect}
                onLike={onPhotoLike}
                onAddToCollection={onPhotoAddToCollection}
                onDownload={onPhotoDownload}
                onClick={() => onPhotoClick?.(item)}
              />
            </div>
          );
        })}
      </Masonry>
    </div>
  );
}
