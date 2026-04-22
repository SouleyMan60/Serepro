import { Link } from "react-router";
import { useTenantPlan, planSatisfies, type PlanId } from "../../hooks/usePlan";

const PLAN_LABEL: Record<PlanId, string> = {
  STARTER: "Starter",
  PRO: "Pro",
  BUSINESS: "Business",
  ENTERPRISE: "Enterprise",
};

interface PlanGateProps {
  children: React.ReactNode;
  requiredPlan: PlanId;
  /** If true, renders children with an overlay instead of hiding them */
  overlay?: boolean;
}

export default function PlanGate({ children, requiredPlan, overlay = true }: PlanGateProps) {
  const { data: currentPlan, isLoading } = useTenantPlan();

  if (isLoading) return <>{children}</>;

  const allowed = currentPlan ? planSatisfies(currentPlan, requiredPlan) : false;
  if (allowed) return <>{children}</>;

  if (!overlay) return null;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-30 blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl z-10">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F97316]/20 to-[#16a34a]/20">
            <span className="text-2xl">🔒</span>
          </div>
          <div>
            <p className="text-base font-semibold text-gray-800 dark:text-white/90">
              Disponible avec le plan {PLAN_LABEL[requiredPlan]}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Votre plan actuel ({PLAN_LABEL[currentPlan ?? "STARTER"]}) ne donne pas accès à cette fonctionnalité.
            </p>
          </div>
          <Link
            to="/billing"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #F97316, #16a34a)" }}
          >
            Passer au {PLAN_LABEL[requiredPlan]}
          </Link>
        </div>
      </div>
    </div>
  );
}
