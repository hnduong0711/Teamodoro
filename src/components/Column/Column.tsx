import React, { useEffect, useState } from "react";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";
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
      window.confirm("Are you sure you want to delete this task?")
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

    console.log(activeTaskId);
    console.log(sourceColumnId);
    console.log(overTaskId);
    console.log(targetColumnId);

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
    <div className="flex flex-col" ref={setNodeRef} style={style}>
      <div className="flex space-x-4 cursor-move">
        <div
          onClick={handleEditColumn}
          className="flex-1 cursor-text font-semibold"
        >
          {isEditing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveColumn}
              onKeyPress={(e) => e.key === "Enter" && handleSaveColumn()}
              autoFocus
              className="w-full p-1 border rounded"
            />
          ) : (
            <div onClick={handleEditColumn} className="cursor-text">
              {name}
            </div>
          )}
        </div>

        <div className="flex-1 px-12" {...listeners}></div>

        <div className="flex items-center space-x-4 justify-between">
          <div className="mt-2">
            <img
              src={"https://via.placeholder.com/30"}
              alt="User"
              className="w-6 h-6 rounded-full"
            />
          </div>
          <button onClick={handleDeleteColumn} className="text-red-500">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="bg-gray-200 p-4 rounded-lg mb-4 flex flex-col space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={columnTasks.map((t) => `task-${t.id}-${id}`)}>
            {columnTasks.map((task) => (
              <TaskItem
                key={task.id}
                id={task.id} // vẫn là taskId
                title={task.title}
                boardId={boardId || ""}
                columnId={id} // để TaskItem biết columnId
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </SortableContext>
        </DndContext>
        <div
          className="mt-4 cursor-pointer bg-blue-100 p-2 rounded border border-slate-400 border-dashed"
          onClick={handleAddTask}
        >
          + Add Task
        </div>
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
    </div>
  );
};

export default Column;
