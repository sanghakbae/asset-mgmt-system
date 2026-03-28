import { forwardRef } from "react";
import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

export const Table = forwardRef<HTMLTableElement, TableHTMLAttributes<HTMLTableElement>>(function Table(
  { className = "", ...props },
  ref
) {
  return <table ref={ref} className={["w-full table-auto border-collapse text-xs", className].filter(Boolean).join(" ")} {...props} />;
});

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  function TableHeader({ className = "", ...props }, ref) {
    return <thead ref={ref} className={className} {...props} />;
  }
);

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  function TableBody({ className = "", ...props }, ref) {
    return <tbody ref={ref} className={className} {...props} />;
  }
);

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(function TableRow(
  { className = "", ...props },
  ref
) {
  return <tr ref={ref} className={className} {...props} />;
});

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  function TableHead({ className = "", ...props }, ref) {
    return (
      <th
        ref={ref}
        className={["px-1.5 py-1 align-middle text-[11px] font-bold leading-4 text-slate-600", className].filter(Boolean).join(" ")}
        {...props}
      />
    );
  }
);

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  function TableCell({ className = "", ...props }, ref) {
    return (
      <td
        ref={ref}
        className={["border-t border-slate-200 px-1.5 py-1 align-middle text-[11px] leading-4", className].filter(Boolean).join(" ")}
        {...props}
      />
    );
  }
);
