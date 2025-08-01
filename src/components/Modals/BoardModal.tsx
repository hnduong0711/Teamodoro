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
import { fade, slideFromBottom, hoverGrow, tapShrink } from "../../utils/motionVariants";

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
      }
    };
    createBoardIfNeeded();
  }, [isOpen, board, createdBoardId, user, teamId]);

  useEffect(() => {
    const fetchUserData = async () => {
      const membersData = await fetchUsersByIds(members);
      setMembersData(membersData);
    };
    fetchUserData();
  }, [members]);

  const handleSave = async () => {
    if (!user?.uid || !teamId) return;
    const memberSaved = isPublic
      ? useTeamStore.getState().currentTeam?.members
      : members;
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
      alert("Người dùng đã có trong bảng!");
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
          variants={fade}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 bg-[#212121]/50 flex items-center justify-center z-50"
        >
          <motion.div
            variants={slideFromBottom}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-[#FDFAF6] dark:bg-[#2A2A2A] p-6 rounded-lg shadow-lg w-full max-w-md mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#212121] dark:text-[#FBF6E9]">
                {board ? "Sửa Board" : "Thêm Board"}
              </h2>
              <motion.button
                {...hoverGrow}
                {...tapShrink}
                onClick={onClose}
                className="text-[#212121] dark:text-[#FBF6E9] hover:text-[#328E6E] cursor-pointer"
              >
                <X size={24} />
              </motion.button>
            </div>
            <div className="mb-4">
              <label className="block text-[#212121] dark:text-[#FBF6E9] mb-2 font-medium">
                Tên Board
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-[#212121] dark:text-[#FBF6E9] mb-2 font-medium">
                Trạng thái
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-[#212121] dark:text-[#FBF6E9]">
                  <input
                    type="radio"
                    checked={isPublic}
                    onChange={() => setIsPublic(true)}
                    className="accent-[#096B68]"
                  />
                  Public
                </label>
                <label className="flex items-center gap-2 text-[#212121] dark:text-[#FBF6E9]">
                  <input
                    type="radio"
                    checked={!isPublic}
                    onChange={() => setIsPublic(false)}
                    className="accent-[#096B68]"
                  />
                  Private
                </label>
              </div>
            </div>
            {!isPublic && (
              <div className="mb-4">
                <label className="block text-[#212121] dark:text-[#FBF6E9] mb-2 font-medium">
                  Thêm Thành viên
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="email"
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                    className="w-full p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E]"
                    placeholder="Nhập email"
                  />
                  <motion.button
                    {...hoverGrow}
                    {...tapShrink}
                    onClick={handleAddMember}
                    className="bg-[#096B68] text-[#FBF6E9] p-2 rounded-lg hover:bg-[#328E6E] transition-colors cursor-pointer"
                  >
                    <UserPlus size={18} />
                  </motion.button>
                </div>
                <ul className="space-y-2">
                  {membersData.map((member) => (
                    <li
                      key={member.id}
                      className="flex justify-between items-center text-[#212121] dark:text-[#FBF6E9]"
                    >
                      {member.displayName}
                      <motion.button
                        {...hoverGrow}
                        {...tapShrink}
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <X size={16} />
                      </motion.button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <motion.button
                {...hoverGrow}
                {...tapShrink}
                onClick={handleCancel}
                className="bg-[#212121] text-[#FBF6E9] px-4 py-2 rounded-lg hover:bg-[#328E6E] transition-colors cursor-pointer"
              >
                Hủy
              </motion.button>
              <motion.button
                {...hoverGrow}
                {...tapShrink}
                onClick={handleSave}
                className="bg-[#096B68] text-[#FBF6E9] px-4 py-2 rounded-lg hover:bg-[#328E6E] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save size={18} /> Lưu
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BoardModal;