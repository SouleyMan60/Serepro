import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { usePlans, useTenantPlan, planSatisfies, type Plan, type PlanId } from "../../hooks/usePlan";
import api from "../../config/api";
import { useQueryClient } from "@tanstack/react-query";

const PLANS_FALLBACK: Plan[] = [
  {
    id: "STARTER", name: "Starter", price: 0, priceYear: 0,
    maxEmployees: 5, maxHRUsers: 1, maxContracts: 2,
    features: { advances: false, microCredit: false, savings: false, insurance: false, employeeSpace: false, smsNotif: false, storage: "1 GB" },
  },
  {
    id: "PRO", name: "Pro", price: 15000, priceYear: 150000,
    maxEmployees: 25, maxHRUsers: 3, maxContracts: 20,
    features: { advances: true, microCredit: true, savings: true, insurance: false, employeeSpace: true, smsNotif: true, storage: "10 GB" },
  },
  {
    id: "BUSINESS", name: "Business", price: 35000, priceYear: 350000,
    maxEmployees: 100, maxHRUsers: 10, maxContracts: -1,
    features: { advances: true, microCredit: true, savings: true, insurance: true, employeeSpace: true, smsNotif: true, storage: "50 GB", api: true, multiSite: true },
  },
  {
    id: "ENTERPRISE", name: "Enterprise", price: -1, priceYear: -1,
    maxEmployees: -1, maxHRUsers: -1, maxContracts: -1,
    features: { advances: true, microCredit: true, savings: true, insurance: true, employeeSpace: true, smsNotif: true, storage: "Illimité", api: true, multiSite: true },
  },
];

const FEATURE_LABELS: { key: string; label: string }[] = [
  { key: "advances",      label: "Avance sur salaire" },
  { key: "microCredit",   label: "Micro-Crédit" },
  { key: "savings",       label: "Épargne automatique" },
  { key: "insurance",     label: "Assurance groupe" },
  { key: "employeeSpace", label: "Espace employé" },
  { key: "smsNotif",      label: "Notifications SMS/WhatsApp" },
  { key: "api",           label: "Accès API" },
  { key: "multiSite",     label: "Multi-sites" },
];

function formatPrice(monthly: number, yearly: number, annual: boolean): string {
  if (monthly === -1) return "Sur devis";
  if (monthly === 0) return "Gratuit";
  if (annual) return `${yearly.toLocaleString("fr-FR")} FCFA/an`;
  return `${monthly.toLocaleString("fr-FR")} FCFA/mois`;
}

function Spinner({ size = 5 }: { size?: number }) {
  return (
    <svg className={`animate-spin h-${size} w-${size}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function PlanCard({
  plan,
  isCurrent,
  isAnnual,
  loadingId,
  onChoose,
}: {
  plan: Plan;
  isCurrent: boolean;
  isAnnual: boolean;
  loadingId: string | null;
  onChoose: (planId: string, billing: string) => void;
}) {
  const isEnterprise = plan.id === "ENTERPRISE";
  const isPopular = plan.id === "PRO" && !isCurrent;
  const isLoading = loadingId === plan.id;

  return (
    <div
      className="rounded-2xl p-[2px]"
      style={isCurrent ? { background: "linear-gradient(135deg, #F97316, #16a34a)" } : { background: "transparent" }}
    >
      <div
        className={`relative flex flex-col h-full rounded-[14px] p-6 bg-white dark:bg-gray-900 ${
          !isCurrent ? "border border-gray-200 dark:border-gray-800" : ""
        } ${isPopular ? "shadow-md" : ""}`}
      >
        {isCurrent && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #F97316, #16a34a)" }}
            >
              Plan actuel
            </span>
          </div>
        )}
        {isPopular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-[#16a34a] shadow-sm whitespace-nowrap">
              Populaire
            </span>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-base font-bold text-gray-800 dark:text-white/90">{plan.name}</h3>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {formatPrice(plan.price, plan.priceYear, isAnnual)}
          </p>
          {isAnnual && plan.price > 0 && plan.price !== -1 && (
            <p className="text-xs text-[#16a34a] font-medium mt-0.5">2 mois offerts</p>
          )}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-4">
          <p>👥 {plan.maxEmployees === -1 ? "Employés illimités" : `${plan.maxEmployees} employés max`}</p>
          <p>📄 {plan.maxContracts === -1 ? "Contrats illimités" : `${plan.maxContracts} contrats max`}</p>
          <p>💾 {plan.features.storage}</p>
        </div>

        <ul className="space-y-2 mb-6 flex-1">
          {FEATURE_LABELS.map(({ key, label }) => {
            const active = !!(plan.features as unknown as Record<string, unknown>)[key];
            return (
              <li key={key} className="flex items-center gap-2 text-xs">
                <span>{active ? "✅" : "❌"}</span>
                <span className={active ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600"}>
                  {label}
                </span>
              </li>
            );
          })}
        </ul>

        <button
          onClick={() => onChoose(plan.id, isAnnual ? "yearly" : "monthly")}
          disabled={isCurrent || isEnterprise || !!loadingId}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            isCurrent
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default"
              : isEnterprise
              ? "bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700"
              : "text-white hover:opacity-90 shadow-sm disabled:opacity-60"
          }`}
          style={!isCurrent && !isEnterprise ? { background: "linear-gradient(135deg, #F97316, #16a34a)" } : undefined}
        >
          {isLoading && <Spinner size={4} />}
          {isCurrent ? "Plan actuel" : isEnterprise ? "Nous contacter" : isLoading ? "Redirection…" : `Choisir ${plan.name}`}
        </button>
      </div>
    </div>
  );
}

export default function Billing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: plansData } = usePlans();
  const { data: currentPlan = "STARTER" } = useTenantPlan();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();

  const plans = plansData && plansData.length > 0 ? plansData : PLANS_FALLBACK;

  // Vérification au retour de Paystack (status=success&ref=...)
  useEffect(() => {
    const status = searchParams.get("status");
    const ref = searchParams.get("ref");
    if (status !== "success" || !ref) return;

    setSearchParams({}, { replace: true });

    (async () => {
      try {
        const { data } = await api.post("/billing/verify", { reference: ref });
        const plan = data?.data?.plan ?? data?.plan;
        setSuccessMsg(`✅ Plan ${plan ?? ""} activé avec succès !`);
        qc.invalidateQueries({ queryKey: ["auth", "me", "plan"] });
      } catch {
        setErrorMsg("Impossible de vérifier le paiement. Contactez le support.");
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleChoose(planId: string, billing: string) {
    if (planId === "ENTERPRISE") {
      window.open("mailto:contact@serepro.net?subject=Plan Enterprise", "_blank");
      return;
    }
    setLoadingId(planId);
    setErrorMsg("");
    try {
      const { data } = await api.post("/billing/subscribe", { planId, billing });
      const url = data?.data?.paymentUrl ?? data?.paymentUrl;
      if (!url) throw new Error("URL de paiement introuvable");
      window.location.href = url;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setErrorMsg(err?.response?.data?.error ?? err?.message ?? "Erreur lors de l'initiation du paiement.");
      setLoadingId(null);
    }
  }

  return (
    <>
      <PageMeta title="Abonnement | SEREPRO" description="Plans et abonnements SEREPRO" />

      <div className="space-y-10">
        {/* Notifications */}
        {successMsg && (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 px-5 py-4 text-sm font-medium text-green-700 dark:text-green-400">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-5 py-4 text-sm font-medium text-red-700 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Choisissez votre plan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Débloquez les fonctionnalités adaptées à votre entreprise.
          </p>

          <div className="inline-flex items-center gap-1 mt-5 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                !isAnnual
                  ? "bg-white dark:bg-gray-900 text-gray-800 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isAnnual
                  ? "bg-white dark:bg-gray-900 text-gray-800 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Annuel
              <span className="text-xs font-bold text-[#16a34a] bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.id === currentPlan}
              isAnnual={isAnnual}
              loadingId={loadingId}
              onChoose={handleChoose}
            />
          ))}
        </div>

        {/* Bandeau plan actuel */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(22,163,74,0.15))" }}
            >
              <span className="text-xl">📋</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Votre plan actuel : <span className="text-[#F97316]">{currentPlan}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {planSatisfies(currentPlan as PlanId, "PRO")
                  ? "Vous avez accès à toutes les fonctionnalités de votre plan."
                  : "Passez au plan Pro pour débloquer les avances, micro-crédits et épargne automatique."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
