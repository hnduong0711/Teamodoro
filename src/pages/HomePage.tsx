import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, MoreVertical, LogOut, Trash2, Edit } from "lucide-react";
import { useTeamStore } from "../store/teamStore";
import {
  fetchTeams,
  subscribeToTeams,
  updateTeam,
  deleteTeam,
} from "../services/teamService";
import TeamModal from "../components/Modals/TeamModal";
import type { Team } from "../types/Team";
import { useAuth } from "../hooks/useAuth";
import Spinner from "../components/Spinner/Spinner";
import { fadeUp, hoverGrow, tapShrink, staggerContainer, staggerItem } from "../utils/motionVariants";

const HomePage: React.FC = () => {
  const { teams, setCurrentTeam } = useTeamStore();
  const { user, loading } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      fetchTeams(user.uid);
      const unsubscribe = subscribeToTeams(user.uid);
      return () => unsubscribe();
    }
  }, [user, loading]);

  const handleOptionsClick = (teamId: string) => {
    setIsDropdownOpen(isDropdownOpen === teamId ? null : teamId);
  };

  const handleSelectTeam = (team: Team) => {
    setCurrentTeam(team);
  };

  const handleLeaveTeam = (teamId: string) => {
    if (window.confirm("Bạn có chắc muốn rời nhóm?")) {
      const team = teams.find((t) => t.id === teamId);
      if (team) {
        const updatedMembers = team.members.filter((email) => email !== user?.email);
        updateTeam(teamId, { members: updatedMembers });
      }
      setIsDropdownOpen(null);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (window.confirm("Bạn có chắc muốn xóa team này?")) {
      await deleteTeam(teamId);
      setIsDropdownOpen(null);
    }
  };

  const handleEditTeam = (team: Team) => {
    setCurrentTeam(team);
    setIsEditModalOpen(true);
    setIsDropdownOpen(null);
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-4 sm:p-6 bg-[#FDFAF6] dark:bg-[#212121] min-h-screen">
      <motion.h1
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="text-2xl sm:text-3xl font-bold text-[#212121] dark:text-[#FDFAF6] mb-6"
      >
        Danh sách Team
      </motion.h1>
      {/* NÚT THÊM TEAM */}
      <motion.button
        variants={fadeUp}
        initial="initial"
        animate="animate"
        {...hoverGrow}
        {...tapShrink}
        onClick={() => setIsAddModalOpen(true)}
        className="mb-6 bg-[#096B68] text-[#FDFAF6] px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#328E6E] transition-color cursor-pointer"
      >
        <Plus size={18} /> Thêm Team
      </motion.button>

      {/* DANH SÁCH TEAM */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {teams.map((team) => (
          <motion.div
            key={team.id}
            variants={staggerItem}
            className="bg-white dark:bg-[#2A2A2A] p-4 rounded-lg shadow-md relative border border-[#CFFFE2]/20"
          >
            <NavLink
              to={`/team/${team.id}`}
              className="block mb-2 text-lg font-semibold text-[#212121] dark:text-[#FDFAF6] hover:text-[#328E6E] transition-colors"
              onClick={() => handleSelectTeam(team)}
            >
              {team.name}
            </NavLink>
            <div className="relative">
              <motion.button
                {...hoverGrow}
                {...tapShrink}
                onClick={() => handleOptionsClick(team.id)}
                className="absolute bottom-2 right-2 text-[#212121] dark:text-[#FDFAF6] hover:text-[#328E6E] cursor-pointer"
              >
                <MoreVertical size={20} />
              </motion.button>
              {isDropdownOpen === team.id && (
                <motion.div
                  variants={fadeUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute bottom-10 right-0 bg-white dark:bg-[#2A2A2A] border border-[#CFFFE2]/20 rounded-lg shadow-md w-32 z-10"
                >
                  {user?.uid !== team.ownerId ? (
                    <motion.button
                      {...hoverGrow}
                      {...tapShrink}
                      onClick={() => handleLeaveTeam(team.id)}
                      className="w-full text-left p-2 text-red-500 hover:bg-[#CFFFE2]/10 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut size={16} /> Rời nhóm
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        {...hoverGrow}
                        {...tapShrink}
                        onClick={() => handleEditTeam(team)}
                        className="w-full text-left p-2 text-[#212121] dark:text-[#FDFAF6] hover:bg-[#CFFFE2]/10 flex items-center gap-2 cursor-pointer"
                      >
                        <Edit size={16} /> Chỉnh sửa
                      </motion.button>
                      <motion.button
                        {...hoverGrow}
                        {...tapShrink}
                        onClick={() => handleDeleteTeam(team.id)}
                        className="w-full text-left p-2 text-red-500 hover:bg-[#CFFFE2]/10 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 size={16} /> Xóa
                      </motion.button>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* TEAM MODAL */}
      {isAddModalOpen && (
        <TeamModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      )}
      {isEditModalOpen && (
        <TeamModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          team={useTeamStore.getState().currentTeam ?? undefined}
        />
      )}
    </div>
  );
};

export default HomePage;