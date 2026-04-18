import { useState } from "react";
import Badge from "../../components/ui/badge/Badge";
import PageMeta from "../../components/common/PageMeta";

const montantsRapides = [50000, 100000, 150000, 200000, 300000, 500000];

const canaux = [
  {
    id: "wave",
    label: "Wave",
    emoji: "🌊",
    bgColor: "#0070f3",
    activeBg: "bg-blue-50 dark:bg-blue-500/10",
    activeBorder: "border-blue-400",
  },
  {
    id: "orange",
    label: "Orange Money",
    emoji: "🍊",
    bgColor: "#f97316",
    activeBg: "bg-orange-50 dark:bg-orange-500/10",
    activeBorder: "border-orange-400",
  },
  {
    id: "mtn",
    label: "MTN MoMo",
    emoji: "💛",
    bgColor: "#eab308",
    activeBg: "bg-yellow-50 dark:bg-yellow-500/10",
    activeBorder: "border-yellow-400",
  },
];

const historique = [
  { id: 1, montant: 150000, canal: "Wave", date: "2025-02-15", statut: "Remboursé" as const },
  { id: 2, montant: 200000, canal: "Orange Money", date: "2025-01-10", statut: "Remboursé" as const },
  { id: 3, montant: 100000, canal: "MTN MoMo", date: "2024-12-05", statut: "Remboursé" as const },
];

export default function Avance() {
  const [montant, setMontant] = useState("");
  const [canal, setCanal] = useState("wave");
  const [motif, setMotif] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const montantNum = Number(montant.replace(/\s/g, ""));
  const salaire = 620000;
  const plafond = salaire * 0.5;
  const valide = montantNum > 0 && montantNum <= plafond;

  function handleSubmit() {
    if (valide) setSubmitted(true);
  }

  if (submitted) {
    return (
      <>
        <PageMeta title="Avance sur Salaire | SEREPRO" description="Demande d'avance sur salaire SEREPRO" />
        <div className="max-w-md mx-auto text-center py-16">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F97316] to-[#16a34a] flex items-center justify-center mx-auto mb-6 serepro-glow">
            <svg className="size-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2">Demande soumise !</h2>
          <p className="text-gray-500 text-sm mb-6">
            Votre demande de <strong>{Number(montant).toLocaleString("fr-FR")} FCFA</strong> via{" "}
            <strong>{canaux.find((c) => c.id === canal)?.label}</strong> est en cours de traitement.
          </p>
          <button
            onClick={() => { setSubmitted(false); setMontant(""); setMotif(""); }}
            className="serepro-btn-ci px-6 py-2.5 rounded-lg text-sm font-semibold"
          >
            Nouvelle demande
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Avance sur Salaire | SEREPRO" description="Demande d'avance sur salaire SEREPRO" />

      <div className="grid grid-cols-12 gap-6">
        {/* Form */}
        <div className="col-span-12 lg:col-span-7">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Demande d'avance sur salaire
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Remboursement automatique sur le prochain bulletin de paie
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-6">
            {/* Plafond info */}
            <div className="rounded-xl bg-gradient-to-r from-[#F97316]/10 to-[#16a34a]/10 p-4 flex items-center gap-3">
              <svg className="size-5 text-[#F97316] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Plafond autorisé :{" "}
                <strong className="text-[#F97316]">
                  {plafond.toLocaleString("fr-FR")} FCFA
                </strong>{" "}
                (50% du salaire)
              </p>
            </div>

            {/* Montant input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Montant souhaité (FCFA)
              </label>
              <input
                type="number"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="Ex: 150 000"
                className="w-full h-11 rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-800 dark:text-white/90 focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/10 placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
              {montantNum > plafond && (
                <p className="text-xs text-red-500 mt-1">
                  Montant supérieur au plafond autorisé ({plafond.toLocaleString("fr-FR")} FCFA)
                </p>
              )}
            </div>

            {/* Quick amounts */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Montants rapides</p>
              <div className="grid grid-cols-3 gap-2">
                {montantsRapides.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMontant(String(m))}
                    className={`rounded-lg border py-2 text-sm font-semibold transition-all ${
                      montant === String(m)
                        ? "border-[#F97316] bg-orange-50 text-[#F97316] dark:bg-orange-500/10"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#F97316]/40 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300"
                    }`}
                  >
                    {m >= 1000000
                      ? `${(m / 1000000).toFixed(1)}M`
                      : `${(m / 1000).toFixed(0)}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* Canal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Canal de réception
              </label>
              <div className="grid grid-cols-3 gap-3">
                {canaux.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCanal(c.id)}
                    className={`rounded-xl border-2 p-3 text-center transition-all ${
                      canal === c.id
                        ? `${c.activeBg} ${c.activeBorder}`
                        : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold shadow-sm"
                      style={{ backgroundColor: c.bgColor }}
                    >
                      {c.label[0]}
                    </div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 leading-tight">
                      {c.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Motif */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motif{" "}
                <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={3}
                placeholder="Raison de la demande d'avance..."
                className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-3 text-sm text-gray-800 dark:border-gray-800 dark:text-white/90 focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/10 placeholder:text-gray-400 resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!valide}
              className={`w-full py-3 rounded-lg text-sm font-semibold text-white transition-all ${
                valide
                  ? "serepro-btn-ci cursor-pointer hover:opacity-90"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              }`}
            >
              Soumettre la demande
            </button>
          </div>
        </div>

        {/* Historique */}
        <div className="col-span-12 lg:col-span-5">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">
            Historique des avances
          </h3>
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] divide-y divide-gray-100 dark:divide-gray-800">
            {historique.map((h) => (
              <div key={h.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[#F97316] to-[#16a34a] text-white text-xs font-bold flex-shrink-0">
                  {h.canal[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90 serepro-amount">
                    {h.montant.toLocaleString("fr-FR")} FCFA
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {h.canal} · {new Date(h.date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <Badge color="success" size="sm">{h.statut}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
