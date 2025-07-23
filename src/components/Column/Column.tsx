import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";
import { useColumnStore } from "../../store/columnStore";
import { useBoardStore } from "../../store/boardStore";
import { useTeamStore } from "../../store/teamStore";

interface ColumnProps {
  id: string;
  column: any;
  onEdit: (id: string, teamId: string, boardId: string, name: string) => void;
  onDelete: (id: string) => void;
}

const Column: React.FC<ColumnProps> = ({ id, column, onEdit, onDelete }) => {
  const { listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const { currentBoard } = useBoardStore();
  const { currentTeam } = useTeamStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(column.name);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    if (currentBoard?.id && currentTeam?.id) {
      onEdit(id, currentTeam?.id, currentBoard.id, name);
      useColumnStore.getState().updateColumn(id, { name });
      setIsEditing(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <div className="mt-2">
          <img
            src={"https://via.placeholder.com/30"}
            alt="User"
            className="w-6 h-6 rounded-full"
          />
        </div>
        <button onClick={handleDelete} className="text-red-500">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex flex-col space-y-8">
        {isEditing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            onKeyPress={(e) => e.key === "Enter" && handleSave()}
            autoFocus
            className="w-full p-1 border rounded"
          />
        ) : (
          <div onClick={handleEdit} className="cursor-text">
            {name}
          </div>
        )}
      </div>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        className="bg-gray-200 p-4 rounded-lg mb-4 flex flex-col space-y-4"
      >
        {/* {Task list here} */}
        <div
          className="mt-4 cursor-pointer bg-blue-100 p-2 rounded"
          onClick={() => alert("Task modal will be implemented later")}
        >
          + Add Task
        </div>
      </div>
    </div>
  );
};

export default Column;
