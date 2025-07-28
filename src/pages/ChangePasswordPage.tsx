import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { Eye, EyeOff  } from 'lucide-react';

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

    // kiểm tra new pass và retype pass
    if (newPassword !== retypePassword) {
      setError("Mật khẩu mới và nhập lại không khớp !");
      return;
    }

    if (!user || loading) return;

    try {
      const credential = EmailAuthProvider.credential(user.email!, oldPassword);

      // xác thực lại với mk cũ
      await reauthenticateWithCredential(user, credential);

      // update mk mới
      await updatePassword(user, newPassword);
      alert("Đổi mật khẩu thành công !")
      setOldPassword("");
      setNewPassword("");
      setRetypePassword("");
    } catch (err: any) {
      setError("Mật khẩu cũ không đúng !");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700">Old Password</label>
          <input
            type={showOldPass ? "text" : "password"}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="mt-1 p-2 border rounded w-full pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowOldPass(!showOldPass)}
            className="absolute right-2 top-9 text-gray-500 hover:text-gray-700"
          >
            {showOldPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <input
            type={showNewPass ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 p-2 border rounded w-full pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPass(!showNewPass)}
            className="absolute right-2 top-9 text-gray-500 hover:text-gray-700"
          >
            {showNewPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700">Retype Password</label>
          <input
            type={showRetypePass ? "text" : "password"}
            value={retypePassword}
            onChange={(e) => setRetypePassword(e.target.value)}
            className="mt-1 p-2 border rounded w-full pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowRetypePass(!showRetypePass)}
            className="absolute right-2 top-9 text-gray-500 hover:text-gray-700"
          >
            {showRetypePass ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Change Password
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;