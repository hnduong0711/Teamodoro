import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { fetchUserById, updateUser, uploadImageToCloudinary } from "../services/userService";
import { type User } from "../types/User";
import { fadeUp, hoverGrow, tapShrink, staggerContainer, staggerItem } from "../utils/motionVariants";

const AccountPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (user && !loading) {
        const fetchedUser = await fetchUserById(user.uid);
        setCurrentUser(fetchedUser);
      }
    };
    loadUser();
  }, [user, loading]);

  const handleEdit = (field: string, value: string) => {
    setEditField(field);
    setEditValue(value);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = async (field: string) => {
    if (currentUser && editValue !== currentUser[field as keyof User]) {
      const updates: Partial<User> = { [field]: editValue };
      const success = await updateUser(user!.uid, updates);
      if (success && currentUser) {
        setCurrentUser({ ...currentUser, [field]: editValue });
      }
    }
    setEditField(null);
    setEditValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, field: string) => {
    if (e.key === "Enter") handleSave(field);
  };

  const handleBlur = (field: string) => {
    handleSave(field);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImageToCloudinary(file);
    if (url) {
      await updateUser(user?.uid ?? "", { avatarUrl: url });
      setCurrentUser((prev) => (prev ? { ...prev, avatarUrl: url } : prev));
    }
  };

  if (loading || !currentUser) return <div className="text-[#212121] dark:text-[#FBF6E9]">Đang tải...</div>;

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      className="p-6 bg-[#FDFAF6] dark:bg-[#212121] rounded-lg shadow-md border border-[#CFFFE2]/20"
    >
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col sm:flex-row gap-6">
        {/* Avatar Section */}
        <motion.div variants={staggerItem} className="flex-1 flex flex-col items-center">
          <img
            src={currentUser.avatarUrl || "https://via.placeholder.com/150"}
            alt="Avatar"
            className="w-40 h-40 rounded-full object-cover mb-4"
          />
          <motion.input
            {...hoverGrow}
            {...tapShrink}
            type="file"
            onChange={handleFileChange}
            className="bg-[#096B68] text-[#FBF6E9] border border-[#CFFFE2] rounded-lg p-2 hover:bg-[#328E6E] transition-colors cursor-pointer"
          />
        </motion.div>

        {/* Info Section */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex-1">
          <motion.div variants={staggerItem} className="mb-4">
            <label className="block text-sm font-medium text-[#212121] dark:text-[#FBF6E9]">
              Tên hiển thị
            </label>
            {editField === "displayName" ? (
              <motion.input
                variants={fadeUp}
                initial="initial"
                animate="animate"
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, "displayName")}
                onBlur={() => handleBlur("displayName")}
                className="mt-1 p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E] w-full"
              />
            ) : (
              <div className="mt-1 flex items-center">
                <span className="flex-1 text-[#212121] dark:text-[#FBF6E9]">
                  {currentUser.displayName}
                </span>
                <motion.button
                  {...hoverGrow}
                  {...tapShrink}
                  onClick={() => handleEdit("displayName", currentUser.displayName || "")}
                  className="ml-2 text-[#096B68] hover:text-[#328E6E] transition-colors"
                >
                  ✎
                </motion.button>
              </div>
            )}
          </motion.div>
          <motion.div variants={staggerItem} className="mb-4">
            <label className="block text-sm font-medium text-[#212121] dark:text-[#FBF6E9]">
              Email
            </label>
            {editField === "email" ? (
              <motion.input
                variants={fadeUp}
                initial="initial"
                animate="animate"
                ref={inputRef}
                type="email"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, "email")}
                onBlur={() => handleBlur("email")}
                className="mt-1 p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E] w-full"
              />
            ) : (
              <div className="mt-1 flex items-center">
                <span className="flex-1 text-[#212121] dark:text-[#FBF6E9]">
                  {currentUser.email}
                </span>
                <motion.button
                  {...hoverGrow}
                  {...tapShrink}
                  onClick={() => handleEdit("email", currentUser.email || "")}
                  className="ml-2 text-[#096B68] hover:text-[#328E6E] transition-colors"
                >
                  ✎
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AccountPage;