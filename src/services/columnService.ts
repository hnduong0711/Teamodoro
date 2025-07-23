import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useColumnStore } from '../store/columnStore';
import { type Column } from '../types/Column';

export const fetchColumns = async (teamId: string, boardId: string) => {
  if (!teamId || !boardId) {
    console.log("No teamId or boardId, setting columns to empty");
    useColumnStore.getState().setColumns([]);
    return;
  }

  const columnsCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns`);
  const columnsQuery = query(columnsCollection, orderBy('position'));
  const snapshot = await getDocs(columnsQuery);
  const columns = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Column));
  console.log("Fetched columns:", columns);
  useColumnStore.getState().setColumns(columns);
};

export const subscribeToColumns = (teamId: string, boardId: string, callback?: () => void) => {
  if (!teamId || !boardId) {
    console.log("No teamId or boardId, setting columns to empty in subscribe");
    useColumnStore.getState().setColumns([]);
    return () => {};
  }

  const columnsCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns`);
  const columnsQuery = query(columnsCollection, orderBy('position'));
  const unsubscribe = onSnapshot(columnsQuery, (snapshot) => {
    const columns = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Column));
    console.log("Subscribed columns:", columns);
    useColumnStore.getState().setColumns(columns);
    if (callback) callback();
  }, (error) => console.error('Error subscribing to columns:', error));

  return unsubscribe;
};

export const addColumn = async (teamId: string, boardId: string, columnData: Omit<Column, 'id' | 'position'> & { createdBy: string }) => {
  if (!teamId || !boardId) throw new Error('No teamId or boardId found');
  const columnsCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns`);
  const snapshot = await getDocs(columnsCollection);
  const newPosition = snapshot.size > 0 ? Math.max(...snapshot.docs.map((doc) => doc.data().position || 0)) + 1 : 0;
  await addDoc(columnsCollection, { ...columnData, position: newPosition });
};

export const updateColumn = async (teamId: string, boardId: string, columnId: string, updates: Partial<Column>) => {
  const columnRef = doc(db, `teams/${teamId}/boards/${boardId}/columns`, columnId);
  await updateDoc(columnRef, updates);
  useColumnStore.getState().updateColumn(columnId, updates);
};

export const deleteColumn = async (teamId: string, boardId: string, columnId: string) => {
  const columnRef = doc(db, `teams/${teamId}/boards/${boardId}/columns`, columnId);
  await deleteDoc(columnRef);
  useColumnStore.getState().deleteColumn(columnId);
};

export const reorderColumns = async (teamId: string, boardId: string, activeId: string, overId: string) => {
  const columnsCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns`);
  const snapshot = await getDocs(columnsCollection);
  const columns = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Column));

  const activeColumn = columns.find((c) => c.id === activeId);
  const overColumn = columns.find((c) => c.id === overId);
  if (!activeColumn || !overColumn) return;

  // Hoán đổi position giữa hai column
  const tempPosition = activeColumn.position;
  activeColumn.position = overColumn.position;
  overColumn.position = tempPosition;

  // Sắp xếp lại toàn bộ columns dựa trên position mới
  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

  // Cập nhật Firestore và store
  const promises = sortedColumns.map((col) =>
    updateDoc(doc(columnsCollection, col.id), { position: sortedColumns.indexOf(col) })
  );
  await Promise.all(promises);
  useColumnStore.getState().setColumns(sortedColumns);
};