import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../config/api";

export type AdvanceStatus = "PENDING" | "APPROVED" | "REFUSED" | "REPAID";
export type AdvanceChannel = "WAVE" | "ORANGE_MONEY" | "MTN_MONEY" | "BANK_TRANSFER";

export interface Advance {
  id: string;
  employeeId: string;
  amount: number;
  maxAmount: number;
  channel: AdvanceChannel;
  status: AdvanceStatus;
  note?: string;
  requestedAt: string;
  approvedAt?: string;
  repaymentDate?: string;
  employee?: {
    firstName: string;
    lastName: string;
    position: string;
    phone: string;
  };
}

const KEY = ["advances"];

function toArray(raw: unknown): Advance[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Advance[];
    if (Array.isArray(obj.advances)) return obj.advances as Advance[];
  }
  return [];
}

export function useAdvances() {
  return useQuery<Advance[]>({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get("/advances");
      return toArray(data);
    },
  });
}

export function useCreateAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      employeeId: string;
      amount: number;
      channel: AdvanceChannel;
      note?: string;
    }) => api.post("/advances/request", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useApproveAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/advances/${id}/approve`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRejectAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason = "Refus employeur" }: { id: string; reason?: string }) =>
      api.post(`/advances/${id}/refuse`, { reason }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
