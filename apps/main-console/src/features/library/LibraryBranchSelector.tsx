import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { getLibraryBranches } from "@/services/library-branches.service";
import type { LibraryBranchRow } from "@/services/library-branches.service";
import { useActiveLibraryBranchId } from "./use-library-branch";

export function LibraryBranchSelector() {
  const [branches, setBranches] = useState<LibraryBranchRow[]>([]);
  const [activeId, setActiveId] = useActiveLibraryBranchId();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getLibraryBranches({ page: 1, limit: 100 });
        if (alive) setBranches(res.payload?.rows ?? []);
      } catch {
        // silent
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-3 mb-2 rounded-lg border border-indigo-100 bg-white p-2 shadow-sm">
      <label className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
        <Building2 className="h-3 w-3" /> Library branch
      </label>
      <select
        className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-indigo-400 focus:outline-none"
        value={activeId ?? ""}
        disabled={loading || branches.length === 0}
        onChange={(e) => setActiveId(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">All branches</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
            {b.code ? ` (${b.code})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
