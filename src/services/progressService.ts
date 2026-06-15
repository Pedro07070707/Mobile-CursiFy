import axios from "axios";
import { BASE_URL } from "./api";

const rootBaseUrl = BASE_URL.replace(/\/api\/v1$/, "");

const progressApi = axios.create({
  baseURL: rootBaseUrl,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export interface ConcluirNoResponse {
  noId: number;
  usuarioId: number;
  status: string;
  xpGanho: number;
  xpTotal: number;
}

export interface ResponderNoResponse {
  noId: number;
  usuarioId: number;
  tipoNo: string;
  acertos: number;
  total: number;
  nota: number;
  notaMinima: number | null;
  xpGanho: number;
  xpTotal: number;
  aprovado: boolean;
  tentativas?: number | null;
  mensagem?: string;
  detalhes?: Array<{
    questaoId: number;
    alternativaId: number | null;
    correta: boolean;
    tentativaNumero: number;
    feedback: string;
  }>;
}

export const progressService = {
  concluirNo: async (noId: number, usuarioId: number): Promise<ConcluirNoResponse> => {
    const response = await progressApi.post<ConcluirNoResponse>(`/api/progresso/nos/${noId}/concluir`, { usuarioId });
    return response.data;
  },
  responderNo: async (
    noId: number,
    usuarioId: number,
    respostas: Array<{ questaoId: number; alternativaId: number | null }>,
  ): Promise<ResponderNoResponse> => {
    const response = await progressApi.post<ResponderNoResponse>(`/api/progresso/nos/${noId}/responder`, {
      usuarioId,
      respostas,
    });
    return response.data;
  },
};
