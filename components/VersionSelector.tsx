"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Copy, Download, Pencil, Save, Trash2 } from "lucide-react";

const INPUT = "w-full rounded-md border border-brand-ink/15 bg-white px-3 py-1.5 text-sm text-brand-ink outline-none focus:border-brand-red dark:border-brand-cream/15 dark:bg-[#2c2221] dark:text-brand-cream";

export function VersionSelector({
  onLoadForEditing,
  onDuplicate,
  onDelete,
  getVersions,
}: {
  onLoadForEditing: (name: string) => void;
  onDuplicate: (sourceName: string, newName: string) => void;
  onDelete: (name: string) => void;
  getVersions: () => { name: string; date: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [versions, setVersions] = useState<{ name: string; date: string }[]>([]);

  const refresh = useCallback(() => {
    setVersions(getVersions());
  }, [getVersions]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function resetSubStates() {
    setDuplicating(null);
    setConfirmDelete(null);
    setName("");
  }

  function handleDuplicate() {
    const trimmed = name.trim();
    if (!trimmed || !duplicating) return;
    onDuplicate(duplicating, trimmed);
    setName("");
    setDuplicating(null);
    refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((v) => !v); resetSubStates(); refresh(); }}
        className="flex items-center gap-1.5 rounded-md border border-brand-ink/10 bg-white px-3 py-1.5 text-xs font-medium text-brand-ink shadow-sm transition hover:border-brand-red hover:text-brand-red dark:border-brand-cream/10 dark:bg-[#221a19] dark:text-brand-cream"
      >
        <Save size={13} />
        Versions
        <ChevronDown size={12} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-20" onClick={() => { setOpen(false); resetSubStates(); }} aria-label="Close" />
          <div className="absolute right-0 top-full z-30 mt-1.5 w-80 rounded-lg border border-brand-ink/10 bg-white p-3 shadow-lift dark:border-brand-cream/10 dark:bg-[#221a19]">

            {/* Duplicate input */}
            {duplicating && (
              <div className="mb-2">
                <p className="mb-1.5 text-[10px] text-brand-slate">Duplicate &ldquo;{duplicating}&rdquo; as:</p>
                <div className="flex gap-1.5">
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleDuplicate(); if (e.key === "Escape") setDuplicating(null); }}
                    placeholder="New version name..."
                    className={INPUT}
                  />
                  <button
                    onClick={handleDuplicate}
                    disabled={!name.trim()}
                    className="shrink-0 rounded-md bg-brand-red px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-red/90 disabled:opacity-40"
                  >
                    Duplicate
                  </button>
                </div>
              </div>
            )}

            <p className="mb-2 text-[10px] text-brand-slate">
              Load a version to edit it locally. Use the <strong>Save to...</strong> bar to save your changes.
            </p>

            {/* Version list */}
            {versions.length === 0 ? (
              <p className="py-3 text-center text-[11px] text-brand-slate">No saved versions yet. Make changes and use &ldquo;Save to...&rdquo; above.</p>
            ) : (
              <div className="max-h-52 overflow-y-auto">
                {versions.map((v) => (
                  <div key={v.name}>
                    <div className="flex items-center gap-1 rounded-md px-2 py-1.5 transition hover:bg-brand-blush dark:hover:bg-brand-cream/5">
                      <button
                        onClick={() => { onLoadForEditing(v.name); setOpen(false); }}
                        className="flex flex-1 items-center justify-between text-left"
                        title={`Load "${v.name}" for editing (nothing is overwritten)`}
                      >
                        <div className="flex items-center gap-2">
                          <Download size={12} className="text-brand-slate" />
                          <span className="text-xs font-medium text-brand-ink dark:text-brand-cream">
                            {v.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-brand-slate">
                          {new Date(v.date).toLocaleDateString()}
                        </span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); resetSubStates(); setDuplicating(v.name); }}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-brand-slate transition hover:bg-brand-ink/5 hover:text-brand-ink dark:hover:bg-brand-cream/10"
                        title={`Duplicate "${v.name}"`}
                      >
                        <Copy size={11} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); resetSubStates(); setConfirmDelete(v.name); }}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-brand-slate transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                        title={`Delete "${v.name}"`}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    {confirmDelete === v.name && (
                      <div className="mx-2 mb-1 flex items-center justify-between rounded-md border border-red-200 bg-red-50/50 px-2 py-1.5 dark:border-red-900 dark:bg-red-950/30">
                        <span className="text-[10px] text-red-600 dark:text-red-400">Delete permanently?</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { onDelete(v.name); setConfirmDelete(null); refresh(); }}
                            className="rounded px-2 py-0.5 text-[10px] font-medium text-red-600 transition hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="rounded px-2 py-0.5 text-[10px] text-brand-slate transition hover:bg-brand-ink/5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
