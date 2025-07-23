import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Column } from '../types/Column';
import { arrayMove } from '@dnd-kit/sortable';

interface ColumnState {
  columns: Column[];
  setColumns: (columns: Column[]) => void;
  addColumn: (column: Omit<Column, 'id' | 'position'> & { createdBy: string }) => void;
  updateColumn: (columnId: string, updates: Partial<Column>) => void;
  deleteColumn: (columnId: string) => void;
  reorderColumns: (activeId: string, overId: string) => void;
}

export const useColumnStore = create(
  persist<ColumnState>(
    (set) => ({
      columns: [],
      setColumns: (columns) => set({ columns }),
      addColumn: (columnData) => set((state) => {
        const newPosition = state.columns.length > 0 ? Math.max(...state.columns.map(c => c.position)) + 1 : 0;
        const newColumn: Column = { id: crypto.randomUUID(), position: newPosition, ...columnData };
        return { columns: [...state.columns, newColumn] };
      }),
      updateColumn: (columnId, updates) => set((state) => ({
        columns: state.columns.map((c) => (c.id === columnId ? { ...c, ...updates } : c)),
      })),
      deleteColumn: (columnId) => set((state) => ({
        columns: state.columns.filter((c) => c.id !== columnId),
      })),
      reorderColumns: (activeId, overId) => set((state) => {
        const activeIndex = state.columns.findIndex((c) => c.id === activeId);
        const overIndex = state.columns.findIndex((c) => c.id === overId);
        if (activeIndex !== -1 && overIndex !== -1) {
          const newColumns = arrayMove(state.columns, activeIndex, overIndex);
          return { columns: newColumns.map((col, index) => ({ ...col, position: index })) };
        }
        return state;
      }),
    }),
    { name: 'column-storage' }
  )
);