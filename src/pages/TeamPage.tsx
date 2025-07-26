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
import {  fetchUserById, fetchUsersByIds } from '../services/userService';
import type { User } from '../types/User';

const TeamPage = () => {
  const currentTeam = useTeamStore((s) => s.currentTeam);
  const { boards, setCurrentBoard } = useBoardStore();
  const { user, loading } = useAuth();
  const [newMember, setNewMember] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<string | null>(null);
  const [leaderName, setLeaderName] = useState("")
  const [membersData, setMembersData] = useState<User[]>([]);

  const members = currentTeam?.members || [];
  useEffect(() => {
    if (!loading && currentTeam?.id && user?.email && user?.uid) {
      fetchBoards(currentTeam.id, user.email, user.uid);
      
      const unsubscribe = subscribeToBoards(currentTeam.id, user.email, user.uid);
      return () => unsubscribe();
    }
  }, [currentTeam?.id, user?.email, user?.uid, loading]);
  
  const memberlist = useMemo(() => Object.keys(members).sort(), [members]);
  useEffect(() => {
    const fetchLeaderData = async () => {
      const leader = await fetchUserById(currentTeam?.ownerId ?? "")
      setLeaderName(leader?.displayName ?? "")
    }
    const fetchMembersData = async () => {
      const membersData = await fetchUsersByIds(members);
      setMembersData(membersData)
    }
    fetchLeaderData();
    fetchMembersData();
  }, [currentTeam, memberlist])

  
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
    if (currentTeam?.id) {
      try {
        await addMemberToBoard(currentTeam.id, boardId, email);
      } catch (error) {
        console.error('Error adding member to board:', error);
      }
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex space-x-8">
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col space-y-4 px-8 bg-red-400 h-[500px] border rounded-tr-2xl rounded-br-2xl"
      >
        <motion.span
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className=""
        >
          Danh sách thành viên
        </motion.span>
        <ul className="space-y-4 flex flex-col">
          {membersData.map((member) => (
            <motion.li
              key={member.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center space-x-4 cursor-pointer"
            >
              <img src={member.avatarUrl} className="size-6" alt="hinhanh" />
              <span className="">{member.displayName}</span>
              <button onClick={() => handleRemoveMemberFromTeam(member.id)} className="cursor-pointer">
                <X />
              </button>
            </motion.li>
          ))}
        </ul>
      </motion.div>
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col space-y-8 pr-4 flex-1"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-3xl font-bold text-center"
        >
          {currentTeam?.name}
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex justify-between items-center"
        >
          <span className="">
            <span className="font-bold">Trưởng nhóm: </span>
            {leaderName}
          </span>
          <div className="flex items-center space-x-4 p-2">
            <input
              className="border rounded-2xl w-72 h-10 py-1 px-2"
              type="email"
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              placeholder="Nhập vào email người mới"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAddMemberToTeam}
              className="bg-blue-600 text-white p-2 rounded-full"
            >
              <Plus />
            </motion.button>
          </div>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {boards.map((board, index) => (
            <motion.div
              key={board.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index, duration: 0.3 }}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md relative"
            >
              <NavLink to={`/board/${board.id}`} onClick={() => {setCurrentBoard(board)}} className="block mb-2 text-lg font-semibold">
                {board.name}
              </NavLink>
              <div className="relative">
                <button
                  onClick={() => handleOptionsClick(board.id)}
                  className="absolute bottom-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  <MoreVertical size={20} />
                </button>
                {isDropdownOpen === board.id && (
                  <div className="absolute bottom-8 right-0 bg-white dark:bg-gray-800 border rounded-lg shadow-md w-32">
                    <button
                      onClick={() => handleEditBoard(board)}
                      className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Edit size={16} className="inline mr-2" /> Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteBoard(board.id)}
                      className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                    >
                      <Trash2 size={16} className="inline mr-2" /> Xóa
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 * (boards.length + 1), duration: 0.3 }}
            className="bg-gray-200 p-4 rounded-lg shadow-md flex items-center justify-center cursor-pointer"
            onClick={() => {
              setCurrentBoard(null);
              setIsModalOpen(true);
            }}
          >
            <span className="text-gray-600">Tạo Board Mới</span>
          </motion.div>
        </div>
        <BoardModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false) }}
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