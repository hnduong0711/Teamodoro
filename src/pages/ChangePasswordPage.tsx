import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import { fadeUp, hoverGrow, tapShrink, staggerContainer, staggerItem } from "../utils/motionVariants";

const ChangePassword: React.FC = () => {
  const { user, loading } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showRetypePass, setShowRetypePass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== retypePassword) {
      setError("Mật khẩu mới và nhập lại không khớp!");
      return;
    }

    if (!user || loading) return;

    try {
      const credential = EmailAuthProvider.credential(user.email!, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      alert("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setRetypePassword("");
    } catch (err: any) {
      setError("Mật khẩu cũ không đúng!");
    }
  };

  if (loading) return <div className="text-[#212121] dark:text-[#FBF6E9]">Đang tải...</div>;

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      className="p-6 bg-[#FDFAF6] dark:bg-[#212121] rounded-lg shadow-md border border-[#CFFFE2]/20"
    >
      <motion.h2
        variants={fadeUp}
        className="text-2xl sm:text-3xl font-bold text-[#212121] dark:text-[#FBF6E9] mb-6"
      >
        Đổi mật khẩu
      </motion.h2>
      <motion.form
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <motion.div variants={staggerItem} className="relative">
          <label className="block text-sm font-medium text-[#212121] dark:text-[#FBF6E9]">
            Mật khẩu cũ
          </label>
          <input
            type={showOldPass ? "text" : "password"}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="mt-1 p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E] w-full pr-10"
            required
          />
          <motion.button
            {...hoverGrow}
            {...tapShrink}
            type="button"
            onClick={() => setShowOldPass(!showOldPass)}
            className="absolute right-2 top-9 text-[#096B68] hover:text-[#328E6E] transition-colors cursor-pointer"
          >
            {showOldPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </motion.button>
        </motion.div>
        <motion.div variants={staggerItem} className="relative">
          <label className="block text-sm font-medium text-[#212121] dark:text-[#FBF6E9]">
            Mật khẩu mới
          </label>
          <input
            type={showNewPass ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E] w-full pr-10"
            required
          />
          <motion.button
            {...hoverGrow}
            {...tapShrink}
            type="button"
            onClick={() => setShowNewPass(!showNewPass)}
            className="absolute right-2 top-9 text-[#096B68] hover:text-[#328E6E] transition-colors cursor-pointer"
          >
            {showNewPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </motion.button>
        </motion.div>
        <motion.div variants={staggerItem} className="relative">
          <label className="block text-sm font-medium text-[#212121] dark:text-[#FBF6E9]">
            Nhập lại mật khẩu
          </label>
          <input
            type={showRetypePass ? "text" : "password"}
            value={retypePassword}
            onChange={(e) => setRetypePassword(e.target.value)}
            className="mt-1 p-2 border border-[#CFFFE2] rounded-lg bg-white dark:bg-[#212121] text-[#212121] dark:text-[#FBF6E9] focus:outline-none focus:border-[#328E6E] w-full pr-10"
            required
          />
          <motion.button
            {...hoverGrow}
            {...tapShrink}
            type="button"
            onClick={() => setShowRetypePass(!showRetypePass)}
            className="absolute right-2 top-9 text-[#096B68] hover:text-[#328E6E] transition-colors cursor-pointer"
          >
            {showRetypePass ? <EyeOff size={20} /> : <Eye size={20} />}
          </motion.button>
        </motion.div>
        {error && (
          <motion.div variants={fadeUp} className="text-red-500 text-sm">
            {error}
          </motion.div>
        )}
        <motion.button
          {...hoverGrow}
          {...tapShrink}
          type="submit"
          className="px-4 py-2 bg-[#096B68] text-[#FBF6E9] rounded-lg hover:bg-[#328E6E] transition-colors cursor-pointer"
        >
          Đổi mật khẩu
        </motion.button>
      </motion.form>
    </motion.div>
  );
};

export default ChangePassword;