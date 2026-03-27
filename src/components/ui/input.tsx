import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", type = "text", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={[
        "w-full rounded-[10px] border border-slate-300 bg-white px-2 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
});
