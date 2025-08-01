import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useTeamStore } from '../store/teamStore';
import { useBoardStore } from '../store/boardStore';
import { fetchBoards, subscribeToBoards, deleteBoard, addMemberToBoard, removeMemberFromBoard } from '../services/boardService';
import { useAuth } from '../hooks/useAuth';
import { addMemberToTeam, removeMemberFromTeam } from '../services/teamService';
import { NavLink } from 'react-router-dom';
import BoardModal from '../components/Modals/BoardModal';
import type { Board } from '../types/Board';
import { fetchUserById, fetchUsersByIds } from '../services/userService';
import type { User } from '../types/User';
import { fadeUp, hoverGrow, tapShrink, staggerContainer, staggerItem } from '../utils/motionVariants';

const TeamPage = () => {
  const currentTeam = useTeamStore((s) => s.currentTeam);
  const { boards, setCurrentBoard } = useBoardStore();
  const { user, loading } = useAuth();
  const [newMember, setNewMember] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<string | null>(null);
  const [leaderName, setLeaderName] = useState("");
  const [membersData, setMembersData] = useState<User[]>([]);

  const members = currentTeam?.members || [];
  useEffect(() => {
    if (!loading && currentTeam?.id && user?.email && user?.uid) {
      fetchBoards(currentTeam.id, user.email, user.uid);
      const unsubscribe = subscribeToBoards(currentTeam.id, user.email, user.uid);
      return () => unsubscribe();
    }
  }, [currentTeam?.id, user?.email, user?.uid, loading]);

  const memberList = useMemo(() => Object.keys(members).sort(), [members]);
  useEffect(() => {
    const fetchLeaderData = async () => {
      const leader = await fetchUserById(currentTeam?.ownerId ?? "");
      setLeaderName(leader?.displayName ?? "");
    };
    const fetchMembersData = async () => {
      const membersData = await fetchUsersByIds(members);
      setMembersData(membersData);
    };
    fetchLeaderData();
    fetchMembersData();
  }, [currentTeam, memberList]);

  const handleAddMemberToTeam = async () => {
    if (newMember && currentTeam?.id && !members.includes(newMember)) {
      try {
        await addMemberToTeam(currentTeam.id, newMember);
        setNewMember("");
      } catch (error) {
        console.error('Error adding member to team:', error);
      }
    }
  };

  const handleRemoveMemberFromTeam = async (memberId: string) => {
    if (currentTeam?.id) {
      await removeMemberFromTeam(currentTeam.id, memberId);
    }
  };

  const handleAddMemberToBoard = async (boardId: string, email: string) => {
    if (!currentTeam?.id) {
      throw new Error("Team ID not found");
    }
    try {
      const result = await addMemberToBoard(currentTeam.id, boardId, email);
      return result;
    } catch (error: any) {
      throw error;
    }
  };

  const handleRemoveMemberFromBoard = async (boardId: string, email: string) => {
    if (currentTeam?.id) {
      try {
        await removeMemberFromBoard(currentTeam.id, boardId, email);
      } catch (error) {
        console.error('Error removing member from board:', error);
      }
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (currentTeam?.id && window.confirm('Bạn có chắc muốn xóa board này?')) {
      await deleteBoard(currentTeam.id, boardId);
      setIsDropdownOpen(null);
    }
  };

  const handleEditBoard = (board: Board) => {
    setCurrentBoard(board);
    setIsModalOpen(true);
    setIsDropdownOpen(null);
  };

  const handleOptionsClick = (boardId: string) => {
    setIsDropdownOpen(isDropdownOpen === boardId ? null : boardId);
  };

  if (loading) return <div className="text-[#212121] dark:text-[#FBF6E9] text-center py-8">Loading...</div>;

  return (
    <div className="flex flex-col sm:flex-row gap-6 p-4 bg-[#FDFAF6] dark:bg-[#212121] min-h-screen">
      {/* DANH SÁCH THÀNH VIÊN */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="w-full sm:w-64 bg-[#096B68] p-6 rounded-2xl flex flex-col gap-4"
      >
        <motion.span
          variants={fadeUp}
          className="text-lg font-semibold text-[#FBF6E9]"
        >
          Danh sách thành viên
        </motion.span>
        <ul className="space-y-3">
          {membersData.map((member) => (
            <motion.li
              key={member.id}
              variants={staggerItem}
              className="flex items-center justify-between text-[#FBF6E9]"
            >
              <div className="flex items-center gap-2">
                <img src={member.avatarUrl} className="size-6 rounded-full" alt="avatar" />
                <span className="text-sm">{member.displayName}</span>
              </div>
              <motion.button
                {...hoverGrow}
                {...tapShrink}
                onClick={() => handleRemoveMemberFromTeam(member.id)}
                className="text-[#FBF6E9] hover:text-red-500 cursor-pointer"
              >
                <X size={16} />
              </motion.button>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* DANH SÁCH BOARD */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="flex-1 flex flex-col gap-6"
      >
        <motion.div
          variants={fadeUp}
          className="text-2xl sm:text-3xl font-bold text-[#212121] dark:text-[#FBF6E9] text-center"
        >
          {currentTeam?.name}
        </motion.div>
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <span className="text-[#212121] dark:text-[#FBF6E9]">
            <span className="font-bold">Trưởng nhóm: </span>
            {leaderName}
          </span>
          <div className="flex items-center gap-2">
            <input
              className="border border-[#CFFFE2] rounded-lg w-full sm:w-64 h-10 py-1 px-3 text-[#212121] dark:text-[#FBF6E9] bg-white dark:bg-[#2A2A2A] focus:outline-none focus:border-[#328E6E]"
              type="email"
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              placeholder="Nhập email người mới"
            />
            <motion.button
              {...hoverGrow}
              {...tapShrink}
              onClick={handleAddMemberToTeam}
              className="bg-[#096B68] text-[#FBF6E9] p-2 rounded-lg hover:bg-[#328E6E] transition-colors cursor-pointer"
            >
              <Plus size={18} />
            </motion.button>
          </div>
        </motion.div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {boards.map((board) => (
            <motion.div
              key={board.id}
              variants={staggerItem}
              className="bg-white dark:bg-[#2A2A2A] p-4 rounded-lg shadow-md relative border border-[#CFFFE2]/20"
            >
              <NavLink
                to={`/board/${board.id}`}
                onClick={() => setCurrentBoard(board)}
                className="block mb-2 text-lg font-semibold text-[#212121] dark:text-[#FBF6E9] hover:text-[#328E6E] transition-colors"
              >
                {board.name}
              </NavLink>
              <div className="relative">
                <motion.button
                  {...hoverGrow}
                  {...tapShrink}
                  onClick={() => handleOptionsClick(board.id)}
                  className="absolute bottom-2 right-2 text-[#212121] dark:text-[#FBF6E9] hover:text-[#328E6E] cursor-pointer"
                >
                  <MoreVertical size={20} />
                </motion.button>
                {isDropdownOpen === board.id && (
                  <motion.div
                    variants={fadeUp}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute bottom-10 right-0 bg-white dark:bg-[#2A2A2A] border border-[#CFFFE2]/20 rounded-lg shadow-md w-32 z-10"
                  >
                    <motion.button
                      {...hoverGrow}
                      {...tapShrink}
                      onClick={() => handleEditBoard(board)}
                      className="w-full text-left p-2 text-[#212121] dark:text-[#FBF6E9] hover:bg-[#CFFFE2]/10 flex items-center gap-2 cursor-pointer"
                    >
                      <Edit size={16} /> Sửa
                    </motion.button>
                    <motion.button
                      {...hoverGrow}
                      {...tapShrink}
                      onClick={() => handleDeleteBoard(board.id)}
                      className="w-full text-left p-2 text-red-500 hover:bg-[#CFFFE2]/10 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 size={16} /> Xóa
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
          <motion.div
            variants={staggerItem}
            {...hoverGrow}
            {...tapShrink}
            className="bg-[#CFFFE2]/20 p-4 rounded-lg shadow-md flex items-center justify-center cursor-pointer hover:bg-[#CFFFE2]/30 transition-colors"
            onClick={() => {
              setCurrentBoard(null);
              setIsModalOpen(true);
            }}
          >
            <span className="text-[#212121] dark:text-[#FBF6E9] font-medium">Tạo Board Mới</span>
          </motion.div>
        </motion.div>
        <BoardModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          teamId={currentTeam?.id || ''}
          board={useBoardStore.getState().currentBoard ?? undefined}
          onAddMemberToBoard={handleAddMemberToBoard}
          onRemoveMemberFromBoard={handleRemoveMemberFromBoard}
        />
      </motion.div>
    </div>
  );
};

export default TeamPage;