import { Link } from "react-router";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../../components/ui/table";
import { useEmployees } from "../../hooks/useEmployees";
import { useAdvances } from "../../hooks/useAdvances";
import { useLoans } from "../../hooks/useLoans";
import { useDeadlines } from "../../hooks/useDeadlines";
import { usePayslips } from "../../hooks/usePayslips";

// ── Helpers ───────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString("fr-FR");
}

function fmtFull(n: number) {
  return n.toLocaleString("fr-FR");
}

function Spin() {
  return (
    <svg className="animate-spin h-5 w-5 text-[#F97316]" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

const GRADIENTS = [
  "from-[#F97316] to-[#fb923c]",
  "from-[#16a34a] to-[#4ade80]",
  "from-[#3b82f6] to-[#60a5fa]",
  "from-[#8b5cf6] to-[#a78bfa]",
  "from-[#ec4899] to-[#f472b6]",
];

const KPI_ICONS = [
  <svg key="emp" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m0 0a5 5 0 106 0m-6 0A5 5 0 1115 16.13" />
  </svg>,
  <svg key="sal" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  <svg key="av" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>,
  <svg key="sc" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>,
];

// ── Month helpers ─────────────────────────────────────────────
function prevMonth(offset: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offset);
  return { month: d.getMonth() + 1, year: d.getFullYear(), label: d.toLocaleDateString("fr-FR", { month: "short" }) };
}

const M = [prevMonth(3), prevMonth(2), prevMonth(1), prevMonth(0)];

// ── ObligationsMois ───────────────────────────────────────────
function ObligationsMois() {
  const { data: deadlines = [], isLoading } = useDeadlines();
  const now = new Date();

  const obligations = deadlines
    .filter((d) => {
      const dd = new Date(d.dueDate);
      return !d.completed &&
        dd.getMonth() === now.getMonth() &&
        dd.getFullYear() === now.getFullYear() &&
        ["CNPS", "ITS", "CMU"].includes(d.type);
    })
    .slice(0, 4);

  const total = obligations.reduce((s, d) => s + (d.amount ?? 0), 0);

  const urgencyBadge = (u: string): "error" | "warning" | "success" => {
    if (u === "URGENT") return "error";
    if (u === "BIENTOT") return "warning";
    return "success";
  };

  const urgencyLabel = (u: string) => {
    if (u === "URGENT") return "urgent";
    if (u === "BIENTOT") return "bientôt";
    return "ok";
  };

  const daysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
    if (diff <= 0) return "Aujourd'hui";
    if (diff === 1) return "Demain";
    return `Dans ${diff} jours`;
  };

  const monthLabel = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Obligations du mois</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{monthLabel}</p>
        </div>
        <Link to="/echeancier" className="text-xs text-brand-500 hover:text-brand-600 font-medium">Voir tout</Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6"><Spin /></div>
      ) : obligations.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">✅ Aucune obligation ce mois</p>
      ) : (
        <div className="space-y-3">
          {obligations.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${o.urgency === "URGENT" ? "bg-red-500" : o.urgency === "BIENTOT" ? "bg-amber-400" : "bg-green-500"}`} />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{o.type}</p>
                  <p className="text-xs text-gray-400">{daysUntil(o.dueDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {o.amount ? (
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 serepro-amount">
                    {fmtFull(o.amount)} <span className="text-xs font-normal text-gray-400">FCFA</span>
                  </span>
                ) : (
                  <Badge color="info" size="sm">À calculer</Badge>
                )}
                <Badge color={urgencyBadge(o.urgency)} size="sm">{urgencyLabel(o.urgency)}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <p className="text-xs text-gray-500">Total à régler</p>
          <p className="text-sm font-bold text-gray-800 dark:text-white/90 serepro-amount">
            {fmtFull(total)} <span className="text-xs font-normal text-gray-400">FCFA</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── MasseSalarialeChart ───────────────────────────────────────
function MasseSalarialeChart({ employees }: { employees: { grossSalary: number }[] }) {
  const p0 = usePayslips(M[0].month, M[0].year);
  const p1 = usePayslips(M[1].month, M[1].year);
  const p2 = usePayslips(M[2].month, M[2].year);
  const p3 = usePayslips(M[3].month, M[3].year);

  const fallback = employees.reduce((s, e) => s + e.grossSalary, 0);

  const sumPayslips = (list: { grossSalary: number }[]) =>
    list.length > 0 ? list.reduce((s, p) => s + p.grossSalary, 0) : fallback;

  const data = [
    sumPayslips(p0.data ?? []),
    sumPayslips(p1.data ?? []),
    sumPayslips(p2.data ?? []),
    sumPayslips(p3.data ?? []),
  ];

  const isLoading = p0.isLoading || p1.isLoading || p2.isLoading || p3.isLoading;

  const options: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "45%" } },
    colors: ["#F97316"],
    dataLabels: { enabled: false },
    xaxis: {
      categories: M.map((m) => m.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#9ca3af", fontSize: "12px" } },
    },
    yaxis: {
      labels: {
        style: { colors: "#9ca3af", fontSize: "11px" },
        formatter: (v) => `${(v / 1_000_000).toFixed(1)}M`,
      },
    },
    grid: { borderColor: "#f3f4f6", strokeDashArray: 4, yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
    tooltip: { y: { formatter: (v) => `${v.toLocaleString("fr-FR")} FCFA` } },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Masse salariale mensuelle</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">FCFA · 4 derniers mois</p>
        </div>
        {isLoading && <Spin />}
      </div>
      <Chart options={options} series={[{ name: "Masse salariale", data }]} type="bar" height={220} />
    </div>
  );
}

// ── ServicesFinanciers ────────────────────────────────────────
function ServicesFinanciers() {
  const { data: advances = [], isLoading: advLoading } = useAdvances();
  const { data: loans = [], isLoading: loanLoading } = useLoans();

  const approvedAdvances = advances.filter((a) => a.status === "APPROVED");
  const activeLoans = loans.filter((l) => l.status === "ACTIVE" || l.status === "APPROVED");

  const advTotal = approvedAdvances.reduce((s, a) => s + a.amount, 0);
  const loanTotal = activeLoans.reduce((s, l) => s + l.amount, 0);

  const services = [
    {
      label: "Avances",
      detail: advLoading ? "…" : `${approvedAdvances.length} en cours`,
      montant: advLoading ? "…" : fmt(advTotal),
      icon: "⚡",
      link: "/avance",
      color: "from-[#F97316] to-[#fb923c]",
    },
    {
      label: "Micro-crédit",
      detail: loanLoading ? "…" : `${activeLoans.length} actif${activeLoans.length > 1 ? "s" : ""}`,
      montant: loanLoading ? "…" : fmt(loanTotal),
      icon: "🏦",
      link: "/credit",
      color: "from-[#16a34a] to-[#4ade80]",
    },
    {
      label: "Épargne",
      detail: "3 employés",
      montant: "210k",
      icon: "💰",
      link: "/epargne",
      color: "from-[#3b82f6] to-[#60a5fa]",
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Services financiers actifs</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">En cours ce mois</p>
        </div>
      </div>
      <div className="space-y-3">
        {services.map((s) => (
          <div key={s.label} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-lg flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{s.label}</p>
                <p className="text-xs text-gray-400">{s.detail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 serepro-amount">
                {s.montant} <span className="text-xs font-normal text-gray-400">FCFA</span>
              </span>
              <Link to={s.link}><Button size="sm" variant="outline">Gérer</Button></Link>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link to="/avance"><Button className="w-full" size="sm">Nouvelle avance</Button></Link>
        <Link to="/credit"><Button className="w-full" size="sm" variant="outline">Demande crédit</Button></Link>
      </div>
    </div>
  );
}

// ── EcheancierWidget ──────────────────────────────────────────
function EcheancierWidget() {
  const { data: deadlines = [], isLoading } = useDeadlines();

  const upcoming = deadlines
    .filter((d) => !d.completed && new Date(d.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Échéancier à venir</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">5 prochaines obligations</p>
        </div>
        <Link to="/echeancier" className="text-xs text-brand-500 hover:text-brand-600 font-medium">Voir tout</Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6"><Spin /></div>
      ) : upcoming.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">✅ Aucune échéance à venir</p>
      ) : (
        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-800" />
          <div className="space-y-4">
            {upcoming.map((e) => {
              const d = new Date(e.dueDate);
              const isUrgent = e.urgency === "URGENT";
              const dayStr = d.toLocaleDateString("fr-FR", { day: "numeric" });
              const monStr = d.toLocaleDateString("fr-FR", { month: "short" });

              return (
                <div key={e.id} className="flex items-start gap-4 relative">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-center z-10 ${isUrgent ? "bg-gradient-to-br from-[#F97316] to-[#fb923c] shadow-sm" : "bg-gray-100 dark:bg-gray-800"}`}>
                    <span className={`text-[10px] font-bold leading-tight ${isUrgent ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>
                      {dayStr}<br />{monStr}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">{e.title}</p>
                      {e.amount ? (
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 serepro-amount ml-2 flex-shrink-0">
                          {fmtFull(e.amount)} <span className="text-xs font-normal text-gray-400">FCFA</span>
                        </span>
                      ) : (
                        <Badge color="info" size="sm">À calculer</Badge>
                      )}
                    </div>
                    {isUrgent && <Badge color="error" size="sm">Urgent</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── DerniersEmployes ──────────────────────────────────────────
function DerniersEmployes({ employees }: { employees: ReturnType<typeof useEmployees>["data"] }) {
  const list = (employees ?? [])
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statusColor = (s: string): "success" | "info" | "warning" => {
    if (s === "ACTIVE") return "success";
    if (s === "ON_LEAVE") return "info";
    return "warning";
  };
  const statusLabel = (s: string) => {
    if (s === "ACTIVE") return "Actif";
    if (s === "ON_LEAVE") return "Congé";
    return "Suspendu";
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Derniers employés ajoutés</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">5 plus récents</p>
        </div>
        <Link to="/employes" className="text-xs text-brand-500 hover:text-brand-600 font-medium">Voir tous</Link>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Aucun employé</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100 dark:border-gray-800">
                {["Employé", "Poste", "Salaire", "Statut"].map((h) => (
                  <TableCell key={h} isHeader className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((emp, i) => (
                <TableRow key={emp.id} className="border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-sm font-bold">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                        {emp.lastName} {emp.firstName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{emp.position}</TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90 serepro-amount whitespace-nowrap">
                      {fmtFull(emp.grossSalary)} <span className="text-xs font-normal text-gray-400">FCFA</span>
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge color={statusColor(emp.status)} size="sm">{statusLabel(emp.status)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function Home() {
  const { data: employees = [], isLoading: empLoading } = useEmployees();
  const { data: advances = [], isLoading: advLoading } = useAdvances();

  // KPIs
  const activeEmps = employees.filter((e) => e.status === "ACTIVE");
  const masseSalariale = employees.reduce((s, e) => s + e.grossSalary, 0);
  const approvedAdvances = advances.filter((a) => a.status === "APPROVED");
  const advancesTotal = approvedAdvances.reduce((s, a) => s + a.amount, 0);
  const empWithScore = employees.filter((e) => e.creditScore != null);
  const avgScore = empWithScore.length
    ? Math.round(empWithScore.reduce((s, e) => s + (e.creditScore ?? 0), 0) / empWithScore.length)
    : 0;

  const kpis = [
    {
      label: "Employés actifs",
      value: empLoading ? "…" : String(activeEmps.length),
      delta: empLoading ? "" : `${employees.length} total`,
      color: "success" as const,
    },
    {
      label: "Masse salariale",
      value: empLoading ? "…" : `${fmt(masseSalariale)} FCFA`,
      delta: empLoading ? "" : `${activeEmps.length} actifs`,
      color: "success" as const,
    },
    {
      label: "Avances en cours",
      value: advLoading ? "…" : `${approvedAdvances.length} dem.`,
      delta: advLoading ? "" : advancesTotal > 0 ? `${fmt(advancesTotal)} FCFA` : "Aucune",
      color: "warning" as const,
    },
    {
      label: "Score crédit moyen",
      value: empLoading ? "…" : avgScore > 0 ? `${avgScore} / 850` : "N/A",
      delta: avgScore >= 700 ? "Excellent" : avgScore >= 500 ? "Moyen" : avgScore > 0 ? "Faible" : "—",
      color: "info" as const,
    },
  ];

  return (
    <>
      <PageMeta title="Tableau de bord | SEREPRO" description="Tableau de bord SEREPRO — Gestion RH & Finance Côte d'Ivoire" />

      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl mb-6 p-6 md:p-8 serepro-dot-grid"
        style={{ background: "linear-gradient(135deg, #F97316, #16a34a)" }}
      >
        <div className="relative z-10">
          <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">Plateforme RH &amp; Finance</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Bienvenue sur SEREPRO</h1>
          <p className="text-white/80 text-sm max-w-md">
            Gérez vos employés, bulletins de paie, avances et obligations fiscales depuis un seul tableau de bord — Côte d'Ivoire.
          </p>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/[0.07] text-[140px] font-black leading-none select-none pointer-events-none">S</div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        {kpis.map((k, i) => (
          <div key={k.label} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 mb-4">
              {KPI_ICONS[i]}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{k.label}</p>
            {(empLoading && i < 3) || (advLoading && i === 2)
              ? <div className="flex items-center h-8 mb-2"><Spin /></div>
              : <p className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2 serepro-amount">{k.value}</p>
            }
            {k.delta && <Badge color={k.color} size="sm">{k.delta}</Badge>}
          </div>
        ))}
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-12 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="col-span-12 xl:col-span-5"><ObligationsMois /></div>
        <div className="col-span-12 xl:col-span-7"><MasseSalarialeChart employees={employees} /></div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-12 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="col-span-12 xl:col-span-7"><ServicesFinanciers /></div>
        <div className="col-span-12 xl:col-span-5"><EcheancierWidget /></div>
      </div>

      {/* Row 3 */}
      {empLoading
        ? <div className="flex justify-center py-10"><Spin /></div>
        : <DerniersEmployes employees={employees} />
      }
    </>
  );
}
