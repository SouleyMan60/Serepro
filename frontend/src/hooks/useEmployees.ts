import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../config/api";

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  position: string;
  department: string;
  contractType: "CDI" | "CDD" | "STAGE" | "FREELANCE";
  grossSalary: number;
  paymentChannel: "WAVE" | "ORANGE_MONEY" | "MTN_MONEY";
  startDate: string;
  status: "ACTIVE" | "ON_LEAVE" | "SUSPENDED";
  creditScore?: number;
  tenantId: string;
  createdAt: string;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  position: string;
  department: string;
  contractType: "CDI" | "CDD" | "STAGE" | "FREELANCE";
  grossSalary: number;
  paymentChannel: "WAVE" | "ORANGE_MONEY" | "MTN_MONEY";
  startDate: string;
}

export interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {
  status?: "ACTIVE" | "ON_LEAVE" | "SUSPENDED";
}

const QUERY_KEY = ["employees"];

function toArray(raw: unknown): Employee[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Employee[];
    if (Array.isArray(obj.employees)) return obj.employees as Employee[];
  }
  return [];
}

export function useEmployees() {
  return useQuery<Employee[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get("/employees");
      return toArray(data);
    },
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      try {
        const { data } = await api.post<Employee>("/employees", input);
        return data;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number; data?: unknown }; message?: string };
        console.error("[useCreateEmployee] échec", {
          status: axiosErr?.response?.status,
          body: axiosErr?.response?.data,
          payload: input,
          message: axiosErr?.message,
        });
        throw err;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateEmployeeInput & { id: string }) =>
      api.patch<Employee>(`/employees/${id}`, input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
