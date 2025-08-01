import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { useBoardStore } from "../store/boardStore";
import { type Board } from "../types/Board";
import type { Team } from "../types/Team";
import { fetchUserByEmail } from "./userService";

// lấy dữ liệu 1 lần
export const fetchBoards = async (
  teamId: string | null,
  userEmail: string | null,
  userId: string | null
) => {
  if (!teamId || !userEmail || !userId) {
    console.log("No teamId, userEmail, or userId, setting boards to empty");
    useBoardStore.getState().setBoards([]);
    return;
  }

  const boardsCollection = collection(db, `teams/${teamId}/boards`);
  const publicQuery = query(boardsCollection, where("isPublic", "==", true));
  const publicSnapshot = await getDocs(publicQuery);
  const publicBoards = publicSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Board)
  );

  const memberQuery = query(
    boardsCollection,
    where("members", "array-contains", userEmail)
  );
  const memberSnapshot = await getDocs(memberQuery);
  const memberBoards = memberSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Board)
  );

  const createdByQuery = query(
    boardsCollection,
    where("createdBy", "==", userId)
  );
  const createdBySnapshot = await getDocs(createdByQuery);
  const createdBoards = createdBySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Board)
  );

  const allBoards = [...publicBoards, ...memberBoards, ...createdBoards];
  const uniqueBoards = Array.from(
    new Map(allBoards.map((board) => [board.id, board])).values()
  );
  console.log("Fetched unique boards:", uniqueBoards);
  useBoardStore.getState().setBoards(uniqueBoards);
};

// theo dõi dữ liệu
export const subscribeToBoards = (
  teamId: string | null,
  userEmail: string | null,
  userId: string | null,
  callback?: () => void
) => {
  if (!teamId || !userEmail || !userId) {
    console.log(
      "No teamId, userEmail, or userId, setting boards to empty in subscribe"
    );
    useBoardStore.getState().setBoards([]);
    return () => {};
  }

  const boardsCollection = collection(db, `teams/${teamId}/boards`);
  const combineBoards = (
    publicBoards: Board[],
    memberBoards: Board[],
    createdBoards: Board[]
  ) => {
    const allBoards = [...publicBoards, ...memberBoards, ...createdBoards];
    const uniqueBoards = Array.from(
      new Map(allBoards.map((board) => [board.id, board])).values()
    );
    console.log("Subscribed unique boards:", uniqueBoards);
    useBoardStore.getState().setBoards(uniqueBoards);
    if (callback) callback();
  };

  const publicQuery = query(boardsCollection, where("isPublic", "==", true));
  let publicBoards: Board[] = [];
  const publicUnsubscribe = onSnapshot(
    publicQuery,
    (snapshot) => {
      publicBoards = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Board)
      );
      combineBoards(publicBoards, memberBoards, createdBoards);
    },
    (error) => console.error("Error subscribing to public boards:", error)
  );

  const memberQuery = query(
    boardsCollection,
    where("members", "array-contains", userEmail)
  );
  let memberBoards: Board[] = [];
  const memberUnsubscribe = onSnapshot(
    memberQuery,
    (snapshot) => {
      memberBoards = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Board)
      );
      combineBoards(publicBoards, memberBoards, createdBoards);
    },
    (error) => console.error("Error subscribing to member boards:", error)
  );

  const createdByQuery = query(
    boardsCollection,
    where("createdBy", "==", userId)
  );
  let createdBoards: Board[] = [];
  const createdByUnsubscribe = onSnapshot(
    createdByQuery,
    (snapshot) => {
      createdBoards = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Board)
      );
      combineBoards(publicBoards, memberBoards, createdBoards);
    },
    (error) => console.error("Error subscribing to created boards:", error)
  );

  return () => {
    publicUnsubscribe();
    memberUnsubscribe();
    createdByUnsubscribe();
  };
};

// thêm
export const addBoard = async (
  teamId: string,
  board: Omit<Board, "id" | "createdAt">,
  userId: string
) => {
  if (!teamId || !userId) throw new Error("No teamId or userId found");
  const docRef = await addDoc(collection(db, `teams/${teamId}/boards`), {
    ...board,
    createdBy: userId,
    createdAt: Timestamp.now(),
  });
  return docRef.id
};

// sửa
export const updateBoard = async (
  teamId: string,
  boardId: string,
  updates: Partial<Board>
) => {
  await updateDoc(doc(db, `teams/${teamId}/boards`, boardId), updates);
  useBoardStore.getState().updateBoard(boardId, updates);
};

// xóa
export const deleteBoard = async (teamId: string, boardId: string) => {
  await deleteDoc(doc(db, `teams/${teamId}/boards`, boardId));
  useBoardStore.getState().deleteBoard(boardId);
};

// phân quyền thành viên
// thêm vào bảng
export const addMemberToBoard = async (
  teamId: string,
  boardId: string,
  email: string
) => {
  const boardRef = doc(db, `teams/${teamId}/boards`, boardId);
  const boardSnap = await getDoc(boardRef);
  if (!boardSnap.exists()) throw new Error("Board not found");

  const boardData = boardSnap.data() as Board;

  // kiểm tra user tồn tại trong collection
  const user = await fetchUserByEmail(email);
  if (!user) {
    throw new Error("Người dùng không tồn tại!");
  }

  // kiểm tra team có tồn tại không
  const teamRef = doc(db, "teams", teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) {
    throw new Error("Không tìm thấy team");
  }

  // kiểm tra user thuộc team không
  const teamData = teamSnap.data() as Team;
  if (!teamData.members || !teamData.members.includes(user.id)) {
    throw new Error("Người dùng không thuộc nhóm này!");
  }
  
  // lưu user vào firebase
  const updatedMembers = boardData.members
    ? [...boardData.members, user.id] : [user.id];
  await updateDoc(boardRef, { members: updatedMembers });
  // update cho board
  useBoardStore.getState().updateBoard(boardId, { members: updatedMembers });
  return { success: true, userId: user.id };
};

// xóa khỏi bảng
export const removeMemberFromBoard = async (
  teamId: string,
  boardId: string,
  email: string
) => {
  const boardRef = doc(db, `teams/${teamId}/boards`, boardId);
  const boardSnap = await getDoc(boardRef);
  if (boardSnap.exists()) {
    const boardData = boardSnap.data() as Board;
    const updatedMembers = boardData.members
      ? boardData.members.filter((m: string) => m !== email)
      : [];
    await updateDoc(boardRef, { members: updatedMembers });
    useBoardStore.getState().updateBoard(boardId, { members: updatedMembers });
  }
};
