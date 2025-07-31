import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot, query, where, Timestamp, getDoc } from 'firebase/firestore';
import { useTeamStore } from '../store/teamStore';
import { type Team } from '../types/Team';
import { fetchUserByEmail } from './userService';

// lấy dữ liệu 1 lần 
export const fetchTeams = async (userId: string | null | null) => {
  if (!userId) {
    console.log("No userId or email, setting teams to empty");
    useTeamStore.getState().setTeams([]);
    return;
  }

  const ownerQuery = query(collection(db, 'teams'), where('ownerId', '==', userId));
  const ownerSnapshot = await getDocs(ownerQuery);
  const ownerTeams = ownerSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Team));

  const memberQuery = query(collection(db, 'teams'), where('members', 'array-contains', userId));
  const memberSnapshot = await getDocs(memberQuery);
  const memberTeams = memberSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Team));

  const allTeams = [...ownerTeams, ...memberTeams];
  const uniqueTeams = Array.from(new Map(allTeams.map((team) => [team.id, team])).values());
  // console.log("Fetched unique teams:", uniqueTeams);
  useTeamStore.getState().setTeams(uniqueTeams);
};

// theo dõi dữ liệu
export const subscribeToTeams = (userId: string | null, callback?: () => void) => {
  if (!userId) {
    console.log("No userId or email, setting teams to empty in subscribe");
    useTeamStore.getState().setTeams([]);
    return () => {};
  }

  const combineTeams = (ownerTeams: Team[], memberTeams: Team[]) => {
    const allTeams = [...ownerTeams, ...memberTeams];
    const uniqueTeams = Array.from(new Map(allTeams.map((team) => [team.id, team])).values());
    useTeamStore.getState().setTeams(uniqueTeams);
    if (callback) callback();
  };

  const ownerQuery = query(collection(db, 'teams'), where('ownerId', '==', userId));
  let ownerTeams: Team[] = [];
  const ownerUnsubscribe = onSnapshot(ownerQuery, (snapshot) => {
    ownerTeams = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Team));
    combineTeams(ownerTeams, memberTeams);
  }, (error) => console.error('Error subscribing to owner teams:', error));

  const memberQuery = query(collection(db, 'teams'), where('members', 'array-contains', userId));
  let memberTeams: Team[] = [];
  const memberUnsubscribe = onSnapshot(memberQuery, (snapshot) => {
    memberTeams = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Team));
    combineTeams(ownerTeams, memberTeams);
  }, (error) => console.error('Error subscribing to member teams:', error));

  return () => {
    ownerUnsubscribe();
    memberUnsubscribe();
  };
};

// thêm team
export const addTeam = async (team: Omit<Team, 'id' | 'createdAt'>, userId: string) => {
  if (!userId) throw new Error('No authenticated user found');
  await addDoc(collection(db, 'teams'), { ...team, ownerId: userId, createdAt: Timestamp.now() });
};

// sửa team
export const updateTeam = async (teamId: string, updates: Partial<Team>) => {
  await updateDoc(doc(db, 'teams', teamId), updates);
  useTeamStore.getState().updateTeam(teamId, updates);
};

// xóa team
export const deleteTeam = async (teamId: string) => {
  await deleteDoc(doc(db, 'teams', teamId));
  useTeamStore.getState().deleteTeam(teamId);
};

// thêm thành viên vào team
export const addMemberToTeam = async (teamId: string, email: string) => {
  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);

  // kiểm tra team 
  if (!teamSnap.exists()) {
    throw new Error("Không tìm thấy team");
  }

  const teamData = teamSnap.data() as Team;
  // kiểm tra user tồn tại trong collection
  const user = await fetchUserByEmail(email);
  if (!user) {
    throw new Error("Người dùng không tồn tại!");
  }

  // kiểm tra user đã có trong team
  if (Array.isArray(teamData.members) && teamData.members.includes(user.id)) {
    throw new Error("Người dùng đã có mặt trong nhóm !");
  }

  const updatedMembers = teamData.members ? [...teamData.members, user.id] : [user.id];
  await updateDoc(teamRef, { members: updatedMembers });
  useTeamStore.getState().updateTeam(teamId, { members: updatedMembers });

  return { success: true, userId: user.id };
};

// xóa thành viên khỏi team
export const removeMemberFromTeam = async (teamId: string, memberId: string) => {
  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) throw new Error('Team not found');
    const teamData = teamSnap.data() as Team;
    const updatedMembers = teamData.members ? teamData.members.filter((m: string) => m !== memberId) : [];
    await updateDoc(teamRef, { members: updatedMembers });
    useTeamStore.getState().updateTeam(teamId, { members: updatedMembers });
};