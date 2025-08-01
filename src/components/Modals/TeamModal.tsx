import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Trash2, Save } from "lucide-react";
import {
  addMemberToTeam,
  addTeam,
  deleteTeam,
  removeMemberFromTeam,
  updateTeam,
} from "../../services/teamService";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";
import type { Team } from "../../types/Team";
import type { User } from "../../types/User";
import { fetchUsersByIds } from "../../services/userService";
import { fade, slideFromBottom, hoverGrow, tapShrink } from "../../utils/motionVariants";

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team?: Team;
}

const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose, team }) => {
  const { user } = useAuth();
  const [name, setName] = useState(team?.name || "");
  const [newMember, setNewMember] = useState("");
  const [members, setMembers] = useState<string[]>(team?.members || []);
  const [membersData, setMembersData] = useState<User[]>([]);
  const [createdTeamId, setCreatedTeamId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const membersData = await fetchUsersByIds(members);
      setMembersData(membersData);
    };
    fetchUserData();
  }, [members]);

  useEffect(() => {
    const createTeamIfNeeded = async () => {
      if (!team && user?.uid && isOpen && !createdTeamId) {
        const tempTeam: Omit<Team, "id"> = {
          name: "",
          ownerId: user.uid,
          members: [],
          createdAt: Timestamp.now(),
        };
        const newTeamId = await addTeam(tempTeam, user.uid);
        setCreatedTeamId(newTeamId);
      }
    };
    createTeamIfNeeded();
  }, [isOpen, team, user, createdTeamId]);

  const handleSave = async () => {
    if (!user?.uid) return;
    const teamData: Omit<Team, "id"> = {
      name,
      ownerId: user.uid,
      members,
      createdAt: Timestamp.now(),
    };

    if (team) {
      await updateTeam(team.id, {
        name,
        members,
        ownerId: team.ownerId,
      });
    } else if (createdTeamId) {
      await updateTeam(createdTeamId, teamData);
    }

    onClose();
  };

  const handleClose = async () => {
    if (!team && createdTeamId) {
      await deleteTeam(createdTeamId);
    }
    onClose();
  };

  const handleAddMember = async (email: string) => {
    const teamId = team?.id || createdTeamId;
    if (!teamId) {
      alert("Team chưa được tạo.");
      return;
    }

    try {
      const result = await addMemberToTeam(teamId, email);
      if (result.success) {
        setMembers((prev) => [...prev, result.userId]);
        setNewMember("");
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setMembers((prev) => prev.filter((id) => id !== memberId));
    const teamId = team?.id || createdTeamId;
    if (teamId) {
      await removeMemberFromTeam(teamId, memberId);
    }
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
              <h2 className="text-xl font-bold text-[#212121] dark:text-[#FDFAF6]">
                {team ? "Sửa Team" : "Thêm Team"}
              </h2>
              <motion.button
                {...hoverGrow}
                {...tapShrink}
                onClick={handleClose}
                className="text-[#212121] dark:text-[#FDFAF6] hover:text-[#328E6E] cursor-pointer"
              >
                <X size={24} />
              </motion.button>
            </div>
            <div className="mb-4">
              <label className="block text-[#212121] dark:text-[#FDFAF6] mb-2 font-medium">
                Tên Team
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FDFAF6] focus:outline-none focus:border-[#328E6E]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-[#212121] dark:text-[#FDFAF6] mb-2 font-medium">
                Thêm Member (ID)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  className="w-full p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FDFAF6] focus:outline-none focus:border-[#328E6E]"
                />
                <motion.button
                  {...hoverGrow}
                  {...tapShrink}
                  onClick={() => handleAddMember(newMember)}
                  className="bg-[#096B68] text-[#FDFAF6] p-2 rounded-lg hover:bg-[#328E6E] transition-colors cursor-pointer"
                >
                  <UserPlus size={18} />
                </motion.button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-[#212121] dark:text-[#FDFAF6] mb-2 font-medium">
                Members
              </label>
              <ul className="space-y-2">
                {membersData.map((memberEmail) => (
                  <li
                    key={memberEmail.id}
                    className="flex justify-between items-center text-[#212121] dark:text-[#FDFAF6]"
                  >
                    {memberEmail.displayName}
                    <motion.button
                      {...hoverGrow}
                      {...tapShrink}
                      onClick={() => handleRemoveMember(memberEmail.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <motion.button
                {...hoverGrow}
                {...tapShrink}
                onClick={handleClose}
                className="bg-[#212121] text-[#FDFAF6] px-4 py-2 rounded-lg hover:bg-[#328E6E] transition-colors cursor-pointer"
              >
                Hủy
              </motion.button>
              <motion.button
                {...hoverGrow}
                {...tapShrink}
                onClick={handleSave}
                className="bg-[#096B68] text-[#FDFAF6] px-4 py-2 rounded-lg hover:bg-[#328E6E] transition-colors flex items-center gap-2 cursor-pointer"
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

export default TeamModal;