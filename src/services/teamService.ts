import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import { useTeamStore } from "../store/teamStore";
import { type Team } from "../types/Team";
import { useAuth } from "../hooks/useAuth";

export const fetchTeams = async (userId: string | null, email: string | null) => {
  if (!userId || !email) {
    console.log("Không nhận User id hoặc email");
    useTeamStore.getState().setTeams([]);
    return;
  }
  console.log("UserId:", userId, "Email:", email);

  // query theo owner
  const ownerQuery = query(collection(db, 'teams'), where('ownerId', '==', userId));
  const ownerSnapshot = await getDocs(ownerQuery);
  const ownerTeams = ownerSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Team));

  // query theo member
  const memberQuery = query(collection(db, 'teams'), where('members', 'array-contains', email));
  const memberSnapshot = await getDocs(memberQuery);
  const memberTeams = memberSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Team));

  // gộp query lại
  const allTeams = [...ownerTeams, ...memberTeams];
  const uniqueTeams = Array.from(new Map(allTeams.map((team) => [team.id, team])).values());
  console.log("Teams:", uniqueTeams);

  useTeamStore.getState().setTeams(uniqueTeams);
};

export const subscribeToTeams = (userId: string | null, email: string | null, callback?: () => void) => {
  if (!userId || !email) {
    useTeamStore.getState().setTeams([]);
    return () => {};
  }

  // gộp dữ liệu từ hai sub
  const combineTeams = (ownerTeams: Team[], memberTeams: Team[]) => {
    const allTeams = [...ownerTeams, ...memberTeams];
    const uniqueTeams = Array.from(new Map(allTeams.map((team) => [team.id, team])).values());
    useTeamStore.getState().setTeams(uniqueTeams);
    if (callback) callback();
  };

  // sub 1: sub theo owner
  const ownerQuery = query(collection(db, 'teams'), where('ownerId', '==', userId));
  let ownerTeams: Team[] = [];
  const ownerUnsubscribe = onSnapshot(ownerQuery, (snapshot) => {
    ownerTeams = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Team));
    combineTeams(ownerTeams, memberTeams); // gộp với memberTeams
  }, (error) => console.error('Error subscribing to owner teams:', error));

  // sub 2: sub theo email
  const memberQuery = query(collection(db, 'teams'), where('members', 'array-contains', email));
  let memberTeams: Team[] = [];
  const memberUnsubscribe = onSnapshot(memberQuery, (snapshot) => {
    memberTeams = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Team));
    combineTeams(ownerTeams, memberTeams); // gộp với ownerTeams
  }, (error) => console.error('Error subscribing to member teams:', error));

  // Cleanup
  return () => {
    ownerUnsubscribe();
    memberUnsubscribe();
  };
};

export const addTeam = async (team: Omit<Team, "id" | "createdAt">) => {
  const { user } = useAuth();
  if (!user?.uid) throw new Error("No authenticated user found");
  const docRef = await addDoc(collection(db, "teams"), {
    ...team,
    ownerId: user.uid,
    createdAt: Timestamp.now(),
  });
  const newTeam: Team = {
    ...team,
    id: docRef.id,
    ownerId: user.uid,
    createdAt: Timestamp.now(),
  };
  useTeamStore.getState().addTeam(newTeam);
};

export const updateTeam = async (teamId: string, updates: Partial<Team>) => {
  await updateDoc(doc(db, "teams", teamId), updates);
  useTeamStore.getState().updateTeam(teamId, updates);
};

export const deleteTeam = async (teamId: string) => {
  await deleteDoc(doc(db, "teams", teamId));
  useTeamStore.getState().deleteTeam(teamId);
};
