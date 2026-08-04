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

  // The card wrapper (label + border + padding) was noise — the quick-links
  // rail is already a well-defined region, and the icon on the select makes
  // the purpose obvious.
  return (
    <div className="mx-3 mb-2">
      <div className="relative">
        <Building2 className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-500" />
        <select
          aria-label="Library branch"
          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 pl-7 text-xs text-gray-700 focus:border-indigo-400 focus:outline-none"
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
    </div>
  );
}
