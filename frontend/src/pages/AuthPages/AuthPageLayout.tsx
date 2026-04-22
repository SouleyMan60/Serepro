import React from "react";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

function SereproAuthPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-1/2 h-full overflow-hidden select-none">
      {/* Photo de fond */}
      <img
        src="/images/background.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "70% center" }}
      />

      {/* Overlay gradient orange → vert */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/60 to-green-600/60" />

      {/* Overlay dot-grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Contenu */}
      <div className="relative z-10 flex flex-col justify-between h-full w-full px-12 py-14">
        {/* Espace haut */}
        <div />

        {/* Slogan */}
        <div className="flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold text-white leading-snug drop-shadow">
            Avec SEREPRO
          </h2>
          <div className="mt-3 w-12 h-1 rounded-full bg-white/50" />
          <p className="mt-4 text-white/80 text-sm max-w-xs leading-relaxed">
            Gérez vos employés et leurs finances en toute simplicité
          </p>
        </div>

        {/* Stats + drapeau */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="flex justify-center gap-10">
            {[
              { value: "500+",    label: "entreprises" },
              { value: "10 000+", label: "employés" },
              { value: "98%",     label: "satisfaction" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center">
                <span className="text-2xl font-black text-white drop-shadow">
                  {s.value}
                </span>
                <span className="text-xs text-white/60 mt-0.5 font-medium tracking-wide">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Drapeau CI */}
          <div className="flex justify-center">
            <div className="flex h-5 w-10 rounded-sm overflow-hidden shadow-md opacity-85">
              <div className="flex-1 bg-orange-500" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-green-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <SereproAuthPanel />
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
