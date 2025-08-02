import React, { useEffect, useState } from "react";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useColumnStore } from "../../store/columnStore";
import { useBoardStore } from "../../store/boardStore";
import { useTeamStore } from "../../store/teamStore";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import TaskModal from "../Modals/TaskModal";
import { useTaskStore } from "../../store/taskStore";
import TaskItem from "../Task/TaskItem";
import {
  deleteTask,
  moveTask,
  subscribeToTasks,
  updateTask,
} from "../../services/taskService";
import { hoverGrow, tapShrink, fadeUp } from "../../utils/motionVariants";

interface ColumnProps {
  id: string;
  column: any;
  onEdit: (id: string, teamId: string, boardId: string, name: string) => void;
  onDelete: (id: string) => void;
}

const Column: React.FC<ColumnProps> = ({ id, column, onEdit, onDelete }) => {
  const { listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const { currentBoard } = useBoardStore();
  const { currentTeam } = useTeamStore();
  const { tasksByColumn, setTasks, setCurrentTask } = useTaskStore();
  const teamId = currentTeam?.id;
  const boardId = currentBoard?.id;
  const columnTasks = tasksByColumn[id] || [];
  const [tempTaskId, setTempTaskId] = useState<string | undefined>(undefined);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (teamId && boardId && id) {
      setTasks(id, []);
      const unsubscribe = subscribeToTasks(teamId, boardId, id);
      return () => unsubscribe();
    }
  }, [teamId, boardId, id, setTasks]);

  const handleEditColumn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSaveColumn = () => {
    if (currentBoard?.id && currentTeam?.id) {
      onEdit(id, currentTeam.id, currentBoard.id, name);
      useColumnStore.getState().updateColumn(id, { name });
      setIsEditing(false);
    }
  };

  const handleDeleteColumn = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };

  const handleDeleteTask = (taskId: string) => {
    if (
      teamId &&
      boardId &&
      id &&
      window.confirm("Bạn có chắc muốn xóa công việc này?")
    ) {
      deleteTask(teamId, boardId, id, taskId);
    }
  };

  const handleEditTask = (taskId: string) => {
    setIsModalOpen(true);
    const task = useTaskStore
      .getState()
      .tasksByColumn[id].find((t) => t.id === taskId);
    if (task) {
      setCurrentTask(task);
    }
  };

  const handleAddTask = () => {
    setIsModalOpen(true);
    setCurrentTask(null);
    setTempTaskId(crypto.randomUUID());
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const [_, activeTaskId, sourceColumnId] = active.id.toString().split("-");
    const [__, overTaskId, targetColumnId] = over.id.toString().split("-");

    if (!activeTaskId || !sourceColumnId || !targetColumnId) return;

    const isSameColumn = sourceColumnId === targetColumnId;

    if (isSameColumn) {
      const tasks = tasksByColumn[sourceColumnId];
      const oldIndex = tasks.findIndex((t) => t.id === activeTaskId);
      const newIndex = tasks.findIndex((t) => t.id === overTaskId);
      if (oldIndex === -1 || newIndex === -1) return;

      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(sourceColumnId, newTasks);

      await Promise.all(
        newTasks.map((task, index) =>
          updateTask(teamId!, boardId!, sourceColumnId, task.id, {
            position: index,
          })
        )
      );
    } else {
      const sourceTasks = tasksByColumn[sourceColumnId] || [];
      const targetTasks = tasksByColumn[targetColumnId] || [];

      const movingTask = sourceTasks.find((t) => t.id === activeTaskId);
      if (!movingTask) return;

      const newIndex = targetTasks.findIndex((t) => t.id === overTaskId);
      const insertIndex = newIndex >= 0 ? newIndex : targetTasks.length;

      const updatedSourceTasks = sourceTasks.filter(
        (t) => t.id !== activeTaskId
      );
      const updatedTargetTasks = [
        ...targetTasks.slice(0, insertIndex),
        { ...movingTask, position: insertIndex },
        ...targetTasks.slice(insertIndex),
      ];

      setTasks(sourceColumnId, updatedSourceTasks);
      setTasks(targetColumnId, updatedTargetTasks);

      await moveTask(
        teamId!,
        boardId!,
        sourceColumnId,
        targetColumnId,
        activeTaskId,
        insertIndex
      );
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="flex flex-col min-w-[300px] py-4 px-2 bg-[#CFFFE2]/20 shadow rounded-xl"
      >
        <div className="flex items-center justify-between mb-2">
          {isEditing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveColumn}
              onKeyPress={(e) => e.key === "Enter" && handleSaveColumn()}
              autoFocus
              className="w-full p-1 mr-4 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E]"
            />
          ) : (
            <div
              onClick={handleEditColumn}
              className="font-semibold text-[#212121] dark:text-[#FBF6E9] cursor-text hover:text-[#328E6E] transition-colors"
            >
              {name}
            </div>
          )}

          <div className="flex items-center gap-2 cursor-pointer flex-1 w-32 h-8" {...listeners}></div>
          <img
            src={"https://via.placeholder.com/30"}
            alt="User"
            className="w-6 h-6 rounded-full"
          />
          <motion.button
            {...hoverGrow}
            {...tapShrink}
            onClick={handleDeleteColumn}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
        <div className="bg-[#CFFFE2]/20 p-4 rounded-lg mb-4 flex flex-col space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columnTasks.map((t) => `task-${t.id}-${id}`)}
            >
              {columnTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  dueDate={task.dueDate!}
                  boardId={boardId || ""}
                  columnId={id}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </SortableContext>
          </DndContext>
          <motion.div
            {...hoverGrow}
            {...tapShrink}
            className="mt-4 cursor-pointer bg-[#096B68] text-[#FBF6E9] p-2 rounded-lg text-center hover:bg-[#328E6E] transition-colors"
            onClick={handleAddTask}
          >
            + Thêm Task
          </motion.div>
          <TaskModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setTempTaskId(undefined);
            }}
            columnId={id}
            teamId={teamId ?? ""}
            boardId={boardId ?? ""}
            tempTaskId={tempTaskId ?? ""}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Column;
