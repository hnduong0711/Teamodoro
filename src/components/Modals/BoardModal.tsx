import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Save } from "lucide-react";
import {
  addBoard,
  deleteBoard,
  updateBoard,
} from "../../services/boardService";
import { useAuth } from "../../hooks/useAuth";
import type { Board } from "../../types/Board";
import type { User } from "../../types/User";
import { fetchUsersByIds } from "../../services/userService";
import { useTeamStore } from "../../store/teamStore";

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  board?: Board;
  onAddMemberToBoard: (
    boardId: string,
    email: string
  ) => Promise<{ success: boolean; userId: string }>;
  onRemoveMemberFromBoard: (boardId: string, email: string) => void;
}

const BoardModal: React.FC<BoardModalProps> = ({
  isOpen,
  onClose,
  teamId,
  board,
  onAddMemberToBoard,
  onRemoveMemberFromBoard,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState(board?.name || "");
  const [isPublic, setIsPublic] = useState(board?.isPublic ?? true);
  const [newMember, setNewMember] = useState("");
  const [members, setMembers] = useState<string[]>(board?.members || []);
  const [membersData, setMembersData] = useState<User[]>([]);
  const [createdBoardId, setCreatedBoardId] = useState<string | null>(null);
  useEffect(() => {
    setName(board?.name || "");
    setIsPublic(board?.isPublic ?? true);
    setMembers(board?.members || []);
  }, [board]);

  useEffect(() => {
    const createBoardIfNeeded = async () => {
      if (isOpen && !board && !createdBoardId && user?.uid) {
        const boardData = {
          name: "Untitled board",
          isPublic: true,
          members: [],
          createdBy: user.uid,
        };
        const id = await addBoard(teamId, boardData, user.uid);
        setCreatedBoardId(id);
        console.log("chạy if nè");
        
      }
    };
    createBoardIfNeeded();
  }, [isOpen, board, createdBoardId, user]);

  useEffect(() => {
    const fetchUserData = async () => {
      const membersData = await fetchUsersByIds(members);
      setMembersData(membersData);
    };
    fetchUserData();
  }, [members]);

  const handleSave = async () => {
    console.log(useTeamStore.getState().currentTeam);

    if (!user?.uid || !teamId) return;
    const memberSaved = isPublic
      ? useTeamStore.getState().currentTeam?.members
      : [];
    const boardData = {
      name,
      isPublic,
      members: memberSaved,
      createdBy: user.uid,
    };
    if (board) {
      await updateBoard(teamId, board.id, boardData);
    } else if (createdBoardId) {
      await updateBoard(teamId, createdBoardId, boardData);
    }
    setNewMember("");
    onClose();
  };

  const handleCancel = async () => {
    if (!board && createdBoardId) {
      await deleteBoard(teamId, createdBoardId);
    }
    setNewMember("");
    onClose();
  };

  const handleAddMember = async () => {
    if (newMember && !members.includes(newMember)) {
      try {
        const boardIdToUse = board?.id || createdBoardId;
        if (boardIdToUse) {
          console.log("có id nè");
          
          const result = await onAddMemberToBoard(boardIdToUse, newMember);
          if (result.success) {
            setMembers([...members, result.userId]);
            setNewMember("");
          }
        }
      } catch (error: any) {
        alert(error.message);
      }
    } else {
      alert("Người dùng đã có trong bảng !");
    }
  };

  const handleRemoveMember = (userId: string) => {
    setMembers(members.filter((m) => m !== userId));
    const boardIdToUse = board?.id || createdBoardId;
    if (boardIdToUse) onRemoveMemberFromBoard(boardIdToUse, userId);
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
              <h2 className="text-xl font-bold">
                {board ? "Sửa Board" : "Thêm Board"}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-200 mb-2">
                Tên Board
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-200 mb-2">
                Trạng thái
              </label>
              <div className="flex space-x-4">
                <label>
                  <input
                    type="radio"
                    checked={isPublic}
                    onChange={() => setIsPublic(true)}
                  />{" "}
                  Public
                </label>
                <label>
                  <input
                    type="radio"
                    checked={!isPublic}
                    onChange={() => setIsPublic(false)}
                  />{" "}
                  Private
                </label>
              </div>
            </div>
            {!isPublic && (
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 mb-2">
                  Thêm Thành viên
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Nhập email"
                  />
                  <button
                    onClick={handleAddMember}
                    className="bg-blue-600 text-white p-2 rounded-lg"
                  >
                    <UserPlus size={18} />
                  </button>
                </div>
                <ul className="list-disc pl-5">
                  {membersData.map((member) => (
                    <li key={member.id} className="flex justify-between">
                      {member.displayName}
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="bg-gray-500 text-white p-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-green-600 text-white p-2 rounded-lg"
              >
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
