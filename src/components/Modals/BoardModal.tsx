import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Save } from 'lucide-react';
import { addBoard, updateBoard } from '../../services/boardService';
import { useAuth } from '../../hooks/useAuth';
import type { Board } from '../../types/Board';

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  board?: Board;
  onAddMemberToBoard: (boardId: string, email: string) => void;
  onRemoveMemberFromBoard: (boardId: string, email: string) => void;
}

const BoardModal: React.FC<BoardModalProps> = ({ isOpen, onClose, teamId, board, onAddMemberToBoard, onRemoveMemberFromBoard }) => {
  const { user } = useAuth();
//   const { addBoard, updateBoard } = useBoardStore();
  const [name, setName] = useState(board?.name || '');
  const [isPublic, setIsPublic] = useState(board?.isPublic ?? true);
  const [newMember, setNewMember] = useState('');
  const [members, setMembers] = useState<string[]>(board?.members || []);

  useEffect(() => {
    setName(board?.name || '');
    setIsPublic(board?.isPublic ?? true);
    setMembers(board?.members || []);
    console.log(board?.isPublic);
    
  }, [board]);

  const handleSave = async () => {
    if (!user?.uid || !teamId) return;
    const boardData = { name, isPublic, members, createdBy: user.uid };
    if (board) {
      await updateBoard(teamId, board.id, boardData);
    } else {
      await addBoard(teamId, boardData, user.uid);
    }
    onClose();
  };

  const handleAddMember = () => {
    if (newMember && !members.includes(newMember)) {
      setMembers([...members, newMember]);
      setNewMember('');
      if (board?.id) onAddMemberToBoard(board.id, newMember);
    }
  };

  const handleRemoveMember = (email: string) => {
    setMembers(members.filter((m) => m !== email));
    if (board?.id) onRemoveMemberFromBoard(board.id, email);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{board ? 'Sửa Board' : 'Thêm Board'}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-200 mb-2">Tên Board</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-200 mb-2">Trạng thái</label>
              <div className="flex space-x-4">
                <label>
                  <input
                    type="radio"
                    checked={isPublic}
                    onChange={() => setIsPublic(true)}
                  /> Public
                </label>
                <label>
                  <input
                    type="radio"
                    checked={!isPublic}
                    onChange={() => setIsPublic(false)}
                  /> Private
                </label>
              </div>
            </div>
            {!isPublic && (
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 mb-2">Thêm Thành viên</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Nhập email"
                  />
                  <button onClick={handleAddMember} className="bg-blue-600 text-white p-2 rounded-lg">
                    <UserPlus size={18} />
                  </button>
                </div>
                <ul className="list-disc pl-5">
                  {members.map((member) => (
                    <li key={member} className="flex justify-between">
                      {member}
                      <button onClick={() => handleRemoveMember(member)} className="text-red-500 hover:text-red-700">
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="bg-gray-500 text-white p-2 rounded-lg">
                Cancel
              </button>
              <button onClick={handleSave} className="bg-green-600 text-white p-2 rounded-lg">
                <Save size={18} /> Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BoardModal;