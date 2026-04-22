import { useQuery } from "@tanstack/react-query";
import api from "../config/api";

export type PlanId = "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE";

export interface PlanFeatures {
  advances: boolean;
  microCredit: boolean;
  savings: boolean;
  insurance: boolean;
  employeeSpace: boolean;
  smsNotif: boolean;
  storage: string;
  api?: boolean;
  multiSite?: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  priceYear: number;
  maxEmployees: number;
  maxHRUsers: number;
  maxContracts: number;
  features: PlanFeatures;
}

const PLAN_RANK: Record<PlanId, number> = {
  STARTER: 0,
  PRO: 1,
  BUSINESS: 2,
  ENTERPRISE: 3,
};

export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ["billing", "plans"],
    queryFn: async () => {
      const { data } = await api.get("/billing/plans");
      return data.plans as Plan[];
    },
    staleTime: Infinity,
  });
}

export function useTenantPlan() {
  return useQuery<PlanId>({
    queryKey: ["auth", "me", "plan"],
    queryFn: async () => {
      const { data } = await api.get("/auth/me");
      const plan: PlanId = data?.data?.tenant?.plan ?? "STARTER";
      return plan;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCanAccess(feature: keyof PlanFeatures): boolean {
  const { data: currentPlan } = useTenantPlan();
  const { data: plans } = usePlans();
  if (!currentPlan || !plans) return false;
  const plan = plans.find((p) => p.id === currentPlan);
  return !!(plan?.features[feature]);
}

export function useIsAtLimit(resource: "employees" | "contracts"): boolean {
  const { data: currentPlan } = useTenantPlan();
  const { data: plans } = usePlans();
  if (!currentPlan || !plans) return false;
  const plan = plans.find((p) => p.id === currentPlan);
  if (!plan) return false;
  const limit = resource === "employees" ? plan.maxEmployees : plan.maxContracts;
  return limit !== -1 && limit <= 0;
}

export function planSatisfies(current: PlanId, required: PlanId): boolean {
  return PLAN_RANK[current] >= PLAN_RANK[required];
}
