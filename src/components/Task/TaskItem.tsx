import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, Trash2 } from 'lucide-react';
import { NavLink, useParams } from 'react-router-dom';

interface TaskItemProps {
  id: string;
  title: string;
  columnId: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ id, title, columnId, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-2 mb-2 rounded shadow flex justify-between items-center cursor-move">
      <NavLink to={`/boards/${useParams<{ boardId?: string }>().boardId}/columns/${columnId}/tasks/${id}`} className="text-blue-600 hover:underline">
        {title}
      </NavLink>
      <div className="space-x-2">
        <button onClick={() => onEdit(id)} className="text-blue-500"><Edit2 size={16} /></button>
        <button onClick={() => onDelete(id)} className="text-red-500"><Trash2 size={16} /></button>
      </div>
    </div>
  );
};

export default TaskItem;