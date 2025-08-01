import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Timestamp } from "firebase/firestore";
import { useTaskStore } from "../../store/taskStore";
import { addAssignedTask, addTask, updateTask } from "../../services/taskService";
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
import { fadeUp, hoverGrow, tapShrink, staggerContainer, staggerItem } from "../../utils/motionVariants";

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
    <motion.li
      variants={staggerItem}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex justify-between items-center mb-1 cursor-move text-[#212121] dark:text-[#FBF6E9]"
    >
      <span>{item.text}</span>
      <motion.button
        {...hoverGrow}
        {...tapShrink}
        onClick={() => deleteChecklistItem(teamId, boardId, columnId, taskId, item.id)}
        className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
      >
        X
      </motion.button>
    </motion.li>
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
        const unsubscribe = subscribeToChecklistItems(teamId, boardId, columnId, taskId);
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

  const addAssignedEmail = async () => {
    if (newEmail && !assignedEmails.includes(newEmail)) {
      try {
        if (taskId) {
          const result = await addAssignedTask(teamId, boardId, columnId, taskId, newEmail);
          if (result.success) {
            setAssignedEmails([...assignedEmails, result.userId]);
            setNewEmail("");
          }
        }
      } catch (error: any) {
        alert(error.message);
      }
    } else {
      alert("Người dùng đã đảm nhiệm!");
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

    const oldIndex = itemsByTask[taskId]?.findIndex((item) => item.id === active.id) || 0;
    const newIndex = itemsByTask[taskId]?.findIndex((item) => item.id === over.id) || 0;
    const newItems = arrayMove(itemsByTask[taskId] || [], oldIndex, newIndex);
    setItems(taskId, newItems);
    await moveChecklistItem(teamId!, boardId!, columnId!, taskId!, active.id.toString(), newIndex, itemsByTask[taskId] || []);
  };

  const handleSave = async () => {
    if (!title) return alert("Vui lòng nhập tiêu đề");

    const taskData = {
      title,
      description,
      assignedTo: assignedEmails ?? [],
      startDate: currentTask?.startDate ?? null,
      dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : undefined,
      isStart: currentTask?.isStart || false,
      isDone: currentTask?.isDone || false,
      createdBy: currentTask?.createdBy || (user?.uid ?? "unknown"),
      focusCount: currentTask?.focusCount || 0,
      focusType: currentTask?.focusType || "default",
      columnId,
      progress: currentTask?.progress || 0,
    };

    try {
      if (currentTask) {
        await updateTask(teamId, boardId, columnId, currentTask.id, taskData);
      } else {
        await addTask(teamId, boardId, columnId, taskData);
      }
      onClose();
    } catch (error) {
      console.error("Lỗi khi lưu công việc:", error);
      alert("Không thể lưu công việc. Vui lòng thử lại.");
    }
  };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
  const checklistItems = itemsByTask[taskId] || [];

  if (!isOpen) return null;

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-[#2A2A2A] p-6 rounded-lg w-full max-w-md border border-[#CFFFE2]/20"
      >
        <motion.h2
          variants={fadeUp}
          className="text-xl sm:text-2xl font-bold mb-4 text-[#212121] dark:text-[#FBF6E9]"
        >
          {currentTask ? "Chỉnh sửa công việc" : "Thêm công việc"}
        </motion.h2>
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <motion.div variants={staggerItem} className="mb-4">
            <label className="block mb-1 text-[#212121] dark:text-[#FBF6E9]">
              Tiêu đề
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E]"
            />
          </motion.div>
          <motion.div variants={staggerItem} className="mb-4">
            <label className="block mb-1 text-[#212121] dark:text-[#FBF6E9]">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E]"
            />
          </motion.div>
          <motion.div variants={staggerItem} className="mb-4">
            <label className="block mb-1 text-[#212121] dark:text-[#FBF6E9]">
              Ngày hết hạn
            </label>
            <input
              type="date"
              value={dueDate || ""}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E]"
            />
          </motion.div>
          <motion.div variants={staggerItem} className="mb-4">
            <label className="block mb-1 text-[#212121] dark:text-[#FBF6E9]">
              Phân công
            </label>
            <div className="flex mb-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E]"
                placeholder="Nhập email"
              />
              <motion.button
                {...hoverGrow}
                {...tapShrink}
                onClick={addAssignedEmail}
                className="ml-2 bg-[#096B68] text-[#FBF6E9] p-2 rounded-lg hover:bg-[#328E6E] transition-colors cursor-pointer"
              >
                Thêm
              </motion.button>
            </div>
            <motion.ul variants={staggerContainer} initial="hidden" animate="show">
              {assignedEmails.map((email) => (
                <motion.li
                  variants={staggerItem}
                  key={email}
                  className="flex justify-between items-center mb-1 text-[#212121] dark:text-[#FBF6E9]"
                >
                  <span>{email}</span>
                  <motion.button
                    {...hoverGrow}
                    {...tapShrink}
                    onClick={() => removeAssignedEmail(email)}
                    className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    X
                  </motion.button>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
          <motion.div variants={staggerItem} className="mb-4">
            <label className="block mb-1 text-[#212121] dark:text-[#FBF6E9]">
              Danh sách công việc
            </label>
            <div className="flex mb-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                className="w-full p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E]"
                placeholder="Nhập công việc"
              />
              <motion.button
                {...hoverGrow}
                {...tapShrink}
                onClick={handleAddChecklistItem}
                className="ml-2 bg-[#096B68] text-[#FBF6E9] p-2 rounded-lg hover:bg-[#328E6E] transition-colors cursor-pointer"
              >
                Thêm
              </motion.button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={checklistItems.map((item) => item.id)}>
                <motion.ul variants={staggerContainer} initial="hidden" animate="show">
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
                </motion.ul>
              </SortableContext>
            </DndContext>
          </motion.div>
          <motion.div variants={staggerItem} className="flex justify-end gap-4">
            <motion.button
              {...hoverGrow}
              {...tapShrink}
              onClick={onClose}
              className="bg-[#212121] dark:bg-[#2A2A2A] text-[#FBF6E9] p-2 rounded-lg hover:bg-[#328E6E] transition-colors cursor-pointer"
            >
              Hủy
            </motion.button>
            <motion.button
              {...hoverGrow}
              {...tapShrink}
              onClick={handleSave}
              className="bg-[#096B68] text-[#FBF6E9] p-2 rounded-lg hover:bg-[#328E6E] transition-colors cursor-pointer"
            >
              Lưu
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default TaskModal;