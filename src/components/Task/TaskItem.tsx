import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit2, Trash2, GripVertical } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useCLIStore } from "../../store/cliStore";

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
  const { getProgressByTask } = useCLIStore();
  const { done, total, percent } = getProgressByTask(id);

  console.log(done, total, percent);

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex space-x-2 items-center bg-white p-2 mb-2 rounded shadow">
        {/* move button */}
        <GripVertical
          {...attributes}
          {...listeners}
          className="cursor-move mr-2 text-gray-400"
        />

        <NavLink
          to={`/board/${boardId}/column/${columnId}/task/${id}`}
          className="flex flex-col space-y-2 items-center flex-1"
        >
          <div className="text-blue-600 hover:underline">{title}</div>
          {/* progress bar */}
          <div className="w-full px-2">
            <div className="w-full relative h-4 bg-gray-200 border-slate-400 border rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
              <div className="absolute inset-0 flex justify-center items-center text-xs text-black font-semibold">
                {percent}%
              </div>
            </div>
          </div>
        </NavLink>

        {/* control button */}
        <div className="space-x-2 flex flex-col space-y-4">
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
      </div>
    </div>
  );
};

export default TaskItem;
