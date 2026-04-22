import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../config/api";

export type LoanStatus = "ELIGIBLE" | "PENDING" | "APPROVED" | "REFUSED" | "ACTIVE" | "COMPLETED";

export interface Loan {
  id: string;
  employeeId: string;
  amount: number;
  duration: number;
  monthlyPayment: number;
  interestRate: number;
  creditScore: number;
  maxEligible: number;
  status: LoanStatus;
  note?: string;
  requestedAt?: string;
  approvedAt?: string;
  createdAt: string;
  employee?: {
    firstName: string;
    lastName: string;
    creditScore?: number;
  };
}

const KEY = ["loans"];

function toArray(raw: unknown): Loan[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Loan[];
    if (Array.isArray(obj.loans)) return obj.loans as Loan[];
  }
  return [];
}

export function useLoans() {
  return useQuery<Loan[]>({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get("/loans");
      return toArray(data);
    },
  });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { employeeId: string; amount: number; duration: number; note?: string }) =>
      api.post("/loans/request", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useApproveLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/loans/${id}/approve`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRejectLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason = "Refus employeur" }: { id: string; reason?: string }) =>
      api.post(`/loans/${id}/refuse`, { reason }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
