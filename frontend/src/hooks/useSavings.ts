import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../config/api";

export interface Saving {
  id: string;
  employeeId: string;
  monthlyAmount: number;
  balance: number;
  isActive: boolean;
  goal?: string;
  goalAmount?: number;
  createdAt: string;
  employee?: {
    firstName: string;
    lastName: string;
    position: string;
  };
  transactions?: { id: string; amount: number; type: string; createdAt: string }[];
}

const KEY = ["savings"];

function toArray(raw: unknown): Saving[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Saving[];
    if (Array.isArray(obj.savings)) return obj.savings as Saving[];
  }
  return [];
}

export function useSavings() {
  return useQuery<Saving[]>({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get("/savings");
      return toArray(data);
    },
  });
}

export function useCreateSaving() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      employeeId: string;
      monthlyAmount: number;
      goal?: string;
      goalAmount?: number;
    }) => api.post("/savings", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleSaving() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/savings/${id}/toggle`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
