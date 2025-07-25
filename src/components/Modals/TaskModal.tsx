import React, { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import { useTaskStore } from "../../store/taskStore";
import { addTask, updateTask } from "../../services/taskService";
import { useAuth } from "../../hooks/useAuth";
import { type ChecklistItem } from "../../types/ChecklistItem";
import { useCLIStore } from "../../store/cliStore";
import {
  addChecklistItem,
  deleteChecklistItem,
  moveChecklistItem,
  subscribeToChecklistItems,
} from "../../services/cliService";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnId: string;
  teamId: string;
  boardId: string;
  tempTaskId: string;
}

const SortableChecklistItem = ({
  item,
  taskId,
  columnId,
  teamId,
  boardId,
}: {
  item: ChecklistItem;
  taskId: string;
  columnId: string;
  teamId: string;
  boardId: string;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex justify-between items-center mb-1 cursor-move"
    >
      <span>{item.text}</span>
      <button
        onClick={() =>
          deleteChecklistItem(teamId, boardId, columnId, taskId, item.id)
        }
        className="text-red-500"
      >
        X
      </button>
    </li>
  );
};

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  columnId,
  teamId,
  boardId,
  tempTaskId,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [assignedEmails, setAssignedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newChecklistText, setNewChecklistText] = useState("");
  const { user } = useAuth();
  const { itemsByTask, setItems } = useCLIStore();
  const { currentTask } = useTaskStore();
  const taskId = currentTask?.id || tempTaskId;

  useEffect(() => {
    if (isOpen && taskId) {
      if (currentTask) {
        // edit mode
        setTitle(currentTask.title || "");
        setDescription(currentTask.description || "");
        setDueDate(
          currentTask.dueDate
            ? currentTask.dueDate.toDate().toISOString().split("T")[0]
            : undefined
        );
        setAssignedEmails(currentTask.assignedTo || []);
        const unsubscribe = subscribeToChecklistItems(
          teamId,
          boardId,
          columnId,
          taskId
        );
        return () => unsubscribe();
      } else {
        // add mode
        setTitle("");
        setDescription("");
        setDueDate("");
        setAssignedEmails([]);
        setItems(taskId, []);
      }
      setNewEmail("");
      setNewChecklistText("");
    }
  }, [isOpen, taskId, currentTask, columnId, boardId, teamId, setItems]);

  const addAssignedEmail = () => {
    if (newEmail && !assignedEmails.includes(newEmail)) {
      setAssignedEmails([...assignedEmails, newEmail]);
      setNewEmail("");
    }
  };

  const removeAssignedEmail = (email: string) => {
    setAssignedEmails(assignedEmails.filter((e) => e !== email));
  };

  const handleAddChecklistItem = () => {
    if (newChecklistText) {
      addChecklistItem(teamId, boardId, columnId, taskId, {
        text: newChecklistText,
        done: false,
      });
      setNewChecklistText("");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const oldIndex =
      itemsByTask[taskId]?.findIndex((item) => item.id === active.id) || 0;
    const newIndex =
      itemsByTask[taskId]?.findIndex((item) => item.id === over.id) || 0;
    const newItems = arrayMove(itemsByTask[taskId] || [], oldIndex, newIndex);
    setItems(taskId, newItems);
    await moveChecklistItem(
      teamId!,
      boardId!,
      columnId!,
      taskId!,
      active.id.toString(),
      newIndex,
      checklistItems
    );
  };

  const handleSave = async () => {
    if (!title) return alert("Missing title");

    const taskData = {
      title,
      description,
      assignedTo: assignedEmails ?? [],
      startDate: currentTask?.startDate || Timestamp.now(),
      dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : undefined,
      isStart: currentTask?.isStart || false,
      isDone: currentTask?.isDone || false,
      createdBy: currentTask?.createdBy || (user?.uid ?? "unknown"),
      focusCount: currentTask?.focusCount || 0,
      focusType: currentTask?.focusType || "default",
      columnId,
    };

    try {
      if (currentTask) {
        await updateTask(teamId, boardId, columnId, currentTask.id, taskData);
      } else {
        await addTask(teamId, boardId, columnId, taskData);
      }
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Failed to save task. Please try again.");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const checklistItems = itemsByTask[taskId] || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">
          {currentTask ? "Edit Task" : "Add Task"}
        </h2>
        <div className="mb-4">
          <label className="block mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate || ""}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Assigned To</label>
          <div className="flex mb-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter email"
            />
            <button
              onClick={addAssignedEmail}
              className="ml-2 bg-blue-500 text-white p-2 rounded"
            >
              Add
            </button>
          </div>
          <ul>
            {assignedEmails.map((email) => (
              <li
                key={email}
                className="flex justify-between items-center mb-1"
              >
                <span>{email}</span>
                <button
                  onClick={() => removeAssignedEmail(email)}
                  className="text-red-500"
                >
                  X
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="mb-4">
          <label className="block mb-1">Checklist</label>
          <div className="flex mb-2">
            <input
              type="text"
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter checklist item"
            />
            <button
              onClick={handleAddChecklistItem}
              className="ml-2 bg-blue-500 text-white p-2 rounded"
            >
              Add
            </button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={checklistItems.map((item) => item.id)}>
              <ul>
                {checklistItems.map((item) => (
                  <SortableChecklistItem
                    key={item.id}
                    item={item}
                    taskId={taskId}
                    columnId={columnId}
                    teamId={teamId}
                    boardId={boardId}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white p-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-green-500 text-white p-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
