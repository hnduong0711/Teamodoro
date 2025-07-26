import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTaskStore } from "../store/taskStore";
import { fetchTask, updateTask } from "../services/taskService";
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
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center mb-2 max-w-full"
    >
      <GripVertical
        {...attributes}
        {...listeners}
        className="cursor-move mr-2 text-gray-400"
      />
      <input
        type="checkbox"
        checked={item.done}
        onChange={handleToggle}
        className="mr-2"
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
          className="flex-1 p-1 border rounded"
          disabled={!currentTask?.isStart}
        />
      ) : (
        <span onClick={() => setIsEditing(true)} className="flex-1 cursor-text">
          {item.text}
        </span>
      )}
      <button
        disabled={!currentTask?.isStart}
        onClick={() =>
          deleteChecklistItem(teamId, boardId, columnId, taskId, item.id)
        }
        className="ml-2 text-red-500"
      >
        <X size={16} />
      </button>
    </li>
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
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25 minutes in seconds
  const [focusType, setFocusType] = useState("25/5"); // Default focus type
  const [sandColor, setSandColor] = useState("green");
  const audioRef = useRef<HTMLAudioElement>(null);
  const teamId = useTeamStore.getState().currentTeam?.id;
  const [newChecklistText, setNewChecklistText] = useState("");

  // progress state
  const { getProgressByTask } = useCLIStore();
  const { done, total, percent } = getProgressByTask(taskId!);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            setIsActive(false);
            setSandColor("gray");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft <= 0) {
      setSandColor("gray");
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  useEffect(() => {
    const unsubscribeChecklist = subscribeToChecklistItems(
      teamId!,
      boardId!,
      columnId!,
      taskId!
    );
    return () => {
      unsubscribeChecklist();
    };
  }, []);

  useEffect(() => {
    if (focusType === "25/5") {
      setTimeLeft(25 * 60);
    } else if (focusType === "50/10") {
      setTimeLeft(50 * 60);
    }
    setIsActive(false);
    setSandColor("green");
  }, [focusType]);

  // check list
  const { itemsByTask, setItems } = useCLIStore();
  const checklistItems = itemsByTask[taskId!] || [];
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

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

    const oldIndex =
      itemsByTask[taskId!]?.findIndex((item) => item.id === active.id) || 0;
    const newIndex =
      itemsByTask[taskId!]?.findIndex((item) => item.id === over.id) || 0;
    const newItems = arrayMove(itemsByTask[taskId!] || [], oldIndex, newIndex);
    setItems(taskId!, newItems);
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

  const handleToggle = async () => {
    console.log(currentTask);
    console.log(isActive);
    if (!isActive && currentTask) {
      setIsActive(true);
      setSandColor("green");
      const newFocusCount = (currentTask.focusCount || 0) + 1;
      await updateTask(teamId!, boardId!, columnId!, taskId!, {
        focusCount: newFocusCount,
      });
      updateTaskInState(currentTask.columnId, taskId!, {
        focusCount: newFocusCount,
      });
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
  const topSandHeight = (timeLeft / totalTime) * 100; // % cát còn lại ở trên
  const bottomSandHeight = 100 - topSandHeight; // % cát ở dưới

  return (
    <div className="">
      {/* info */}
      <div className="">
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="flex items-center mb-4">
            <button onClick={() => navigate(-1)} className="mr-4 text-blue-500">
              ← Back
            </button>
            <h2 className="text-2xl font-bold">
              {currentTask?.title || "Loading..."}
            </h2>
          </div>
        </div>
      </div>
      {/* progress bar */}
      <div className="w-full px-2 pr-8">
        <div className="pb-2 ">Đã hoàn thành: {done}/{total}</div>
        <div className="w-full relative h-5 bg-gray-200 border-slate-400 border rounded-full overflow-hidden">
          <div
            className="absolute top-0 h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${percent}%` }}
          >
            <div className={`absolute  ${done/total>0.9 ? "transform left-1/2 translate-x-[-1/2] text-white" : "right-[-30px]"} text-xs text-black font-semibold`}>
            {percent}%
          </div>
          </div>
          
        </div>
      </div>
      {/* check list and sand clock */}
      <div className="flex space-x-4 h-fit py-10 px-4">
        {/* check list */}
        <div className="bg-white px-4 py-4 rounded-lg shadow flex-1 min-w-[50%]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Danh sách công việc</h3>
            <div
              className={
                !currentTask?.isStart ? "pointer-events-none opacity-50" : ""
              }
            >
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="New checklist item"
                className="p-1 border rounded mr-2"
                disabled={!currentTask?.isStart}
              />
              <button
                onClick={handleAddChecklistItem}
                className="bg-blue-500 text-white px-2 py-1 rounded"
                disabled={!currentTask?.isStart}
              >
                Add
              </button>
            </div>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={checklistItems.map((item) => item.id)}>
              <ul className="space-y-2">
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
              </ul>
            </SortableContext>
          </DndContext>
        </div>
        {/* sand clock */}
        <div className="flex flex-col items-center justify-center h-fit w-full p-4 rounded-lg shadow">
          <div className="relative w-40 h-64">
            {/* khung trên */}
            <div className="absolute top-0 rotate-180 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[80px] border-r-[80px] border-b-[120px] border-transparent border-b-green-500"></div>

            {/* cát trên */}
            <div
              className="absolute top-0 rotate-180 left-1/2 transform -translate-x-1/2 w-[160px] h-[120px] overflow-hidden"
              style={{
                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
              }}
            >
              <div
                className="w-full bg-gray-300 absolute bottom-0"
                style={{
                  height: `${bottomSandHeight}%`,
                  transition: "height 1s linear",
                }}
              ></div>
            </div>

            {/* khung dưới */}
            <div className="absolute bottom-0 rotate-180 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[80px] border-r-[80px] border-t-[120px] border-transparent border-t-gray-300"></div>

            {/* cát dưới */}
            <div
              className="absolute bottom-0 rotate-180 left-1/2 transform -translate-x-1/2 w-[160px] h-[120px] overflow-hidden"
              style={{
                clipPath: "polygon(50% 100%, 0% 0%, 100% 0%)",
              }}
            >
              <div
                className="w-full bg-green-500 absolute top-0"
                style={{
                  height: `${bottomSandHeight}%`,
                  transition: "height 1s linear",
                }}
              ></div>
            </div>

            {/* nút giao */}
            <div className="absolute w-2 h-2 bg-green-500 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"></div>
          </div>
          {/* thời gian */}
          <div className="text-black font-bold z-20">
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={handleToggle}
            className={`mt-8 px-6 py-3 rounded-lg text-white ${
              isActive ? "bg-red-500" : "bg-green-500"
            }`}
          >
            {isActive ? "Stop" : "Start"}
          </button>

          {/* vùng điều khiển */}
          <div className="mt-8 p-4 bg-white rounded-lg shadow w-full flex items-center justify-evenly">
              <div className="flex space-x-4 items-center">
                <label>Focus Type:</label>
                <select
                  value={focusType}
                  onChange={(e) => setFocusType(e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="25/5">25/5</option>
                  <option value="50/10">50/10</option>
                </select>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handlePlayMusic}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Play Music
                </button>
                <audio
                  ref={audioRef}
                  src="path/to/your/music.mp3"
                  loop
                  autoPlay={false}
                ></audio>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusMode;
