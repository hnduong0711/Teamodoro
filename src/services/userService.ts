import { db } from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import type { User } from "../types/User";

// lấy thông tin 1 user bằng email (dùng cho add member vào team/board)
export const fetchUserByEmail = async (email: string): Promise<User | null> => {
  const usersCollection = collection(db, "users");
  const q = query(usersCollection, where("email", "==", email));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const userData = snapshot.docs[0].data() as Omit<User, "id">;
    return { id: snapshot.docs[0].id, ...userData };
  }
  return null;
};

// lấy thông tin 1 user
export const fetchUserById = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, "users", userId);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as User;
  }
  return null;
};

// sửa
export const updateUser = async (userId: string, updates: Partial<User>) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, updates);
    return true;
  } catch (error) {
    console.error("Error updating user:", error);
    return false;
  }
};

// lấy thông tin nhiều user từ nhiều id
export const fetchUsersByIds = async (userIds: string[]): Promise<User[]> => {
  const users = await Promise.all(userIds.map(fetchUserById));
  return users.filter((user): user is User => user !== null);
};

// upload ảnh
export const uploadImageToCloudinary = async (
  file: File
): Promise<string | null> => {
  const cloudName = "dripiq1he";
  const uploadPreset = "unsigned_upload";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return data.secure_url as string; // url trả về
};