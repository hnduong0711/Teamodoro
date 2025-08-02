import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTaskStore } from "../store/taskStore";
import { subscribeToTask, updateTask } from "../services/taskService";
import { useCLIStore } from "../store/cliStore";
import {
  fetchChecklistItems,
  subscribeToChecklistItems,
  updateChecklistItem,
  addChecklistItem,
  deleteChecklistItem,
  moveChecklistItem,
} from "../services/cliService";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import type { ChecklistItem } from "../types/ChecklistItem";
import { useTeamStore } from "../store/teamStore";
import {
  addChatMessage,
  subscribeToChatMessages,
} from "../services/chatService";
import { useAuth } from "../hooks/useAuth";
import { useChatStore } from "../store/chatStore";
import { Timestamp } from "firebase/firestore";
import {
  fadeUp,
  hoverGrow,
  tapShrink,
  staggerContainer,
  staggerItem,
} from "../utils/motionVariants";
import type { User } from "../types/User";
import { fetchUsersByIds } from "../services/userService";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const { currentTask } = useTaskStore();
  const { getProgressByTask } = useCLIStore();

  const handleToggle = () => {
    updateChecklistItem(teamId, boardId, columnId, taskId, item.id, {
      done: !item.done,
    });
    updateTask(teamId, boardId, columnId, taskId, {
      progress: getProgressByTask(taskId).percent,
    });
  };

  const handleSaveEdit = () => {
    if (editText.trim() !== item.text) {
      updateChecklistItem(teamId, boardId, columnId, taskId, item.id, {
        text: editText.trim(),
      });
    }
    setIsEditing(false);
  };

  return (
    <motion.li
      variants={staggerItem}
      ref={setNodeRef}
      style={style}
      className="flex items-center mb-2 max-w-full"
    >
      <GripVertical
        {...attributes}
        {...listeners}
        className="cursor-move mr-2 text-[#212121] dark:text-[#FBF6E9] opacity-50 hover:opacity-100 transition-opacity"
      />
      <input
        type="checkbox"
        checked={item.done}
        onChange={handleToggle}
        className="mr-2 accent-[#096B68]"
        disabled={!currentTask?.isStart}
      />
      {isEditing ? (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
          autoFocus
          className="flex-1 p-1 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E]"
          disabled={!currentTask?.isStart}
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className="flex-1 cursor-text text-[#212121] dark:text-[#FBF6E9] hover:text-[#328E6E] transition-colors"
        >
          {item.text}
        </span>
      )}
      <motion.button
        {...hoverGrow}
        {...tapShrink}
        disabled={!currentTask?.isStart}
        onClick={() =>
          deleteChecklistItem(teamId, boardId, columnId, taskId, item.id)
        }
        className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors cursor-pointer"
      >
        <X size={16} />
      </motion.button>
    </motion.li>
  );
};

const TaskPage: React.FC = () => {
  const { boardId, columnId, taskId } = useParams<{
    teamId: string;
    boardId: string;
    columnId: string;
    taskId: string;
  }>();
  const navigate = useNavigate();
  const { setCurrentTask, currentTask } = useTaskStore();
  const { itemsByTask, setItems } = useCLIStore();
  const [isStartClicked, setIsStartClicked] = useState(false);
  const [isDoneClicked, setIsDoneClicked] = useState(false);
  const { currentTeam } = useTeamStore();
  const teamId = currentTeam?.id;
  const [newMessage, setNewMessage] = useState("");
  const { messagesByTask } = useChatStore();
  const { user } = useAuth();
  const [newChecklistText, setNewChecklistText] = useState("");
  const [assignedMembers, setAssignedMembers] = useState<User[]>([]);

  useEffect(() => {
    if (teamId && boardId && columnId && taskId) {
      const unsubscribeTask = subscribeToTask(
        teamId,
        boardId,
        columnId,
        taskId,
        (task) => setCurrentTask(task)
      );
      const unsubscribeChecklist = subscribeToChecklistItems(
        teamId,
        boardId,
        columnId,
        taskId
      );
      const unsubscribeMessages = subscribeToChatMessages(
        teamId,
        boardId,
        columnId,
        taskId
      );
      return () => {
        unsubscribeTask();
        unsubscribeChecklist();
        unsubscribeMessages();
      };
    }
  }, [teamId, boardId, columnId, taskId, setCurrentTask, setItems]);

  useEffect(() => {
    if (teamId && boardId && columnId && taskId) {
      fetchChecklistItems(teamId, boardId, columnId, taskId);
    }
  }, [teamId, boardId, columnId, taskId]);

  useEffect(() => {
    const fetchUserData = async () => {
      const membersData = await fetchUsersByIds(currentTask?.assignedTo!);
      setAssignedMembers(membersData);
    };
    fetchUserData();
  }, [currentTask?.assignedTo]);

  const handleStart = () => {
    if (!isStartClicked && currentTask && !currentTask.isStart) {
      updateTask(teamId!, boardId!, columnId!, taskId!, {
        isStart: true,
        startDate: Timestamp.now(),
      });
      setIsStartClicked(true);
    }
  };

  const handleDone = () => {
    if (
      !isDoneClicked &&
      currentTask &&
      currentTask.isStart &&
      itemsByTask[taskId || ""]?.every((item) => item.done)
    ) {
      updateTask(teamId!, boardId!, columnId!, taskId!, { isDone: true });
      setIsDoneClicked(true);
    }
  };

  const handleFocusMode = () => {
    if (taskId && boardId) {
      navigate(`/board/${boardId}/column/${columnId}/task/${taskId}/focus`);
    }
  };

  const handleAddChecklistItem = () => {
    if (teamId && boardId && columnId && taskId && newChecklistText) {
      addChecklistItem(teamId, boardId, columnId, taskId, {
        text: newChecklistText,
        done: false,
      });
      setNewChecklistText("");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const checklistItems = itemsByTask[taskId || ""] || [];
  const chatMessages = messagesByTask[taskId || ""] || [];
  const currentUserId = user?.uid;

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const oldIndex = checklistItems.findIndex((item) => item.id === active.id);
    const newIndex = checklistItems.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

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

  const handleSendMessage = () => {
    if (teamId && boardId && columnId && taskId && newMessage && user?.uid) {
      addChatMessage(teamId, boardId, columnId, taskId, user.uid, newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FDFAF6] dark:bg-[#212121] p-4 sm:p-6">
      {/* Task Information */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-[#2A2A2A] p-4 rounded-lg shadow-md mb-6 border border-[#CFFFE2]/20"
      >
        <div className="flex items-center mb-4">
          <motion.button
            {...hoverGrow}
            {...tapShrink}
            onClick={() => navigate(-1)}
            className="mr-4 text-[#096B68] hover:text-[#328E6E] transition-colors cursor-pointer"
          >
            ← Quay lại
          </motion.button>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#212121] dark:text-[#FBF6E9]">
            {currentTask?.title || "Đang tải..."}
          </h2>
        </div>
        <p className="mb-2 text-[#212121] dark:text-[#FBF6E9]">
          {currentTask?.description || "Không có mô tả"}
        </p>
        <p className="mb-2 text-[#212121] dark:text-[#FBF6E9]">
          Ngày hết hạn:{" "}
          {currentTask?.dueDate
            ? currentTask.dueDate.toDate().toLocaleDateString("vi-VN")
            : "Không có ngày hết hạn"}
        </p>
        <div className="mb-2 text-[#212121] dark:text-[#FBF6E9]">
          Thành viên: {assignedMembers.map((member) => (<img className="rounded-full size-6" src={member.avatarUrl}/>)) || "Không có thành viên"}
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          <motion.button
            {...hoverGrow}
            {...tapShrink}
            onClick={handleStart}
            disabled={isStartClicked || currentTask?.isStart}
            className="bg-[#096B68] text-[#FBF6E9] px-4 py-2 rounded-lg cursor-pointer disabled:bg-[#212121]/50 disabled:text-[#FBF6E9]/50 hover:bg-[#328E6E] transition-colors"
          >
            Bắt đầu
          </motion.button>
          <motion.button
            {...hoverGrow}
            {...tapShrink}
            onClick={handleDone}
            disabled={
              !currentTask?.isStart ||
              !itemsByTask[taskId || ""]?.every((item) => item.done) ||
              currentTask?.isDone
            }
            className="bg-[#096B68] text-[#FBF6E9] px-4 py-2 rounded-lg cursor-pointer disabled:bg-[#212121]/50 disabled:text-[#FBF6E9]/50 hover:bg-[#328E6E] transition-colors"
          >
            Hoàn thành
          </motion.button>
          <motion.button
            {...hoverGrow}
            {...tapShrink}
            onClick={handleFocusMode}
            className="bg-[#096B68] text-[#FBF6E9] px-4 py-2 rounded-lg cursor-pointer hover:bg-[#328E6E] transition-colors"
          >
            Chế độ tập trung
          </motion.button>
        </div>
        {(currentTask?.isStart === false || currentTask?.isStart) && (
          <div className="text-red-500 text-xs font-bold p-2">
            {currentTask?.isStart
              ? "*Chú ý: Chỉ có thể nhấn 'Hoàn thành' khi xong hết danh sách công việc, khi xác nhận thì không thể quay lại"
              : "*Chú ý: Khi nhấn 'Bắt đầu' mới có thể làm việc, khi xác nhận thì không thể quay lại"}
          </div>
        )}
      </motion.div>

      <div className="flex flex-col lg:flex-row flex-1 gap-4">
        {/* Checklist Items */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-[#2A2A2A] p-4 rounded-lg shadow-md flex-1 border border-[#CFFFE2]/20"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-[#212121] dark:text-[#FBF6E9]">
              Danh sách công việc
            </h3>
            <div
              className={
                !currentTask?.isStart ? "pointer-events-none opacity-50" : ""
              }
            >
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Thêm công việc mới"
                className="p-1 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E] mr-2"
                disabled={!currentTask?.isStart}
              />
              <motion.button
                {...hoverGrow}
                {...tapShrink}
                onClick={handleAddChecklistItem}
                className="bg-[#096B68] text-[#FBF6E9] px-2 py-1 rounded-lg hover:bg-[#328E6E] transition-colors cursor-pointer"
                disabled={!currentTask?.isStart}
              >
                Thêm
              </motion.button>
            </div>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={checklistItems.map((item) => item.id)}>
              <motion.ul
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {checklistItems.map((item) => (
                  <SortableChecklistItem
                    key={item.id}
                    item={item}
                    taskId={taskId || ""}
                    columnId={columnId || ""}
                    teamId={teamId || ""}
                    boardId={boardId || ""}
                  />
                ))}
              </motion.ul>
            </SortableContext>
          </DndContext>
        </motion.div>

        {/* Chat */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-[#2A2A2A] p-4 rounded-lg shadow-md flex-1 border border-[#CFFFE2]/20"
        >
          <h3 className="text-xl font-semibold text-[#212121] dark:text-[#FBF6E9] mb-4">
            Chat
          </h3>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="h-64 mb-4 border border-[#CFFFE2]/20 rounded-lg overflow-y-auto"
          >
            {chatMessages.map((message) => (
              <motion.div
                key={message.id}
                variants={staggerItem}
                className={`mb-2 p-2 rounded-lg max-w-[70%] ${
                  message.senderId === currentUserId
                    ? "bg-[#096B68] text-[#FBF6E9] ml-auto"
                    : "bg-[#CFFFE2]/30 text-[#212121] dark:text-[#FBF6E9]"
                }`}
              >
                {message.senderId !== currentUserId && (
                  <div className="w-8 h-8 bg-[#CFFFE2]/50 rounded-full inline-block mr-2"></div>
                )}
                <p>{message.text}</p>
                <small className="text-[#212121]/70 dark:text-[#FBF6E9]/70">
                  {message.createdAt.toDate().toLocaleTimeString("vi-VN")}
                </small>
              </motion.div>
            ))}
          </motion.div>
          <div className="flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn"
              className="flex-1 p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E]"
            />
            <motion.button
              {...hoverGrow}
              {...tapShrink}
              onClick={handleSendMessage}
              className="ml-2 bg-[#096B68] text-[#FBF6E9] px-4 py-2 rounded-lg hover:bg-[#328E6E] transition-colors cursor-pointer"
            >
              Gửi
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TaskPage;
