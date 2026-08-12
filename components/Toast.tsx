"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export type ToastData = {
  id: string;
  message: string;
  undo?: () => void;
};

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastData[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (exiting) {
      const timer = setTimeout(onDismiss, 200);
      return () => clearTimeout(timer);
    }
  }, [exiting, onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-brand-ink/10 bg-white px-4 py-3 shadow-lift dark:border-brand-cream/10 dark:bg-[#2c2221] ${
        exiting ? "animate-toast-out" : "animate-toast-in"
      }`}
    >
      <span className="text-sm text-brand-ink dark:text-brand-cream">{toast.message}</span>
      {toast.undo && (
        <button
          onClick={() => {
            toast.undo!();
            onDismiss();
          }}
          className="shrink-0 text-xs font-medium text-brand-red hover:underline"
        >
          Undo
        </button>
      )}
      <button onClick={() => setExiting(true)} className="shrink-0 rounded p-0.5 text-brand-slate hover:text-brand-ink dark:hover:text-brand-cream">
        <X size={14} />
      </button>
    </div>
  );
}
