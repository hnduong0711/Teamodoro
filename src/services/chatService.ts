import { db } from '../config/firebase';
import { collection, addDoc, getDocs, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { useChatStore } from '../store/chatStore';
import { type ChatMessage } from '../types/ChatMessage';

export const fetchChatMessages = async (teamId: string, boardId: string, columnId: string, taskId: string) => {
  if (!teamId || !boardId || !columnId || !taskId) {
    console.log("No teamId, boardId, columnId, or taskId, setting messages to empty for task:", taskId);
    useChatStore.getState().setMessages(taskId, []);
    return;
  }

  const messagesCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/chatMessages`);
  const messagesQuery = query(messagesCollection, orderBy('createdAt'));
  const snapshot = await getDocs(messagesQuery);
  const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ChatMessage));
  console.log("Fetched chat messages for task:", taskId, messages);
  useChatStore.getState().setMessages(taskId, messages);
};

export const subscribeToChatMessages = (teamId: string, boardId: string, columnId: string, taskId: string, callback?: () => void) => {
  if (!teamId || !boardId || !columnId || !taskId) {
    console.log("No teamId, boardId, columnId, or taskId, setting messages to empty for task:", taskId);
    useChatStore.getState().setMessages(taskId, []);
    return () => {};
  }

  const messagesCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/chatMessages`);
  const messagesQuery = query(messagesCollection, orderBy('createdAt'));
  const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ChatMessage));
    console.log("Subscribed chat messages for task:", taskId, messages);
    useChatStore.getState().setMessages(taskId, messages);
    if (callback) callback();
  }, (error) => console.error('Error subscribing to chat messages for task:', taskId, error));

  return unsubscribe;
};

export const addChatMessage = async (teamId: string, boardId: string, columnId: string, taskId: string, senderId: string, text: string) => {
  if (!teamId || !boardId || !columnId || !taskId || !senderId || !text) throw new Error('Missing required fields');
  const messagesCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/chatMessages`);
  await addDoc(messagesCollection, {
    senderId,
    text,
    createdAt: Timestamp.now()
  });
};