'use client';

import { useState, useMemo } from 'react';
import { FilterBar } from './components/FilterBar';
import { PhotoGrid } from './components/PhotoGrid';
import { PhotoSidebar } from './components/PhotoSidebar';
import { SearchBar } from './components/SearchBar';
import { BatchActionBar } from './components/BatchActionBar';
import { PhotoDetailDrawer } from './components/PhotoDetailDrawer';
import { usePhotos, useCategories, useTags, usePhotoBatchOperation, useUpdatePhoto } from './hooks/usePhotos';
import { usePhotoSelection } from './hooks/usePhotoSelection';
import { Menu, Search, Bell, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GENERATED_MOCK_PHOTOS, MOCK_TAGS, MOCK_CATEGORIES } from './components/MockData';

// Use mock data for preview
const USE_MOCK_DATA = true;

export default function Page() {
  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'filename' | 'fileSize'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [gridSortBy, setGridSortBy] = useState<'trending' | 'newest' | 'oldest'>('trending');
  const [page, setPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPhotoForDetail, setSelectedPhotoForDetail] = useState<string | undefined>();
  const [sidebarFilters, setSidebarFilters] = useState<{
    orientation?: string;
    people?: string;
    age?: string;
  }>({});
  const [activeTab, setActiveTab] = useState('photos');

  // Hooks - only fetch real data if not using mock
  const { data: categoriesData } = useCategories(!USE_MOCK_DATA);
  const { data: tagsData } = useTags(!USE_MOCK_DATA);
  const { data: photosData, isLoading: photosLoading } = usePhotos(
    !USE_MOCK_DATA
      ? {
          page,
          limit: 50,
          categoryId: selectedCategory || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          sortBy,
          sortOrder,
        }
      : undefined
  );

  const batchOperation = usePhotoBatchOperation();
  const updatePhoto = useUpdatePhoto();

  const {
    selectedPhotoIds,
    togglePhoto,
    clearSelection,
    selectAll,
    deselectAll,
    isSelected,
  } = usePhotoSelection();

  // Use mock data or real data
  const photos = useMemo(() => {
    if (USE_MOCK_DATA) {
      return GENERATED_MOCK_PHOTOS.map((photo) => ({
        id: photo.id,
        filename: photo.alt,
        thumbKey: photo.src,
        previewKey: photo.src,
        originalKey: photo.src,
        projectId: 'mock-project',
        projectName: photo.photographer,
        customerId: undefined,
        customerName: undefined,
        categoryId: undefined,
        categoryName: undefined,
        isProjectCover: false,
        selected: undefined,
        selectedAt: undefined,
        fileSize: 0,
        width: photo.width,
        height: photo.height,
        createdAt: 1704067200000, // Fixed timestamp for mock data (2024-01-01)
        tags: undefined,
      }));
    }
    return photosData?.data || [];
  }, [USE_MOCK_DATA, photosData]);

  const totalPhotos = useMemo(() => {
    if (USE_MOCK_DATA) return GENERATED_MOCK_PHOTOS.length;
    return photosData?.meta.total || 0;
  }, [USE_MOCK_DATA, photosData]);

  const totalPages = useMemo(() => {
    if (USE_MOCK_DATA) return 1;
    return photosData?.meta.totalPages || 0;
  }, [USE_MOCK_DATA, photosData]);

  // Transform categories and tags
  const categoryOptions = useMemo(() => {
    if (USE_MOCK_DATA) return MOCK_CATEGORIES;
    if (!categoriesData) return [];
    return categoriesData
      .filter((c) => c.status === 'active')
      .map((c) => ({
        id: c.id,
        label: c.name,
      }));
  }, [USE_MOCK_DATA, categoriesData]);

  const tagOptions = useMemo(() => {
    if (USE_MOCK_DATA) {
      return MOCK_TAGS.map((tag, i) => ({
        id: `tag-${i}`,
        label: tag,
      }));
    }
    if (!tagsData) return [];
    return tagsData.map((t) => ({
      id: t.id,
      label: t.name,
    }));
  }, [USE_MOCK_DATA, tagsData]);

  // Handlers
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
    setPage(1);
  };

  const handlePhotoClick = (photo: any) => {
    setSelectedPhotoForDetail(photo.id);
  };

  const handlePhotoDownload = (photo: any) => {
    // TODO: Implement download functionality
    console.log('Download photo:', photo.id);
  };

  const handleBatchDelete = () => {
    const photoIds = Array.from(selectedPhotoIds);
    batchOperation.mutate(
      {
        action: 'delete',
        photoIds,
      },
      {
        onSuccess: () => {
          clearSelection();
        },
      }
    );
  };

  const handleBatchUpdateCategory = () => {
    // TODO: Show dialog to select category
    console.log('Batch update category');
  };

  const handleBatchAddTags = () => {
    // TODO: Show dialog to select tags
    console.log('Batch add tags');
  };

  const handleBatchRemoveTags = () => {
    // TODO: Show dialog to select tags
    console.log('Batch remove tags');
  };

  const handleUpdatePhoto = (photoId: string, data: any) => {
    updatePhoto.mutate(
      {
        photoId,
        data,
      },
      {
        onSuccess: () => {
          setSelectedPhotoForDetail(undefined);
        },
      }
    );
  };

  const handleSidebarFilterChange = (filterType: string, value: string) => {
    setSidebarFilters((prev) => ({
      ...prev,
      [filterType]: value || undefined,
    }));
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-background border-b border-border h-20 flex items-center px-6 gap-6">
        {/* Logo/Title */}
        <a href="#" className="flex items-center gap-2 mr-2">
          <div className="bg-primary rounded-sm p-1">
            <div className="w-6 h-6 bg-background rounded-sm text-primary flex items-center justify-center font-bold text-xs">S</div>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground hidden md:block">SnapMatch</span>
        </a>

        {/* Search Bar */}
        <div className="flex-1 max-w-3xl relative">
          <div className="flex items-center w-full bg-muted rounded-lg hover:bg-muted/80 transition-colors focus-within:bg-background focus-within:ring-1 focus-within:ring-border">
            <input
              type="text"
              placeholder="搜索文件名、项目、客户、标签..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-foreground placeholder:text-muted-foreground text-base"
            />
            <button className="p-3 text-muted-foreground hover:text-foreground">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto shrink-0">
          <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground hover:text-foreground hover:bg-muted">
            <Bell className="w-5 h-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 h-10 w-10 rounded-full overflow-hidden border border-border">
                <Avatar className="h-full w-full">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>个人资料</DropdownMenuItem>
              <DropdownMenuItem>设置</DropdownMenuItem>
              <DropdownMenuItem>退出登录</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button className="bg-foreground hover:bg-foreground/90 text-background font-semibold rounded-md px-6 h-10">
            <Upload className="w-4 h-4 mr-2" />
            上传
          </Button>
        </div>
      </header>

      {/* Filter Bar */}
      <FilterBar
        categories={categoryOptions}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        tags={tagOptions}
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex w-full max-w-[1920px] mx-auto">
        {/* Sidebar */}
        <PhotoSidebar
          isOpen={isSidebarOpen}
          currentFilters={sidebarFilters}
          onFilterChange={handleSidebarFilterChange}
        />

        {/* Photo Grid */}
        <main className="flex-1 min-w-0 transition-all duration-300 p-6">
          <PhotoGrid
            photos={photos}
            selectedPhotoIds={selectedPhotoIds}
            onPhotoClick={handlePhotoClick}
            onPhotoSelect={togglePhoto}
            onPhotoDownload={handlePhotoDownload}
            loading={photosLoading}
            title={USE_MOCK_DATA ? '免费婚纱照片' : '全局照片库'}
            totalCount={totalPhotos}
            sortBy={gridSortBy}
            onSortChange={setGridSortBy}
            showTabs={USE_MOCK_DATA}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            showAdCard={USE_MOCK_DATA}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <span className="text-sm text-muted-foreground">
                第 {page} / {totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                下一页
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Batch Action Bar */}
      <BatchActionBar
        selectedCount={selectedPhotoIds.size}
        onClearSelection={clearSelection}
        onDelete={handleBatchDelete}
        onUpdateCategory={handleBatchUpdateCategory}
        onAddTags={handleBatchAddTags}
        onRemoveTags={handleBatchRemoveTags}
      />

      {/* Photo Detail Drawer */}
      <PhotoDetailDrawer
        photo={photos.find((p) => p.id === selectedPhotoForDetail)}
        categories={categoriesData}
        allTags={tagsData}
        open={!!selectedPhotoForDetail}
        onOpenChange={(open) => !open && setSelectedPhotoForDetail(undefined)}
        onUpdate={handleUpdatePhoto}
      />
    </div>
  );
}
