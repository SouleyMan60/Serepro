import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../config/api";

export type DocumentType = "CONTRACT" | "PAYSLIP" | "ATTESTATION" | "DIPLOMA" | "REPORT" | "OTHER";

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  fileType?: string;
  size?: number;
  url?: string;
  employeeId: string;
  uploadedAt: string;
}

function docKey(employeeId: string) {
  return ["documents", employeeId];
}

function toArray(raw: unknown): Document[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as Document[];
    if (Array.isArray(obj.documents)) return obj.documents as Document[];
  }
  return [];
}

export function useDocuments(employeeId: string | null) {
  return useQuery<Document[]>({
    queryKey: docKey(employeeId ?? ""),
    queryFn: async () => {
      const { data } = await api.get("/documents", { params: { employeeId } });
      return toArray(data);
    },
    enabled: !!employeeId,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: FormData) => {
      const { data } = await api.post("/documents/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (_data, form) => {
      const employeeId = form.get("employeeId") as string;
      if (employeeId) qc.invalidateQueries({ queryKey: docKey(employeeId) });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; employeeId: string }) =>
      api.delete(`/documents/${id}`),
    onSuccess: (_data, { employeeId }) =>
      qc.invalidateQueries({ queryKey: docKey(employeeId) }),
  });
}
