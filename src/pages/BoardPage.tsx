import { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import Column from '../components/Column/Column';
import { useColumnStore } from '../store/columnStore';
import { useBoardStore } from '../store/boardStore';
import { useAuth } from '../hooks/useAuth';
import { fetchColumns, subscribeToColumns, addColumn, deleteColumn, updateColumn, reorderColumnsInFirestore } from '../services/columnService';
import { useTeamStore } from '../store/teamStore';
import { fadeUp, staggerContainer } from '../utils/motionVariants';

const BoardPage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { user } = useAuth();
  const { currentBoard } = useBoardStore();
  const { columns } = useColumnStore();
  const [newColumnName, setNewColumnName] = useState('');
  const { currentTeam } = useTeamStore();

  useEffect(() => {
    if (currentBoard?.id && currentTeam?.id && user?.uid) {
      fetchColumns(currentTeam?.id, currentBoard.id);
      const unsubscribe = subscribeToColumns(currentTeam?.id, currentBoard.id);
      return () => unsubscribe();
    }
  }, [currentBoard?.id, currentTeam?.id, user?.uid]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!active || !over || active.id === over.id) return;
  if (!currentTeam?.id || !currentBoard?.id) return;

  // lấy column hiện tại từ store
  const currentColumns = useColumnStore.getState().columns;
  const oldIndex = currentColumns.findIndex(col => col.id === active.id);
  const newIndex = currentColumns.findIndex(col => col.id === over.id);
  if (oldIndex === -1 || newIndex === -1) return;

  // cập nhật UI ngay
  const newColumns = arrayMove(currentColumns, oldIndex, newIndex).map((col, index) => ({
    ...col,
    position: index,
  }));
  useColumnStore.getState().setColumns(newColumns);

  reorderColumnsInFirestore(currentTeam.id, currentBoard.id, newColumns);
};


  const handleAddColumn = () => {
    if (newColumnName && currentBoard?.id && currentTeam?.id && user) {
      addColumn(currentTeam?.id, currentBoard.id, {
        name: newColumnName,
        createdBy: user.uid,
      });
      setNewColumnName('');
    }
  };

  const handleDeleteColumn = (columnId: string) => {
    if (currentBoard?.id && currentTeam?.id && window.confirm('Bạn có chắc muốn xóa cột này?')) {
      deleteColumn(currentTeam?.id, currentBoard.id, columnId);
    }
  };

  const handleEditColumn = (columnId: string, teamId: string, boardId: string, name: string) => {
    if (currentBoard?.id && currentTeam?.id) {
      const column = useColumnStore.getState().columns.find((c) => c.id === columnId);
      if (column) {
        updateColumn(teamId, boardId, columnId, { name });
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFAF6] dark:bg-[#212121]">
      {/* Sidebar */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="w-64 bg-[#096B68] text-[#FBF6E9] p-4 flex-shrink-0"
      >
        <motion.h2
          variants={fadeUp}
          className="text-xl font-bold mb-4"
        >
          Menu
        </motion.h2>
        <nav className="space-y-2">
          <NavLink
            to={`/boards/${boardId}`}
            className={({ isActive }) =>
              `block py-2 px-4 rounded transition-colors ${isActive ? 'bg-[#328E6E]' : 'hover:bg-[#328E6E]'}`
            }
          >
            Bảng
          </NavLink>
          <NavLink
            to={`/board/${boardId}/weekly`}
            className={({ isActive }) =>
              `block py-2 px-4 rounded transition-colors ${isActive ? 'bg-[#328E6E]' : 'hover:bg-[#328E6E]'}`
            }
          >
            Lịch
          </NavLink>
        </nav>
      </motion.div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        <motion.h1
          variants={fadeUp}
          initial="initial"
          animate="animate"
          className="text-2xl sm:text-3xl font-bold text-[#212121] dark:text-[#FBF6E9] mb-6"
        >
          {currentBoard?.name || 'Board'}
        </motion.h1>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={columns.map((c) => c.id)}>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="flex flex-col sm:flex-row gap-4 overflow-x-auto pb-4"
            >
              {columns.map((column) => (
                <Column
                  key={column.id}
                  id={column.id}
                  column={column}
                  onEdit={handleEditColumn}
                  onDelete={handleDeleteColumn}
                />
              ))}
              <motion.div
                variants={fadeUp}
                className="bg-[#CFFFE2]/20 p-4 rounded-lg min-w-[250px] h-[80px] flex items-center justify-center border border-[#328E6E]/30"
              >
                <input
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddColumn()}
                  placeholder="Nhập tên cột"
                  className="w-full p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E]"
                />
              </motion.div>
            </motion.div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default BoardPage;