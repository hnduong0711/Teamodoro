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

const HomePage: React.FC = () => {
  const { teams, setCurrentTeam } = useTeamStore();
  const { user, loading } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      fetchTeams(user.uid, user.email);
      const unsubscribe = subscribeToTeams(user.uid, user.email);
      return () => unsubscribe();
    }
  }, [user, loading]);

  const handleOptionsClick = (teamId: string) => {
    setIsDropdownOpen(isDropdownOpen === teamId ? null : teamId);
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Danh sách Team</h1>
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="mb-4 bg-blue-600 text-white p-2 rounded-lg flex items-center gap-2"
      >
        <Plus size={18} /> Thêm Team
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md relative"
          >
            <NavLink
              to={`/team/${team.id}`}
              className="block mb-2 text-lg font-semibold"
            >
              {team.name}
            </NavLink>
            <div className="relative">
              <button
                onClick={() => handleOptionsClick(team.id)}
                className="absolute bottom-2 right-2 text-gray-500 hover:text-gray-700"
              >
                <MoreVertical size={20} />
              </button>
              {isDropdownOpen === team.id && (
                <div className="absolute bottom-8 right-0 bg-white dark:bg-gray-800 border rounded-lg shadow-md w-32">
                  {user?.uid !== team.ownerId ? (
                    <button
                      onClick={() => handleLeaveTeam(team.id)}
                      className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                    >
                      <LogOut size={16} className="inline mr-2" /> Rời nhóm
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditTeam(team)}
                        className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Edit size={16} className="inline mr-2" /> Chỉnh sửa
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                      >
                        <Trash2 size={16} className="inline mr-2" /> Xóa
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      {isAddModalOpen && <TeamModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />}
      {isEditModalOpen && <TeamModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        team={useTeamStore.getState().currentTeam ?? undefined}
      />}
      
    </div>
  );
};

export default HomePage;
