import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useColumnStore } from '../store/columnStore';
import { type Column } from '../types/Column';

// lấy dữ liệu 1 lần 
export const fetchColumns = async (teamId: string, boardId: string) => {
  if (!teamId || !boardId) {
    useColumnStore.getState().setColumns([]);
    return;
  }

  const columnsCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns`);
  const columnsQuery = query(columnsCollection, orderBy('position'));
  const snapshot = await getDocs(columnsQuery);
  const columns = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Column));
  useColumnStore.getState().setColumns(columns);
};

// theo dõi dữ liệu
export const subscribeToColumns = (teamId: string, boardId: string, callback?: () => void) => {
  if (!teamId || !boardId) {
    useColumnStore.getState().setColumns([]);
    return () => {};
  }

  const columnsCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns`);
  const columnsQuery = query(columnsCollection, orderBy('position'));
  const unsubscribe = onSnapshot(columnsQuery, (snapshot) => {
    const columns = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Column));
    useColumnStore.getState().setColumns(columns);
    if (callback) callback();
  }, (error) => console.error('Error subscribing to columns:', error));

  return unsubscribe;
};

// thêm 
export const addColumn = async (teamId: string, boardId: string, columnData: Omit<Column, 'id' | 'position'> & { createdBy: string }) => {
  if (!teamId || !boardId) throw new Error('No teamId or boardId found');
  const columnsCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns`);
  const snapshot = await getDocs(columnsCollection);
  const newPosition = snapshot.size > 0 ? Math.max(...snapshot.docs.map((doc) => doc.data().position || 0)) + 1 : 0;
  await addDoc(columnsCollection, { ...columnData, position: newPosition });
};

// sửa
export const updateColumn = async (teamId: string, boardId: string, columnId: string, updates: Partial<Column>) => {
  const columnRef = doc(db, `teams/${teamId}/boards/${boardId}/columns`, columnId);
  await updateDoc(columnRef, updates);
  useColumnStore.getState().updateColumn(columnId, updates);
};

// xóa
export const deleteColumn = async (teamId: string, boardId: string, columnId: string) => {
  const columnRef = doc(db, `teams/${teamId}/boards/${boardId}/columns`, columnId);
  await deleteDoc(columnRef);
  useColumnStore.getState().deleteColumn(columnId);
};

// kéo thả
export const reorderColumnsInFirestore = async (teamId: string, boardId: string, columns: Column[]) => {
  const columnsCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns`);
  const promises = columns.map((col, index) =>
    updateDoc(doc(columnsCollection, col.id), { position: index })
  );
  await Promise.all(promises);
};
