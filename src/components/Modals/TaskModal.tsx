import React, { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import { useTaskStore } from "../../store/taskStore";
import { addTask, updateTask } from "../../services/taskService";
import { useAuth } from "../../hooks/useAuth";
import type { ChecklistItem } from "../../types/ChecklistItem";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnId: string;
  teamId: string;
  boardId: string;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  columnId,
  teamId,
  boardId,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [assignedEmails, setAssignedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [checklistItems, setChecklistItems] = useState<
    { id: string; text: string; done: boolean }[]
  >([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const { user } = useAuth();
  const { currentTask } = useTaskStore();

  // load dữ liệu task khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (currentTask) {
        // update mode
        setTitle(currentTask.title || "");
        setDescription(currentTask.description || "");
        setDueDate(
          currentTask.dueDate
            ? currentTask.dueDate.toDate().toISOString().split("T")[0]
            : undefined
        );
        setAssignedEmails(currentTask.assignedTo || []);
        setChecklistItems(
          currentTask.checklist?.map((item) => ({
            id: item.id,
            text: item.text,
            done: item.done,
          })) || []
        );
      } else {
        // add mode
        setTitle("");
        setDescription("");
        setDueDate("");
        setAssignedEmails([]);
        setChecklistItems([]);
      }
      setNewEmail("");
      setNewChecklistText("");
    }
  }, [isOpen, currentTask]);

  const addAssignedEmail = () => {
    if (newEmail && !assignedEmails.includes(newEmail)) {
      setAssignedEmails([...assignedEmails, newEmail]);
      setNewEmail("");
    }
  };

  const removeAssignedEmail = (email: string) => {
    setAssignedEmails(assignedEmails.filter((e) => e !== email));
  };

  const addChecklistItem = () => {
    if (newChecklistText) {
      setChecklistItems([
        ...checklistItems,
        { id: crypto.randomUUID(), text: newChecklistText, done: false },
      ]);
      setNewChecklistText("");
    }
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    if (!title) return alert("Missing title");

    const checklistItemsFormatted: ChecklistItem[] = checklistItems.map(
      (item, index) => ({
        ...item,
        position: index,
      })
    );

    const taskData = {
      title,
      description,
      assignedTo: assignedEmails ?? [],
      startDate: currentTask?.startDate || Timestamp.now(),
      dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : undefined,
      isStart: currentTask?.isStart || false,
      isDone: currentTask?.isDone || false,
      checklist: checklistItemsFormatted,
      createdBy: currentTask?.createdBy || (user?.uid ?? "unknown"),
      focusCount: currentTask?.focusCount || 0,
      focusType: currentTask?.focusType || "default",
      columnId,
    };

    try {
      if (currentTask) {
        // update mode
        await updateTask(teamId, boardId, columnId, currentTask.id, taskData);
      } else {
        // add mode
        await addTask(teamId, boardId, columnId, taskData);
      }
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      alert("Failed to save task. Please try again.");
    }
  };

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
              onClick={addChecklistItem}
              className="ml-2 bg-blue-500 text-white p-2 rounded"
            >
              Add
            </button>
          </div>
          <ul>
            {checklistItems.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center mb-1"
              >
                <span>{item.text}</span>
                <button
                  onClick={() => removeChecklistItem(item.id)}
                  className="text-red-500"
                >
                  X
                </button>
              </li>
            ))}
          </ul>
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
