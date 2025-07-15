export interface Board {
  id: string;
  name: string;
  teamId?: string;
  createdBy: string;
  members?: string[];
  isPublic: boolean;
  createdAt: string;
}
