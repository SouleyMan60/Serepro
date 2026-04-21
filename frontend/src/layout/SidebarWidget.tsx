export default function SidebarWidget() {
  return (
    <div className="mx-auto mb-10 w-full max-w-60 rounded-2xl px-4 py-5 text-center overflow-hidden relative"
      style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.08), rgba(22,163,74,0.08))" }}
    >
      <div className="relative z-10">
        <h3 className="mb-1 font-semibold text-gray-900 dark:text-white text-sm">
          SEREPRO Pro
        </h3>
        <p className="mb-4 text-gray-500 text-theme-xs dark:text-gray-400 leading-relaxed">
          Passez au plan Pro pour débloquer toutes les fonctionnalités RH &amp; Finance.
        </p>
        <button
          className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-white text-theme-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #F97316, #16a34a)" }}
        >
          Passer au Pro
        </button>
      </div>
    </div>
  );
}
