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
  return <table ref={ref} className={["w-full table-fixed border-collapse text-sm", className].filter(Boolean).join(" ")} {...props} />;
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
    return <th ref={ref} className={["px-3 py-3 align-middle font-bold text-slate-600", className].filter(Boolean).join(" ")} {...props} />;
  }
);

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  function TableCell({ className = "", ...props }, ref) {
    return <td ref={ref} className={["border-t border-slate-200 px-2 py-2 align-middle", className].filter(Boolean).join(" ")} {...props} />;
  }
);
