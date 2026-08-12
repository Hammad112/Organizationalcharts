"use client";

import { useEffect, useMemo, useState } from "react";
import { GitCompare, X } from "lucide-react";
import type { OrgData, OrgNode } from "@/lib/types";

type DiffStatus = "added" | "removed" | "changed" | "unchanged";

type FieldDiff = {
  label: string;
  oldVal: string;
  newVal: string;
};

type NodeDiff = {
  id: string;
  title: string;
  status: DiffStatus;
  color: string;
  fields: FieldDiff[];
  children: NodeDiff[];
};

const FIELD_LABELS: { key: keyof OrgNode; label: string }[] = [
  { key: "title", label: "Name" },
  { key: "designation", label: "Designation" },
  { key: "subtitle", label: "Subtitle" },
  { key: "empCode", label: "Emp Code" },
  { key: "department", label: "Department" },
  { key: "location", label: "Location" },
  { key: "dateOfJoining", label: "Joined" },
  { key: "reportsTo", label: "Reports to" },
  { key: "description", label: "Description" },
  { key: "jobDescription", label: "Job Description" },
  { key: "color", label: "Color" },
  { key: "linksTo", label: "Links to" },
];

function getFieldStr(node: OrgNode, key: keyof OrgNode): string {
  if (key === "requiredSkills") return (node.requiredSkills ?? []).join(", ");
  return String(node[key] ?? "");
}

function diffTrees(aRoots: OrgNode[], bRoots: OrgNode[]): NodeDiff[] {
  function diffNode(nodeA: OrgNode | null, nodeB: OrgNode | null): NodeDiff | null {
    if (nodeA && !nodeB) {
      return {
        id: nodeA.id, title: nodeA.title, status: "removed", color: nodeA.color,
        fields: [],
        children: nodeA.children.map((c) => diffNode(c, null)!),
      };
    }
    if (!nodeA && nodeB) {
      return {
        id: nodeB.id, title: nodeB.title, status: "added", color: nodeB.color,
        fields: [],
        children: nodeB.children.map((c) => diffNode(null, c)!),
      };
    }
    if (!nodeA || !nodeB) return null;

    const fields: FieldDiff[] = [];
    for (const { key, label } of FIELD_LABELS) {
      const oldVal = getFieldStr(nodeA, key);
      const newVal = getFieldStr(nodeB, key);
      if (oldVal !== newVal) fields.push({ label, oldVal, newVal });
    }
    const oldSkills = (nodeA.requiredSkills ?? []).join(", ");
    const newSkills = (nodeB.requiredSkills ?? []).join(", ");
    if (oldSkills !== newSkills) fields.push({ label: "Skills", oldVal: oldSkills, newVal: newSkills });

    const allChildIds = new Set([
      ...nodeA.children.map((c) => c.id),
      ...nodeB.children.map((c) => c.id),
    ]);
    const childDiffs: NodeDiff[] = [];
    for (const cid of allChildIds) {
      const ca = nodeA.children.find((c) => c.id === cid) ?? null;
      const cb = nodeB.children.find((c) => c.id === cid) ?? null;
      const d = diffNode(ca, cb);
      if (d) childDiffs.push(d);
    }

    const status: DiffStatus = fields.length > 0 ? "changed" : "unchanged";
    return { id: nodeA.id, title: nodeB.title, status, color: nodeB.color, fields, children: childDiffs };
  }

  const allRootIds = new Set([...aRoots.map((r) => r.id), ...bRoots.map((r) => r.id)]);
  const result: NodeDiff[] = [];
  for (const rid of allRootIds) {
    const ra = aRoots.find((r) => r.id === rid) ?? null;
    const rb = bRoots.find((r) => r.id === rid) ?? null;
    const d = diffNode(ra, rb);
    if (d) result.push(d);
  }
  return result;
}

function hasChanges(d: NodeDiff): boolean {
  if (d.status !== "unchanged") return true;
  return d.children.some(hasChanges);
}

function countChanges(diffs: NodeDiff[]): { added: number; removed: number; changed: number } {
  let added = 0, removed = 0, changed = 0;
  function walk(d: NodeDiff) {
    if (d.status === "added") added++;
    else if (d.status === "removed") removed++;
    else if (d.status === "changed") changed++;
    d.children.forEach(walk);
  }
  diffs.forEach(walk);
  return { added, removed, changed };
}

function DiffCard({ diff, depth }: { diff: NodeDiff; depth: number }) {
  const show = hasChanges(diff);
  if (!show) return null;

  const borderColor =
    diff.status === "added" ? "border-green-400" :
    diff.status === "removed" ? "border-red-400" :
    diff.status === "changed" ? "border-amber-400" : "border-brand-ink/10 dark:border-brand-cream/10";

  const bgColor =
    diff.status === "added" ? "bg-green-50/80 dark:bg-green-950/20" :
    diff.status === "removed" ? "bg-red-50/80 dark:bg-red-950/20" :
    diff.status === "changed" ? "bg-white dark:bg-[#221a19]" : "";

  const badgeInfo =
    diff.status === "added" ? { label: "Added", cls: "bg-green-500 text-white" } :
    diff.status === "removed" ? { label: "Removed", cls: "bg-red-500 text-white" } :
    diff.status === "changed" ? { label: "Modified", cls: "bg-amber-500 text-white" } : null;

  return (
    <>
      <div
        className={`rounded-lg border-l-[4px] ${borderColor} ${bgColor} overflow-hidden shadow-sm`}
        style={{ marginLeft: depth * 24 }}
      >
        {/* Card header bar */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="h-3 w-3 rounded-[3px] shrink-0" style={{ backgroundColor: diff.color }} />
          <span className={`text-xs font-semibold text-brand-ink dark:text-brand-cream flex-1 truncate ${diff.status === "removed" ? "line-through opacity-60" : ""}`}>
            {diff.title}
          </span>
          {badgeInfo && (
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badgeInfo.cls}`}>
              {badgeInfo.label}
            </span>
          )}
        </div>

        {/* Field-level diffs for changed nodes */}
        {diff.status === "changed" && diff.fields.length > 0 && (
          <div className="border-t border-brand-ink/5 dark:border-brand-cream/5">
            {diff.fields.map((f, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-1.5 text-[11px] even:bg-brand-ink/[0.02] dark:even:bg-brand-cream/[0.02]">
                <span className="w-20 shrink-0 font-medium text-brand-slate">{f.label}</span>
                <div className="flex-1 min-w-0 space-y-0.5">
                  {f.oldVal && (
                    <div className="flex items-start gap-1">
                      <span className="shrink-0 rounded bg-red-100 px-1 py-px text-[9px] font-bold text-red-600 dark:bg-red-900 dark:text-red-300">−</span>
                      <span className="rounded bg-red-100/60 px-1 py-px text-brand-ink/70 line-through dark:bg-red-950/40 dark:text-brand-cream/50 break-all">
                        {f.label === "Color" ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: f.oldVal }} />
                            {f.oldVal}
                          </span>
                        ) : f.oldVal}
                      </span>
                    </div>
                  )}
                  {f.newVal && (
                    <div className="flex items-start gap-1">
                      <span className="shrink-0 rounded bg-green-100 px-1 py-px text-[9px] font-bold text-green-600 dark:bg-green-900 dark:text-green-300">+</span>
                      <span className="rounded bg-green-100/60 px-1 py-px font-medium text-brand-ink dark:bg-green-950/40 dark:text-brand-cream break-all">
                        {f.label === "Color" ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: f.newVal }} />
                            {f.newVal}
                          </span>
                        ) : f.newVal}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Removed node: show what was there */}
        {diff.status === "removed" && (
          <div className="border-t border-red-200 bg-red-50/50 px-3 py-1.5 dark:border-red-900 dark:bg-red-950/10">
            <p className="text-[10px] text-red-500 italic">This entire node and its branch were removed</p>
          </div>
        )}

        {/* Added node: brief highlight */}
        {diff.status === "added" && (
          <div className="border-t border-green-200 bg-green-50/50 px-3 py-1.5 dark:border-green-900 dark:bg-green-950/10">
            <p className="text-[10px] text-green-600 italic">New node added to the structure</p>
          </div>
        )}
      </div>

      {diff.children.map((child) => (
        <DiffCard key={child.id} diff={child} depth={depth + 1} />
      ))}
    </>
  );
}

export function VersionCompare({
  getVersions,
  getVersionData,
  getCurrentData,
  onClose,
}: {
  getVersions: () => { name: string; date: string }[];
  getVersionData: (name: string) => Promise<OrgData | null>;
  getCurrentData: () => OrgData | null;
  onClose: () => void;
}) {
  const versions = useMemo(() => getVersions(), [getVersions]);
  const [sourceKey, setSourceKey] = useState("__current__");
  const [targetKey, setTargetKey] = useState(versions[0]?.name ?? "");
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [sourceData, setSourceData] = useState<OrgData | null>(null);
  const [targetData, setTargetData] = useState<OrgData | null>(null);

  useEffect(() => {
    if (sourceKey === "__current__") { setSourceData(getCurrentData()); return; }
    getVersionData(sourceKey).then(setSourceData);
  }, [sourceKey, getCurrentData, getVersionData]);

  useEffect(() => {
    if (targetKey === "__current__") { setTargetData(getCurrentData()); return; }
    getVersionData(targetKey).then(setTargetData);
  }, [targetKey, getCurrentData, getVersionData]);

  const viewTabs = useMemo(() => {
    if (!sourceData || !targetData) return [];
    const ids = new Set([
      ...sourceData.views.filter((v) => !v.auto).map((v) => v.id),
      ...targetData.views.filter((v) => !v.auto).map((v) => v.id),
    ]);
    return Array.from(ids).map((id) => {
      const sv = sourceData.views.find((v) => v.id === id);
      const tv = targetData.views.find((v) => v.id === id);
      return { id, label: tv?.label ?? sv?.label ?? id };
    });
  }, [sourceData, targetData]);

  useEffect(() => {
    if (viewTabs.length > 0 && !activeTab) setActiveTab(viewTabs[0].id);
  }, [viewTabs, activeTab]);

  const diffs = useMemo(() => {
    if (!sourceData || !targetData || !activeTab) return [];
    const sv = sourceData.views.find((v) => v.id === activeTab);
    const tv = targetData.views.find((v) => v.id === activeTab);
    return diffTrees(sv?.roots ?? [], tv?.roots ?? []);
  }, [sourceData, targetData, activeTab]);

  const stats = useMemo(() => countChanges(diffs), [diffs]);
  const anyChanges = stats.added + stats.removed + stats.changed > 0;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const options = [
    { value: "__current__", label: "Current (main)" },
    ...versions.map((v) => ({ value: v.name, label: v.name })),
  ];

  const SELECT = "rounded-md border border-brand-ink/15 bg-white px-3 py-1.5 text-xs text-brand-ink outline-none focus:border-brand-red dark:border-brand-cream/15 dark:bg-[#2c2221] dark:text-brand-cream";

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-brand-ink/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-brand-ink/10 bg-brand-cream shadow-lift dark:border-brand-cream/10 dark:bg-[#221a19]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-ink/10 px-5 py-4 dark:border-brand-cream/10">
          <div className="flex items-center gap-2">
            <GitCompare size={16} className="text-brand-red" />
            <span className="text-sm font-medium text-brand-ink dark:text-brand-cream">Compare versions</span>
          </div>
          <button onClick={onClose} className="rounded p-1 text-brand-slate hover:bg-brand-ink/5">
            <X size={16} />
          </button>
        </div>

        {/* Selectors */}
        <div className="flex items-center gap-3 border-b border-brand-ink/10 px-5 py-3 dark:border-brand-cream/10">
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-brand-slate">From (base)</label>
            <select value={sourceKey} onChange={(e) => setSourceKey(e.target.value)} className={`w-full ${SELECT}`}>
              {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <span className="mt-4 text-brand-slate">→</span>
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-brand-slate">To (compare)</label>
            <select value={targetKey} onChange={(e) => setTargetKey(e.target.value)} className={`w-full ${SELECT}`}>
              {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* View tabs */}
        {viewTabs.length > 1 && (
          <div className="flex gap-1 border-b border-brand-ink/10 px-5 py-2 dark:border-brand-cream/10">
            {viewTabs.map((vt) => (
              <button
                key={vt.id}
                onClick={() => setActiveTab(vt.id)}
                className={`rounded-md px-3 py-1 text-xs transition ${activeTab === vt.id ? "bg-brand-red text-white" : "text-brand-slate hover:bg-brand-ink/5"}`}
              >
                {vt.label}
              </button>
            ))}
          </div>
        )}

        {/* Stats bar */}
        {anyChanges && (
          <div className="flex items-center gap-3 border-b border-brand-ink/5 px-5 py-2 text-[10px] dark:border-brand-cream/5">
            {stats.added > 0 && <span className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">+{stats.added} added</span>}
            {stats.removed > 0 && <span className="rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-700 dark:bg-red-900 dark:text-red-300">−{stats.removed} removed</span>}
            {stats.changed > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-900 dark:text-amber-300">~{stats.changed} modified</span>}
          </div>
        )}

        {/* Diff content */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {sourceKey === targetKey ? (
            <p className="py-8 text-center text-xs text-brand-slate">Select two different versions to compare.</p>
          ) : !anyChanges ? (
            <p className="py-8 text-center text-xs text-brand-slate">No differences found in this view.</p>
          ) : (
            <div className="space-y-2">
              {diffs.map((d) => (
                <DiffCard key={d.id} diff={d} depth={0} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
