import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type FeesTableProps = {
  children: ReactNode;
  className?: string;
  /** Full width, fixed layout — reduces empty gaps between columns */
  fixed?: boolean;
  dense?: boolean;
  /** Outer frame when table is not already inside CompactPanel border */
  framed?: boolean;
};

export function FeesTable({
  children,
  className,
  fixed = true,
  dense = false,
  framed = false,
}: FeesTableProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto",
        framed && "overflow-hidden rounded-md border border-[#a0a0a0] bg-white",
        className,
      )}
    >
      <Table
        className={cn(
          "w-full border-collapse text-sm",
          fixed && "table-fixed",
          dense && "text-[13px]",
        )}
      >
        {children}
      </Table>
    </div>
  );
}

export function FeesTableHeader({
  children,
  multiRow,
}: {
  children: ReactNode;
  /** Use with FeesTableHeaderRow for stacked header rows */
  multiRow?: boolean;
}) {
  return (
    <TableHeader>
      {multiRow ? (
        children
      ) : (
        <TableRow className="border-b border-[#d4d4d4] bg-[#f0f0f0] hover:bg-[#f0f0f0]">
          {children}
        </TableRow>
      )}
    </TableHeader>
  );
}

export function FeesTableHeaderRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <TableRow
      className={cn("border-b border-[#b8b8b8] bg-[#f0f0f0] hover:bg-[#f0f0f0]", className)}
    >
      {children}
    </TableRow>
  );
}

export function FeesTableHead({
  children,
  className,
  colSpan,
  rowSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <TableHead
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={cn(
        "h-9 whitespace-nowrap border-r border-[#b8b8b8] px-2 py-1.5 text-left text-xs font-semibold text-[#1a1a1a] last:!border-r last:border-[#b8b8b8]",
        className,
      )}
    >
      {children}
    </TableHead>
  );
}

export function FeesTableBody({ children }: { children: ReactNode }) {
  return <TableBody>{children}</TableBody>;
}

export function FeesTableRow({
  children,
  className,
  highlight,
}: {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <TableRow
      className={cn(
        "border-b border-[#c8c8c8] hover:bg-[#f8f8f8]",
        highlight && "bg-[#f3f0ff] font-medium",
        className,
      )}
    >
      {children}
    </TableRow>
  );
}

export function FeesTableCell({
  children,
  className,
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <TableCell
      colSpan={colSpan}
      className={cn(
        "border-r border-[#b8b8b8] px-2 py-1.5 text-sm text-[#1a1a1a] last:!border-r last:border-[#b8b8b8]",
        className,
      )}
    >
      {children}
    </TableCell>
  );
}

/** Inline paid / not paid counts for matrix cells */
export function PaidUnpaidCell({
  paid,
  notPaid,
  empty,
}: {
  paid?: number;
  notPaid?: number;
  empty?: boolean;
}) {
  if (empty || (paid === undefined && notPaid === undefined)) {
    return <span className="text-[#bbb]">—</span>;
  }
  return (
    <span className="tabular-nums">
      <span className="font-semibold text-[#1a1a1a]">{paid?.toLocaleString("en-IN") ?? "—"}</span>
      <span className="text-[#999]"> / </span>
      <span className="font-semibold text-[#1a1a1a]">
        {notPaid?.toLocaleString("en-IN") ?? "—"}
      </span>
    </span>
  );
}
