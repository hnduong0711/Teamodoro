import { create } from "zustand";
import { type ChatMessage } from "../types/ChatMessage";

interface ChatMessageState {
  messagesByTask: Record<string, ChatMessage[]>;
  setMessages: (taskId: string, messages: ChatMessage[]) => void;
  addMessage: (taskId: string, message: ChatMessage) => void;
}

export const useChatStore = create<ChatMessageState>((set) => ({
  messagesByTask: {},
  setMessages: (taskId, messages) =>
    set((state) => ({
      messagesByTask: { ...state.messagesByTask, [taskId]: messages },
    })),
  addMessage: (taskId, message) =>
    set((state) => ({
      messagesByTask: {
        ...state.messagesByTask,
        [taskId]: [...(state.messagesByTask[taskId] || []), message],
      },
    })),
}));
