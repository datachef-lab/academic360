import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Users,
  FileCheck2,
  ShieldCheck,
  Trophy,
  Ban,
  IndianRupee,
  BadgeCheck,
  XCircle,
  Home,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { AcademicYearSelector } from "@/components/academic-year";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { useAppSelector } from "@/store/hooks";
import { selectAvailableAcademicYears } from "@/store/slices/academicYearSlice";
import {
  getAdmissionDashboard,
  type AdmissionDashboard,
  type Bucket,
} from "@/features/academic-year-setup/api/admission-dashboard-api";

const ADMISSIONS_BASE = "/dashboard/admissions";
const BAR_HUE = "#7c3aed"; // single sequential hue — bars encode magnitude by length

// Humanize an ENUM_LIKE_KEY into "Enum like key".
const humanize = (s: string) =>
  s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

type Tile = {
  label: string;
  value: number;
  icon: typeof Users;
  accent: string; // ink color for the icon chip
  money?: boolean;
};

function StatTile({ t }: { t: Tile }) {
  return (
    <Card className="rounded-xl border border-gray-200 bg-white">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`rounded-lg bg-gray-100 p-2 ${t.accent}`}>
          <t.icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-gray-500">{t.label}</div>
          <div className="text-xl font-bold text-gray-900">
            {t.money ? `₹${t.value.toLocaleString("en-IN")}` : t.value.toLocaleString("en-IN")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title,
  buckets,
  limit = 8,
}: {
  title: string;
  buckets: Bucket[];
  limit?: number;
}) {
  const sorted = [...buckets].sort((a, b) => b.count - a.count);
  const shown = sorted.slice(0, limit);
  const hiddenCount = sorted.slice(limit).reduce((s, b) => s + b.count, 0);
  if (hiddenCount > 0) shown.push({ key: "__other", label: "Other", count: hiddenCount });
  const max = Math.max(1, ...shown.map((b) => b.count));
  const total = buckets.reduce((s, b) => s + b.count, 0);

  return (
    <Card className="rounded-xl border border-gray-200 bg-white">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <span className="text-xs text-gray-400">{total.toLocaleString("en-IN")}</span>
        </div>
        {shown.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">No data</p>
        ) : (
          <ul className="space-y-2">
            {shown.map((b) => (
              <li key={b.key}>
                <div className="mb-0.5 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-gray-700" title={b.label}>
                    {b.label}
                  </span>
                  <span className="shrink-0 font-medium text-gray-900">
                    {b.count.toLocaleString("en-IN")}
                  </span>
                </div>
                {/* single-hue magnitude bar; 4px rounded end anchored to the track */}
                <div className="h-2 w-full overflow-hidden rounded bg-gray-100">
                  <div
                    className="h-full rounded"
                    style={{ width: `${(b.count / max) * 100}%`, backgroundColor: BAR_HUE }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdmissionHomePage() {
  useRestrictTempUsers();
  const navigate = useNavigate();
  const { year } = useParams<{ year: string }>();
  const years = useAppSelector(selectAvailableAcademicYears);

  const [data, setData] = useState<AdmissionDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");

  // Map the 4-digit URL year → academic_years.id for the backend filter.
  const academicYearId = useMemo(() => {
    const wanted = String(year ?? "").match(/\d{4}/)?.[0];
    if (!wanted) return undefined;
    const hit = years.find((y) => String(y.year ?? "").match(/\d{4}/)?.[0] === wanted);
    return hit?.id;
  }, [year, years]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAdmissionDashboard({
      academicYearId,
      level: level || undefined,
      formStatus: status || undefined,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load admission dashboard.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [academicYearId, level, status]);

  const k = data?.kpis;
  const tiles: Tile[] = k
    ? [
        {
          label: "Total Applications",
          value: k.totalApplications,
          icon: Users,
          accent: "text-violet-600",
        },
        { label: "Submitted", value: k.submitted, icon: FileCheck2, accent: "text-blue-600" },
        { label: "Approved", value: k.approved, icon: BadgeCheck, accent: "text-emerald-600" },
        { label: "Admitted", value: k.admitted, icon: ShieldCheck, accent: "text-emerald-600" },
        { label: "Merit-listed", value: k.meritListed, icon: Trophy, accent: "text-amber-600" },
        { label: "Verified", value: k.verified, icon: ShieldCheck, accent: "text-teal-600" },
        {
          label: "Payment Received",
          value: k.paymentReceived,
          icon: IndianRupee,
          accent: "text-emerald-600",
        },
        {
          label: "Amount Collected",
          value: k.amountCollected,
          icon: IndianRupee,
          accent: "text-emerald-600",
          money: true,
        },
        { label: "Blocked", value: k.blocked, icon: Ban, accent: "text-rose-600" },
        { label: "Cancelled", value: k.cancelled, icon: XCircle, accent: "text-rose-600" },
      ]
    : [];

  const b = data?.breakdowns;
  const levelOptions = b?.byLevel.map((x) => x.key).filter((x) => x !== "UNKNOWN") ?? [];
  const statusOptions = b?.byStatus.map((x) => x.key).filter((x) => x !== "UNKNOWN") ?? [];

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Home className="h-6 w-6 text-emerald-600 sm:h-7 sm:w-7" />
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Admission Home</h1>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Overview &amp; statistics for the current admission cycle
            </p>
          </div>
          <AcademicYearSelector
            className="w-full sm:w-64"
            showLabel={false}
            onAcademicYearChange={(y) => {
              const m = String(y?.year ?? "").match(/\d{4}/);
              if (m && m[0] !== year) navigate(`${ADMISSIONS_BASE}/${m[0]}/home`);
            }}
          />
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
          >
            <option value="">All levels</option>
            {levelOptions.map((o) => (
              <option key={o} value={o}>
                {humanize(o)}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
          >
            <option value="">All statuses</option>
            {statusOptions.map((o) => (
              <option key={o} value={o}>
                {humanize(o)}
              </option>
            ))}
          </select>
          {(level || status) && (
            <button
              onClick={() => {
                setLevel("");
                setStatus("");
              }}
              className="text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200/60" />
            ))}
          </div>
        ) : data && k ? (
          <>
            {/* KPI tiles */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {tiles.map((t) => (
                <StatTile key={t.label} t={t} />
              ))}
            </div>

            {/* Trend */}
            <Card className="mb-6 rounded-xl border border-gray-200 bg-white">
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Applications over time</h3>
                {data.trend.length === 0 ? (
                  <p className="py-10 text-center text-xs text-gray-400">No applications yet</p>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={data.trend}
                        margin={{ top: 8, right: 12, bottom: 4, left: -8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                          tickLine={false}
                          axisLine={{ stroke: "#e5e7eb" }}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            fontSize: 12,
                            borderRadius: 8,
                            border: "1px solid #e5e7eb",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="Applications"
                          stroke={BAR_HUE}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Breakdowns */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <BreakdownCard title="By status" buckets={b!.byStatus} />
              <BreakdownCard title="By program-course" buckets={b!.byProgramCourse} />
              <BreakdownCard title="By level" buckets={b!.byLevel} />
              <BreakdownCard title="By category" buckets={b!.byCategory} />
              <BreakdownCard title="By gender" buckets={b!.byGender} />
              <BreakdownCard title="By religion" buckets={b!.byReligion} />
              <BreakdownCard title="By state" buckets={b!.byState} />
              <BreakdownCard title="By country" buckets={b!.byCountry} />
              <BreakdownCard title="By annual income" buckets={b!.byAnnualIncome} />
              <BreakdownCard title="By board" buckets={b!.byBoard} />
              <BreakdownCard title="By blood group" buckets={b!.byBloodGroup} />
              <BreakdownCard title="By nationality" buckets={b!.byNationality} />
              <BreakdownCard title="Special groups" buckets={b!.specialGroups} />
              <BreakdownCard title="By admission step" buckets={b!.byStep} />
            </div>
          </>
        ) : (
          !loading && (
            <div className="rounded-xl border border-dashed bg-white p-12 text-center text-sm text-gray-500">
              No admission data for this academic year.
            </div>
          )
        )}
      </div>
    </div>
  );
}
