import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../config/api";

export interface Payslip {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  grossSalary: number;
  netSalary: number;
  cnpsEmployer: number;
  its: number;
  cmu: number;
  status: "GENERATED" | "PENDING";
  employee?: {
    firstName: string;
    lastName: string;
    position: string;
    department: string;
  };
  pdfUrl?: string;
}

function payslipsKey(month: number, year: number) {
  return ["payslips", month, year];
}

function toArray(raw: unknown): Payslip[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Payslip[];
    if (Array.isArray(obj.payslips)) return obj.payslips as Payslip[];
  }
  return [];
}

export function usePayslips(month: number, year: number) {
  return useQuery<Payslip[]>({
    queryKey: payslipsKey(month, year),
    queryFn: async () => {
      const { data } = await api.get("/payslips", { params: { month, year } });
      return toArray(data);
    },
  });
}

export function useGeneratePayslips() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      api.post("/payslips/generate-all", { month, year }).then((r) => r.data),
    onSuccess: (_data, { month, year }) =>
      qc.invalidateQueries({ queryKey: payslipsKey(month, year) }),
  });
}

// Returns a signed MinIO URL valid for 1 hour
export function usePayslipPdf() {
  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      const { data } = await api.get(`/payslips/${id}/download`);
      const url = (data as { url?: string })?.url ?? (data as string);
      if (!url) throw new Error("URL PDF introuvable");
      return url;
    },
  });
}
