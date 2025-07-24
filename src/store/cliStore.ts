import {create} from 'zustand';
import { type ChecklistItem } from '../types/ChecklistItem';

interface CLIState {
  itemsByTask: Record<string, ChecklistItem[]>;
  setItems: (taskId: string, items: ChecklistItem[]) => void;
  addItem: (taskId: string, item: ChecklistItem) => void;
  updateItem: (taskId: string, itemId: string, updates: Partial<ChecklistItem>) => void;
  deleteItem: (taskId: string, itemId: string) => void;
}

export const useCLIStore = create<CLIState>((set) => ({
  itemsByTask: {},
  setItems: (taskId, items) => set((state) => ({
    itemsByTask: { ...state.itemsByTask, [taskId]: items }
  })),
  addItem: (taskId, item) => set((state) => ({
    itemsByTask: { 
      ...state.itemsByTask, 
      [taskId]: [...(state.itemsByTask[taskId] || []), item] 
    }
  })),
  updateItem: (taskId, itemId, updates) => set((state) => ({
    itemsByTask: {
      ...state.itemsByTask,
      [taskId]: state.itemsByTask[taskId]?.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ) || []
    }
  })),
  deleteItem: (taskId, itemId) => set((state) => ({
    itemsByTask: {
      ...state.itemsByTask,
      [taskId]: state.itemsByTask[taskId]?.filter((item) => item.id !== itemId) || []
    }
  })),
}));