type LiveUpdatesBadgeProps = {
  connected?: boolean;
  /** Dashboard or master data is still fetching. */
  loading?: boolean;
};

/** Fixed bottom-right status: loading, live socket, or hidden when idle and offline. */
export function LiveUpdatesBadge({ connected = false, loading = false }: LiveUpdatesBadgeProps) {
  if (!loading && !connected) return null;

  const label = loading ? "Loading…" : "Live Updates";
  const tone = loading ? "bg-[#64748b]" : "bg-red-600";

  return (
    <div className="fixed bottom-3 right-3 z-50 sm:bottom-4 sm:right-4">
      <div
        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-white shadow-lg sm:px-3 sm:py-2 ${tone}`}
      >
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white sm:h-2 sm:w-2" />
        <span className="text-xs font-medium sm:text-sm">{label}</span>
      </div>
    </div>
  );
}
