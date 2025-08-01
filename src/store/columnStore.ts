import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Column } from '../types/Column';

interface ColumnState {
  columns: Column[];
  setColumns: (columns: Column[]) => void;
  addColumn: (column: Omit<Column, 'id' | 'position'> & { createdBy: string }) => void;
  updateColumn: (columnId: string, updates: Partial<Column>) => void;
  deleteColumn: (columnId: string) => void;
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
    }),
    { name: 'column-storage' }
  )
);