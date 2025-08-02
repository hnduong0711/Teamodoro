import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Timestamp } from "firebase/firestore";
import { useTaskStore } from "../../store/taskStore";
import {
  addAssignedTask,
  addTask,
  removeAssignedTask,
  updateTask,
} from "../../services/taskService";
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
import {
  fadeUp,
  hoverGrow,
  tapShrink,
  staggerContainer,
  staggerItem,
} from "../../utils/motionVariants";
import { fetchUsersByIds } from "../../services/userService";
import type { User } from "../../types/User";
import { GripVertical, Trash2 } from "lucide-react";

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
  onDelete,
}: {
  item: ChecklistItem;
  taskId: string;
  columnId: string;
  teamId: string;
  boardId: string;
  onDelete: () => void;
}) => {
  const { attributes, listeners, setNodeRef } =
    useSortable({ id: item.id });

  return (
    <motion.li
      variants={staggerItem}
      ref={setNodeRef}
      className="flex justify-between items-center mb-1 cursor-move text-[#212121] dark:text-[#FBF6E9]"
    >
      <GripVertical
        {...attributes}
        {...listeners}
        className="cursor-move text-[#212121] dark:text-[#FBF6E9] opacity-50 hover:opacity-100 transition-opacity"
      />
      <span>{item.text}</span>
      <motion.button
        {...hoverGrow}
        {...tapShrink}
        onClick={onDelete}
        className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
      >
        <Trash2 size={16} />
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
  // task store
  const { user } = useAuth();
  const { itemsByTask, setItems } = useCLIStore();
  const { currentTask } = useTaskStore();
  // state component
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [assignedMembers, setAssignedMembers] = useState<string[]>(
    currentTask?.assignedTo || []
  );
  const [newEmail, setNewEmail] = useState("");
  const [newChecklistText, setNewChecklistText] = useState("");
  const [membersData, setMembersData] = useState<User[]>([]);

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
        setAssignedMembers(currentTask.assignedTo || []);
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
        setAssignedMembers([]);
        setItems(taskId, []);
      }
      setNewEmail("");
      setNewChecklistText("");
    }
  }, [isOpen, taskId, currentTask, columnId, boardId, teamId, setItems]);

  useEffect(() => {
    const fetchUserData = async () => {
      const membersData = await fetchUsersByIds(assignedMembers);
      setMembersData(membersData);
    };
    fetchUserData();
  }, [assignedMembers]);

  const addAssignedEmail = async () => {
    try {
      if (taskId) {
        const result = await addAssignedTask(
          teamId,
          boardId,
          columnId,
          taskId,
          newEmail
        );
        if (result.success) {
          setAssignedMembers([...assignedMembers, result.userId]);
          setNewEmail("");
        }
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const removeAssignedEmail = async (userId: string) => {
    setAssignedMembers(assignedMembers.filter((e) => e !== userId));
    await removeAssignedTask(teamId, boardId, columnId, taskId, userId);
  };

  const handleAddChecklistItem = async () => {
    try {
      if (taskId && newChecklistText) {
        await addChecklistItem(teamId, boardId, columnId, taskId, {
          text: newChecklistText,
          done: false,
        });
        setNewChecklistText("");
      }
    } catch (error) {
      console.error("Lỗi khi thêm checklist:", error);
    }
  };

  const removeChecklistItem = async (cliId: string) => {
    try {
      await deleteChecklistItem(teamId, boardId, columnId, taskId, cliId);
    } catch (err) {
      console.error("Xoá checklist item thất bại:", err);
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
      itemsByTask[taskId] || []
    );
  };

  const handleSave = async () => {
    if (!title) return alert("Vui lòng nhập tiêu đề");

    const taskData = {
      title,
      description,
      assignedTo: assignedMembers ?? [],
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

  const handleClose = () => {
    setNewEmail("");
    onClose();
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
  //   itemsByTask[taskId] || []
  // );

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
            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {membersData.map((member) => (
                <motion.li
                  variants={staggerItem}
                  key={member.id}
                  className="flex justify-between items-center mb-1 text-[#212121] dark:text-[#FBF6E9]"
                >
                  <span>{member.displayName}</span>
                  <motion.button
                    {...hoverGrow}
                    {...tapShrink}
                    onClick={() => removeAssignedEmail(member.id)}
                    className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={(itemsByTask[taskId] || []).map((item) => item.id)}
              >
                <motion.ul
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                >
                  {(itemsByTask[taskId] || []).map((item) => (
                    <SortableChecklistItem
                      key={item.id}
                      item={item}
                      taskId={taskId}
                      columnId={columnId}
                      teamId={teamId}
                      boardId={boardId}
                      onDelete={() => removeChecklistItem(item.id)}
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
              onClick={handleClose}
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
