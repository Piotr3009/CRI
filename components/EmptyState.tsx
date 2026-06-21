import type { ReactNode } from "react";
import { ShieldIcon } from "./Icons";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center shadow-card">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cri-green/10 text-cri-green">
        <ShieldIcon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-cri-charcoal">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm text-cri-steel">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
