import { api } from "./api";
import { TrackSummary } from "../types/tracks";

const trackService = {
  getAll: async (userId?: string): Promise<TrackSummary[]> => {
    const response = await api.get<TrackSummary[]>("/trilhas", {
      params: userId ? { userId: Number(userId) } : undefined,
    });
    return response.data;
  },
};

export default trackService;
