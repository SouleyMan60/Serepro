import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import PlanGate from "../../components/ui/PlanGate";
import { useSavings, useCreateSaving, useToggleSaving } from "../../hooks/useSavings";
import { useEmployees } from "../../hooks/useEmployees";

const GRADIENTS = [
  "from-[#16a34a] to-[#4ade80]",
  "from-[#F97316] to-[#fb923c]",
  "from-[#3b82f6] to-[#60a5fa]",
  "from-[#8b5cf6] to-[#a78bfa]",
  "from-[#ec4899] to-[#f472b6]",
];

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000];

function EpargneContent() {
  const { data: savings = [], isLoading } = useSavings();
  const { data: employees = [] } = useEmployees();
  const createMutation = useCreateSaving();
  const toggleMutation = useToggleSaving();

  const [showModal, setShowModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState(10000);
  const [goal, setGoal] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [formError, setFormError] = useState("");

  // Employés sans plan existant
  const empWithSaving = new Set(savings.map((s) => s.employeeId));
  const eligibleEmps = employees.filter((e) => e.status === "ACTIVE" && !empWithSaving.has(e.id));

  // KPIs
  const active = savings.filter((s) => s.isActive);
  const totalBalance = savings.reduce((s, p) => s + p.balance, 0);
  const totalMonthly = active.reduce((s, p) => s + p.monthlyAmount, 0);
  const avgMonthly = active.length ? Math.round(totalMonthly / active.length) : 0;

  function resetModal() {
    setSelectedEmpId(""); setMonthlyAmount(10000); setGoal(""); setGoalAmount(""); setFormError("");
    setShowModal(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!selectedEmpId) { setFormError("Sélectionnez un employé."); return; }
    if (monthlyAmount < 1000) { setFormError("Montant minimum : 1 000 FCFA/mois."); return; }
    try {
      await createMutation.mutateAsync({
        employeeId: selectedEmpId,
        monthlyAmount,
        goal: goal || undefined,
        goalAmount: goalAmount ? Number(goalAmount) : undefined,
      });
      resetModal();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setFormError(e?.response?.data?.error ?? e?.message ?? "Erreur lors de la création.");
    }
  }

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Solde total épargné", value: `${fmt(totalBalance)} FCFA`, icon: "💰" },
          { label: "Employés participants", value: `${active.length}`, icon: "👥" },
          { label: "Versement moyen / mois", value: avgMonthly > 0 ? `${fmt(avgMonthly)} FCFA` : "—", icon: "📈" },
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
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Plans d'épargne actifs</h3>
          <button
            onClick={() => setShowModal(true)}
            disabled={eligibleEmps.length === 0}
            className="serepro-btn-ci text-xs px-3 py-2 rounded-lg font-semibold disabled:opacity-40"
          >
            + Nouveau plan
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-6 w-6 text-[#F97316]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : savings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-3">🐷</span>
            <p className="text-sm">Aucun plan d'épargne pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {savings.map((saving, idx) => {
              const emp = saving.employee;
              const toggling = toggleMutation.isPending && toggleMutation.variables === saving.id;
              const pct = saving.goalAmount && saving.goalAmount > 0
                ? Math.min(100, Math.round((saving.balance / saving.goalAmount) * 100))
                : null;

              return (
                <div key={saving.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  {/* Avatar */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENTS[idx % GRADIENTS.length]} text-white font-bold text-xs flex-shrink-0`}>
                    {emp ? initials(emp.firstName, emp.lastName) : "??"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {emp ? `${emp.lastName} ${emp.firstName}` : saving.employeeId.slice(0, 8)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-400">
                        {fmt(saving.monthlyAmount)} FCFA/mois
                        {saving.goal ? ` · ${saving.goal}` : ""}
                      </p>
                    </div>
                    {/* Barre progression objectif */}
                    {pct !== null && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#16a34a] to-[#4ade80] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{pct}%</span>
                      </div>
                    )}
                  </div>

                  {/* Solde */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-white/90">{fmt(saving.balance)} FCFA</p>
                    {saving.goalAmount && (
                      <p className="text-xs text-gray-400 mt-0.5">/ {fmt(saving.goalAmount)}</p>
                    )}
                  </div>

                  {/* Badge + toggle */}
                  <Badge color={saving.isActive ? "success" : "warning"} size="sm">
                    {saving.isActive ? "Actif" : "Pausé"}
                  </Badge>

                  <button
                    onClick={() => toggleMutation.mutate(saving.id)}
                    disabled={toggling}
                    title={saving.isActive ? "Mettre en pause" : "Réactiver"}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#F97316] hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-40 flex-shrink-0"
                  >
                    {toggling ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : saving.isActive ? (
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
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
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Nouveau plan d'épargne</h2>
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
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 px-3 text-sm text-gray-800 dark:text-white/90 focus:border-[#F97316] focus:outline-none"
                >
                  <option value="">Sélectionner un employé</option>
                  {eligibleEmps.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.lastName} {emp.firstName} — {fmt(emp.grossSalary)} FCFA
                    </option>
                  ))}
                </select>
                {eligibleEmps.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">Tous les employés actifs ont déjà un plan.</p>
                )}
              </div>

              {/* Montant mensuel */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Versement mensuel</label>
                  <span className="text-xs font-bold text-gray-800 dark:text-white/90">{fmt(monthlyAmount)} FCFA</span>
                </div>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {QUICK_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setMonthlyAmount(a)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                        monthlyAmount === a
                          ? "border-[#16a34a] bg-green-50 dark:bg-green-900/20 text-[#16a34a]"
                          : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      {fmt(a)}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                  min={1000}
                  step={1000}
                  className="w-full h-10 rounded-lg border border-gray-200 bg-transparent dark:border-gray-700 px-3 text-sm text-gray-800 dark:text-white/90 focus:border-[#F97316] focus:outline-none"
                />
              </div>

              {/* Objectif (optionnel) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Objectif <span className="text-gray-400">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Ex : fonds d'urgence, achat véhicule…"
                  className="w-full h-10 rounded-lg border border-gray-200 bg-transparent dark:border-gray-700 px-3 text-sm text-gray-800 dark:text-white/90 focus:border-[#F97316] focus:outline-none"
                />
              </div>

              {/* Montant objectif (optionnel) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Montant cible <span className="text-gray-400">(optionnel)</span>
                </label>
                <input
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  min={0}
                  step={10000}
                  placeholder="Ex : 500 000"
                  className="w-full h-10 rounded-lg border border-gray-200 bg-transparent dark:border-gray-700 px-3 text-sm text-gray-800 dark:text-white/90 focus:border-[#F97316] focus:outline-none"
                />
              </div>

              {formError && <p className="text-xs text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={resetModal} className="flex-1 h-10 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || eligibleEmps.length === 0}
                  className="flex-1 h-10 rounded-lg serepro-btn-ci text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createMutation.isPending && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {createMutation.isPending ? "Création…" : "Créer le plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function Epargne() {
  return (
    <>
      <PageMeta title="Épargne Auto | SEREPRO" description="Épargne automatique employés SEREPRO" />
      <PlanGate requiredPlan="PRO">
        <EpargneContent />
      </PlanGate>
    </>
  );
}
