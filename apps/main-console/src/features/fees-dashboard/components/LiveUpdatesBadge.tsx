type LiveUpdatesBadgeProps = {
  connected?: boolean;
};

/** Fixed bottom-right badge — matches Realtime Tracker live indicator. */
export function LiveUpdatesBadge({ connected = false }: LiveUpdatesBadgeProps) {
  if (!connected) return null;

  return (
    <div className="fixed bottom-3 right-3 z-50 sm:bottom-4 sm:right-4">
      <div className="flex items-center gap-2 rounded-lg bg-red-600 px-2 py-1.5 text-white shadow-lg sm:px-3 sm:py-2">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white sm:h-2 sm:w-2" />
        <span className="text-xs font-medium sm:text-sm">Live Updates</span>
      </div>
    </div>
  );
}
