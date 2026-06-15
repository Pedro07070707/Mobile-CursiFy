export type TrackNodeStatus = "CONCLUIDO" | "EM_ANDAMENTO" | "LIBERADO" | "BLOQUEADO";

export interface TrackNode {
  id: number;
  titulo: string;
  tipo: string;
  estado: TrackNodeStatus;
  xp: number;
  icone: string;
  emAndamento: boolean;
  checkpoint: boolean;
}

export interface TrackSummary {
  id: number;
  titulo: string;
  materia: string;
  professor: string;
  xpTotal: number;
  dificuldade: string;
  thumbnail: string;
  progresso: number;
  streak: number;
  proximoNo: string;
  nos: TrackNode[];
}
