"use client";

import { useEffect } from "react";
import { Trash2, Unlink, User, Users } from "lucide-react";
import type { OrgNode } from "@/lib/types";

export function DeleteConfirm({
  node,
  onDeleteAll,
  onDeleteOnly,
  onDeleteDisconnect,
  onCancel,
}: {
  node: OrgNode;
  onDeleteAll: () => void;
  onDeleteOnly: () => void;
  onDeleteDisconnect: () => void;
  onCancel: () => void;
}) {
  const childCount = node.children.length;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={`Delete ${node.title}`}>
      <div className="absolute inset-0 bg-brand-ink/20 backdrop-blur-[2px]" onClick={onCancel} role="presentation" />
      <div className="relative z-10 w-80 rounded-xl border border-brand-ink/10 bg-white p-5 shadow-lift dark:border-brand-cream/10 dark:bg-[#221a19]">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950">
            <Trash2 size={16} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-ink dark:text-brand-cream">Delete &ldquo;{node.title}&rdquo;?</p>
            <p className="text-[11px] text-brand-slate">{childCount} direct report{childCount !== 1 ? "s" : ""} below</p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={onDeleteOnly}
            className="flex w-full items-center gap-3 rounded-lg border border-brand-ink/10 px-3 py-2.5 text-left transition hover:border-brand-red/30 hover:bg-brand-blush dark:border-brand-cream/10 dark:hover:bg-brand-cream/5"
          >
            <User size={16} className="shrink-0 text-brand-slate" />
            <div>
              <p className="text-xs font-medium text-brand-ink dark:text-brand-cream">Delete only this role</p>
              <p className="text-[10px] text-brand-slate">Promote {childCount} report{childCount !== 1 ? "s" : ""} up to the parent</p>
            </div>
          </button>

          <button
            onClick={onDeleteDisconnect}
            className="flex w-full items-center gap-3 rounded-lg border border-brand-ink/10 px-3 py-2.5 text-left transition hover:border-brand-red/30 hover:bg-brand-blush dark:border-brand-cream/10 dark:hover:bg-brand-cream/5"
          >
            <Unlink size={16} className="shrink-0 text-brand-slate" />
            <div>
              <p className="text-xs font-medium text-brand-ink dark:text-brand-cream">Delete and disconnect</p>
              <p className="text-[10px] text-brand-slate">Remove this role, leave {childCount} report{childCount !== 1 ? "s" : ""} as separate flows</p>
            </div>
          </button>

          <button
            onClick={onDeleteAll}
            className="flex w-full items-center gap-3 rounded-lg border border-red-200 bg-red-50/50 px-3 py-2.5 text-left transition hover:border-red-400 hover:bg-red-50 dark:border-red-900 dark:bg-red-950/30 dark:hover:bg-red-950"
          >
            <Users size={16} className="shrink-0 text-red-500" />
            <div>
              <p className="text-xs font-medium text-red-600 dark:text-red-400">Delete entire branch</p>
              <p className="text-[10px] text-red-400 dark:text-red-500">Remove this role and all {childCount} report{childCount !== 1 ? "s" : ""} below</p>
            </div>
          </button>
        </div>

        <button
          onClick={onCancel}
          className="mt-3 w-full rounded-md py-1.5 text-center text-xs text-brand-slate transition hover:text-brand-ink dark:hover:text-brand-cream"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
