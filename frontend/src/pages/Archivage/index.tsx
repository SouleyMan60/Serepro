import { useState, useRef, useEffect } from "react";
import Badge from "../../components/ui/badge/Badge";
import PageMeta from "../../components/common/PageMeta";
import api from "../../config/api";
import { useEmployees } from "../../hooks/useEmployees";
import { useDocuments, useUploadDocument, useDeleteDocument, type DocumentType } from "../../hooks/useDocuments";

const GRADIENTS = [
  "from-[#F97316] to-[#fb923c]",
  "from-[#16a34a] to-[#4ade80]",
  "from-[#3b82f6] to-[#60a5fa]",
  "from-[#8b5cf6] to-[#a78bfa]",
  "from-[#ec4899] to-[#f472b6]",
  "from-[#14b8a6] to-[#2dd4bf]",
];

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: "CONTRACT",    label: "Contrat" },
  { value: "PAYSLIP",     label: "Bulletin de paie" },
  { value: "ATTESTATION", label: "Attestation" },
  { value: "DIPLOMA",     label: "Diplôme" },
  { value: "REPORT",      label: "Rapport" },
  { value: "OTHER",       label: "Autre" },
];

const TYPE_BADGE: Record<DocumentType, "primary" | "success" | "info" | "warning" | "light"> = {
  CONTRACT:    "primary",
  PAYSLIP:     "success",
  ATTESTATION: "info",
  DIPLOMA:     "warning",
  REPORT:      "light",
  OTHER:       "light",
};

const TYPE_LABEL: Record<DocumentType, string> = {
  CONTRACT:    "Contrat",
  PAYSLIP:     "Bulletin",
  ATTESTATION: "Attestation",
  DIPLOMA:     "Diplôme",
  REPORT:      "Rapport",
  OTHER:       "Autre",
};

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function Archivage() {
  const { data: employees = [], isLoading: empLoading } = useEmployees();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchDoc, setSearchDoc] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [docType, setDocType] = useState<DocumentType>("CONTRACT");
  const [docName, setDocName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedId && employees.length > 0) setSelectedId(employees[0].id);
  }, [employees, selectedId]);

  const { data: documents = [], isLoading: docsLoading } = useDocuments(selectedId);
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();

  const employee = employees.find((e) => e.id === selectedId);
  const docsFiltered = documents.filter((d) =>
    d.name.toLowerCase().includes(searchDoc.toLowerCase())
  );
  const totalDocs = documents.length;

  async function handleDownload(id: string) {
    setDownloadingId(id);
    try {
      const response = await api.get(`/documents/${id}/download`);
      const url = response.data?.data?.url || response.data?.url;
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!selectedId) return;
    if (!window.confirm("Supprimer ce document définitivement ?")) return;
    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync({ id, employeeId: selectedId });
    } finally {
      setDeletingId(null);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFileError("");
    if (f && f.size > 10 * 1024 * 1024) {
      setFileError("Fichier trop volumineux (max 10 Mo)");
      setFile(null);
      return;
    }
    setFile(f);
    if (f && !docName) setDocName(f.name.replace(/\.[^.]+$/, ""));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !selectedId) return;
    const form = new FormData();
    form.append("file", file);
    form.append("employeeId", selectedId);
    form.append("type", docType);
    form.append("name", docName || file.name);
    await uploadMutation.mutateAsync(form);
    setShowModal(false);
    setFile(null);
    setDocName("");
    setDocType("CONTRACT");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      <PageMeta title="Archivage | SEREPRO" description="Archivage documents RH SEREPRO" />

      <div className="grid grid-cols-12 gap-6">
        {/* ── Sidebar dossiers ─────────────────────────────── */}
        <div className="col-span-12 lg:col-span-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Dossiers employés
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {empLoading ? "Chargement…" : `${employees.length} dossier${employees.length > 1 ? "s" : ""}`}
            </p>
          </div>

          {empLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-6 w-6 text-[#F97316]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : (
            <ul className="p-2 space-y-1">
              {employees.map((emp, idx) => (
                <li key={emp.id}>
                  <button
                    onClick={() => { setSelectedId(emp.id); setSearchDoc(""); }}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                      selectedId === emp.id
                        ? "bg-gradient-to-r from-[#F97316]/10 to-[#16a34a]/10 border border-[#F97316]/20"
                        : "hover:bg-gray-50 dark:hover:bg-white/[0.02] border border-transparent"
                    }`}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENTS[idx % GRADIENTS.length]} text-white font-bold text-xs flex-shrink-0 shadow-sm`}>
                      {initials(emp.firstName, emp.lastName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">
                        {emp.lastName} {emp.firstName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{emp.position}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Documents panel ──────────────────────────────── */}
        <div className="col-span-12 lg:col-span-8 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 gap-4 flex-wrap">
            {employee ? (
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENTS[employees.indexOf(employee) % GRADIENTS.length]} text-white font-bold text-xs shadow-sm`}>
                  {initials(employee.firstName, employee.lastName)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {employee.lastName} {employee.firstName}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {docsLoading ? "Chargement…" : `${totalDocs} document${totalDocs > 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchDoc}
                onChange={(e) => setSearchDoc(e.target.value)}
                placeholder="Rechercher…"
                className="h-9 rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-800 dark:text-white/90 focus:border-[#F97316] focus:outline-none w-40"
              />
              <button
                onClick={() => setShowModal(true)}
                disabled={!employee}
                className="serepro-btn-ci text-xs px-3 py-2 rounded-lg font-semibold disabled:opacity-40"
              >
                + Ajouter
              </button>
            </div>
          </div>

          {/* List */}
          {docsLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin h-6 w-6 text-[#F97316]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : docsFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <span className="text-4xl mb-3">📂</span>
              <p className="text-sm">Aucun document trouvé</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {docsFiltered.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
                >
                  <span className="text-2xl flex-shrink-0">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatSize(doc.size)}
                      {doc.size ? " · " : ""}
                      {new Date(doc.uploadedAt).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge color={TYPE_BADGE[doc.type] ?? "light"} size="sm">
                    {TYPE_LABEL[doc.type] ?? doc.type}
                  </Badge>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownload(doc.id)}
                      disabled={downloadingId === doc.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#F97316] hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors disabled:opacity-50"
                      title="Télécharger"
                    >
                      {downloadingId === doc.id
                        ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                        : <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      }
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      {deletingId === doc.id
                        ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                        : <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Upload ────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
                Ajouter un document
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Type de document
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="w-full h-10 rounded-lg border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 px-3 text-sm text-gray-800 dark:text-white/90 focus:border-[#F97316] focus:outline-none"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Nom du document
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="Ex : Contrat CDI 2024"
                  className="w-full h-10 rounded-lg border border-gray-200 bg-transparent dark:border-gray-700 px-3 text-sm text-gray-800 dark:text-white/90 focus:border-[#F97316] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Fichier <span className="text-gray-400">(PDF, JPG, PNG — max 10 Mo)</span>
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-[#F97316] hover:file:bg-orange-100 cursor-pointer"
                />
                {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-10 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!file || uploadMutation.isPending}
                  className="flex-1 h-10 rounded-lg serepro-btn-ci text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploadMutation.isPending && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {uploadMutation.isPending ? "Envoi…" : "Envoyer"}
                </button>
              </div>

              {uploadMutation.isError && (
                <p className="text-xs text-red-500 text-center">
                  Erreur lors de l'upload. Réessayez.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
