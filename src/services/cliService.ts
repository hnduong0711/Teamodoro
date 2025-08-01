import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useCLIStore } from '../store/cliStore';
import { type ChecklistItem } from '../types/ChecklistItem';

// lấy dữ liệu 1 lần 
export const fetchChecklistItems = async (teamId: string, boardId: string, columnId: string, taskId: string) => {
  if (!teamId || !boardId || !columnId || !taskId) {
    useCLIStore.getState().setItems(taskId, []);
    return;
  }

  const itemsCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/checkListItem`);
  const itemsQuery = query(itemsCollection, orderBy('position'));
  const snapshot = await getDocs(itemsQuery);
  const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ChecklistItem))
  useCLIStore.getState().setItems(taskId, items);
};

// theo dõi dữ liệu
export const subscribeToChecklistItems = (teamId: string, boardId: string, columnId: string, taskId: string, callback?: () => void) => {
  if (!teamId || !boardId || !columnId || !taskId) {
    useCLIStore.getState().setItems(taskId, []);
    return () => {};
  }

  const itemsCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/checkListItem`);
  const itemsQuery = query(itemsCollection, orderBy('position'));
  const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ChecklistItem));
    useCLIStore.getState().setItems(taskId, items);
    if (callback) callback();
  }, (error) => console.error('Error subscribing to checklist items for task:', taskId, error));

  return unsubscribe;
};

// thêm cli
export const addChecklistItem = async (teamId: string, boardId: string, columnId: string, taskId: string, itemData: Omit<ChecklistItem, 'id' | 'position'>) => {
  if (!teamId || !boardId || !columnId || !taskId) throw new Error('No teamId, boardId, columnId, or taskId found');
  const itemsCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/checkListItem`);
  const snapshot = await getDocs(itemsCollection);
  const newPosition = snapshot.size > 0 ? Math.max(...snapshot.docs.map((doc) => doc.data().position || 0)) + 1 : 0;
  await addDoc(itemsCollection, { ...itemData, position: newPosition });
};

// sửa cli
export const updateChecklistItem = async (teamId: string, boardId: string, columnId: string, taskId: string, itemId: string, updates: Partial<ChecklistItem>) => {
  const itemRef = doc(db, `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/checkListItem`, itemId);
  await updateDoc(itemRef, updates);
};

// xóa cli
export const deleteChecklistItem = async (teamId: string, boardId: string, columnId: string, taskId: string, itemId: string) => {
  const itemRef = doc(db, `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/checkListItem`, itemId);
  await deleteDoc(itemRef);
};

// kéo thả
export const moveChecklistItem = async (
  teamId: string,
  boardId: string,
  columnId: string,
  taskId: string,
  itemId: string,
  newPosition: number,
  currentItems: ChecklistItem[]
) => {
  const sorted = [...currentItems].sort((a, b) => a.position - b.position);
  const itemToMove = sorted.find((i) => i.id === itemId);
  if (!itemToMove) throw new Error("Checklist item not found");

  const itemsWithout = sorted.filter((i) => i.id !== itemId);
  itemsWithout.splice(newPosition, 0, itemToMove);

  const updatePromises = itemsWithout.map((item, index) => {
    const itemRef = doc(
      db,
      `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/checkListItem`,
      item.id
    );
    return updateDoc(itemRef, { position: index });
  });

  await Promise.all(updatePromises);

  useCLIStore.getState().setItems(taskId, itemsWithout.map((item, index) => ({
    ...item,
    position: index,
  })));
};

// tính progress
export const totalProgress = (teamId: string, boardId: string, columnId: string, taskId: string) => {
  if(!teamId || !boardId || !columnId || !teamId) {
    useCLIStore.getState().setItems(taskId, []);
    return
  }

} 