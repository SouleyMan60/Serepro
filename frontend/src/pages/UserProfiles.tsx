import { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";
import Badge from "../components/ui/badge/Badge";
import { useAuth } from "../context/AuthContext";
import api from "../config/api";

interface Tenant {
  id: string;
  name: string;
  tenantType: "ENTREPRISE" | "ENTREPRENEUR";
  plan: "STARTER" | "PRO" | "ENTERPRISE";
  phone?: string;
  email?: string;
  nif?: string;
  address?: string;
}

interface UserProfile {
  id: string;
  displayName?: string;
  email: string;
  role: string;
  tenant: Tenant;
}

const planColors: Record<string, "success" | "warning" | "info"> = {
  STARTER: "info",
  PRO: "warning",
  ENTERPRISE: "success",
};

const planLabels: Record<string, string> = {
  STARTER: "Starter",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

function ProfileHeader({ profile }: { profile: UserProfile | null }) {
  const { user } = useAuth();
  const displayName = profile?.displayName ?? user?.displayName ?? "Utilisateur";
  const email = profile?.email ?? user?.email ?? "";
  const photoURL = user?.photoURL ?? null;
  const initiale = displayName.charAt(0).toUpperCase();
  const tenant = profile?.tenant;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Avatar + nom */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
            {photoURL ? (
              <img src={photoURL} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ background: "linear-gradient(135deg, #F97316, #16a34a)" }}
              >
                {initiale}
              </div>
            )}
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">{displayName}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{email}</p>
          </div>
        </div>

        {/* Badges tenant */}
        {tenant && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Type de compte */}
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300">
              {tenant.tenantType === "ENTREPRISE" ? "🏢" : "👤"}
              {tenant.tenantType === "ENTREPRISE" ? "Entreprise" : "Entrepreneur"}
            </span>

            {/* Plan */}
            <Badge color={planColors[tenant.plan] ?? "info"} size="sm">
              {planLabels[tenant.plan] ?? tenant.plan}
            </Badge>
          </div>
        )}
      </div>

      {/* Nom entreprise / propriétaire */}
      {tenant && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {tenant.tenantType === "ENTREPRISE" ? "Nom de l'entreprise" : "Nom du propriétaire"}
          </p>
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{tenant.name}</p>
        </div>
      )}
    </div>
  );
}

export default function UserProfiles() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    api.get("/auth/me")
      .then((res) => setProfile(res.data.data))
      .catch(() => setProfile(null))
      .finally(() => setLoadingProfile(false));
  }, []);

  return (
    <>
      <PageMeta
        title="Mon profil | SEREPRO"
        description="Gérez vos informations personnelles sur SEREPRO"
      />
      <PageBreadcrumb pageTitle="Mon compte" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Mon compte
        </h3>
        <div className="space-y-6">
          {loadingProfile ? (
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 animate-pulse h-24" />
          ) : (
            <ProfileHeader profile={profile} />
          )}
          <UserInfoCard />
          <UserAddressCard />
        </div>
      </div>
    </>
  );
}
