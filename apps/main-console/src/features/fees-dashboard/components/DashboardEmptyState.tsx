export function DashboardEmptyState({
  message = "No data for the selected filters.",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-[120px] items-center justify-center px-4 py-8 text-center text-sm text-[#666]">
      {message}
    </div>
  );
}
