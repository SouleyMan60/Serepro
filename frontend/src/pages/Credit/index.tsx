import { useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import PlanGate from "../../components/ui/PlanGate";
import { useLoans, useCreateLoan, useApproveLoan, useRejectLoan } from "../../hooks/useLoans";
import { useEmployees } from "../../hooks/useEmployees";

// Taux API : 10% annuel → 0.833% mensuel
const MONTHLY_RATE = 0.10 / 12;

function calcMensualite(amount: number, duration: number): number {
  if (!amount || !duration) return 0;
  return Math.round((amount * MONTHLY_RATE) / (1 - Math.pow(1 + MONTHLY_RATE, -duration)));
}

function formatFCFA(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

const STATUS_COLOR = {
  ELIGIBLE:  "info",
  PENDING:   "warning",
  APPROVED:  "success",
  REFUSED:   "error",
  ACTIVE:    "primary",
  COMPLETED: "light",
} as const;

const STATUS_LABEL: Record<string, string> = {
  ELIGIBLE:  "Éligible",
  PENDING:   "En attente",
  APPROVED:  "Approuvé",
  REFUSED:   "Refusé",
  ACTIVE:    "Actif",
  COMPLETED: "Remboursé",
};

function scoreColor(score: number) {
  if (score >= 700) return "#16a34a";
  if (score >= 500) return "#F97316";
  return "#ef4444";
}

function scoreLabel(score: number) {
  if (score >= 700) return "Excellent";
  if (score >= 500) return "Moyen";
  return "Faible";
}

function radialOptions(score: number): ApexOptions {
  const pct = Math.round((score / 850) * 100);
  return {
    chart: { fontFamily: "Outfit, sans-serif", type: "radialBar", sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -130,
        endAngle: 130,
        hollow: { size: "65%" },
        track: { background: "#f3f4f6", strokeWidth: "100%", margin: 0 },
        dataLabels: {
          name: { show: true, offsetY: 20, fontSize: "12px", color: "#667085", fontWeight: "400" },
          value: {
            show: true, offsetY: -15, fontSize: "32px", fontWeight: "700", color: "#101828",
            formatter: () => String(score),
          },
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: { shade: "dark", type: "horizontal", gradientToColors: [scoreColor(score)], stops: [0, 100] },
    },
    colors: ["#F97316"],
    stroke: { lineCap: "round" },
    labels: [scoreLabel(score)],
    series: [pct],
  };
}

function CreditContent() {
  const { data: loans = [], isLoading } = useLoans();
  const { data: employees = [] } = useEmployees();
  const createMutation = useCreateLoan();
  const approveMutation = useApproveLoan();
  const rejectMutation = useRejectLoan();

  const [showModal, setShowModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [amount, setAmount] = useState(500000);
  const [duration, setDuration] = useState(12);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");

  // Score moyen des employés
  const empWithScore = employees.filter((e) => e.creditScore != null);
  const avgScore = empWithScore.length
    ? Math.round(empWithScore.reduce((s, e) => s + (e.creditScore ?? 0), 0) / empWithScore.length)
    : 0;

  const selectedEmp = employees.find((e) => e.id === selectedEmpId);
  const empScore = selectedEmp?.creditScore ?? 0;
  const maxEligible = selectedEmp ? Math.round(selectedEmp.grossSalary * 0.85 * 2) : 0;
  const mensualite = calcMensualite(amount, duration);
  const totalCost = mensualite * duration;

  // KPIs
  const pending = loans.filter((l) => l.status === "PENDING");
  const active  = loans.filter((l) => l.status === "ACTIVE" || l.status === "APPROVED");
  const totalEngaged = active.reduce((s, l) => s + l.amount, 0);

  function resetModal() {
    setSelectedEmpId(""); setAmount(500000); setDuration(12); setNote(""); setFormError("");
    setShowModal(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!selectedEmpId) { setFormError("Sélectionnez un employé."); return; }
    if (amount < 50000) { setFormError("Montant minimum : 50 000 FCFA."); return; }
    if (amount > 2000000) { setFormError("Montant maximum : 2 000 000 FCFA."); return; }
    if (duration < 6 || duration > 24) { setFormError("Durée entre 6 et 24 mois."); return; }
    try {
      await createMutation.mutateAsync({ employeeId: selectedEmpId, amount, duration, note: note || undefined });
      resetModal();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setFormError(e?.response?.data?.error ?? e?.message ?? "Erreur lors de la création.");
    }
  }

  return (
    <>
      {/* ── Top : score radial + simulateur ─────────────────── */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Score moyen */}
        <div className="col-span-12 lg:col-span-5 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Score crédit moyen</h3>
            <Badge color={avgScore >= 700 ? "success" : avgScore >= 500 ? "warning" : "error"} size="sm">
              {scoreLabel(avgScore)}
            </Badge>
          </div>

          {avgScore > 0 ? (
            <Chart
              options={radialOptions(avgScore)}
              series={[Math.round((avgScore / 850) * 100)]}
              type="radialBar"
              height={220}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Aucun score disponible
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { label: "En attente", value: pending.length, color: "text-amber-500" },
              { label: "Crédits actifs", value: active.length, color: "text-green-600" },
              { label: "Total engagé", value: totalEngaged > 0 ? `${(totalEngaged / 1000).toFixed(0)}k` : "0k", color: "text-[#F97316]" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Simulateur */}
        <div className="col-span-12 lg:col-span-7 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Simulateur de crédit</h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">Montant</label>
                <span className="text-sm font-bold text-gray-800 dark:text-white/90">{formatFCFA(amount)}</span>
              </div>
              <input
                type="range" min={50000} max={2000000} step={25000}
                value={amount} onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-[#F97316]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>50 000</span><span>2 000 000 FCFA</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">Durée</label>
                <span className="text-sm font-bold text-gray-800 dark:text-white/90">{duration} mois</span>
              </div>
              <input
                type="range" min={6} max={24} step={1}
                value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-[#F97316]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>6 mois</span><span>24 mois</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { label: "Mensualité", value: formatFCFA(mensualite) },
                { label: "Coût total", value: formatFCFA(totalCost) },
                { label: "Intérêts", value: formatFCFA(totalCost - amount) },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3 text-center">
                  <p className="text-base font-bold text-gray-800 dark:text-white/90">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400">Taux : 10% / an · 0.83% / mois</p>
          </div>
        </div>
      </div>

      {/* ── Liste crédits ────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Demandes de micro-crédit</h3>
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
        ) : loans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-3">💳</span>
            <p className="text-sm">Aucun crédit pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {loans.map((loan) => {
              const emp = loan.employee;
              const isPending = loan.status === "PENDING";
              const approving = approveMutation.isPending && approveMutation.variables === loan.id;
              const rejecting = rejectMutation.isPending && (rejectMutation.variables as { id: string })?.id === loan.id;

              return (
                <div key={loan.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-white font-bold text-xs flex-shrink-0">
                    {emp ? initials(emp.firstName, emp.lastName) : "??"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {emp ? `${emp.lastName} ${emp.firstName}` : loan.employeeId.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {loan.duration} mois · {formatFCFA(loan.monthlyPayment)}/mois
                      {loan.requestedAt && ` · ${new Date(loan.requestedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-800 dark:text-white/90 flex-shrink-0">
                    {formatFCFA(loan.amount)}
                  </p>
                  <Badge color={STATUS_COLOR[loan.status] ?? "light"} size="sm">
                    {STATUS_LABEL[loan.status] ?? loan.status}
                  </Badge>
                  {isPending && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => approveMutation.mutate(loan.id)}
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
                        onClick={() => rejectMutation.mutate({ id: loan.id })}
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

      {/* ── Modal ────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Demande de micro-crédit</h2>
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
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.lastName} {emp.firstName} — Score : {emp.creditScore ?? "N/A"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Score + éligibilité */}
              {selectedEmp && (
                <div className={`flex gap-3 text-xs rounded-lg px-3 py-2 ${empScore >= 450 ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"}`}>
                  <span>🎯 Score : <strong>{empScore}</strong></span>
                  <span>·</span>
                  <span>🔒 Max éligible : <strong>{formatFCFA(maxEligible)}</strong></span>
                  <span>·</span>
                  <span>{empScore >= 450 ? "✅ Éligible" : "❌ Score insuffisant (min 450)"}</span>
                </div>
              )}

              {/* Montant */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Montant</label>
                  <span className="text-xs font-bold text-gray-800 dark:text-white/90">{formatFCFA(amount)}</span>
                </div>
                <input
                  type="range" min={50000} max={2000000} step={25000}
                  value={amount} onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full accent-[#F97316]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>50 000</span><span>2 000 000 FCFA</span></div>
              </div>

              {/* Durée */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Durée</label>
                  <span className="text-xs font-bold text-gray-800 dark:text-white/90">{duration} mois</span>
                </div>
                <input
                  type="range" min={6} max={24} step={1}
                  value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-[#F97316]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>6 mois</span><span>24 mois</span></div>
              </div>

              {/* Mensualité calculée */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 p-3 text-center">
                  <p className="text-base font-bold text-[#F97316]">{formatFCFA(mensualite)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Mensualité</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3 text-center">
                  <p className="text-base font-bold text-gray-800 dark:text-white/90">{formatFCFA(mensualite * duration)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Coût total</p>
                </div>
              </div>

              {/* Objet */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Objet du crédit <span className="text-gray-400">(optionnel)</span></label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Ex : achat matériel, loyer, frais scolaires..."
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
                  disabled={createMutation.isPending || (!!selectedEmp && empScore < 450)}
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

export default function Credit() {
  return (
    <>
      <PageMeta title="Micro-Crédit | SEREPRO" description="Score crédit et micro-crédit SEREPRO" />
      <PlanGate requiredPlan="PRO">
        <CreditContent />
      </PlanGate>
    </>
  );
}
