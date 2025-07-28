import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { fetchUserById, updateUser, uploadImageToCloudinary } from "../services/userService";
import { type User } from "../types/User";

const AccountPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);


  

  useEffect(() => {
    const loadUser = async () => {
        console.log(user);
      if (user && !loading) {
        console.log("chạy được");
        
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
    await updateUser(user?.uid ?? "", {avatarUrl: url})
  }
};

  if (loading || !currentUser) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex space-x-6">
        {/* Avatar Section */}
        <div className="flex-1">
          <img
            src={currentUser.avatarUrl || "https://via.placeholder.com/150"}
            alt="Avatar"
            className="w-40 h-40 rounded-full object-cover mb-4"
          />
          <input className="bg-amber-300 border" type="file" onChange={handleFileChange} />
        </div>
        {/* Info Section */}
        <div className="flex-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Display Name</label>
            {editField === "displayName" ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, "displayName")}
                onBlur={() => handleBlur("displayName")}
                className="mt-1 p-2 border rounded w-full"
              />
            ) : (
              <div className="mt-1 flex items-center">
                <span className="flex-1">{currentUser.displayName}</span>
                <button
                  onClick={() => handleEdit("displayName", currentUser.displayName || "")}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  ✎
                </button>
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            {editField === "email" ? (
              <input
                ref={inputRef}
                type="email"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, "email")}
                onBlur={() => handleBlur("email")}
                className="mt-1 p-2 border rounded w-full"
              />
            ) : (
              <div className="mt-1 flex items-center">
                <span className="flex-1">{currentUser.email}</span>
                <button
                  onClick={() => handleEdit("email", currentUser.email || "")}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  ✎
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;