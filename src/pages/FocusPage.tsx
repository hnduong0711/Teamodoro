import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTaskStore } from "../store/taskStore";
import { updateTask } from "../services/taskService";
import { useTeamStore } from "../store/teamStore";
import { useCLIStore } from "../store/cliStore";
import {
  addChecklistItem,
  deleteChecklistItem,
  moveChecklistItem,
  subscribeToChecklistItems,
  updateChecklistItem,
} from "../services/cliService";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { ChecklistItem } from "../types/ChecklistItem";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { fadeUp, hoverGrow, tapShrink, scaleIn, staggerContainer, staggerItem } from "../utils/motionVariants";

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

  const handleToggle = () => {
    updateChecklistItem(teamId, boardId, columnId, taskId, item.id, {
      done: !item.done,
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
        onClick={() => deleteChecklistItem(teamId, boardId, columnId, taskId, item.id)}
        className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors cursor-pointer"
      >
        <X size={16} />
      </motion.button>
    </motion.li>
  );
};

const FocusMode: React.FC = () => {
  const { boardId, columnId, taskId } = useParams<{
    boardId: string;
    columnId: string;
    taskId: string;
  }>();
  const navigate = useNavigate();
  const { currentTask, updateTaskInState } = useTaskStore();
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [focusType, setFocusType] = useState("25/5");
  const [sandColor, setSandColor] = useState("#096B68");
  const audioRef = useRef<HTMLAudioElement>(null);
  const teamId = useTeamStore.getState().currentTeam?.id;
  const [newChecklistText, setNewChecklistText] = useState("");
  const { getProgressByTask } = useCLIStore();
  const { done, total, percent } = getProgressByTask(taskId!);
  const { itemsByTask, setItems } = useCLIStore();
  const checklistItems = itemsByTask[taskId!] || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    const unsubscribeChecklist = subscribeToChecklistItems(teamId!, boardId!, columnId!, taskId!);
    return () => unsubscribeChecklist();
  }, [teamId, boardId, columnId, taskId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            setIsActive(false);
            setSandColor("#212121");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft <= 0) {
      setSandColor("#212121");
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (focusType === "25/5") {
      setTimeLeft(25 * 60);
    } else if (focusType === "50/10") {
      setTimeLeft(50 * 60);
    }
    setIsActive(false);
    setSandColor("#096B68");
  }, [focusType]);

  const handleAddChecklistItem = () => {
    if (newChecklistText) {
      addChecklistItem(teamId!, boardId!, columnId!, taskId!, {
        text: newChecklistText,
        done: false,
      });
      setNewChecklistText("");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const oldIndex = itemsByTask[taskId!]?.findIndex((item) => item.id === active.id) || 0;
    const newIndex = itemsByTask[taskId!]?.findIndex((item) => item.id === over.id) || 0;
    const newItems = arrayMove(itemsByTask[taskId!] || [], oldIndex, newIndex);
    setItems(taskId!, newItems);
    await moveChecklistItem(teamId!, boardId!, columnId!, taskId!, active.id.toString(), newIndex, checklistItems);
  };

  const handleToggle = async () => {
    if (!isActive && currentTask) {
      setIsActive(true);
      setSandColor("#096B68");
      const newFocusCount = (currentTask.focusCount || 0) + 1;
      await updateTask(teamId!, boardId!, columnId!, taskId!, { focusCount: newFocusCount });
      updateTaskInState(currentTask.columnId, taskId!, { focusCount: newFocusCount });
    } else {
      setIsActive(false);
    }
  };

  const handlePlayMusic = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const totalTime = focusType === "25/5" ? 25 * 60 : 50 * 60;
  const topSandHeight = (timeLeft / totalTime) * 100;
  const bottomSandHeight = 100 - topSandHeight;

  return (
    <div className="bg-[#FDFAF6] dark:bg-[#212121] min-h-screen p-4 sm:p-6">
      {/* Task Info */}
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
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="w-full px-2 pr-8 mb-6"
      >
        <div className="pb-2 text-[#212121] dark:text-[#FBF6E9]">
          Đã hoàn thành: {done}/{total}
        </div>
        <div className="w-full relative h-5 bg-[#CFFFE2]/30 border border-[#CFFFE2] rounded-full overflow-hidden">
          <motion.div
            variants={scaleIn}
            initial="initial"
            animate="animate"
            className="absolute top-0 h-full bg-[#096B68] transition-all duration-300"
            style={{ width: `${percent}%` }}
          >
            <div
              className={`absolute ${
                done / total > 0.9 ? "transform left-1/2 -translate-x-1/2 text-[#FBF6E9]" : "right-[-30px] text-[#212121] dark:text-[#FBF6E9]"
              } text-xs font-semibold`}
            >
              {percent}%
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Checklist and Sand Clock */}
      <div className="flex flex-col lg:flex-row gap-4 py-10 px-4">
        {/* Checklist */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-[#2A2A2A] px-4 py-4 rounded-lg shadow-md flex-1 min-w-[50%] border border-[#CFFFE2]/20"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-[#212121] dark:text-[#FBF6E9]">
              Danh sách công việc
            </h3>
            <div className={!currentTask?.isStart ? "pointer-events-none opacity-50" : ""}>
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={checklistItems.map((item) => item.id)}>
              <motion.ul variants={staggerContainer} initial="hidden" animate="show" className="space-y-2">
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

        {/* Sand Clock */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center justify-center p-4 rounded-lg shadow-md w-full lg:w-auto border border-[#CFFFE2]/20"
        >
          <div className="relative w-40 h-64">
            {/* Top Frame */}
            <div className="absolute top-0 rotate-180 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[80px] border-r-[80px] border-b-[120px] border-transparent border-b-[#096B68]"></div>
            {/* Top Sand */}
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              className="absolute top-0 rotate-180 left-1/2 transform -translate-x-1/2 w-[160px] h-[120px] overflow-hidden"
              style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
            >
              <div
                className="w-full absolute bottom-0"
                style={{
                  height: `${bottomSandHeight}%`,
                  backgroundColor: sandColor,
                  transition: "height 1s linear",
                }}
              ></div>
            </motion.div>
            {/* Bottom Frame */}
            <div className="absolute bottom-0 rotate-180 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[80px] border-r-[80px] border-t-[120px] border-transparent border-t-[#212121]"></div>
            {/* Bottom Sand */}
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              className="absolute bottom-0 rotate-180 left-1/2 transform -translate-x-1/2 w-[160px] h-[120px] overflow-hidden"
              style={{ clipPath: "polygon(50% 100%, 0% 0%, 100% 0%)" }}
            >
              <div
                className="w-full absolute top-0"
                style={{
                  height: `${bottomSandHeight}%`,
                  backgroundColor: sandColor,
                  transition: "height 1s linear",
                }}
              ></div>
            </motion.div>
            {/* Center Dot */}
            <div className="absolute w-2 h-2 bg-[#096B68] rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"></div>
          </div>
          {/* Time Display */}
          <div className="text-[#212121] dark:text-[#FBF6E9] font-bold z-20 mt-4">
            {formatTime(timeLeft)}
          </div>
          <motion.button
            {...hoverGrow}
            {...tapShrink}
            onClick={handleToggle}
            className={`mt-8 px-6 py-3 rounded-lg text-[#FBF6E9] ${
              isActive ? "bg-red-500 hover:bg-red-700" : "bg-[#096B68] hover:bg-[#328E6E] cursor-pointer"
            } transition-colors`}
          >
            {isActive ? "Dừng" : "Bắt đầu"}
          </motion.button>
          {/* Controls */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className="mt-8 p-4 bg-white dark:bg-[#2A2A2A] rounded-lg shadow-md w-full flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#CFFFE2]/20"
          >
            <div className="flex items-center gap-4">
              <label className="text-[#212121] dark:text-[#FBF6E9]">
                Loại tập trung:
              </label>
              <select
                value={focusType}
                onChange={(e) => setFocusType(e.target.value)}
                className="p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E]"
              >
                <option value="25/5">25/5</option>
                <option value="50/10">50/10</option>
              </select>
            </div>
            <motion.button
              {...hoverGrow}
              {...tapShrink}
              onClick={handlePlayMusic}
              className="px-4 py-2 bg-[#096B68] text-[#FBF6E9] rounded-lg hover:bg-[#328E6E] transition-colors cursor-pointer"
            >
              Phát nhạc
            </motion.button>
            <audio ref={audioRef} src="path/to/your/music.mp3" loop autoPlay={false}></audio>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default FocusMode;