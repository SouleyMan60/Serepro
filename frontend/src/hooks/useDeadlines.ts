import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../config/api";

export interface Deadline {
  id: string;
  title: string;
  description?: string;
  type: "CNPS" | "ITS" | "CMU" | "CONTRACT_RENEWAL" | "OTHER";
  dueDate: string;
  amount?: number;
  urgency: "URGENT" | "BIENTOT" | "OK";
  completed: boolean;
  completedAt?: string;
  employeeId?: string;
  employee?: { firstName: string; lastName: string } | null;
}

export interface CreateDeadlineInput {
  title: string;
  description?: string;
  type: Deadline["type"];
  dueDate: string;
  amount?: number;
}

function normalize<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  const r = raw as { data?: unknown };
  if (r?.data && Array.isArray(r.data)) return r.data as T[];
  return [];
}

const QK = ["deadlines"] as const;

export function useDeadlines() {
  return useQuery<Deadline[]>({
    queryKey: QK,
    queryFn: async () => {
      const { data } = await api.get("/deadlines");
      return normalize<Deadline>(data);
    },
  });
}

export function useCreateDeadline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDeadlineInput) => {
      const { data } = await api.post("/deadlines", {
        ...input,
        dueDate: new Date(input.dueDate).toISOString(),
        amount: input.amount ? Number(input.amount) : undefined,
      });
      return (data?.data ?? data) as Deadline;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useCompleteDeadline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/deadlines/${id}/complete`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}
