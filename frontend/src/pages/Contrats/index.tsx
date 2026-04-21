import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Badge from "../../components/ui/badge/Badge";
import PageMeta from "../../components/common/PageMeta";
import api from "../../config/api";
import { usePayslips, useGeneratePayslips, type Payslip } from "../../hooks/usePayslips";
import { useEmployees, type Employee } from "../../hooks/useEmployees";

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const GRADIENTS = [
  "from-[#F97316] to-[#fb923c]",
  "from-[#16a34a] to-[#4ade80]",
  "from-[#3b82f6] to-[#60a5fa]",
  "from-[#8b5cf6] to-[#a78bfa]",
  "from-[#ec4899] to-[#f472b6]",
  "from-[#F97316] to-[#16a34a]",
  "from-[#06b6d4] to-[#67e8f9]",
  "from-[#f59e0b] to-[#fcd34d]",
];

const CONTRACT_COLORS: Record<string, "success" | "info" | "warning" | "light"> = {
  CDI: "success",
  CDD: "info",
  STAGE: "warning",
  FREELANCE: "light",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avatarGradient(firstName: string, lastName: string) {
  const idx = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % GRADIENTS.length;
  return GRADIENTS[idx];
}

function initiales(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function contractStatus(emp: Employee): "Actif" | "Expiré" | "En attente" {
  const now = new Date();
  const start = new Date(emp.startDate);
  if (start > now) return "En attente";
  if (emp.contractType === "CDD" && emp.endDate) {
    if (new Date(emp.endDate) < now) return "Expiré";
  }
  return "Actif";
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

function fmtM(n: number) {
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M`
    : `${(n / 1_000).toFixed(0)}K`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin h-8 w-8 text-[#F97316]" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-800 dark:text-white/90 serepro-amount">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function StatutContratBadge({ statut }: { statut: "Actif" | "Expiré" | "En attente" }) {
  if (statut === "Actif") return <Badge color="success" size="sm">Actif</Badge>;
  if (statut === "Expiré") return <Badge color="error" size="sm">Expiré</Badge>;
  return <Badge color="warning" size="sm">En attente</Badge>;
}

// ─── Tab: Bulletins ───────────────────────────────────────────────────────────

function BulletinsTab({
  month, year,
  onMonthChange, onYearChange,
}: {
  month: number; year: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
}) {
  const { data: payslips = [], isLoading, isError } = usePayslips(month, year);
  const generateMutation = useGeneratePayslips();
  const [genError, setGenError] = useState("");
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  const masseSalariale = payslips.reduce((s, p) => s + p.netSalary, 0);
  const cnpsTotal = payslips.reduce((s, p) => s + (p.cnpsEmployer ?? 0), 0);
  const itsTotal = payslips.reduce((s, p) => s + (p.its ?? 0), 0);
  const cmuTotal = payslips.reduce((s, p) => s + (p.cmu ?? 0), 0);
  const generes = payslips.filter((p) => p.status === "GENERATED").length;

  async function handleGenerate() {
    setGenError("");
    try {
      await generateMutation.mutateAsync({ month, year });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setGenError(e?.response?.data?.message ?? e?.message ?? "Erreur génération");
    }
  }

  async function downloadPdf(payslip: Payslip) {
    console.log("payslip:", payslip);
    const id = typeof payslip.id === "string" ? payslip.id : String(payslip.id);
    setPdfLoadingId(id);
    try {
      const response = await api.get(`/payslips/${id}/download`);
      const url = response.data?.data?.url || response.data?.url;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // silent — user will retry
    } finally {
      setPdfLoadingId(null);
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <>
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <select
            className="serepro-input text-sm py-2"
            value={month}
            onChange={(e) => onMonthChange(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className="serepro-input text-sm py-2"
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="serepro-btn-ci text-sm px-4 py-2.5 rounded-lg font-semibold disabled:opacity-60 flex items-center gap-2"
        >
          {generateMutation.isPending && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {generateMutation.isPending ? "Génération…" : "Générer les bulletins"}
        </button>
      </div>

      {genError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {genError}
        </div>
      )}

      {/* KPI cards */}
      {!isLoading && payslips.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <KpiCard label="Masse salariale nette" value={`${fmtM(masseSalariale)} FCFA`} sub={`${generes}/${payslips.length} générés`} />
          <KpiCard label="CNPS employeur" value={`${fmtM(cnpsTotal)} FCFA`} />
          <KpiCard label="ITS total" value={`${fmtM(itsTotal)} FCFA`} />
          <KpiCard label="CMU total" value={`${fmtM(cmuTotal)} FCFA`} />
        </div>
      )}

      {isLoading && <Spinner />}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 px-6 py-4 text-sm text-red-600 dark:text-red-400">
          Impossible de charger les bulletins.
        </div>
      )}

      {!isLoading && !isError && payslips.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="w-14 h-14 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-medium text-gray-600 dark:text-gray-400">Aucun bulletin pour {MONTHS[month - 1]} {year}</p>
          <p className="text-sm text-gray-400">Cliquez sur "Générer les bulletins" pour créer les fiches de paie</p>
        </div>
      )}

      {!isLoading && !isError && payslips.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] divide-y divide-gray-100 dark:divide-gray-800">
          {payslips.map((p) => {
            const fn = p.employee?.firstName ?? "";
            const ln = p.employee?.lastName ?? "";
            const isDownloading = pdfLoadingId === p.id;
            return (
              <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient(fn || "A", ln || "B")} text-white font-bold text-xs flex-shrink-0 shadow-sm`}>
                  {fn && ln ? initiales(fn, ln) : "—"}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {fn || ln ? `${fn} ${ln}`.trim() : `Employé #${p.employeeId.slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.employee?.position ?? ""}</p>
                </div>

                <div className="text-right flex-shrink-0 mr-2 hidden sm:block">
                  <p className="text-sm font-bold text-gray-800 dark:text-white/90 serepro-amount">
                    {fmt(p.netSalary)} FCFA
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Brut : {fmt(p.grossSalary)}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {p.status === "GENERATED"
                    ? <Badge color="success" size="sm">Généré</Badge>
                    : <Badge color="warning" size="sm">En attente</Badge>
                  }
                  {p.status === "GENERATED" && (
                    <button
                      onClick={() => downloadPdf(p)}
                      disabled={isDownloading}
                      className="text-gray-400 hover:text-[#F97316] transition-colors disabled:opacity-50"
                      title="Télécharger le PDF"
                    >
                      {isDownloading
                        ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                        : <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      }
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContractDoc {
  id: string;
  employeeId: string;
  name: string;
  uploadedAt: string;
}

interface ContractOptions {
  missions: string;
  responsibilities: string;
  advantages: string;
  trialPeriodDays: string;
  workLocation: string;
  hasRulesAck: boolean;
  nonCompete: boolean;
}

const DEFAULT_OPTIONS: ContractOptions = {
  missions: "",
  responsibilities: "",
  advantages: "",
  trialPeriodDays: "",
  workLocation: "Abidjan",
  hasRulesAck: false,
  nonCompete: false,
};

// ─── Contract Modal ───────────────────────────────────────────────────────────

function ContractModal({
  emp,
  isRegenerating,
  onClose,
  onSubmit,
  isLoading,
  error,
}: {
  emp: Employee;
  isRegenerating: boolean;
  onClose: () => void;
  onSubmit: (opts: ContractOptions) => void;
  isLoading: boolean;
  error: string;
}) {
  const [opts, setOpts] = useState<ContractOptions>({ ...DEFAULT_OPTIONS });
  const set = <K extends keyof ContractOptions>(k: K, v: ContractOptions[K]) =>
    setOpts((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60">
      <div className="w-full max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">

        {/* Header — fixe */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <p className="text-base font-semibold text-gray-800 dark:text-white/90">
              {isRegenerating ? "Régénérer le contrat" : "Générer le contrat"}
            </p>
            <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-2">
              <span className="font-medium text-gray-600 dark:text-gray-300">{emp.firstName} {emp.lastName}</span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              {emp.position}
              {emp.department && (
                <><span className="text-gray-300 dark:text-gray-600">·</span>{emp.department}</>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto max-h-[70vh] px-6 py-5 space-y-5">

          {/* Ligne 1 : Lieu + Période d'essai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Lieu de travail
              </label>
              <input
                type="text"
                value={opts.workLocation}
                onChange={(e) => set("workLocation", e.target.value)}
                className="serepro-input text-sm w-full"
                placeholder="Abidjan"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Période d'essai <span className="text-gray-400">(jours)</span>
              </label>
              <input
                type="number"
                value={opts.trialPeriodDays}
                onChange={(e) => set("trialPeriodDays", e.target.value)}
                className="serepro-input text-sm w-full"
                placeholder="Ex : 30"
                min={0}
              />
            </div>
          </div>

          {/* Ligne 2 : Missions + Responsabilités */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Missions principales <span className="text-gray-400">(une par ligne)</span>
              </label>
              <textarea
                value={opts.missions}
                onChange={(e) => set("missions", e.target.value)}
                className="serepro-input text-sm w-full resize-none min-h-[100px]"
                placeholder={"Assurer la gestion comptable\nPréparer les déclarations fiscales…"}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Responsabilités <span className="text-gray-400">(une par ligne)</span>
              </label>
              <textarea
                value={opts.responsibilities}
                onChange={(e) => set("responsibilities", e.target.value)}
                className="serepro-input text-sm w-full resize-none min-h-[100px]"
                placeholder={"Encadrer l'équipe terrain\nRendre compte à la direction…"}
              />
            </div>
          </div>

          {/* Avantages — pleine largeur */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Avantages <span className="text-gray-400">(transport, repas, logement… — une par ligne)</span>
            </label>
            <textarea
              value={opts.advantages}
              onChange={(e) => set("advantages", e.target.value)}
              className="serepro-input text-sm w-full resize-none min-h-[100px]"
              placeholder={"Indemnité de transport : 30 000 FCFA/mois\nRepas : 15 000 FCFA/mois…"}
            />
          </div>

          {/* Checkboxes */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
            <label className="flex items-start gap-3 px-4 py-3.5 cursor-pointer group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors rounded-t-xl">
              <input
                type="checkbox"
                checked={opts.nonCompete}
                onChange={(e) => set("nonCompete", e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#F97316] flex-shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  Clause de non-concurrence
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Interdit l'exercice d'une activité concurrente pendant 12 mois après la rupture
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 px-4 py-3.5 cursor-pointer group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors rounded-b-xl">
              <input
                type="checkbox"
                checked={opts.hasRulesAck}
                onChange={(e) => set("hasRulesAck", e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#F97316] flex-shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  Règlement intérieur
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Le salarié reconnaît avoir pris connaissance du règlement intérieur de l'entreprise
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer — fixe en bas */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={() => onSubmit(opts)}
            disabled={isLoading}
            className="serepro-btn-ci flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg disabled:opacity-60"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {isLoading ? "Génération en cours…" : isRegenerating ? "Régénérer" : "Générer le contrat"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Contrats ────────────────────────────────────────────────────────────

function ContratsTab() {
  const qc = useQueryClient();
  const { data: employees = [], isLoading, isError } = useEmployees();

  const { data: contractDocs = [] } = useQuery<ContractDoc[]>({
    queryKey: ["documents", "CONTRACT"],
    queryFn: async () => {
      const { data } = await api.get<{ data: ContractDoc[] }>("/documents", { params: { type: "CONTRACT" } });
      return data.data ?? [];
    },
  });

  // Latest contract per employee
  const contractMap = contractDocs.reduce<Record<string, ContractDoc>>((acc, doc) => {
    const existing = acc[doc.employeeId];
    if (!existing || new Date(doc.uploadedAt) > new Date(existing.uploadedAt)) {
      acc[doc.employeeId] = doc;
    }
    return acc;
  }, {});

  const [modal, setModal] = useState<{ emp: Employee; regenerate: boolean } | null>(null);

  useEffect(() => {
    const header = document.querySelector("header");
    if (header) header.style.zIndex = modal ? "0" : "";
  }, [modal]);

  const [generating, setGenerating] = useState(false);
  const [modalError, setModalError] = useState("");
  const [downloadLoadingId, setDownloadLoadingId] = useState<string | null>(null);

  async function handleSubmit(opts: ContractOptions) {
    if (!modal) return;
    setGenerating(true);
    setModalError("");
    try {
      const response = await api.post<{ data: { url: string } }>("/documents/generate-contract", {
        employeeId: modal.emp.id,
        ...opts,
      });
      const url = response.data.data.url;
      window.open(url, "_blank", "noopener,noreferrer");
      await qc.invalidateQueries({ queryKey: ["documents", "CONTRACT"] });
      setModal(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setModalError(e?.response?.data?.message ?? e?.message ?? "Erreur génération contrat");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload(docId: string) {
    setDownloadLoadingId(docId);
    try {
      const { data } = await api.get<{ data: { url: string } }>(`/documents/${docId}/download`);
      window.open(data.data.url, "_blank", "noopener,noreferrer");
    } catch {
      // silent — user will retry
    } finally {
      setDownloadLoadingId(null);
    }
  }

  return (
    <>
      {modal && (
        <ContractModal
          emp={modal.emp}
          isRegenerating={modal.regenerate}
          onClose={() => { setModal(null); setModalError(""); }}
          onSubmit={handleSubmit}
          isLoading={generating}
          error={modalError}
        />
      )}

      {isLoading && <Spinner />}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 px-6 py-4 text-sm text-red-600 dark:text-red-400">
          Impossible de charger les employés.
        </div>
      )}

      {!isLoading && !isError && employees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="font-medium text-gray-600 dark:text-gray-400">Aucun employé</p>
          <p className="text-sm text-gray-400">Ajoutez des employés pour gérer leurs contrats</p>
        </div>
      )}

      {!isLoading && !isError && employees.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] divide-y divide-gray-100 dark:divide-gray-800">
          {employees.map((emp) => {
            const statut = contractStatus(emp);
            const existingDoc = contractMap[emp.id];
            const isDownloading = downloadLoadingId === existingDoc?.id;

            return (
              <div key={emp.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient(emp.firstName, emp.lastName)} text-white font-bold text-xs flex-shrink-0 shadow-sm`}>
                  {initiales(emp.firstName, emp.lastName)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{emp.position} · {emp.department}</p>
                </div>

                <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 mr-2 text-right">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Depuis {new Date(emp.startDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                  {emp.contractType === "CDD" && emp.endDate && (
                    <span className="text-xs text-gray-400">
                      → {new Date(emp.endDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge color={CONTRACT_COLORS[emp.contractType] ?? "light"} size="sm">
                    {emp.contractType}
                  </Badge>
                  <StatutContratBadge statut={statut} />

                  {existingDoc ? (
                    <>
                      {/* Télécharger */}
                      <button
                        onClick={() => handleDownload(existingDoc.id)}
                        disabled={isDownloading}
                        title="Télécharger le contrat"
                        className="flex items-center justify-center h-7 w-7 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-[#F97316] hover:border-[#F97316] transition-colors disabled:opacity-50"
                      >
                        {isDownloading
                          ? <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                          : <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        }
                      </button>
                      {/* Régénérer */}
                      <button
                        onClick={() => { setModal({ emp, regenerate: true }); setModalError(""); }}
                        title="Régénérer le contrat"
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-[#F97316] hover:text-[#F97316] transition-colors whitespace-nowrap"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Régénérer
                      </button>
                    </>
                  ) : (
                    /* Générer contrat */
                    <button
                      onClick={() => { setModal({ emp, regenerate: false }); setModalError(""); }}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#F97316] text-[#F97316] hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors whitespace-nowrap"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Générer contrat
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Contrats() {
  const now = new Date();
  const [activeTab, setActiveTab] = useState<"bulletins" | "contrats">("bulletins");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  return (
    <>
      <PageMeta title="Contrats & Paie | SEREPRO" description="Gestion bulletins de paie et contrats SEREPRO" />

      {/* Page header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Contrats & Paie</h2>
          <p className="text-sm text-gray-500 mt-0.5">Bulletins de paie et gestion des contrats</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 dark:bg-white/[0.05] rounded-xl w-fit">
        {(["bulletins", "contrats"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-white/90 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab === "bulletins" ? "Bulletins de paie" : "Contrats"}
          </button>
        ))}
      </div>

      {activeTab === "bulletins" && (
        <BulletinsTab
          month={month}
          year={year}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />
      )}

      {activeTab === "contrats" && <ContratsTab />}
    </>
  );
}
