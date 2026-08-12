"use client";

import { useEffect } from "react";
import { ArrowDown, ArrowUp, Briefcase, Calendar, ExternalLink, FileText, Globe, Hash, MapPin, Plus, Sparkles, Trash2, Users, X } from "lucide-react";
import type { OrgNode, ViewDef } from "@/lib/types";
import { FUNCTION_ICON_MAP } from "./FunctionBlocks";

const PRESETS = ["#990011", "#5C000A", "#C9A227", "#2F3C7E", "#0F6E56", "#5F5E5A"];
const INPUT = "w-full rounded-md border border-brand-ink/15 bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-red dark:border-brand-cream/15 dark:bg-[#2c2221] dark:text-brand-cream";

export function NodeDrawer({
  node,
  parent,
  editMode,
  views,
  onChange,
  onAddChild,
  onMove,
  onDelete,
  onClose,
}: {
  node: OrgNode;
  parent: OrgNode | null;
  editMode: boolean;
  views: ViewDef[];
  onChange: (patch: Partial<OrgNode>) => void;
  onAddChild: () => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-20 flex justify-end" role="dialog" aria-modal="true" aria-label={`${editMode ? "Edit" : "Details for"} ${node.title}`}>
      <div
        aria-label="Close detail panel"
        onClick={onClose}
        className="absolute inset-0 bg-brand-ink/20 backdrop-blur-[1px]"
      />
      <div className="relative z-10 flex h-full w-full max-w-sm animate-slide-in flex-col overflow-y-auto border-l border-brand-ink/10 bg-brand-cream p-6 shadow-lift dark:border-brand-cream/10 dark:bg-[#221a19]">
        <div className="mb-5 flex items-start justify-between">
          <p className="font-mono text-[11px] uppercase tracking-wide text-brand-slate">
            {editMode ? "Edit role" : "Role detail"}
          </p>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-brand-slate hover:bg-brand-ink/5">
            <X size={16} />
          </button>
        </div>

        {editMode ? (
          <>
            <label className="mb-4 block">
              <span className="mb-1 block text-xs text-brand-slate">Name / Title</span>
              <input value={node.title} onChange={(e) => onChange({ title: e.target.value })} className={INPUT} />
            </label>

            <label className="mb-4 block">
              <span className="mb-1 block text-xs text-brand-slate">Designation</span>
              <input value={node.designation ?? ""} onChange={(e) => onChange({ designation: e.target.value, subtitle: e.target.value || node.subtitle })} placeholder="e.g. Sr. IT Engineer" className={INPUT} />
            </label>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs text-brand-slate">Emp Code</span>
                <input value={node.empCode ?? ""} onChange={(e) => onChange({ empCode: e.target.value })} placeholder="e.g. 601001" className={INPUT} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-brand-slate">Location</span>
                <input value={node.location ?? ""} onChange={(e) => onChange({ location: e.target.value })} placeholder="e.g. Islamabad" className={INPUT} />
              </label>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs text-brand-slate">Department</span>
                <input value={node.department ?? ""} onChange={(e) => onChange({ department: e.target.value })} placeholder="e.g. IT - News" className={INPUT} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-brand-slate">Date of Joining</span>
                <input value={node.dateOfJoining ?? ""} onChange={(e) => onChange({ dateOfJoining: e.target.value })} placeholder="e.g. 01-Mar-2023" className={INPUT} />
              </label>
            </div>

            <label className="mb-4 block">
              <span className="mb-1 block text-xs text-brand-slate">Reports to</span>
              <input value={node.reportsTo ?? ""} onChange={(e) => onChange({ reportsTo: e.target.value })} className={INPUT} />
            </label>

            <label className="mb-4 block">
              <span className="mb-1 block text-xs text-brand-slate">Links to tab (click navigates)</span>
              <select
                value={node.linksTo ?? ""}
                onChange={(e) => onChange({ linksTo: e.target.value || undefined })}
                className={INPUT}
              >
                <option value="">None</option>
                {views.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            </label>

            <label className="mb-4 block">
              <span className="mb-1 block text-xs text-brand-slate">Job Description</span>
              <textarea value={node.jobDescription ?? ""} onChange={(e) => onChange({ jobDescription: e.target.value })} placeholder="Key responsibilities, duties, objectives..." rows={3} className={`${INPUT} resize-none`} />
            </label>

            <div className="mb-4">
              <span className="mb-1 block text-xs text-brand-slate">Required Skills</span>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(node.requiredSkills ?? []).map((skill, i) => (
                  <span key={i} className="flex items-center gap-1 rounded-full bg-brand-red/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-red">
                    {skill}
                    <button
                      onClick={() => {
                        const updated = [...(node.requiredSkills ?? [])];
                        updated.splice(i, 1);
                        onChange({ requiredSkills: updated });
                      }}
                      className="ml-0.5 text-brand-red/60 hover:text-brand-red"
                    >×</button>
                  </span>
                ))}
              </div>
              <input
                placeholder="Type a skill and press Enter"
                className={INPUT}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) {
                      onChange({ requiredSkills: [...(node.requiredSkills ?? []), val] });
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
            </div>

            {(node.functions ?? []).length > 0 && (
              <div className="mb-4">
                <span className="mb-1.5 block text-xs text-brand-slate">Assigned Functions</span>
                <div className="flex flex-wrap gap-1.5">
                  {(node.functions ?? []).map((fn, i) => {
                    const FnIcon = FUNCTION_ICON_MAP[fn.icon] || Globe;
                    return (
                      <span key={i} className="flex items-center gap-1.5 rounded-full border border-brand-ink/10 px-2.5 py-1 text-[11px] font-medium dark:border-brand-cream/10" style={{ color: fn.color }}>
                        <FnIcon size={12} />
                        {fn.label}
                        <button
                          onClick={() => {
                            const updated = [...(node.functions ?? [])];
                            updated.splice(i, 1);
                            onChange({ functions: updated });
                          }}
                          className="ml-0.5 opacity-60 hover:opacity-100"
                        >×</button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <label className="mb-4 block">
              <span className="mb-1 block text-xs text-brand-slate">Description</span>
              <textarea value={node.description ?? ""} onChange={(e) => onChange({ description: e.target.value })} placeholder="Role responsibilities, notes..." rows={3} className={`${INPUT} resize-none`} />
            </label>

            <div className="mb-5">
              <span className="mb-1.5 block text-xs text-brand-slate">Color</span>
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => onChange({ color: hex })}
                    aria-label={`Use color ${hex}`}
                    className="h-6 w-6 rounded-[4px]"
                    style={{ backgroundColor: hex, outline: node.color === hex ? "2px solid var(--text-primary)" : "none", outlineOffset: "2px" }}
                  />
                ))}
                <input type="color" value={node.color} onChange={(e) => onChange({ color: e.target.value })} aria-label="Custom color" className="h-6 w-8 cursor-pointer rounded-[4px] border border-brand-ink/15" />
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2 border-t border-brand-ink/10 pt-4 dark:border-brand-cream/10">
              <button onClick={onAddChild} className="flex items-center gap-1.5 rounded-md border border-brand-ink/15 px-3 py-1.5 text-xs text-brand-ink hover:border-brand-red hover:text-brand-red dark:border-brand-cream/20 dark:text-brand-cream">
                <Plus size={13} /> Add role under this
              </button>
              <button onClick={() => onMove(-1)} aria-label="Move left" className="flex items-center gap-1 rounded-md border border-brand-ink/15 px-2 py-1.5 text-xs text-brand-ink hover:border-brand-red hover:text-brand-red dark:border-brand-cream/20 dark:text-brand-cream"><ArrowUp size={13} /></button>
              <button onClick={() => onMove(1)} aria-label="Move right" className="flex items-center gap-1 rounded-md border border-brand-ink/15 px-2 py-1.5 text-xs text-brand-ink hover:border-brand-red hover:text-brand-red dark:border-brand-cream/20 dark:text-brand-cream"><ArrowDown size={13} /></button>
              <button onClick={() => { onClose(); requestAnimationFrame(onDelete); }} className="ml-auto flex items-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-xs text-brand-red hover:border-brand-red"><Trash2 size={13} /> Delete</button>
            </div>

            <p className="mt-auto pt-2 text-[11px] text-brand-slate">
              Saved in this browser as you type — nothing sent anywhere.
            </p>
          </>
        ) : (
          <>
            <div className="mb-1 flex items-center gap-2">
              <span className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: node.color }} aria-hidden="true" />
              <span className="font-display text-lg text-brand-ink dark:text-brand-cream">{node.title}</span>
            </div>
            {node.subtitle && <p className="mb-4 text-sm text-brand-slate">{node.subtitle}</p>}

            <dl className="space-y-3 text-sm">
              {node.empCode && (
                <div className="flex items-center gap-2">
                  <Hash size={13} className="shrink-0 text-brand-slate" />
                  <dt className="text-xs text-brand-slate">Emp Code</dt>
                  <dd className="ml-auto font-medium text-brand-ink dark:text-brand-cream">{node.empCode}</dd>
                </div>
              )}
              {node.designation && (
                <div className="flex items-center gap-2">
                  <Briefcase size={13} className="shrink-0 text-brand-slate" />
                  <dt className="text-xs text-brand-slate">Designation</dt>
                  <dd className="ml-auto text-right font-medium text-brand-ink dark:text-brand-cream">{node.designation}</dd>
                </div>
              )}
              {node.department && (
                <div className="flex items-center gap-2">
                  <Users size={13} className="shrink-0 text-brand-slate" />
                  <dt className="text-xs text-brand-slate">Department</dt>
                  <dd className="ml-auto text-right font-medium text-brand-ink dark:text-brand-cream">{node.department}</dd>
                </div>
              )}
              {node.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="shrink-0 text-brand-slate" />
                  <dt className="text-xs text-brand-slate">Location</dt>
                  <dd className="ml-auto font-medium text-brand-ink dark:text-brand-cream">{node.location}</dd>
                </div>
              )}
              {node.dateOfJoining && (
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="shrink-0 text-brand-slate" />
                  <dt className="text-xs text-brand-slate">Joined</dt>
                  <dd className="ml-auto font-medium text-brand-ink dark:text-brand-cream">{node.dateOfJoining}</dd>
                </div>
              )}
              {node.reportsTo && (
                <div className="border-t border-brand-ink/8 pt-3 dark:border-brand-cream/8">
                  <dt className="text-xs text-brand-slate">Reports to</dt>
                  <dd className="mt-0.5 text-brand-ink dark:text-brand-cream">{node.reportsTo}</dd>
                </div>
              )}
              {parent && !node.reportsTo && (
                <div className="border-t border-brand-ink/8 pt-3 dark:border-brand-cream/8">
                  <dt className="text-xs text-brand-slate">Under</dt>
                  <dd className="mt-0.5 text-brand-ink dark:text-brand-cream">{parent.title}</dd>
                </div>
              )}
              {node.linksTo && (
                <div className="flex items-center gap-2 border-t border-brand-ink/8 pt-3 dark:border-brand-cream/8">
                  <ExternalLink size={13} className="shrink-0 text-brand-slate" />
                  <dt className="text-xs text-brand-slate">Links to</dt>
                  <dd className="ml-auto font-medium text-brand-red">{views.find((v) => v.id === node.linksTo)?.label ?? node.linksTo}</dd>
                </div>
              )}
              {node.jobDescription && (
                <div className="border-t border-brand-ink/8 pt-3 dark:border-brand-cream/8">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText size={13} className="shrink-0 text-brand-slate" />
                    <dt className="text-xs text-brand-slate">Job Description</dt>
                  </div>
                  <dd className="whitespace-pre-wrap text-sm text-brand-ink dark:text-brand-cream">{node.jobDescription}</dd>
                </div>
              )}
              {node.requiredSkills && node.requiredSkills.length > 0 && (
                <div className="border-t border-brand-ink/8 pt-3 dark:border-brand-cream/8">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles size={13} className="shrink-0 text-brand-slate" />
                    <dt className="text-xs text-brand-slate">Required Skills</dt>
                  </div>
                  <dd className="flex flex-wrap gap-1.5">
                    {node.requiredSkills.map((skill, i) => (
                      <span key={i} className="rounded-full bg-brand-red/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-red">{skill}</span>
                    ))}
                  </dd>
                </div>
              )}
              {node.functions && node.functions.length > 0 && (
                <div className="border-t border-brand-ink/8 pt-3 dark:border-brand-cream/8">
                  <dt className="text-xs text-brand-slate mb-1.5">Assigned Functions</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {node.functions.map((fn, i) => {
                      const FnIcon = FUNCTION_ICON_MAP[fn.icon] || Globe;
                      return (
                        <span key={i} className="flex items-center gap-1.5 rounded-full border border-brand-ink/10 px-2.5 py-1 text-[11px] font-medium dark:border-brand-cream/10" style={{ color: fn.color }}>
                          <FnIcon size={12} />
                          {fn.label}
                        </span>
                      );
                    })}
                  </dd>
                </div>
              )}
              {node.description && (
                <div className="border-t border-brand-ink/8 pt-3 dark:border-brand-cream/8">
                  <dt className="text-xs text-brand-slate">Description</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-brand-ink dark:text-brand-cream">{node.description}</dd>
                </div>
              )}
            </dl>
          </>
        )}
      </div>
    </div>
  );
}
