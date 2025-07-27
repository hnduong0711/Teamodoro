import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { addChatMessage, subscribeToChatMessages } from "../services/chatService";
import { useAuth } from "../hooks/useAuth";
import { useChatStore } from "../store/chatStore";
import { Timestamp } from "firebase/firestore";

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
  const { messagesByTask, setMessages } = useChatStore();
  const {user} = useAuth();

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
      const unsubscribeMessages = subscribeToChatMessages(teamId, boardId, columnId, taskId);
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

  const handleStart = () => {
    if (!isStartClicked && currentTask && !currentTask.isStart) {
      updateTask(teamId!, boardId!, columnId!, taskId!, { isStart: true, startDate: Timestamp.now(),});
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

  const [newChecklistText, setNewChecklistText] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );
  const checklistItems = itemsByTask[taskId || ""] || [];

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

  const chatMessages = messagesByTask[taskId || ""] || [];
  const currentUserId = user?.uid;
  const handleSendMessage = () => {
    if (teamId && boardId && columnId && taskId && newMessage && user?.uid) {
      addChatMessage(teamId, boardId, columnId, taskId, user.uid, newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4">
      {/* Zone 1: Task Information */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)} className="mr-4 text-blue-500">
            ← Back
          </button>
          <h2 className="text-2xl font-bold">
            {currentTask?.title || "Loading..."}
          </h2>
        </div>
        <p className="mb-2">{currentTask?.description || "No description"}</p>
        <p className="mb-2">
          Due Date:{" "}
          {currentTask?.dueDate
            ? currentTask.dueDate.toDate().toLocaleDateString("vi-VN")
            : "No due date"}
        </p>
        <div className="mb-2">
          Members:{" "}
          {currentTask?.assignedTo?.length
            ? currentTask.assignedTo.join(", ")
            : "No members"}
        </div>
        <div className="flex space-x-4 mt-4">
          <button
            onClick={handleStart}
            disabled={isStartClicked || currentTask?.isStart}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            Bắt đầu
          </button>
          <button
            onClick={handleDone}
            disabled={
              !currentTask?.isStart ||
              !itemsByTask[taskId || ""]?.every((item) => item.done) ||
              currentTask?.isDone
            }
            className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            Hoàn thành
          </button>
          <button
            onClick={handleFocusMode}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            Focus Mode
          </button>
        </div>
        {!currentTask?.isStart && (
          <div className="text-red-500 text-xs font-bold p-2">
            *Chú ý: Khi nhấn "Bắt đầu" mới có thể làm việc, khi xác nhận thì
            không thể quay lại
          </div>
        )}
        {currentTask?.isStart && (
          <div className="text-red-500 text-xs font-bold p-2">
            *Chú ý: Chỉ có thể nhấn "Hoàn thành" khi xong hết danh sách công
            việc, khi xác nhận thì không thể quay lại
          </div>
        )}
      </div>

      <div className="flex flex-1 space-x-4">
        {/* Checklist Items */}
        <div className="bg-white p-4 rounded-lg shadow flex-1 max-w-[50%]">
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

        {/* Chat */}
        <div className="bg-white p-4 rounded-lg shadow flex-1 max-w-[50%]">
          <h3 className="text-xl font-semibold mb-4">Chat</h3>
          <div className="h-64 mb-4 border rounded overflow-y-auto">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`mb-2 p-2 rounded-lg max-w-[70%] ${
                  message.senderId === currentUserId
                    ? "bg-blue-100 ml-auto"
                    : "bg-gray-100"
                }`}
              >
                {/* Placeholder for avatar */}
                {message.senderId !== currentUserId && <div className="w-8 h-8 bg-gray-300 rounded-full inline-block mr-2"></div>}
                <p>{message.text}</p>
                <small className="text-gray-500">
                  {message.createdAt.toDate().toLocaleTimeString()}
                </small>
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message"
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={handleSendMessage}
              className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPage;
