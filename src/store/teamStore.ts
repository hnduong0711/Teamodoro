import {create} from 'zustand';
import { type Team } from "../types/Team";

interface TeamState {
  teams: Team[];
  currentTeam: Team | null;
  setTeams: (teams: Team[]) => void;
  setCurrentTeam: (team: Team | null) => void;
  addTeam: (team: Team) => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  deleteTeam: (teamId: string) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
    teams: [],
    currentTeam: null,
    setTeams: (teams) => set({teams}),
    setCurrentTeam: (team) => set({currentTeam: team}),
    addTeam: (team) => set((state) => ({
        teams: [...state.teams, team]
    })),
    updateTeam: (teamId, updates) => set((state) => ({
        teams: state.teams.map((team) => team.id === teamId ? {...team, ...updates} : team),
        currentTeam: state.currentTeam?.id === teamId ? {...state.currentTeam, ...updates} : state.currentTeam
    })),
    deleteTeam: (teamId) => set((state) => ({
        teams: state.teams.filter((team) => team.id !== teamId),
        currentTeam: state.currentTeam?.id === teamId ? null : state.currentTeam,
    })),

    
}))