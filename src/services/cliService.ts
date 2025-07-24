import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot, query, orderBy, getDoc } from 'firebase/firestore';
import { useCLIStore } from '../store/cliStore';
import { type ChecklistItem } from '../types/ChecklistItem';

// lấy dữ liệu 1 lần 
export const fetchChecklistItems = async (teamId: string, boardId: string, columnId: string, taskId: string) => {
  if (!teamId || !boardId || !columnId || !taskId) {
    console.log("No teamId, boardId, columnId, or taskId, setting items to empty for task:", taskId);
    useCLIStore.getState().setItems(taskId, []);
    return;
  }

  const itemsCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/checkListItem`);
  const itemsQuery = query(itemsCollection, orderBy('position'));
  const snapshot = await getDocs(itemsQuery);
  const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ChecklistItem));
  console.log("Fetched checklist items for task:", taskId, items);
  useCLIStore.getState().setItems(taskId, items);
};

// theo dõi dữ liệu
export const subscribeToChecklistItems = (teamId: string, boardId: string, columnId: string, taskId: string, callback?: () => void) => {
  if (!teamId || !boardId || !columnId || !taskId) {
    console.log("No teamId, boardId, columnId, or taskId, setting items to empty for task:", taskId);
    useCLIStore.getState().setItems(taskId, []);
    return () => {};
  }

  const itemsCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/checkListItem`);
  const itemsQuery = query(itemsCollection, orderBy('position'));
  const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ChecklistItem));
    console.log("Subscribed checklist items for task:", taskId, items);
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
  const docRef = await addDoc(itemsCollection, { ...itemData, position: newPosition });
  const newItem: ChecklistItem = { id: docRef.id, position: newPosition, ...itemData };
  useCLIStore.getState().addItem(taskId, newItem);
};

// sửa cli
export const updateChecklistItem = async (teamId: string, boardId: string, columnId: string, taskId: string, itemId: string, updates: Partial<ChecklistItem>) => {
  const itemRef = doc(db, `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/checkListItem`, itemId);
  await updateDoc(itemRef, updates);
  useCLIStore.getState().updateItem(taskId, itemId, updates);
};

// xóa cli
export const deleteChecklistItem = async (teamId: string, boardId: string, columnId: string, taskId: string, itemId: string) => {
  const itemRef = doc(db, `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/checkListItem`, itemId);
  await deleteDoc(itemRef);
  useCLIStore.getState().deleteItem(taskId, itemId);
};

// kéo thả
export const moveChecklistItem = async (teamId: string, boardId: string, columnId: string, taskId: string, itemId: string, newPosition: number) => {
  const itemRef = doc(db, `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/checkListItem`, itemId);
  const itemSnap = await getDoc(itemRef);
  if (!itemSnap.exists()) throw new Error('Checklist item not found');

  const itemData = itemSnap.data() as ChecklistItem;
  await updateDoc(itemRef, { position: newPosition });

  const itemsCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/checkListItem`);
  const snapshot = await getDocs(itemsCollection);
  const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ChecklistItem)).filter(i => i.id !== itemId);
  const updatePositions = items.map((item, index) => ({
    ref: doc(db, `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/checkListItem`, item.id),
    updates: { position: index < newPosition ? index : index + 1 }
  }));
  await Promise.all(updatePositions.map(({ ref, updates }) => updateDoc(ref, updates)));

  useCLIStore.getState().updateItem(taskId, itemId, { position: newPosition });
};