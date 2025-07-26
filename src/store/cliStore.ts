import { create } from "zustand";
import { type ChecklistItem } from "../types/ChecklistItem";

interface CLIState {
  itemsByTask: Record<string, ChecklistItem[]>;
  setItems: (taskId: string, items: ChecklistItem[]) => void;
  addItem: (taskId: string, item: ChecklistItem) => void;
  updateItem: (
    taskId: string,
    itemId: string,
    updates: Partial<ChecklistItem>
  ) => void;
  deleteItem: (taskId: string, itemId: string) => void;
  getProgressByTask: (taskId: string) => {
    done: number;
    total: number;
    percent: number;
  };
}

export const useCLIStore = create<CLIState>((set, get) => ({
  itemsByTask: {},
  setItems: (taskId, items) =>
    set((state) => ({
      itemsByTask: { ...state.itemsByTask, [taskId]: items },
    })),
  addItem: (taskId, item) =>
    set((state) => ({
      itemsByTask: {
        ...state.itemsByTask,
        [taskId]: [...(state.itemsByTask[taskId] || []), item],
      },
    })),
  updateItem: (taskId, itemId, updates) =>
    set((state) => ({
      itemsByTask: {
        ...state.itemsByTask,
        [taskId]:
          state.itemsByTask[taskId]?.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          ) || [],
      },
    })),
  deleteItem: (taskId, itemId) =>
    set((state) => ({
      itemsByTask: {
        ...state.itemsByTask,
        [taskId]:
          state.itemsByTask[taskId]?.filter((item) => item.id !== itemId) || [],
      },
    })),
  getProgressByTask: (taskId: string) => {
    const items = get().itemsByTask[taskId] || [];
    const total = items.length;
    const done = items.filter((item) => item.done).length;
    return {
      done,
      total,
      percent: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  },
}));
