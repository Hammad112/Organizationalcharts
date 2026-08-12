"use client";

import { useState } from "react";
import { ClipboardCopy, ClipboardPaste, GitCompare, Maximize, Minimize, Pencil, RotateCcw, Search, X } from "lucide-react";
import { VersionSelector } from "./VersionSelector";
import { AiPrompt } from "./AiPrompt";

export function Header({
  editMode,
  onToggleEdit,
  onReset,
  onLoadForEditing,
  onDuplicateVersion,
  onDeleteVersion,
  onCompare,
  onCopyAll,
  onPaste,
  onToggleFullscreen,
  hasClipboard,
  isFullscreen,
  isOverview,
  searchQuery,
  onSearchChange,
  getVersions,
  onAiApply,
  tabLabel,
}: {
  editMode: boolean;
  onToggleEdit: () => void;
  onReset: () => void;
  onLoadForEditing: (name: string) => void;
  onDuplicateVersion: (sourceName: string, newName: string) => void;
  onDeleteVersion: (name: string) => void;
  onCompare: () => void;
  onCopyAll: () => void;
  onPaste: () => void;
  onToggleFullscreen: () => void;
  hasClipboard: boolean;
  isFullscreen: boolean;
  isOverview: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  getVersions: () => { name: string; date: string }[];
  onAiApply: (prompt: string) => Promise<void>;
  tabLabel: string;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const BTN = "flex items-center gap-1.5 rounded-md border border-brand-ink/10 bg-white px-3 py-1.5 text-xs font-medium text-brand-ink shadow-sm transition hover:border-brand-red hover:text-brand-red dark:border-brand-cream/10 dark:bg-[#221a19] dark:text-brand-cream";

  return (
    <header className="px-6 pt-8 pb-6 sm:px-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-brand-red text-brand-cream shadow-card">
            <span className="font-display text-lg">H</span>
          </div>
          <div>
            <h1 className="font-display text-2xl text-brand-ink dark:text-brand-cream">
              Organization structure
            </h1>
            <p className="mt-0.5 font-mono text-xs uppercase tracking-wide text-brand-slate">
              HUM Network — click a view below, not a slide
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          {/* Search */}
          {searchOpen ? (
            <div className="flex items-center gap-1 rounded-md border border-brand-red bg-white px-2 py-1 shadow-sm dark:bg-[#221a19]">
              <Search size={13} className="text-brand-red" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") { onSearchChange(""); setSearchOpen(false); } }}
                placeholder="Search by name..."
                className="w-36 bg-transparent text-xs text-brand-ink outline-none placeholder:text-brand-slate dark:text-brand-cream"
              />
              <button onClick={() => { onSearchChange(""); setSearchOpen(false); }} className="rounded p-0.5 text-brand-slate hover:text-brand-red">
                <X size={12} />
              </button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className={BTN} title="Search nodes (by name)">
              <Search size={13} />
            </button>
          )}

          {/* Copy / Paste */}
          {!isOverview && (
            <>
              <button onClick={onCopyAll} className={BTN} title="Copy all nodes from this tab">
                <ClipboardCopy size={13} />
                Copy
              </button>
              {hasClipboard && (
                <button onClick={onPaste} className={`${BTN} !border-green-400 !text-green-600 hover:!bg-green-50`} title="Paste copied nodes into this tab">
                  <ClipboardPaste size={13} />
                  Paste
                </button>
              )}
            </>
          )}

          <VersionSelector
            onLoadForEditing={onLoadForEditing}
            onDuplicate={onDuplicateVersion}
            onDelete={onDeleteVersion}
            getVersions={getVersions}
          />
          <button onClick={onCompare} className={BTN}>
            <GitCompare size={13} />
            Compare
          </button>
          <button onClick={onToggleFullscreen} className={BTN} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
          </button>
          <button
            onClick={onToggleEdit}
            aria-pressed={editMode}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition ${
              editMode
                ? "border-brand-red bg-brand-red text-brand-cream"
                : "border-brand-ink/15 text-brand-slate hover:border-brand-red hover:text-brand-red dark:border-brand-cream/20 dark:text-brand-cream/70"
            }`}
          >
            <Pencil size={13} aria-hidden="true" />
            {editMode ? "Editing — click to preview" : "Edit structure"}
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-md border border-brand-ink/15 px-3 py-1.5 text-xs text-brand-slate transition hover:border-brand-red hover:text-brand-red dark:border-brand-cream/20 dark:text-brand-cream/70"
          >
            <RotateCcw size={13} aria-hidden="true" />
            Reset to defaults
          </button>
        </div>
      </div>

      {!isOverview && (
        <div className="mt-3">
          <AiPrompt onApply={onAiApply} tabLabel={tabLabel} />
        </div>
      )}
    </header>
  );
}
