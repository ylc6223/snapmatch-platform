import { create } from 'zustand';

interface PhotoSelectionState {
  selectedPhotoIds: Set<string>;
  togglePhoto: (photoId: string) => void;
  selectPhoto: (photoId: string) => void;
  deselectPhoto: (photoId: string) => void;
  clearSelection: () => void;
  selectAll: (photoIds: string[]) => void;
  deselectAll: () => void;
  isSelected: (photoId: string) => boolean;
  selectedCount: number;
}

export const usePhotoSelection = create<PhotoSelectionState>((set, get) => ({
  selectedPhotoIds: new Set(),

  togglePhoto: (photoId) =>
    set((state) => {
      const newSet = new Set(state.selectedPhotoIds);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return { selectedPhotoIds: newSet };
    }),

  selectPhoto: (photoId) =>
    set((state) => {
      const newSet = new Set(state.selectedPhotoIds);
      newSet.add(photoId);
      return { selectedPhotoIds: newSet };
    }),

  deselectPhoto: (photoId) =>
    set((state) => {
      const newSet = new Set(state.selectedPhotoIds);
      newSet.delete(photoId);
      return { selectedPhotoIds: newSet };
    }),

  clearSelection: () => set({ selectedPhotoIds: new Set() }),

  selectAll: (photoIds) => set({ selectedPhotoIds: new Set(photoIds) }),

  deselectAll: () => set({ selectedPhotoIds: new Set() }),

  isSelected: (photoId) => get().selectedPhotoIds.has(photoId),

  selectedCount: 0, // This will be computed
}));

// Selector for selected count
usePhotoSelection.getState().selectedPhotoIds.size;
