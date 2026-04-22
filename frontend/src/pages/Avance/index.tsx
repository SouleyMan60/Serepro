import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import PlanGate from "../../components/ui/PlanGate";
import { useAdvances, useCreateAdvance, useApproveAdvance, useRejectAdvance, type AdvanceChannel } from "../../hooks/useAdvances";
import { useEmployees } from "../../hooks/useEmployees";

const CHANNEL_LABEL: Record<AdvanceChannel, string> = {
  WAVE: "Wave",
  ORANGE_MONEY: "Orange Money",
  MTN_MONEY: "MTN MoMo",
  BANK_TRANSFER: "Virement",
};

const CHANNEL_EMOJI: Record<AdvanceChannel, string> = {
  WAVE: "🌊",
  ORANGE_MONEY: "🍊",
  MTN_MONEY: "💛",
  BANK_TRANSFER: "🏦",
};

const STATUS_COLOR = {
  PENDING:  "warning",
  APPROVED: "success",
  REFUSED:  "error",
  REPAID:   "light",
} as const;

const STATUS_LABEL = {
  PENDING:  "En attente",
  APPROVED: "Approuvée",
  REFUSED:  "Refusée",
  REPAID:   "Remboursée",
};

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function AvanceContent() {
  const { data: advances = [], isLoading } = useAdvances();
  const { data: employees = [] } = useEmployees();
  const createMutation = useCreateAdvance();
  const approveMutation = useApproveAdvance();
  const rejectMutation = useRejectAdvance();

  const [showModal, setShowModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [amount, setAmount] = useState("");
  const [channel, setChannel] = useState<AdvanceChannel>("WAVE");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");

  const selectedEmp = employees.find((e) => e.id === selectedEmpId);
  const grossSalary = selectedEmp?.grossSalary ?? 0;
  const plafond = Math.floor(grossSalary * 0.5);
  const amountNum = Number(amount.replace(/\s/g, ""));

  // KPIs
  const pending = advances.filter((a) => a.status === "PENDING");
  const approved = advances.filter((a) => a.status === "APPROVED");
  const totalEngaged = approved.reduce((s, a) => s + a.amount, 0);
  const repaid = advances.filter((a) => a.status === "REPAID").length;
  const totalClosed = repaid + advances.filter((a) => a.status === "REFUSED").length;
  const tauxRemb = totalClosed > 0 ? Math.round((repaid / (repaid + approved.length)) * 100) : 0;

  function resetModal() {
    setSelectedEmpId("");
    setAmount("");
    setChannel("WAVE");
    setNote("");
    setFormError("");
    setShowModal(false);
  }

  function setQuickAmount(pct: number) {
    setAmount(String(Math.floor(grossSalary * pct)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!selectedEmpId) { setFormError("Sélectionnez un employé."); return; }
    if (!amountNum || amountNum < 5000) { setFormError("Montant minimum : 5 000 FCFA."); return; }
    if (amountNum > plafond) { setFormError(`Plafond 50% du salaire : ${plafond.toLocaleString("fr-FR")} FCFA.`); return; }
    try {
      await createMutation.mutateAsync({ employeeId: selectedEmpId, amount: amountNum, channel, note: note || undefined });
      resetModal();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setFormError(e?.response?.data?.error ?? e?.message ?? "Erreur lors de la création.");
    }
  }

  return (
    <>
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Avances en attente", value: pending.length, icon: "⏳" },
          { label: "Montant total engagé", value: `${totalEngaged.toLocaleString("fr-FR")} FCFA`, icon: "💰" },
          { label: "Taux de remboursement", value: `${tauxRemb}%`, icon: "📊" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
            <span className="text-2xl">{k.icon}</span>
            <p className="text-xl font-bold text-gray-800 dark:text-white/90 mt-2">{k.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Avances sur salaire
          </h3>
          <button onClick={() => setShowModal(true)} className="serepro-btn-ci text-xs px-3 py-2 rounded-lg font-semibold">
            + Nouvelle demande
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-6 w-6 text-[#F97316]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : advances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-3">💸</span>
            <p className="text-sm">Aucune avance pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {advances.map((adv) => {
              const emp = adv.employee;
              const isPending = adv.status === "PENDING";
              const approving = approveMutation.isPending && approveMutation.variables === adv.id;
              const rejecting = rejectMutation.isPending && (rejectMutation.variables as { id: string })?.id === adv.id;

              return (
                <div key={adv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  {/* Avatar */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#F97316] to-[#fb923c] text-white font-bold text-xs flex-shrink-0">
                    {emp ? initials(emp.firstName, emp.lastName) : "??"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {emp ? `${emp.lastName} ${emp.firstName}` : adv.employeeId.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {CHANNEL_EMOJI[adv.channel]} {CHANNEL_LABEL[adv.channel]} ·{" "}
                      {new Date(adv.requestedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  {/* Montant */}
                  <p className="text-sm font-bold text-gray-800 dark:text-white/90 flex-shrink-0">
                    {adv.amount.toLocaleString("fr-FR")} FCFA
                  </p>

                  {/* Badge */}
                  <Badge color={STATUS_COLOR[adv.status] ?? "light"} size="sm">
                    {STATUS_LABEL[adv.status] ?? adv.status}
                  </Badge>

                  {/* Actions PENDING */}
                  {isPending && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => approveMutation.mutate(adv.id)}
                        disabled={approving || rejecting}
                        title="Approuver"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-40"
                      >
                        {approving
                          ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                          : <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        }
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate({ id: adv.id })}
                        disabled={approving || rejecting}
                        title="Rejeter"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                      >
                        {rejecting
                          ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                          : <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        }
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Nouvelle demande d'avance</h2>
              <button onClick={resetModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Employé */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Employé</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => { setSelectedEmpId(e.target.value); setAmount(""); }}
                  className="w-full h-10 rounded-lg border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 px-3 text-sm text-gray-800 dark:text-white/90 focus:border-[#F97316] focus:outline-none"
                >
                  <option value="">Sélectionner un employé</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.lastName} {emp.firstName} — {emp.grossSalary.toLocaleString("fr-FR")} FCFA
                    </option>
                  ))}
                </select>
              </div>

              {/* Salaire + plafond */}
              {selectedEmp && (
                <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                  <span>💼 Salaire brut : <strong>{grossSalary.toLocaleString("fr-FR")} FCFA</strong></span>
                  <span>·</span>
                  <span>🔒 Plafond 50% : <strong>{plafond.toLocaleString("fr-FR")} FCFA</strong></span>
                </div>
              )}

              {/* Montants rapides */}
              {selectedEmp && (
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Montants rapides</p>
                  <div className="flex gap-2">
                    {[0.25, 0.33, 0.5].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setQuickAmount(pct)}
                        className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#F97316] hover:text-[#F97316] transition-colors"
                      >
                        {Math.round(pct * 100)}%
                        <br />
                        <span className="font-normal text-gray-400">{Math.floor(grossSalary * pct).toLocaleString("fr-FR")}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Montant */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Montant (FCFA)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={5000}
                  max={plafond || undefined}
                  placeholder="Ex : 100 000"
                  className="w-full h-10 rounded-lg border border-gray-200 bg-transparent dark:border-gray-700 px-3 text-sm text-gray-800 dark:text-white/90 focus:border-[#F97316] focus:outline-none"
                />
              </div>

              {/* Canal */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Canal de paiement</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["WAVE", "ORANGE_MONEY", "MTN_MONEY"] as AdvanceChannel[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setChannel(c)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        channel === c
                          ? "border-[#F97316] bg-orange-50 dark:bg-orange-900/20 text-[#F97316]"
                          : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      {CHANNEL_EMOJI[c]} {CHANNEL_LABEL[c]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motif */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Motif <span className="text-gray-400">(optionnel)</span></label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Ex : dépense urgente, loyer..."
                  className="w-full rounded-lg border border-gray-200 bg-transparent dark:border-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-white/90 focus:border-[#F97316] focus:outline-none resize-none"
                />
              </div>

              {formError && <p className="text-xs text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={resetModal} className="flex-1 h-10 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 h-10 rounded-lg serepro-btn-ci text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createMutation.isPending && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {createMutation.isPending ? "Envoi…" : "Soumettre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function Avance() {
  return (
    <>
      <PageMeta title="Avance Salaire | SEREPRO" description="Avances sur salaire SEREPRO" />
      <PlanGate requiredPlan="PRO">
        <AvanceContent />
      </PlanGate>
    </>
  );
}
