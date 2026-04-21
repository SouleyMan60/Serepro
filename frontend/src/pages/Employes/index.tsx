import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import PageMeta from "../../components/common/PageMeta";
import { Modal } from "../../components/ui/modal";
import {
  useEmployees,
  useCreateEmployee,
  type Employee,
  type CreateEmployeeInput,
} from "../../hooks/useEmployees";

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

function initiales(e: Employee) {
  return `${e.firstName[0] ?? ""}${e.lastName[0] ?? ""}`.toUpperCase();
}

function gradient(e: Employee) {
  const idx = (e.firstName.charCodeAt(0) + e.lastName.charCodeAt(0)) % GRADIENTS.length;
  return GRADIENTS[idx];
}

function statutLabel(s: Employee["status"]): "Actif" | "Congé" | "Suspendu" {
  if (s === "ACTIVE") return "Actif";
  if (s === "ON_LEAVE") return "Congé";
  return "Suspendu";
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#F97316" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 dark:bg-gray-800">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold w-6 text-right flex-shrink-0" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function StatutBadge({ statut }: { statut: "Actif" | "Congé" | "Suspendu" }) {
  if (statut === "Actif") return <Badge color="success" size="sm">{statut}</Badge>;
  if (statut === "Congé") return <Badge color="warning" size="sm">{statut}</Badge>;
  return <Badge color="error" size="sm">{statut}</Badge>;
}

const EMPTY_FORM: CreateEmployeeInput = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  position: "",
  department: "",
  contractType: "CDI",
  grossSalary: 0,
  paymentChannel: "WAVE",
  startDate: "",
};

const PAGE_SIZES = [10, 20, 50];

const CANAL_LABELS: Record<string, string> = {
  WAVE: "Wave",
  ORANGE_MONEY: "Orange Money",
  MTN_MONEY: "MTN Money",
};

export default function Employes() {
  const { data: employes = [], isLoading, isError } = useEmployees();
  const createMutation = useCreateEmployee();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateEmployeeInput>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const actifs = employes.filter((e) => e.status === "ACTIVE").length;
  const totalPages = Math.max(1, Math.ceil(employes.length / pageSize));
  const paginated = employes.slice((page - 1) * pageSize, page * pageSize);

  function handleOpen() {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function handleClose() {
    if (createMutation.isPending) return;
    setShowModal(false);
  }

  function set<K extends keyof CreateEmployeeInput>(k: K, v: CreateEmployeeInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.firstName || !form.lastName || !form.phone || !form.position || !form.department || !form.startDate) {
      setFormError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    const payload: CreateEmployeeInput = {
      ...form,
      email: form.email || undefined,
      grossSalary: parseInt(String(form.grossSalary), 10),
      startDate: new Date(form.startDate).toISOString(),
    };
    try {
      await createMutation.mutateAsync(payload);
      setShowModal(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const apiMsg =
        axiosErr?.response?.data?.message ??
        axiosErr?.response?.data?.error ??
        axiosErr?.message ??
        "Erreur inconnue";
      setFormError(`Erreur API : ${apiMsg}`);
    }
  }

  return (
    <>
      <PageMeta title="Employés | SEREPRO" description="Liste des employés SEREPRO" />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Employés</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoading ? "Chargement…" : `${employes.length} employés · ${actifs} actifs`}
          </p>
        </div>
        <button onClick={handleOpen} className="serepro-btn-ci text-sm px-4 py-2.5 rounded-lg font-semibold">
          + Ajouter
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-[#F97316]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 px-6 py-4 text-sm text-red-600 dark:text-red-400">
          Impossible de charger les employés. Vérifiez votre connexion et réessayez.
        </div>
      )}

      {!isLoading && !isError && employes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Aucun employé</p>
          <p className="text-sm text-gray-400">Ajoutez votre premier employé</p>
          <button onClick={handleOpen} className="serepro-btn-ci text-sm px-5 py-2.5 rounded-lg font-semibold mt-1">
            + Ajouter un employé
          </button>
        </div>
      )}

      {!isLoading && !isError && employes.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.02]">
                  {["Employé", "Département", "Canal", "Salaire brut", "Score crédit", "Statut"].map((h) => (
                    <TableCell key={h} isHeader className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((e) => {
                  const score = e.creditScore ?? 0;
                  const statut = statutLabel(e.status);
                  return (
                    <TableRow
                      key={e.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors last:border-0"
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${gradient(e)} text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                            {initiales(e)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                              {e.firstName} {e.lastName}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{e.position}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{e.department}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {CANAL_LABELS[e.paymentChannel] ?? e.paymentChannel}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-800 dark:text-white/90 serepro-amount">
                          {e.grossSalary.toLocaleString("fr-FR")} FCFA
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {score > 0 ? <ScoreBar score={score} /> : <span className="text-xs text-gray-400">—</span>}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <StatutBadge statut={statut} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Par page</span>
              <select
                className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 outline-none focus:border-[#F97316]"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              {Math.min((page - 1) * pageSize + 1, employes.length)}–{Math.min(page * pageSize, employes.length)} sur {employes.length} employés
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={handleClose} className="max-w-2xl mx-4 p-6 sm:p-8">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-6">
          Nouvel employé
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prénom / Nom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prénom *</label>
              <input className="serepro-input w-full" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Koné" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom *</label>
              <input className="serepro-input w-full" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Aboubakar" required />
            </div>
          </div>

          {/* Téléphone / Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Téléphone *</label>
              <input className="serepro-input w-full" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+225 07 00 00 00" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
              <input className="serepro-input w-full" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@exemple.com" />
            </div>
          </div>

          {/* Poste / Département */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Poste *</label>
              <input className="serepro-input w-full" value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="Directeur Commercial" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Département *</label>
              <input className="serepro-input w-full" value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="Commercial" required />
            </div>
          </div>

          {/* Type contrat / Canal paiement */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type contrat *</label>
              <select className="serepro-input w-full" value={form.contractType} onChange={(e) => set("contractType", e.target.value as CreateEmployeeInput["contractType"])}>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="STAGE">STAGE</option>
                <option value="FREELANCE">FREELANCE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Canal paiement *</label>
              <select className="serepro-input w-full" value={form.paymentChannel} onChange={(e) => set("paymentChannel", e.target.value as CreateEmployeeInput["paymentChannel"])}>
                <option value="WAVE">WAVE</option>
                <option value="ORANGE_MONEY">ORANGE MONEY</option>
                <option value="MTN_MONEY">MTN MONEY</option>
              </select>
            </div>
          </div>

          {/* Salaire / Date début */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Salaire brut (FCFA) *</label>
              <input className="serepro-input w-full" type="number" min={0} value={form.grossSalary || ""} onChange={(e) => set("grossSalary", Number(e.target.value))} placeholder="500000" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date début *</label>
              <input className="serepro-input w-full" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} required />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-lg px-3 py-2">{formError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} disabled={createMutation.isPending} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors disabled:opacity-50">
              Annuler
            </button>
            <button type="submit" disabled={createMutation.isPending} className="flex-1 serepro-btn-ci text-sm px-4 py-2.5 rounded-lg font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              {createMutation.isPending && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {createMutation.isPending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
