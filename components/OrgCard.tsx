"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowDown, ArrowUpFromLine, ChevronDown, ExternalLink, Globe, GripVertical, MapPin, Pencil, Plus, Scissors, Trash2, UserPlus, X } from "lucide-react";
import type { OrgNode } from "@/lib/types";
import { FUNCTION_ICON_MAP } from "./FunctionBlocks";

function SiblingDropZone({
  parentId,
  index,
  onAddNodeAt,
}: {
  parentId: string;
  index: number;
  onAddNodeAt: (parentId: string, index: number, data: { type: string; label: string; color: string }) => void;
}) {
  const [over, setOver] = useState(false);

  return (
    <li className="sibling-drop-zone" style={{ width: 16, minHeight: 40, padding: "32px 0 0 0" }}
      aria-hidden="true"
    >
      <div
        className="flex h-full w-full items-center justify-center"
        style={{ minHeight: 40 }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("application/new-node")) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setOver(true);
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOver(false);
          const raw = e.dataTransfer.getData("application/new-node");
          if (raw) {
            try {
              onAddNodeAt(parentId, index, JSON.parse(raw));
            } catch {}
          }
        }}
      >
        <div className={`rounded-full transition-all ${
          over
            ? "h-6 w-6 border-2 border-dashed border-brand-red bg-brand-red/10 flex items-center justify-center"
            : "h-1 w-1 bg-brand-ink/10 dark:bg-brand-cream/10"
        }`}>
          {over && <Plus size={10} className="text-brand-red" />}
        </div>
      </div>
    </li>
  );
}

type WireDropData = { type: string; label: string; color: string };

function WireDropMenu({
  topLabel,
  bottomLabel,
  onAddOnTop,
  onAddInBranch,
  onCancel,
}: {
  topLabel: string;
  bottomLabel: string;
  onAddOnTop: () => void;
  onAddInBranch: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onCancelRef.current();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="absolute left-1/2 top-0 z-[50] -translate-x-1/2 rounded-lg border border-brand-ink/10 bg-white p-1.5 shadow-lift dark:border-brand-cream/10 dark:bg-[#221a19]" style={{ width: 180 }}>
      <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wide text-brand-slate">Where to add?</p>
      <button
        onClick={(e) => { e.stopPropagation(); onAddOnTop(); }}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-brand-ink transition hover:bg-brand-blush hover:text-brand-red dark:text-brand-cream dark:hover:bg-brand-cream/5"
      >
        <UserPlus size={12} />
        {topLabel}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onAddInBranch(); }}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-brand-ink transition hover:bg-brand-blush hover:text-brand-red dark:text-brand-cream dark:hover:bg-brand-cream/5"
      >
        <ArrowDown size={12} />
        {bottomLabel}
      </button>
    </div>
  );
}

function WireZone({
  nodeId,
  parentId,
  siblingIndex,
  onDetach,
  onDropNewOnWire,
  onReparent,
  onAddNodeAt,
  onInsertLayer,
}: {
  nodeId: string;
  parentId: string | null;
  siblingIndex: number;
  onDetach: (nodeId: string) => void;
  onDropNewOnWire: (nodeId: string, parentId: string, data: WireDropData) => void;
  onReparent?: (nodeId: string, newParentId: string | null) => void;
  onAddNodeAt?: (parentId: string, index: number, data: WireDropData) => void;
  onInsertLayer?: (parentId: string, data: WireDropData) => void;
}) {
  const [over, setOver] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<WireDropData | null>(null);

  if (!parentId) return null;

  return (
    <div
      className="absolute left-1/2 z-[20] flex -translate-x-1/2 items-center justify-center"
      style={{ width: 168, height: 32, top: -32 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { if (!pendingDrop) setHovered(false); }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("application/new-node") || e.dataTransfer.types.includes("application/reparent")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = e.dataTransfer.types.includes("application/reparent") ? "move" : "copy";
          setOver(true);
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        const newNodeRaw = e.dataTransfer.getData("application/new-node");
        if (newNodeRaw && parentId) {
          try {
            const data = JSON.parse(newNodeRaw) as WireDropData;
            setPendingDrop(data);
          } catch {}
          return;
        }
        const reparentId = e.dataTransfer.getData("application/reparent");
        if (reparentId && reparentId !== nodeId && onReparent && parentId) {
          onReparent(reparentId, parentId);
        }
      }}
    >
      {pendingDrop && (
        <WireDropMenu
          topLabel="Add as sibling"
          bottomLabel="Insert in branch"
          onAddOnTop={() => {
            if (onAddNodeAt) onAddNodeAt(parentId, siblingIndex, pendingDrop);
            setPendingDrop(null);
          }}
          onAddInBranch={() => {
            if (onInsertLayer) onInsertLayer(parentId, pendingDrop);
            setPendingDrop(null);
          }}
          onCancel={() => setPendingDrop(null)}
        />
      )}

      {over && !pendingDrop && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-brand-red bg-brand-red/10">
          <Plus size={14} className="text-brand-red" />
        </div>
      )}

      {!over && !pendingDrop && (
        <div className="flex items-center gap-1">
          <ArrowDown size={12} className="text-brand-ink/30 dark:text-brand-cream/30" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDetach(nodeId);
            }}
            className={`flex h-5 w-5 items-center justify-center rounded-full border border-red-300 bg-white text-red-400 shadow-sm transition hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:bg-[#221a19] dark:hover:bg-red-950 ${hovered ? "opacity-100" : "opacity-0"}`}
            aria-label="Cut wire — detach from parent"
            title="Cut wire — detach from parent"
          >
            <Scissors size={10} />
          </button>
        </div>
      )}
    </div>
  );
}

export function OrgCard({
  node,
  parentId,
  depth,
  editMode,
  forceExpand,
  siblingIndex = 0,
  onSelect,
  onQuickAdd,
  onAddSibling,
  onDelete,
  onWrapWithParent,
  onNavigate,
  onDropNew,
  onDetach,
  onDropNewOnWire,
  onReparent,
  onInsertLayer,
  searchMatches,
  onAddNodeAt,
  onDropFunction,
}: {
  node: OrgNode;
  parentId: string | null;
  depth: number;
  editMode: boolean;
  forceExpand: boolean;
  siblingIndex?: number;
  searchMatches?: Set<string>;
  onSelect: (node: OrgNode, parentId: string | null) => void;
  onQuickAdd: (node: OrgNode) => void;
  onAddSibling: (node: OrgNode, parentId: string | null) => void;
  onDelete: (node: OrgNode) => void;
  onWrapWithParent: (node: OrgNode) => void;
  onNavigate: (viewId: string) => void;
  onDropNew?: (parentId: string, data: { type: string; label: string; color: string }) => void;
  onDetach?: (nodeId: string) => void;
  onDropNewOnWire?: (childId: string, parentId: string, data: { type: string; label: string; color: string }) => void;
  onReparent?: (nodeId: string, newParentId: string | null) => void;
  onInsertLayer?: (parentId: string, data: { type: string; label: string; color: string }) => void;
  onAddNodeAt?: (parentId: string, index: number, data: { type: string; label: string; color: string }) => void;
  onDropFunction?: (nodeId: string, fn: { label: string; icon: string; color: string }) => void;
}) {
  const isSearchMatch = searchMatches && searchMatches.size > 0 && searchMatches.has(node.id);
  const isSearchDimmed = searchMatches && searchMatches.size > 0 && !searchMatches.has(node.id);
  const [manualExpanded, setManualExpanded] = useState(depth < 2);
  const [dropOver, setDropOver] = useState(false);
  const [belowWireOver, setBelowWireOver] = useState(false);
  const [belowWirePending, setBelowWirePending] = useState<WireDropData | null>(null);
  const expanded = forceExpand || manualExpanded;
  const hasChildren = node.children.length > 0;
  const isEmployee = !!node.empCode;

  function handleClick() {
    if (node.linksTo && !editMode) {
      onNavigate(node.linksTo);
    } else {
      onSelect(node, parentId);
    }
  }

  const [fnDropOver, setFnDropOver] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    if (e.dataTransfer.types.includes("application/function-block")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setFnDropOver(true);
    } else if (e.dataTransfer.types.includes("application/new-node")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDropOver(true);
    } else if (e.dataTransfer.types.includes("application/reparent")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDropOver(true);
    }
  }

  function handleDragLeave() {
    setDropOver(false);
    setFnDropOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDropOver(false);
    setFnDropOver(false);
    const fnRaw = e.dataTransfer.getData("application/function-block");
    if (fnRaw && onDropFunction) {
      try {
        const fn = JSON.parse(fnRaw) as { label: string; icon: string; color: string };
        onDropFunction(node.id, fn);
      } catch {}
      return;
    }
    const newNodeRaw = e.dataTransfer.getData("application/new-node");
    if (newNodeRaw && onDropNew) {
      try {
        onDropNew(node.id, JSON.parse(newNodeRaw));
      } catch {}
      return;
    }
    const reparentId = e.dataTransfer.getData("application/reparent");
    if (reparentId && reparentId !== node.id && onReparent) {
      onReparent(reparentId, node.id);
    }
  }

  return (
    <>
      <div className="group relative">
        {parentId && onDetach && onDropNewOnWire && (
          <WireZone
            nodeId={node.id}
            parentId={parentId}
            siblingIndex={siblingIndex}
            onDetach={onDetach}
            onDropNewOnWire={onDropNewOnWire}
            onReparent={onReparent}
            onAddNodeAt={onAddNodeAt}
            onInsertLayer={onInsertLayer}
          />
        )}

        {editMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onWrapWithParent(node); }}
            aria-label={`Add parent above ${node.title}`}
            className="absolute -top-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-brand-ink/10 bg-white px-2 py-0.5 text-[10px] text-brand-slate opacity-0 shadow-card transition group-hover:opacity-100 hover:!border-brand-red hover:!text-brand-red dark:border-brand-cream/15 dark:bg-[#221a19]"
          >
            <ArrowUpFromLine size={10} />
            Add above
          </button>
        )}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={fnDropOver ? "rounded-lg ring-2 ring-emerald-500 ring-offset-2 transition-shadow" : dropOver ? "rounded-lg ring-2 ring-brand-red ring-offset-2 transition-shadow" : isSearchMatch ? "rounded-lg ring-2 ring-brand-gold ring-offset-2 transition-shadow" : "transition-shadow"}
        >
          <div className={`relative transition-opacity ${isSearchDimmed ? "opacity-25" : ""}`}>
            <button
              onClick={handleClick}
              className={`block w-[168px] overflow-hidden rounded-lg border bg-white text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lift dark:bg-[#221a19] ${
                dropOver
                  ? "border-brand-red"
                  : isSearchMatch
                    ? "border-brand-gold"
                    : "border-brand-ink/10 dark:border-brand-cream/10"
              }`}
            >
              <div className="h-1.5 w-full" style={{ backgroundColor: node.color }} aria-hidden="true" />
              <div className="px-3 py-2.5">
                <div className="font-display text-[13px] leading-tight text-brand-ink dark:text-brand-cream">
                  {node.title}
                </div>
                {node.subtitle && (
                  <div className="mt-0.5 text-[11px] leading-tight text-brand-slate">{node.subtitle}</div>
                )}
                {node.location && isEmployee && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-brand-slate">
                    <MapPin size={9} />
                    {node.location}
                    {node.empCode && <span className="ml-auto opacity-60">#{node.empCode}</span>}
                  </div>
                )}
                {node.functions && node.functions.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {node.functions.map((fn, i) => {
                      const FnIcon = FUNCTION_ICON_MAP[fn.icon] || Globe;
                      return (
                        <div
                          key={`${fn.label}-${i}`}
                          className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
                          style={{ backgroundColor: fn.color + "18" }}
                          title={fn.label}
                        >
                          <FnIcon size={8} style={{ color: fn.color }} />
                          <span className="text-[8px] font-medium leading-none" style={{ color: fn.color }}>{fn.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {!editMode && node.linksTo && (
                <div className="absolute right-1.5 top-3.5">
                  <ExternalLink size={10} className="text-brand-slate" />
                </div>
              )}
            </button>
            {/* Drag handle */}
            <div
              draggable
              role="button"
              tabIndex={0}
              aria-label={`Drag to reparent ${node.title}`}
              onDragStart={(e) => {
                e.dataTransfer.setData("application/reparent", node.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              className="absolute -right-1 top-1/2 flex h-5 w-4 -translate-y-1/2 cursor-grab items-center justify-center rounded-r border border-l-0 border-brand-ink/10 bg-white opacity-0 transition group-hover:opacity-100 active:cursor-grabbing dark:border-brand-cream/10 dark:bg-[#221a19]"
              title="Drag to reparent"
            >
              <GripVertical size={9} className="text-brand-slate" />
            </div>
          </div>
        </div>

        {/* Expand/collapse + toolbar */}
        {hasChildren && (
          <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center rounded-full border border-brand-ink/10 bg-white p-0.5 shadow-card dark:border-brand-cream/15 dark:bg-[#221a19]">
            <button
              onClick={(e) => { e.stopPropagation(); setManualExpanded((v) => !v); }}
              aria-label={expanded ? "Collapse" : "Expand"}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-brand-slate transition hover:bg-brand-blush hover:text-brand-red dark:hover:bg-brand-cream/10"
            >
              <ChevronDown size={12} style={{ transform: expanded ? "none" : "rotate(-90deg)", transition: "transform 0.15s" }} />
            </button>
            {editMode && (
              <div className="flex max-w-0 items-center overflow-hidden transition-all duration-200 ease-out group-hover:max-w-[120px]">
                <button onClick={(e) => { e.stopPropagation(); onQuickAdd(node); }} aria-label="Add child" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-brand-slate transition hover:bg-brand-blush hover:text-brand-red dark:hover:bg-brand-cream/10"><Plus size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); onAddSibling(node, parentId); }} aria-label="Add sibling" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-brand-slate transition hover:bg-brand-blush hover:text-brand-red dark:hover:bg-brand-cream/10"><UserPlus size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); onSelect(node, parentId); }} aria-label="Edit" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-brand-slate transition hover:bg-brand-blush hover:text-brand-red dark:hover:bg-brand-cream/10"><Pencil size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(node); }} aria-label="Delete" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-brand-slate transition hover:bg-brand-blush hover:text-red-600 dark:hover:bg-brand-cream/10"><Trash2 size={12} /></button>
                {parentId && onDetach && <button onClick={(e) => { e.stopPropagation(); onDetach(node.id); }} aria-label="Detach from parent" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-brand-slate transition hover:bg-brand-blush hover:text-red-600 dark:hover:bg-brand-cream/10"><Scissors size={12} /></button>}
              </div>
            )}
          </div>
        )}

        {!hasChildren && editMode && (
          <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-brand-ink/10 bg-white p-0.5 opacity-0 shadow-card transition group-hover:opacity-100 dark:border-brand-cream/15 dark:bg-[#221a19]">
            <button onClick={(e) => { e.stopPropagation(); onQuickAdd(node); }} aria-label="Add child" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-brand-slate transition hover:bg-brand-blush hover:text-brand-red dark:hover:bg-brand-cream/10"><Plus size={12} /></button>
            <button onClick={(e) => { e.stopPropagation(); onAddSibling(node, parentId); }} aria-label="Add sibling" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-brand-slate transition hover:bg-brand-blush hover:text-brand-red dark:hover:bg-brand-cream/10"><UserPlus size={12} /></button>
            <button onClick={(e) => { e.stopPropagation(); onSelect(node, parentId); }} aria-label="Edit" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-brand-slate transition hover:bg-brand-blush hover:text-brand-red dark:hover:bg-brand-cream/10"><Pencil size={12} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(node); }} aria-label="Delete" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-brand-slate transition hover:bg-brand-blush hover:text-red-600 dark:hover:bg-brand-cream/10"><Trash2 size={12} /></button>
            {parentId && onDetach && <button onClick={(e) => { e.stopPropagation(); onDetach(node.id); }} aria-label="Detach from parent" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-brand-slate transition hover:bg-brand-blush hover:text-red-600 dark:hover:bg-brand-cream/10"><Scissors size={12} /></button>}
          </div>
        )}
      </div>

      {/* Below-wire drop zone */}
      {expanded && hasChildren && (
        <div
          className="relative flex justify-center"
          style={{ height: 0 }}
        >
          <div
            className="absolute z-[20] flex items-center justify-center"
            style={{ width: 168, height: 30, top: 0 }}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes("application/new-node")) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                setBelowWireOver(true);
              }
            }}
            onDragLeave={() => setBelowWireOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setBelowWireOver(false);
              const raw = e.dataTransfer.getData("application/new-node");
              if (raw) {
                try {
                  setBelowWirePending(JSON.parse(raw));
                } catch {}
              }
            }}
          >
            {belowWirePending && (
              <WireDropMenu
                topLabel="Add as child"
                bottomLabel="Insert in branch"
                onAddOnTop={() => {
                  if (onDropNew) onDropNew(node.id, belowWirePending);
                  setBelowWirePending(null);
                }}
                onAddInBranch={() => {
                  if (onInsertLayer) onInsertLayer(node.id, belowWirePending);
                  setBelowWirePending(null);
                }}
                onCancel={() => setBelowWirePending(null)}
              />
            )}
            {belowWireOver && !belowWirePending && (
              <div className="flex items-center gap-1 rounded-full border-2 border-dashed border-brand-red bg-brand-red/10 px-3 py-0.5 text-[10px] font-medium text-brand-red">
                <Plus size={10} /> Drop here
              </div>
            )}
          </div>
        </div>
      )}

      {expanded && hasChildren && (
        <ul>
          {node.children.map((child, i) => (
            <React.Fragment key={child.id}>
              {i === 0 && onAddNodeAt && (
                <SiblingDropZone parentId={node.id} index={0} onAddNodeAt={onAddNodeAt} />
              )}
              <li>
                <OrgCard
                  node={child}
                  parentId={node.id}
                  depth={depth + 1}
                  editMode={editMode}
                  forceExpand={forceExpand}
                  siblingIndex={i}
                  onSelect={onSelect}
                  onQuickAdd={onQuickAdd}
                  onAddSibling={onAddSibling}
                  onDelete={onDelete}
                  onWrapWithParent={onWrapWithParent}
                  onNavigate={onNavigate}
                  onDropNew={onDropNew}
                  onDetach={onDetach}
                  onDropNewOnWire={onDropNewOnWire}
                  onReparent={onReparent}
                  onInsertLayer={onInsertLayer}
                  searchMatches={searchMatches}
                  onAddNodeAt={onAddNodeAt}
                  onDropFunction={onDropFunction}
                />
              </li>
              {onAddNodeAt && (
                <SiblingDropZone parentId={node.id} index={i + 1} onAddNodeAt={onAddNodeAt} />
              )}
            </React.Fragment>
          ))}
        </ul>
      )}
    </>
  );
}
