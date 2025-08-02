import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { useTaskStore } from "../store/taskStore";
import { type Task } from "../types/Task";
import { fetchUserByEmail } from "./userService";
import type { Board } from "../types/Board";

// lấy dữ liệu 1 lần all task
export const fetchTasks = async (
  teamId: string,
  boardId: string,
  columnId: string
) => {
  if (!teamId || !boardId || !columnId) {
    useTaskStore.getState().setTasks(columnId, []);
    return;
  }

  const tasksCollection = collection(
    db,
    `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks`
  );
  const tasksQuery = query(tasksCollection, orderBy("position"));
  const snapshot = await getDocs(tasksQuery);
  const tasks = snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Task)
  );
  useTaskStore.getState().setTasks(columnId, tasks);
};

// lấy dữ liệu 1 lần 1 task
export const fetchTask = async (
  teamId: string,
  boardId: string,
  columnId: string,
  taskId: string
) => {
  const taskRef = doc(
    db,
    `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}`
  );
  const docSnap = await getDoc(taskRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Task;
  }
  return null;
};

// theo dõi dữ liệu
export const subscribeToTasks = (
  teamId: string,
  boardId: string,
  columnId: string,
  callback?: () => void
) => {
  if (!teamId || !boardId || !columnId) {
    useTaskStore.getState().setTasks(columnId, []);
    return () => {};
  }

  const tasksCollection = collection(
    db,
    `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks`
  );
  const tasksQuery = query(tasksCollection, orderBy("position"));
  const unsubscribe = onSnapshot(
    tasksQuery,
    (snapshot) => {
      const tasks = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Task)
      );
      useTaskStore.getState().setTasks(columnId, tasks);
      if (callback) callback();
    },
    (error) =>
      console.error("Error subscribing to tasks for column:", columnId, error)
  );

  return unsubscribe;
};
// theo dõi 1 task
export const subscribeToTask = (
  teamId: string,
  boardId: string,
  columnId: string,
  taskId: string,
  callback: (task: Task | null) => void
) => {
  const taskRef = doc(
    db,
    `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}`
  );
  return onSnapshot(
    taskRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as Task);
      } else {
        callback(null);
      }
    },
    (error) => console.error("Error subscribing to task:", error)
  );
};
// thêm task
export const addTask = async (
  teamId: string,
  boardId: string,
  columnId: string,
  taskData: Omit<Task, "id" | "position" | "createdAt"> & { createdBy: string }
) => {
  if (!teamId || !boardId || !columnId)
    throw new Error("No teamId, boardId, or columnId found");
  const tasksCollection = collection(
    db,
    `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks`
  );
  const snapshot = await getDocs(tasksCollection);
  const newPosition =
    snapshot.size > 0
      ? Math.max(...snapshot.docs.map((doc) => doc.data().position || 0)) + 1
      : 0;
  await addDoc(tasksCollection, {
    ...taskData,
    position: newPosition,
    createdAt: Timestamp.now(),
    columnId,
    progress: 0,
  });
};

// sửa task
export const updateTask = async (
  teamId: string,
  boardId: string,
  columnId: string,
  taskId: string,
  updates: Partial<Task>
) => {
  const taskRef = doc(
    db,
    `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks`,
    taskId
  );
  await updateDoc(taskRef, updates);
  useTaskStore.getState().updateTaskInState(columnId, taskId, updates);
};

// xóa task
export const deleteTask = async (
  teamId: string,
  boardId: string,
  columnId: string,
  taskId: string
) => {
  const taskRef = doc(
    db,
    `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks`,
    taskId
  );

  // xóa checklist items
  const checklistRef = collection(taskRef, "/checkListItem");
  const checklistSnap = await getDocs(checklistRef);

  const deleteChecklistPromises = checklistSnap.docs.map((doc) =>
    deleteDoc(doc.ref)
  );
  await Promise.all(deleteChecklistPromises);

  // xóa task
  await deleteDoc(taskRef);

  // cập nhật store
  useTaskStore.getState().deleteTask(columnId, taskId);
};

// phân công thành viên
// thêm vào task
export const addAssignedTask = async (
  teamId: string,
  boardId: string,
  columnId: string,
  taskId: string,
  email: string
) => {
  const taskRef = doc(
    db,
    `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/`,
    taskId
  );
  const taskSnap = await getDoc(taskRef);
  if (!taskSnap.exists()) throw new Error("Task not found");

  const taskData = taskSnap.data() as Task;

  // kiểm tra user tồn tại trong collection
  const user = await fetchUserByEmail(email);
  if (!user) {
    throw new Error("Người dùng không tồn tại!");
  }

  // kiểm tra task có tồn tại không
  const boardRef = doc(db, `teams/${teamId}/boards/`, boardId);
  const boardSnap = await getDoc(boardRef);
  if (!boardSnap.exists()) {
    throw new Error("Không tìm thấy board");
  }

  // kiểm tra user thuộc team không
  const boardData = boardSnap.data() as Board;
  if (!boardData.isPublic) {
    if (!boardData.members || !boardData.members.includes(user.id)) {
      throw new Error("Người dùng không thuộc nhóm này!");
    }
  }

  if (taskData.assignedTo && taskData.assignedTo.includes(user.id)) {
    throw new Error("Người dùng đã đảm nhiệm công việc này!");
  }

  // lưu user vào firebase
  const updatedAssigned = taskData.assignedTo
    ? [...taskData.assignedTo, user.id]
    : [user.id];
  await updateDoc(taskRef, { assignedTo: updatedAssigned });
  // update cho task
  useTaskStore
    .getState()
    .updateTaskInState(columnId, taskId, { assignedTo: updatedAssigned });
  return { success: true, userId: user.id };
};

// xóa khỏi task
export const removeAssignedTask = async (
  teamId: string,
  boardId: string,
  columnId: string,
  taskId: string,
  userId: string
) => {
  const taskRef = doc(
    db,
    `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks/`,
    taskId
  );

  const taskSnap = await getDoc(taskRef);
  if (taskSnap.exists()) {
    const taskData = taskSnap.data() as Task;
    const updatedMembers = taskData.assignedTo
      ? taskData.assignedTo.filter((m: string) => m !== userId)
      : [];
    await updateDoc(taskRef, { assignedTo: updatedMembers });
    useTaskStore
      .getState()
      .updateTaskInState(columnId, taskId, { assignedTo: updatedMembers });
  }
};

// kéo thả
export const moveTask = async (
  teamId: string,
  boardId: string,
  sourceColumnId: string,
  targetColumnId: string,
  taskId: string,
  newPosition: number
) => {
  const taskRef = doc(
    db,
    `teams/${teamId}/boards/${boardId}/columns/${sourceColumnId}/tasks`,
    taskId
  );

  const taskSnap = await getDoc(taskRef);
  if (!taskSnap.exists()) throw new Error("Task not found");

  const taskData = taskSnap.data() as Task;

  // tạo task mới ở target column với dữ liệu cũ + position mới
  const targetTasksRef = collection(
    db,
    `teams/${teamId}/boards/${boardId}/columns/${targetColumnId}/tasks`
  );
  const newTaskRef = await addDoc(targetTasksRef, {
    ...taskData,
    columnId: targetColumnId,
    position: newPosition,
  });

  await deleteDoc(taskRef);

  // lấy danh sách task còn lại từ cả 2 column
  const [sourceSnap, targetSnap] = await Promise.all([
    getDocs(
      collection(
        db,
        `teams/${teamId}/boards/${boardId}/columns/${sourceColumnId}/tasks`
      )
    ),
    getDocs(targetTasksRef),
  ]);

  const sourceTasks = sourceSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Task[];
  const targetTasks = targetSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Task[];

  // update lại position theo index
  const updatePositionOps = [...sourceTasks, ...targetTasks].map(
    (task, index) => {
      const columnId =
        task.columnId === sourceColumnId ? sourceColumnId : targetColumnId;
      const ref = doc(
        db,
        `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks`,
        task.id
      );
      return updateDoc(ref, { position: index });
    }
  );

  await Promise.all(updatePositionOps);

  // update store
  useTaskStore.getState().deleteTask(sourceColumnId, taskId);
  useTaskStore.getState().addTask(targetColumnId, {
    ...taskData,
    id: newTaskRef.id,
    columnId: targetColumnId,
    position: newPosition,
  });
};
