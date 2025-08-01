import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useWeeklyTaskStore } from '../store/weeklyTaskStore';
import { type Task } from '../types/Task';

export const fetchTasksByBoard = async (boardId: string, teamId: string) => {
  try {
    const tasks: Task[] = [];
    
    
    // Lấy tất cả column thuộc boardId
    const columnsCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns`);
    const columnsSnapshot = await getDocs(columnsCollection);
    

    for (const columnDoc of columnsSnapshot.docs) {
      const columnId = columnDoc.id;
      const tasksCollection = collection(db, `teams/${teamId}/boards/${boardId}/columns/${columnId}/tasks`);
      const tasksSnapshot = await getDocs(tasksCollection);
      
      tasksSnapshot.forEach((taskDoc) => {
        const taskData = taskDoc.data() as Omit<Task, 'id'>;
        tasks.push({ id: taskDoc.id, ...taskData, columnId: `${teamId}/${boardId}/${columnId}` });
      });
    }
    useWeeklyTaskStore.getState().setTasks(tasks);
    return tasks;
  } catch (error) {
    console.error('Error fetching tasks by board:', error);
    throw error;
  }
};