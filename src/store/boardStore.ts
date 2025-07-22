import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Board } from '../types/Board';

interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  setBoards: (boards: Board[]) => void;
  setCurrentBoard: (board: Board | null) => void;
  addBoard: (board: Board) => void;
  updateBoard: (boardId: string, updates: Partial<Board>) => void;
  deleteBoard: (boardId: string) => void;
  addMemberToBoard: (boardId: string, email: string) => void;
}

export const useBoardStore = create(
  persist<BoardState>(
    (set) => ({
      boards: [],
      currentBoard: null,
      setBoards: (boards) => set({ boards }),
      setCurrentBoard: (board) => set({ currentBoard: board }),
      addBoard: (board) => set((state) => ({ boards: [...state.boards, board] })),
      updateBoard: (boardId, updates) => set((state) => ({
        boards: state.boards.map((b) => (b.id === boardId ? { ...b, ...updates } : b)),
        currentBoard: state.currentBoard?.id === boardId ? { ...state.currentBoard, ...updates } : state.currentBoard,
      })),
      deleteBoard: (boardId) => set((state) => ({
        boards: state.boards.filter((b) => b.id !== boardId),
        currentBoard: state.currentBoard?.id === boardId ? null : state.currentBoard,
      })),
      addMemberToBoard: (boardId, email) => set((state) => ({
        boards: state.boards.map((b) => 
          b.id === boardId ? { ...b, members: b.members ? [...b.members, email] : [email] } : b
        ),
        currentBoard: state.currentBoard?.id === boardId 
          ? { ...state.currentBoard, members: state.currentBoard.members ? [...state.currentBoard.members, email] : [email] }
          : state.currentBoard,
      })),
    }),
    { name: 'board-storage' }
  )
);