import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Trash2, Save } from 'lucide-react';
import { addTeam, updateTeam } from '../../services/teamService';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import type { Team } from '../../types/Team';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team?: Team;
}

const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose, team }) => {
  const { user } = useAuth();
  const [name, setName] = useState(team?.name || '');
  const [newMember, setNewMember] = useState('');
  const [members, setMembers] = useState<string[]>(team?.members || []);

  console.log(team);
  

  const handleSave = async () => {
    if (!user?.uid) {
      console.error('No authenticated user found');
      return;
    }
    const teamData: Omit<Team, 'id'> = { name, ownerId: user.uid, members, createdAt: Timestamp.now() };
    if (team) {
      await updateTeam(team.id, { name, members, ownerId: team.ownerId });
    } else {
      await addTeam(teamData, user.uid);
    }
    onClose();
  };

  const handleAddMember = () => {
    if (newMember && !members.includes(newMember)) {
      setMembers([...members, newMember]);
      setNewMember('');
    }
  };

  const handleRemoveMember = (memberEmail: string) => {
    setMembers(members.filter((email) => email !== memberEmail));
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
              <h2 className="text-xl font-bold">{team ? 'Sửa Team' : 'Thêm Team'}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-200 mb-2">Tên Team</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-200 mb-2">Thêm Member (ID)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <button onClick={handleAddMember} className="bg-blue-600 text-white p-2 rounded-lg">
                  <UserPlus size={18} />
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-200 mb-2">Members</label>
              <ul className="list-disc pl-5">
                {members.map((memberEmail) => (
                  <li key={memberEmail} className="flex justify-between">
                    {memberEmail}
                    <button onClick={() => handleRemoveMember(memberEmail)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="bg-gray-500 text-white p-2 rounded-lg">
                Hủy
              </button>
              <button onClick={handleSave} className="bg-green-600 text-white p-2 rounded-lg">
                <Save size={18} />
                Lưu
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TeamModal;