'use client';

import Image from 'next/image';
import { Heart, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Photo } from '../hooks/usePhotos';

export interface PhotoCardProps {
  photo: Photo;
  isSelected?: boolean;
  onSelect?: (photoId: string) => void;
  onLike?: (photoId: string) => void;
  onAddToCollection?: (photoId: string) => void;
  onDownload?: (photo: Photo) => void;
  onClick?: (photo: Photo) => void;
}

export function PhotoCard({
  photo,
  isSelected = false,
  onSelect,
  onLike,
  onAddToCollection,
  onDownload,
  onClick,
}: PhotoCardProps) {
  // 使用图片的实际宽高比
  const width = photo.width || 500;
  const height = photo.height || 750;

  return (
    <div
      className="relative group mb-4 break-inside-avoid rounded-lg overflow-hidden cursor-pointer"
      onClick={() => onClick?.(photo)}
    >
      {/* Image - 使用 Next.js Image 组件，设置 width 和 height */}
      <div className="relative w-full" style={{ backgroundColor: 'rgb(243 244 246)' }}>
        <Image
          src={photo.thumbKey}
          alt={photo.filename || 'Photo'}
          width={width}
          height={height}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Selection Overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-primary/30 ring-4 ring-primary" />
      )}

      {/* Top Right Actions */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onLike?.(photo.id);
          }}
        >
          <Heart className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg bg-white/90 hover:bg-white text-gray-700 hover:text-green-600 shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCollection?.(photo.id);
          }}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0 bg-gradient-to-t from-black/60 to-transparent pt-12">
        {/* User */}
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border border-white/50">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${photo.projectName || photo.id}`}
            />
            <AvatarFallback className="text-xs bg-white/90 text-gray-700">
              {(photo.projectName || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-white font-medium text-sm drop-shadow-md line-clamp-1">
            {photo.projectName || 'Unknown'}
          </span>
        </div>

        {/* Download */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg bg-white/90 hover:bg-white text-gray-700 hover:text-black shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onDownload?.(photo);
          }}
        >
          <Download className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
