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

// lấy dữ liệu 1 lần
export const fetchTasks = async (
  teamId: string,
  boardId: string,
  columnId: string
) => {
  if (!teamId || !boardId || !columnId) {
    console.log(
      "No teamId, boardId, or columnId, setting tasks to empty for column:",
      columnId
    );
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
  console.log("Fetched tasks for column:", columnId, tasks);
  useTaskStore.getState().setTasks(columnId, tasks);
};

// theo dõi dữ liệu
export const subscribeToTasks = (
  teamId: string,
  boardId: string,
  columnId: string,
  callback?: () => void
) => {
  if (!teamId || !boardId || !columnId) {
    console.log(
      "No teamId, boardId, or columnId, setting tasks to empty for column:",
      columnId
    );
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
      console.log("Subscribed tasks for column:", columnId, tasks);
      useTaskStore.getState().setTasks(columnId, tasks);
      if (callback) callback();
    },
    (error) =>
      console.error("Error subscribing to tasks for column:", columnId, error)
  );

  return unsubscribe;
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
  await deleteDoc(taskRef);
  useTaskStore.getState().deleteTask(columnId, taskId);
};

// kéo thả
// export const moveTask = async (
//   teamId: string,
//   sourceBoardId: string,
//   sourceColumnId: string,
//   targetBoardId: string,
//   targetColumnId: string,
//   taskId: string,
//   newPosition: number
// ) => {
//   const sourceTaskRef = doc(
//     db,
//     `teams/${teamId}/boards/${sourceBoardId}/columns/${sourceColumnId}/tasks`,
//     taskId
//   );
//   const targetTasksCollection = collection(
//     db,
//     `teams/${teamId}/boards/${targetBoardId}/columns/${targetColumnId}/tasks`
//   );

//   const taskSnap = await getDoc(sourceTaskRef);
//   if (!taskSnap.exists()) throw new Error("Task not found");

//   const taskData = taskSnap.data() as Task;
//   await deleteDoc(sourceTaskRef);
//   const newTaskRef = await addDoc(targetTasksCollection, {
//     ...taskData,
//     position: newPosition,
//     columnId: targetColumnId,
//   });
//   const newTask: Task = {
//     id: newTaskRef.id,
//     ...taskData,
//     position: newPosition,
//     columnId: targetColumnId,
//   };

//   const sourceSnapshot = await getDocs(
//     collection(
//       db,
//       `teams/${teamId}/boards/${sourceBoardId}/columns/${sourceColumnId}/tasks`
//     )
//   );
//   const targetSnapshot = await getDocs(targetTasksCollection);
//   const sourceTasks = sourceSnapshot.docs
//     .map((doc) => ({ id: doc.id, ...doc.data() } as Task))
//     .filter((t) => t.id !== taskId);
//   const targetTasks = targetSnapshot.docs.map(
//     (doc) => ({ id: doc.id, ...doc.data() } as Task)
//   );

//   const updatePositions = (tasks: Task[], colId: string) =>
//     tasks.map((task, index) => ({
//       ref: doc(
//         db,
//         `teams/${teamId}/boards/${sourceBoardId}/columns/${colId}/tasks`,
//         task.id
//       ),
//       updates: { position: index },
//     }));

//   const promises = [
//     ...updatePositions(sourceTasks, sourceColumnId),
//     ...updatePositions(targetTasks, targetColumnId),
//   ];
//   await Promise.all(
//     promises.map(({ ref, updates }) => updateDoc(ref, updates))
//   );

//   useTaskStore.getState().deleteTask(sourceColumnId, taskId);
//   useTaskStore.getState().addTask(targetColumnId, newTask);
// };
