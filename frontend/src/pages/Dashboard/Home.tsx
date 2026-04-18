import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";

const kpis: { label: string; value: string; delta: string; color: "success" | "warning" | "info" }[] = [
  { label: "Employés actifs", value: "247", delta: "+3 ce mois", color: "success" },
  { label: "Masse salariale", value: "48,2M FCFA", delta: "+1,2%", color: "success" },
  { label: "Avances en cours", value: "12,4M FCFA", delta: "6 demandes", color: "warning" },
  { label: "Score crédit moyen", value: "72 / 100", delta: "+4 pts", color: "info" },
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

export default function Home() {
  return (
    <>
      <PageMeta
        title="Tableau de bord | SEREPRO"
        description="Tableau de bord SEREPRO — Gestion RH & Finance Côte d'Ivoire"
      />

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl mb-6 p-6 md:p-8 serepro-dot-grid"
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

      {/* Charts & data */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />
          <MonthlySalesChart />
        </div>
        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>
        <div className="col-span-12">
          <StatisticsChart />
        </div>
        <div className="col-span-12">
          <RecentOrders />
        </div>
      </div>
    </>
  );
}
