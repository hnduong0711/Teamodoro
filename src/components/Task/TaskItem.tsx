import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit2, Trash2, GripVertical } from "lucide-react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useCLIStore } from "../../store/cliStore";
import {
  fadeUp,
  hoverGrow,
  tapShrink,
  scaleIn,
} from "../../utils/motionVariants";

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
  const { percent } = getProgressByTask(id);

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-[#2A2A2A] p-2 mb-2 rounded-lg shadow-md border border-[#CFFFE2]/20"
      >
        <div className="flex items-center space-x-2">
          {/* move button */}
          <GripVertical
            {...attributes}
            {...listeners}
            className="cursor-move text-[#212121] dark:text-[#FBF6E9] opacity-50 hover:opacity-100 transition-opacity"
          />

          {/* task content */}
          <NavLink
            to={`/board/${boardId}/column/${columnId}/task/${id}`}
            className="flex flex-col flex-1 gap-2"
          >
            <div className="text-[#212121] dark:text-[#FBF6E9] hover:text-[#328E6E] transition-colors font-medium">
              {title}
            </div>
            {/* progress bar */}
            <div className="w-full px-2">
              <div className="w-full relative h-4 bg-[#CFFFE2]/30 border border-[#CFFFE2] rounded-full overflow-hidden">
                <motion.div
                  variants={scaleIn}
                  initial="initial"
                  animate="animate"
                  className="absolute top-0 left-0 h-full bg-[#096B68] transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
                <div className="absolute inset-0 flex justify-center items-center text-xs text-[#212121] dark:text-[#FBF6E9] font-semibold">
                  {percent}%
                </div>
              </div>
            </div>
          </NavLink>

          {/* control buttons */}
          <div className="flex flex-col gap-2">
            <motion.button
              {...hoverGrow}
              {...tapShrink}
              onClick={() => onEdit(id)}
              className="text-[#096B68] hover:text-[#328E6E] transition-colors cursor-pointer"
            >
              <Edit2 size={16} />
            </motion.button>
            <motion.button
              {...hoverGrow}
              {...tapShrink}
              onClick={() => onDelete(id)}
              className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
            >
              <Trash2 size={16} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TaskItem;
