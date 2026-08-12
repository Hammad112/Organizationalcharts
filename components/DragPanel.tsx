"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, GripVertical, Plus, Unlink } from "lucide-react";
import type { ViewDef } from "@/lib/types";

export function DragPanel({ view, onReparent }: { view: ViewDef; onReparent: (nodeId: string, newParentId: string | null) => void }) {
  const [open, setOpen] = useState(true);

  if (view.auto && view.roots.length === 0) return null;

  return (
    <div
      className={`fixed right-0 top-1/2 z-10 flex -translate-y-1/2 transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-[calc(100%-32px)]"
      }`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-16 w-8 items-center justify-center rounded-l-lg border border-r-0 border-brand-ink/10 bg-white shadow-card dark:border-brand-cream/10 dark:bg-[#221a19]"
        aria-label={open ? "Close panel" : "Open panel"}
      >
        {open ? <ChevronRight size={14} className="text-brand-slate" /> : <ChevronLeft size={14} className="text-brand-slate" />}
      </button>

      <div className="flex w-44 flex-col rounded-l-lg border border-r-0 border-brand-ink/10 bg-white shadow-lift dark:border-brand-cream/10 dark:bg-[#221a19]">
        <div className="border-b border-brand-ink/10 px-3 py-2 dark:border-brand-cream/10">
          <p className="font-mono text-[10px] uppercase tracking-wider text-brand-slate">
            Drag onto chart
          </p>
        </div>

        <div className="px-3 py-3">
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/new-node", JSON.stringify({ type: "blank", label: "New Role", color: "#990011" }));
              e.dataTransfer.effectAllowed = "copy";
            }}
            className="flex cursor-grab items-center gap-2 rounded-lg border border-brand-ink/12 bg-brand-cream/50 px-3 py-2.5 text-[13px] font-medium text-brand-ink shadow-sm transition hover:border-brand-red/30 hover:shadow-card active:cursor-grabbing dark:border-brand-cream/12 dark:bg-brand-ink/30 dark:text-brand-cream"
          >
            <GripVertical size={12} className="shrink-0 text-brand-slate/50" />
            <Plus size={14} className="shrink-0 text-brand-red" />
            <span>New Box</span>
          </div>

          <div
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes("application/reparent")) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("application/reparent");
              if (id) onReparent(id, null);
            }}
            className="mt-3 flex items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-brand-ink/15 py-2.5 text-[10px] text-brand-slate transition hover:border-brand-red hover:text-brand-red dark:border-brand-cream/15"
          >
            <Unlink size={10} />
            Drop to detach
          </div>
        </div>
      </div>
    </div>
  );
}
