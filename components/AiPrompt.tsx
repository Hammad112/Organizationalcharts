"use client";

import { useRef, useState } from "react";
import { Loader2, Send, Sparkles, X } from "lucide-react";

export function AiPrompt({
  onApply,
  tabLabel,
  disabled,
}: {
  onApply: (prompt: string) => Promise<void>;
  tabLabel: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onApply(prompt.trim());
      setPrompt("");
      setOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-md border border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 px-3 py-1.5 text-xs font-medium text-purple-700 shadow-sm transition hover:border-purple-400 hover:shadow-md disabled:opacity-50 dark:border-purple-500/30 dark:from-purple-900/20 dark:to-indigo-900/20 dark:text-purple-300"
        title="Modify this tab with AI"
      >
        <Sparkles size={13} />
        AI Edit
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center">
      <div className="mx-4 mb-4 w-full max-w-lg rounded-xl border border-purple-200 bg-white p-5 shadow-2xl dark:border-purple-500/20 dark:bg-[#1a1412] sm:mb-0">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
              <Sparkles size={14} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-brand-ink dark:text-brand-cream">AI Edit</h3>
              <p className="text-[10px] text-brand-slate">Modifying &ldquo;{tabLabel}&rdquo; tab</p>
            </div>
          </div>
          <button
            onClick={() => { setOpen(false); setError(null); }}
            className="rounded-md p-1.5 text-brand-slate transition hover:bg-brand-blush hover:text-brand-red dark:hover:bg-brand-cream/10"
          >
            <X size={15} />
          </button>
        </div>

        <textarea
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
            if (e.key === "Escape") { setOpen(false); setError(null); }
          }}
          placeholder='e.g. "Add a Marketing team under CEO with 3 roles", "Remove all empty nodes", "Add JD for all Senior roles"'
          rows={3}
          disabled={loading}
          className="w-full resize-none rounded-lg border border-brand-ink/10 bg-brand-blush/30 px-3 py-2.5 text-sm text-brand-ink outline-none placeholder:text-brand-slate/60 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 disabled:opacity-50 dark:border-brand-cream/10 dark:bg-brand-ink/30 dark:text-brand-cream"
        />

        {error && (
          <p className="mt-2 rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[10px] text-brand-slate">Enter to send &middot; Shift+Enter for new line &middot; Esc to close</p>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || loading}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            {loading ? "Thinking..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
