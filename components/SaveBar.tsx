"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Save, Undo2, Loader2 } from "lucide-react";

export function SaveBar({
  dirty,
  saving,
  lastSavedTo,
  getVersions,
  onSaveToTarget,
  onSaveNewVersion,
  onDiscard,
}: {
  dirty: boolean;
  saving: boolean;
  lastSavedTo: string | null;
  getVersions: () => { name: string; date: string }[];
  onSaveToTarget: (target: string) => Promise<boolean>;
  onSaveNewVersion: (name: string) => Promise<boolean>;
  onDiscard: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newVersionMode, setNewVersionMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [versions, setVersions] = useState<{ name: string; date: string }[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dropdownOpen) {
      setVersions(getVersions());
    }
  }, [dropdownOpen, getVersions]);

  useEffect(() => {
    if (newVersionMode && inputRef.current) inputRef.current.focus();
  }, [newVersionMode]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setNewVersionMode(false);
        setNewName("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  async function handleSave(target: string) {
    const ok = await onSaveToTarget(target);
    if (ok) {
      setJustSaved(true);
      setDropdownOpen(false);
      setTimeout(() => setJustSaved(false), 2500);
    }
  }

  async function handleSaveNew() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const ok = await onSaveNewVersion(trimmed);
    if (ok) {
      setJustSaved(true);
      setDropdownOpen(false);
      setNewVersionMode(false);
      setNewName("");
      setTimeout(() => setJustSaved(false), 2500);
    }
  }

  // Show success flash briefly after save
  if (!dirty && justSaved) {
    return (
      <div className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2.5 text-white shadow-md transition-all">
        <Check size={16} strokeWidth={3} />
        <span className="text-sm font-semibold">
          Saved to {lastSavedTo === "__main__" ? "Main" : `"${lastSavedTo}"`}
        </span>
      </div>
    );
  }

  if (!dirty) return null;

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-gradient-to-r from-brand-red via-brand-maroon to-brand-red px-5 py-2.5 shadow-md">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
          <Save size={14} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-white">
          You have unsaved changes
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Discard */}
        <button
          onClick={onDiscard}
          className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-white/25"
        >
          <Undo2 size={13} />
          Discard
        </button>

        {/* Save dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setDropdownOpen((v) => !v); setNewVersionMode(false); setNewName(""); }}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-brand-red shadow transition hover:bg-brand-blush disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Save size={13} />
            )}
            Save to...
            <ChevronDown size={12} className={`transition ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-2xl dark:border-gray-700 dark:bg-[#221a19]">
              {/* Save to Main */}
              <button
                onClick={() => handleSave("__main__")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-brand-blush dark:hover:bg-brand-red/10"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red/10">
                  <Save size={14} className="text-brand-red" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-ink dark:text-brand-cream">Main (Original)</p>
                  <p className="text-[10px] text-brand-slate">Overwrites the current live data</p>
                </div>
              </button>

              {versions.length > 0 && (
                <>
                  <div className="my-1.5 flex items-center gap-2 px-3">
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-brand-slate">Versions</span>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {versions.map((v) => (
                      <button
                        key={v.name}
                        onClick={() => handleSave(v.name)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-blue-50 dark:hover:bg-blue-950/20"
                      >
                        <span className="text-sm font-medium text-brand-ink dark:text-brand-cream">{v.name}</span>
                        <span className="text-[10px] text-brand-slate">{new Date(v.date).toLocaleDateString()}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-1.5 border-t border-gray-200 pt-1.5 dark:border-gray-700">
                {!newVersionMode ? (
                  <button
                    onClick={() => setNewVersionMode(true)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-brand-slate transition hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/20"
                  >
                    <Plus size={14} />
                    Save as new version
                  </button>
                ) : (
                  <div className="flex gap-1.5 px-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveNew(); if (e.key === "Escape") { setNewVersionMode(false); setNewName(""); } }}
                      placeholder="Version name..."
                      className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-brand-ink outline-none focus:border-green-500 dark:border-gray-700 dark:bg-[#2c2221] dark:text-brand-cream"
                    />
                    <button
                      onClick={handleSaveNew}
                      disabled={!newName.trim()}
                      className="shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-40"
                    >
                      Create
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
