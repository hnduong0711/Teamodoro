import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit2, Trash2, GripVertical } from "lucide-react";
import { NavLink } from "react-router-dom";

interface TaskItemProps {
  id: string;
  title: string;
  boardId: string;
  columnId: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  id,
  title,
  boardId,
  columnId,
  onEdit,
  onDelete,
}) => {
  const sortableId = `task-${id}-${columnId}`;
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: sortableId });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex space-x-4 items-center bg-white p-2 mb-2 rounded shadow">
        <GripVertical
          {...attributes}
          {...listeners}
          className="cursor-move mr-2 text-gray-400"
        />
        <NavLink
          to={`/board/${boardId}/column/${columnId}/task/${id}`}
          className="p-2 flex flex-1 justify-between items-center"
        >
          <div className="text-blue-600 hover:underline">{title}</div>
          <div className="space-x-2">
            <button
              onClick={() => onEdit(id)}
              className="text-blue-500 cursor-pointer"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => onDelete(id)}
              className="text-red-500 cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </NavLink>
      </div>
    </div>
  );
};

export default TaskItem;
