import { useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import PlanGate from "../../components/ui/PlanGate";

const score = 72;

const radialOptions: ApexOptions = {
  chart: {
    fontFamily: "Outfit, sans-serif",
    type: "radialBar",
    sparkline: { enabled: true },
  },
  plotOptions: {
    radialBar: {
      startAngle: -130,
      endAngle: 130,
      hollow: { size: "65%" },
      track: {
        background: "#f3f4f6",
        strokeWidth: "100%",
        margin: 0,
      },
      dataLabels: {
        name: {
          show: true,
          offsetY: 20,
          fontSize: "12px",
          color: "#667085",
          fontWeight: "400",
        },
        value: {
          show: true,
          offsetY: -15,
          fontSize: "36px",
          fontWeight: "700",
          color: "#101828",
          formatter: (val: number) => `${val}`,
        },
      },
    },
  },
  fill: {
    type: "gradient",
    gradient: {
      shade: "dark",
      type: "horizontal",
      gradientToColors: ["#16a34a"],
      stops: [0, 100],
    },
  },
  colors: ["#F97316"],
  stroke: { lineCap: "round" },
  labels: ["Score / 100"],
};

const facteurs = [
  { label: "Ancienneté", val: 90, color: "#16a34a" },
  { label: "Régularité des remboursements", val: 85, color: "#16a34a" },
  { label: "Historique avances", val: 70, color: "#F97316" },
  { label: "Taux d'endettement", val: 60, color: "#F97316" },
  { label: "Stabilité contrat", val: 80, color: "#16a34a" },
];

const TAUX_MENSUEL = 0.015;

function formatFCFA(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

export default function Credit() {
  const [montant, setMontant] = useState(500000);
  const [duree, setDuree] = useState(12);

  const mensualite =
    montant > 0
      ? Math.round(
          (montant * TAUX_MENSUEL) /
            (1 - Math.pow(1 + TAUX_MENSUEL, -duree))
        )
      : 0;
  const totalRemb = mensualite * duree;
  const interets = totalRemb - montant;

  const niveauScore =
    score >= 80
      ? { label: "Excellent", color: "success" as const }
      : score >= 65
      ? { label: "Bon", color: "info" as const }
      : score >= 50
      ? { label: "Moyen", color: "warning" as const }
      : { label: "Faible", color: "error" as const };

  return (
    <PlanGate requiredPlan="PRO">
      <>
      <PageMeta title="Micro-Crédit | SEREPRO" description="Score crédit et simulateur de micro-crédit SEREPRO" />

      <div className="grid grid-cols-12 gap-6">
        {/* ── Score card ─────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Votre score crédit
            </h3>
            <Badge color={niveauScore.color} size="sm">{niveauScore.label}</Badge>
          </div>
          <p className="text-xs text-gray-400 mb-4">Mis à jour le 1 avril 2025</p>

          <Chart
            options={radialOptions}
            series={[score]}
            type="radialBar"
            height={240}
          />

          <div className="space-y-3 mt-4">
            {facteurs.map((f) => (
              <div key={f.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{f.label}</span>
                  <span className="font-semibold" style={{ color: f.color }}>
                    {f.val}/100
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full dark:bg-gray-800">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${f.val}%`, backgroundColor: f.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Simulator ──────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-7 space-y-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-5">
              Simulateur de micro-crédit
            </h3>

            {/* Montant slider */}
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">Montant emprunté</span>
                <span className="font-bold serepro-gradient-text">{formatFCFA(montant)}</span>
              </div>
              <input
                type="range"
                min={50000}
                max={5000000}
                step={50000}
                value={montant}
                onChange={(e) => setMontant(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#F97316]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>50k</span><span>5M</span>
              </div>
            </div>

            {/* Durée slider */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">Durée de remboursement</span>
                <span className="font-bold text-[#16a34a]">{duree} mois</span>
              </div>
              <input
                type="range"
                min={3}
                max={36}
                step={3}
                value={duree}
                onChange={(e) => setDuree(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#16a34a]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>3 mois</span><span>36 mois</span>
              </div>
            </div>

            {/* Result box */}
            <div className="rounded-xl bg-gradient-to-r from-[#F97316]/10 to-[#16a34a]/10 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mensualité estimée</span>
                <span className="text-2xl font-bold text-gray-800 dark:text-white/90 serepro-amount">
                  {formatFCFA(mensualite)}
                </span>
              </div>
              <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total remboursé</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 serepro-amount">
                    {formatFCFA(totalRemb)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Coût du crédit</span>
                  <span className="font-semibold text-[#F97316] serepro-amount">
                    {formatFCFA(interets)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taux mensuel</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {(TAUX_MENSUEL * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <button className="serepro-btn-ci w-full py-3 rounded-lg text-sm font-semibold mt-4">
              Faire une demande de micro-crédit
            </button>
          </div>

          {/* Eligibility note */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-3">
              Conditions d'éligibilité
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {[
                { ok: true, text: "Ancienneté ≥ 6 mois" },
                { ok: true, text: "Score crédit ≥ 50 / 100" },
                { ok: true, text: "Pas d'avance en cours non remboursée" },
                { ok: montant <= 3000000, text: "Montant ≤ 3 000 000 FCFA pour ce profil" },
              ].map((c) => (
                <li key={c.text} className="flex items-center gap-2">
                  <span className={c.ok ? "text-[#16a34a]" : "text-red-500"}>
                    {c.ok ? "✓" : "✗"}
                  </span>
                  {c.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      </>
    </PlanGate>
  );
}
