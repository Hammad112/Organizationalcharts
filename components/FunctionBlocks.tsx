"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  X,
  Check,
  Pencil,
  Shield,
  Cloud,
  Network,
  Server,
  Database,
  Code,
  Users,
  Globe,
  Briefcase,
  Monitor,
  Lock,
  Cpu,
  Wifi,
  HardDrive,
  Tv,
  Film,
  Megaphone,
  Newspaper,
  Palette,
  Scale,
  Banknote,
  Radio,
  Clapperboard,
  Headphones,
  type LucideIcon,
} from "lucide-react";
import { cloudSave, cloudLoad } from "@/lib/supabase";

const STORAGE_KEY = "hum-org-function-blocks";

export type FunctionBlock = {
  id: string;
  label: string;
  icon: string;
  color: string;
};

export const FUNCTION_ICON_MAP: Record<string, LucideIcon> = {
  shield: Shield,
  cloud: Cloud,
  network: Network,
  server: Server,
  database: Database,
  code: Code,
  users: Users,
  globe: Globe,
  briefcase: Briefcase,
  monitor: Monitor,
  lock: Lock,
  cpu: Cpu,
  wifi: Wifi,
  "hard-drive": HardDrive,
  tv: Tv,
  film: Film,
  megaphone: Megaphone,
  newspaper: Newspaper,
  palette: Palette,
  scale: Scale,
  banknote: Banknote,
  radio: Radio,
  clapperboard: Clapperboard,
  headphones: Headphones,
};

const ICON_OPTIONS = Object.keys(FUNCTION_ICON_MAP);

const COLOR_OPTIONS = [
  "#990011",
  "#5C000A",
  "#2F3C7E",
  "#C9A227",
  "#0F6E56",
  "#5F5E5A",
  "#1B4965",
  "#7B2D8E",
  "#D4611E",
  "#2D6A4F",
];

const DEFAULT_BLOCKS: FunctionBlock[] = [
  { id: "fn-1", label: "IT Infrastructure", icon: "server", color: "#990011" },
  { id: "fn-2", label: "Cyber Security", icon: "shield", color: "#5C000A" },
  { id: "fn-3", label: "DevOps & CI/CD", icon: "code", color: "#2F3C7E" },
  { id: "fn-4", label: "Cloud & Hosting", icon: "cloud", color: "#7B2D8E" },
  { id: "fn-5", label: "Network Administration", icon: "network", color: "#D4611E" },
  { id: "fn-6", label: "Database Management", icon: "database", color: "#0F6E56" },
  { id: "fn-7", label: "Software Development", icon: "cpu", color: "#C9A227" },
  { id: "fn-8", label: "IT Support & Helpdesk", icon: "headphones", color: "#1B4965" },
  { id: "fn-9", label: "System Administration", icon: "hard-drive", color: "#5F5E5A" },
  { id: "fn-10", label: "Web & Digital Platforms", icon: "globe", color: "#990011" },
  { id: "fn-11", label: "AI & Automation", icon: "monitor", color: "#7B2D8E" },
  { id: "fn-12", label: "Data & Analytics", icon: "wifi", color: "#2D6A4F" },
];

function BlockForm({
  label,
  icon,
  color,
  onLabelChange,
  onIconChange,
  onColorChange,
  onSave,
  onCancel,
  saveLabel,
}: {
  label: string;
  icon: string;
  color: string;
  onLabelChange: (v: string) => void;
  onIconChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="rounded-xl border border-brand-ink/10 bg-white p-4 shadow-lg dark:border-brand-cream/10 dark:bg-[#221a19]">
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-brand-slate">Function Name</label>
        <input
          ref={inputRef}
          type="text"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
          placeholder="e.g. DevOps & Automation"
          className="w-full rounded-lg border border-brand-ink/10 bg-brand-cream/30 px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-red dark:border-brand-cream/10 dark:bg-brand-ink/30 dark:text-brand-cream"
        />
      </div>
      <div className="mb-3">
        <label className="mb-1.5 block text-xs font-medium text-brand-slate">Icon</label>
        <div className="flex flex-wrap gap-1.5">
          {ICON_OPTIONS.map((key) => {
            const IC = FUNCTION_ICON_MAP[key];
            return (
              <button
                key={key}
                onClick={() => onIconChange(key)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                  icon === key
                    ? "border-brand-red bg-brand-red/10 text-brand-red"
                    : "border-brand-ink/10 text-brand-slate hover:border-brand-red/30 dark:border-brand-cream/10"
                }`}
              >
                <IC size={15} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-brand-slate">Color</label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => onColorChange(c)}
              className={`h-7 w-7 rounded-full border-2 transition ${
                color === c ? "border-brand-ink scale-110 dark:border-brand-cream" : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-xs text-brand-slate hover:bg-brand-blush dark:hover:bg-brand-cream/10"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!label.trim()}
          className="rounded-lg bg-brand-red px-4 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

export function FunctionBlocks({ editMode }: { editMode: boolean }) {
  const [blocks, setBlocks] = useState<FunctionBlock[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formIcon, setFormIcon] = useState("globe");
  const [formColor, setFormColor] = useState(COLOR_OPTIONS[0]);
  const saveTimer = useRef<number>(0);

  useEffect(() => {
    async function load() {
      const cloud = await cloudLoad(STORAGE_KEY);
      if (cloud && Array.isArray(cloud) && cloud.length > 0) {
        setBlocks(cloud as FunctionBlock[]);
      } else {
        setBlocks(DEFAULT_BLOCKS);
        cloudSave(STORAGE_KEY, DEFAULT_BLOCKS);
      }
      setLoaded(true);
    }
    load();
  }, []);

  const persist = useCallback((updated: FunctionBlock[]) => {
    saveTimer.current++;
    const seq = saveTimer.current;
    setTimeout(() => {
      if (saveTimer.current !== seq) return;
      cloudSave(STORAGE_KEY, updated);
    }, 500);
  }, []);

  function startAdd() {
    setEditingId(null);
    setFormLabel("");
    setFormIcon("globe");
    setFormColor(COLOR_OPTIONS[0]);
    setAdding(true);
  }

  function startEdit(block: FunctionBlock) {
    setAdding(false);
    setEditingId(block.id);
    setFormLabel(block.label);
    setFormIcon(block.icon);
    setFormColor(block.color);
  }

  function cancelForm() {
    setAdding(false);
    setEditingId(null);
  }

  function handleAdd() {
    if (!formLabel.trim()) return;
    const block: FunctionBlock = {
      id: `fn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      label: formLabel.trim(),
      icon: formIcon,
      color: formColor,
    };
    const updated = [...blocks, block];
    setBlocks(updated);
    persist(updated);
    cancelForm();
  }

  function handleSaveEdit() {
    if (!formLabel.trim() || !editingId) return;
    const updated = blocks.map((b) =>
      b.id === editingId ? { ...b, label: formLabel.trim(), icon: formIcon, color: formColor } : b
    );
    setBlocks(updated);
    persist(updated);
    cancelForm();
  }

  function handleRemove(id: string) {
    const updated = blocks.filter((b) => b.id !== id);
    setBlocks(updated);
    persist(updated);
    if (editingId === id) cancelForm();
  }

  if (!loaded) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-brand-ink/10 bg-brand-cream/95 backdrop-blur-sm py-2 px-4 dark:border-brand-cream/10 dark:bg-[#1a1211]/95">
      <div className="mb-1.5 flex items-center justify-center gap-2">
        <div className="h-px w-8 bg-brand-ink/10 dark:bg-brand-cream/10" />
        <h3 className="text-[9px] font-semibold uppercase tracking-wider text-brand-slate">
          Organization Functions
        </h3>
        <div className="h-px w-8 bg-brand-ink/10 dark:bg-brand-cream/10" />
      </div>

      {/* Blocks row */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {blocks.map((block) => {
          const IconComp = FUNCTION_ICON_MAP[block.icon] || Globe;
          const isEditing = editingId === block.id;
          return (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  "application/function-block",
                  JSON.stringify({ label: block.label, icon: block.icon, color: block.color })
                );
                e.dataTransfer.effectAllowed = "copy";
              }}
              className={`group relative flex cursor-grab items-center gap-1.5 rounded-lg border px-2 py-1 transition-all hover:shadow-sm hover:-translate-y-0.5 active:cursor-grabbing ${
                isEditing
                  ? "border-brand-red ring-1 ring-brand-red/20 bg-white dark:bg-[#221a19]"
                  : "border-brand-ink/8 bg-white dark:border-brand-cream/8 dark:bg-[#221a19]"
              }`}
            >
              <div
                className="flex h-5 w-5 items-center justify-center rounded"
                style={{ backgroundColor: block.color + "18" }}
              >
                <IconComp size={11} style={{ color: block.color }} />
              </div>
              <span className="text-[10px] font-medium text-brand-ink dark:text-brand-cream">
                {block.label}
              </span>
              <div
                className="ml-0.5 h-1 w-1 rounded-full"
                style={{ backgroundColor: block.color }}
              />
              {editMode && (
                <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => startEdit(block)}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-gold text-white shadow-sm"
                  >
                    <Pencil size={7} />
                  </button>
                  <button
                    onClick={() => handleRemove(block.id)}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
                  >
                    <X size={8} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {editMode && !adding && !editingId && (
          <button
            onClick={startAdd}
            className="flex items-center gap-1 rounded-lg border border-dashed border-brand-ink/15 px-2 py-1 text-[10px] text-brand-slate transition hover:border-brand-red hover:text-brand-red dark:border-brand-cream/15"
          >
            <Plus size={10} />
            Add
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && editMode && (
        <div className="mt-4 mx-auto max-w-md">
          <BlockForm
            label={formLabel}
            icon={formIcon}
            color={formColor}
            onLabelChange={setFormLabel}
            onIconChange={setFormIcon}
            onColorChange={setFormColor}
            onSave={handleAdd}
            onCancel={cancelForm}
            saveLabel="Add"
          />
        </div>
      )}

      {/* Edit form */}
      {editingId && editMode && (
        <div className="mt-4 mx-auto max-w-md">
          <BlockForm
            label={formLabel}
            icon={formIcon}
            color={formColor}
            onLabelChange={setFormLabel}
            onIconChange={setFormIcon}
            onColorChange={setFormColor}
            onSave={handleSaveEdit}
            onCancel={cancelForm}
            saveLabel="Save"
          />
        </div>
      )}
    </div>
  );
}
