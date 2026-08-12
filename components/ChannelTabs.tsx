"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import type { ViewDef } from "@/lib/types";
import { ICONS, ICON_CYCLE } from "@/lib/icons";

function InlineInput({
  initial,
  placeholder,
  onConfirm,
  onCancel,
}: {
  initial: string;
  placeholder: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  function submit() {
    const trimmed = value.trim();
    if (trimmed) onConfirm(trimmed);
    else onCancel();
  }

  return (
    <div className="flex items-center gap-1 rounded-sm bg-brand-gold/20 px-1.5 py-1">
      <input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onCancel();
        }}
        onBlur={submit}
        placeholder={placeholder}
        className="w-28 rounded bg-white/90 px-2 py-1 text-sm text-brand-ink outline-none focus:ring-1 focus:ring-brand-gold dark:bg-brand-ink/80 dark:text-brand-cream"
      />
      <button
        onPointerDown={(e) => e.preventDefault()}
        onClick={submit}
        className="rounded p-1 text-brand-cream/80 hover:text-brand-cream"
      >
        <Check size={13} />
      </button>
      <button
        onPointerDown={(e) => e.preventDefault()}
        onClick={onCancel}
        className="rounded p-1 text-brand-cream/80 hover:text-brand-cream"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function ChannelTabs({
  views,
  activeId,
  editMode,
  headcounts,
  onSelect,
  onRename,
  onDelete,
  onAdd,
}: {
  views: ViewDef[];
  activeId: string;
  editMode: boolean;
  headcounts: Record<string, number>;
  onSelect: (id: string) => void;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  onAdd: (label: string) => void;
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="border-y-2 border-brand-gold bg-brand-maroon px-4 py-2 sm:px-8">
      <div role="tablist" aria-label="Organization view" className="flex flex-wrap items-center gap-1.5">
        {views.map((view) => {
          const Icon = ICONS[view.icon] ?? ICONS[ICON_CYCLE[0]];
          const active = view.id === activeId;

          if (renamingId === view.id) {
            return (
              <InlineInput
                key={view.id}
                initial={view.label}
                placeholder="Tab name"
                onConfirm={(label) => {
                  onRename(view.id, label);
                  setRenamingId(null);
                }}
                onCancel={() => setRenamingId(null)}
              />
            );
          }

          return (
            <div
              key={view.id}
              role="presentation"
              className={`flex items-center gap-1 rounded-sm ${
                active ? "bg-brand-gold text-brand-maroon" : "text-brand-cream/80"
              }`}
            >
              <button
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(view.id)}
                className={`flex items-center gap-2 rounded-sm px-3.5 py-2 text-sm transition ${
                  active ? "font-medium" : "hover:bg-brand-cream/10 hover:text-brand-cream"
                }`}
              >
                <Icon size={15} aria-hidden={true} />
                {view.label}
                {headcounts[view.id] != null && headcounts[view.id] > 0 && (
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold tabular-nums leading-none ${active ? "bg-brand-maroon/20 text-brand-maroon" : "bg-brand-cream/20 text-brand-cream/70"}`}>
                    {headcounts[view.id]}
                  </span>
                )}
              </button>
              {editMode && (
                <span className="flex items-center gap-0.5 pr-1.5">
                  <button
                    onClick={() => setRenamingId(view.id)}
                    aria-label={`Rename ${view.label}`}
                    className="rounded p-1 opacity-70 hover:opacity-100"
                  >
                    <Pencil size={11} />
                  </button>
                  {views.length > 1 && (
                    <button
                      onClick={() => onDelete(view.id)}
                      aria-label={`Delete ${view.label}`}
                      className="rounded p-1 opacity-70 hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              )}
            </div>
          );
        })}
        {editMode && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm text-brand-cream/80 transition hover:bg-brand-cream/10 hover:text-brand-cream"
          >
            <Plus size={15} aria-hidden="true" />
            Add tab
          </button>
        )}
        {editMode && adding && (
          <InlineInput
            initial=""
            placeholder="Tab name"
            onConfirm={(label) => {
              onAdd(label);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>
    </div>
  );
}
