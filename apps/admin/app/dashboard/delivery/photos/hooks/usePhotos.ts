import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Photo {
  id: string;
  filename: string;
  originalKey: string;
  previewKey: string;
  thumbKey: string;
  projectId: string;
  projectName?: string;
  customerId?: string;
  customerName?: string;
  categoryId?: string;
  categoryName?: string;
  isProjectCover: boolean;
  selected?: boolean;
  selectedAt?: number;
  fileSize: number;
  width: number;
  height: number;
  createdAt: number;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  group: string;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  parentId?: string;
  order: number;
  status: string;
}

export interface PhotoQueryParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  tags?: string[];
  sortBy?: 'createdAt' | 'filename' | 'fileSize';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PhotoListResponse {
  data: Photo[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Fetch photos list
export function usePhotos(params?: PhotoQueryParams) {
  return useQuery({
    queryKey: ['photos', params],
    queryFn: async () => {
      if (!params) {
        return { data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } };
      }

      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.categoryId)
        queryParams.append('categoryId', params.categoryId);
      if (params.tags && params.tags.length > 0)
        queryParams.append('tags', params.tags.join(','));
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/photos?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      return response.json() as Promise<PhotoListResponse>;
    },
    enabled: !!params,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch photo detail
export function usePhotoDetail(photoId: string) {
  return useQuery({
    queryKey: ['photo', photoId],
    queryFn: async () => {
      const response = await fetch(`/api/photos/${photoId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch photo detail');
      }
      return response.json() as Promise<Photo>;
    },
    enabled: !!photoId,
  });
}

// Update photo metadata
export function useUpdatePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      photoId,
      data,
    }: {
      photoId: string;
      data: Partial<Photo>;
    }) => {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update photo');
      }
      return response.json() as Promise<Photo>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}

// Delete photo
export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}

// Batch operations
export function usePhotoBatchOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      photoIds,
      payload,
    }: {
      action: 'delete' | 'updateCategory' | 'addTags' | 'removeTags';
      photoIds: string[];
      payload?: any;
    }) => {
      const response = await fetch('/api/photos/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, photoIds, payload }),
      });
      if (!response.ok) {
        throw new Error('Failed to perform batch operation');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}

// Search photos
export function usePhotoSearch(keyword: string) {
  return useQuery({
    queryKey: ['photo-search', keyword],
    queryFn: async () => {
      if (!keyword.trim()) return { data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } };

      const response = await fetch(
        `/api/photos/search?q=${encodeURIComponent(keyword)}`
      );
      if (!response.ok) {
        throw new Error('Failed to search photos');
      }
      return response.json() as Promise<PhotoListResponse>;
    },
    enabled: !!keyword.trim(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Fetch categories
export function useCategories(enabled: boolean = true) {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json() as Promise<Category[]>;
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch tags
export function useTags(enabled: boolean = true) {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags');
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      return response.json() as Promise<Tag[]>;
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
