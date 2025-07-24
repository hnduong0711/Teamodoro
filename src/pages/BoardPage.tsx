import { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import Column from '../components/Column/Column';
import { useColumnStore } from '../store/columnStore';
import { useBoardStore } from '../store/boardStore';
import { useAuth } from '../hooks/useAuth';
import { fetchColumns, subscribeToColumns, addColumn, deleteColumn, reorderColumns, updateColumn } from '../services/columnService';
import { useTeamStore } from '../store/teamStore';

const BoardPage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const { user } = useAuth();
  const { currentBoard } = useBoardStore();
  const { columns } = useColumnStore();
  const [newColumnName, setNewColumnName] = useState('');
  const {currentTeam} = useTeamStore();

  useEffect(() => {
    if (currentBoard?.id && currentTeam?.id && user?.uid) {
      fetchColumns(currentTeam?.id, currentBoard.id);
      const unsubscribe = subscribeToColumns(currentTeam?.id, currentBoard.id);
      return () => unsubscribe();
    }
  }, [currentBoard?.id, currentBoard?.id, user?.uid]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id && currentBoard?.id && currentTeam?.id) {
      reorderColumns(currentTeam?.id, currentBoard.id, active.id, over.id);
    }
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
    if (currentBoard?.id && currentTeam?.id && window.confirm('Are you sure you want to delete this column?')) {
      deleteColumn(currentTeam?.id, currentBoard.id, columnId);
    }
  };

    const handleEditColumn = (columnId: string, teamId: string, boardId: string, name: string) => {
    if (currentBoard?.id && currentTeam?.id) {
      const column = useColumnStore.getState().columns.find((c) => c.id === columnId);
      if (column) {
        updateColumn(teamId, boardId, columnId, {name});
      }
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Menu</h2>
        <nav>
          <NavLink
            to={`/boards/${boardId}`}
            className={({ isActive }) => `block py-2 px-4 rounded ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
          >
            Bảng
          </NavLink>
          <NavLink
            to={`/board/${boardId}/weekly`}
            className={({ isActive }) => `block py-2 px-4 rounded ${isActive ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
          >
            Lịch
          </NavLink>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-4">{currentBoard?.name || 'Board'}</h1>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={columns.map((c) => c.id)}>
            <div className="flex space-x-4">
              {columns.map((column) => (
                <Column
                  key={column.id}
                  id={column.id}
                  column={column}
                  onEdit={handleEditColumn}
                  onDelete={handleDeleteColumn}
                  
                />
              ))}
              <div className="bg-gray-100 p-4 rounded-lg min-w-[250px] flex items-center justify-center">
                <input
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddColumn()}
                  placeholder="Enter column name"
                  className="w-full p-1 border rounded"
                />
              </div>
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default BoardPage;