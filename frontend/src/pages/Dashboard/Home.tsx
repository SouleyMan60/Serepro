import { Link } from "react-router";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

// ── KPI data ──────────────────────────────────────────────────
const kpis: {
  label: string;
  value: string;
  delta: string;
  color: "success" | "warning" | "info";
}[] = [
  { label: "Employés actifs",    value: "247",        delta: "+3 ce mois", color: "success" },
  { label: "Masse salariale",    value: "48,2M FCFA", delta: "+1,2%",      color: "success" },
  { label: "Avances en cours",   value: "12,4M FCFA", delta: "6 demandes", color: "warning" },
  { label: "Score crédit moyen", value: "72 / 100",   delta: "+4 pts",     color: "info"    },
];

const kpiIcons = [
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

// ── 1. Obligations du mois ────────────────────────────────────
const obligations = [
  { label: "CNPS",    montant: "340 000",  statut: "urgent", badge: "error"   as const, delai: "Aujourd'hui" },
  { label: "ITS",     montant: "180 000",  statut: "7 jours", badge: "warning" as const, delai: "Dans 7 jours" },
  { label: "CMU",     montant: "72 000",   statut: "ok",      badge: "success" as const, delai: "Dans 21 jours" },
];

function ObligationsMois() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Obligations du mois
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Avril 2026</p>
        </div>
        <Link to="/echeancier" className="text-xs text-brand-500 hover:text-brand-600 font-medium">
          Voir tout
        </Link>
      </div>
      <div className="space-y-3">
        {obligations.map((o) => (
          <div
            key={o.label}
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                o.badge === "error" ? "bg-red-500" :
                o.badge === "warning" ? "bg-amber-400" : "bg-green-500"
              }`} />
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{o.label}</p>
                <p className="text-xs text-gray-400">{o.delai}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 serepro-amount">
                {o.montant} <span className="text-xs font-normal text-gray-400">FCFA</span>
              </span>
              <Badge color={o.badge} size="sm">{o.statut}</Badge>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <p className="text-xs text-gray-500">Total à régler</p>
        <p className="text-sm font-bold text-gray-800 dark:text-white/90 serepro-amount">
          592 000 <span className="text-xs font-normal text-gray-400">FCFA</span>
        </p>
      </div>
    </div>
  );
}

// ── 2. Masse salariale mensuelle (ApexCharts) ─────────────────
const chartOptions: ApexOptions = {
  chart: {
    type: "bar",
    toolbar: { show: false },
    fontFamily: "inherit",
  },
  plotOptions: {
    bar: {
      borderRadius: 6,
      columnWidth: "45%",
    },
  },
  colors: ["#F97316"],
  dataLabels: { enabled: false },
  xaxis: {
    categories: ["Jan", "Fév", "Mar", "Avr"],
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
  grid: {
    borderColor: "#f3f4f6",
    strokeDashArray: 4,
    yaxis: { lines: { show: true } },
    xaxis: { lines: { show: false } },
  },
  tooltip: {
    y: {
      formatter: (v) =>
        `${v.toLocaleString("fr-FR")} FCFA`,
    },
  },
};

const chartSeries = [
  {
    name: "Masse salariale",
    data: [44_500_000, 45_200_000, 47_800_000, 48_200_000],
  },
];

function MasseSalarialeChart() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Masse salariale mensuelle
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">FCFA · 2026</p>
      </div>
      <Chart options={chartOptions} series={chartSeries} type="bar" height={220} />
    </div>
  );
}

// ── 3. Services financiers actifs ─────────────────────────────
const services = [
  {
    label: "Avances",
    detail: "2 en cours",
    montant: "80 000",
    icon: "⚡",
    link: "/avance",
    color: "from-[#F97316] to-[#fb923c]",
  },
  {
    label: "Micro-crédit",
    detail: "1 actif",
    montant: "150 000",
    icon: "🏦",
    link: "/credit",
    color: "from-[#16a34a] to-[#4ade80]",
  },
  {
    label: "Épargne",
    detail: "3 employés",
    montant: "210 000",
    icon: "💰",
    link: "/epargne",
    color: "from-[#3b82f6] to-[#60a5fa]",
  },
];

function ServicesFinanciers() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Services financiers actifs
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">En cours ce mois</p>
        </div>
      </div>
      <div className="space-y-3">
        {services.map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]"
          >
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
              <Link to={s.link}>
                <Button size="sm" variant="outline">Gérer</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link to="/avance">
          <Button className="w-full" size="sm">
            Nouvelle avance
          </Button>
        </Link>
        <Link to="/credit">
          <Button className="w-full" size="sm" variant="outline">
            Demande crédit
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ── 4. Échéancier à venir (timeline) ─────────────────────────
const echeances = [
  { date: "25 Avr", label: "CNPS",               montant: "340 000", urgent: true  },
  { date: "30 Avr", label: "ITS",                 montant: "180 000", urgent: true  },
  { date: "15 Mai", label: "CMU",                 montant: "72 000",  urgent: false },
  { date: "25 Mai", label: "CNPS",               montant: "340 000", urgent: false },
  { date: "30 Mai", label: "Déclaration fiscale", montant: "—",       urgent: false },
];

function EcheancierWidget() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Échéancier à venir
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">5 prochaines obligations</p>
        </div>
        <Link to="/echeancier" className="text-xs text-brand-500 hover:text-brand-600 font-medium">
          Voir tout
        </Link>
      </div>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-800" />
        <div className="space-y-4">
          {echeances.map((e, i) => (
            <div key={i} className="flex items-start gap-4 relative">
              <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-center z-10 ${
                e.urgent
                  ? "bg-gradient-to-br from-[#F97316] to-[#fb923c] shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}>
                <span className={`text-[10px] font-bold leading-tight ${e.urgent ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>
                  {e.date.split(" ")[0]}<br />{e.date.split(" ")[1]}
                </span>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{e.label}</p>
                  {e.montant !== "—" ? (
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 serepro-amount">
                      {e.montant} <span className="text-xs font-normal text-gray-400">FCFA</span>
                    </span>
                  ) : (
                    <Badge color="info" size="sm">À calculer</Badge>
                  )}
                </div>
                {e.urgent && (
                  <Badge color="error" size="sm">Urgent</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 5. Derniers employés ajoutés ──────────────────────────────
const employes = [
  { nom: "Kouassi Jean-Pierre", poste: "Comptable",         salaire: "350 000", initiale: "K", statut: "Actif",     statutColor: "success" as const },
  { nom: "Bamba Aminata",       poste: "RH Manager",        salaire: "420 000", initiale: "B", statut: "Actif",     statutColor: "success" as const },
  { nom: "Traoré Mamadou",      poste: "Chauffeur",         salaire: "180 000", initiale: "T", statut: "Actif",     statutColor: "success" as const },
  { nom: "Koné Fatoumata",      poste: "Assistante admin.", salaire: "220 000", initiale: "K", statut: "Essai",     statutColor: "warning" as const },
  { nom: "Diallo Ibrahim",      poste: "Commercial",        salaire: "280 000", initiale: "D", statut: "Congé",     statutColor: "info"    as const },
];

const avatarGradients = [
  "from-[#F97316] to-[#fb923c]",
  "from-[#16a34a] to-[#4ade80]",
  "from-[#3b82f6] to-[#60a5fa]",
  "from-[#8b5cf6] to-[#a78bfa]",
  "from-[#ec4899] to-[#f472b6]",
];

function DerniersEmployes() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Derniers employés ajoutés
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">5 plus récents</p>
        </div>
        <Link to="/employes" className="text-xs text-brand-500 hover:text-brand-600 font-medium">
          Voir tous
        </Link>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-100 dark:border-gray-800">
              <TableCell isHeader className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Employé
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Poste
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                Salaire
              </TableCell>
              <TableCell isHeader className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Statut
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employes.map((e, i) => (
              <TableRow
                key={i}
                className="border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradients[i]} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-sm font-bold">{e.initiale}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
                      {e.nom}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {e.poste}
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <span className="text-sm font-semibold text-gray-800 dark:text-white/90 serepro-amount whitespace-nowrap">
                    {e.salaire} <span className="text-xs font-normal text-gray-400">FCFA</span>
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <Badge color={e.statutColor} size="sm">{e.statut}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function Home() {
  return (
    <>
      <PageMeta
        title="Tableau de bord | SEREPRO"
        description="Tableau de bord SEREPRO — Gestion RH & Finance Côte d'Ivoire"
      />

      {/* Hero banner */}
      <div
        className="relative overflow-hidden rounded-2xl mb-6 p-6 md:p-8 serepro-dot-grid"
        style={{ background: "linear-gradient(135deg, #F97316, #16a34a)" }}
      >
        <div className="relative z-10">
          <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">
            Plateforme RH &amp; Finance
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Bienvenue sur SEREPRO
          </h1>
          <p className="text-white/80 text-sm max-w-md">
            Gérez vos employés, bulletins de paie, avances et obligations fiscales
            depuis un seul tableau de bord — Côte d'Ivoire.
          </p>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/[0.07] text-[140px] font-black leading-none select-none pointer-events-none">
          S
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        {kpis.map((k, i) => (
          <div
            key={k.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 mb-4">
              {kpiIcons[i]}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{k.label}</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2 serepro-amount">
              {k.value}
            </p>
            <Badge color={k.color} size="sm">{k.delta}</Badge>
          </div>
        ))}
      </div>

      {/* Row 1 : Obligations + Masse salariale */}
      <div className="grid grid-cols-12 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="col-span-12 xl:col-span-5">
          <ObligationsMois />
        </div>
        <div className="col-span-12 xl:col-span-7">
          <MasseSalarialeChart />
        </div>
      </div>

      {/* Row 2 : Services financiers + Échéancier */}
      <div className="grid grid-cols-12 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="col-span-12 xl:col-span-7">
          <ServicesFinanciers />
        </div>
        <div className="col-span-12 xl:col-span-5">
          <EcheancierWidget />
        </div>
      </div>

      {/* Row 3 : Derniers employés */}
      <DerniersEmployes />
    </>
  );
}
