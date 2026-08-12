"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, Maximize, Plus, ZoomIn, ZoomOut } from "lucide-react";
import { toPng } from "html-to-image";
import type { OrgNode, ViewDef } from "@/lib/types";
import { OrgCard } from "./OrgCard";
import { EmptyState } from "./EmptyState";

export function OrgChart({
  view,
  editMode,
  focusNode,
  breadcrumb,
  onSelect,
  onAddRoot,
  onQuickAdd,
  onAddSibling,
  onDelete,
  onWrapWithParent,
  onBreadcrumbBack,
  onNavigate,
  onDropNew,
  onDropNewRoot,
  onDetach,
  onDropNewOnWire,
  onReparent,
  onInsertLayer,
  searchMatches,
  onAddNodeAt,
  onDropFunction,
  onRefreshFromCloud,
}: {
  view: ViewDef;
  editMode: boolean;
  focusNode: OrgNode | null;
  breadcrumb: { id: string; title: string }[];
  searchMatches: Set<string>;
  onSelect: (node: OrgNode, parentId: string | null) => void;
  onAddRoot: () => void;
  onQuickAdd: (node: OrgNode) => void;
  onAddSibling: (node: OrgNode, parentId: string | null) => void;
  onDelete: (node: OrgNode) => void;
  onWrapWithParent: (node: OrgNode) => void;
  onBreadcrumbBack: (index: number) => void;
  onNavigate: (viewId: string) => void;
  onDropNew: (parentId: string, data: { type: string; label: string; color: string }) => void;
  onDropNewRoot: (data: { type: string; label: string; color: string }) => void;
  onDetach: (nodeId: string) => void;
  onDropNewOnWire: (childId: string, parentId: string, data: { type: string; label: string; color: string }) => void;
  onReparent: (nodeId: string, newParentId: string | null) => void;
  onInsertLayer: (parentId: string, data: { type: string; label: string; color: string }) => void;
  onAddNodeAt: (parentId: string, index: number, data: { type: string; label: string; color: string }) => void;
  onDropFunction?: (nodeId: string, fn: { label: string; icon: string; color: string }) => void;
  onRefreshFromCloud?: () => Promise<void>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [autoFitted, setAutoFitted] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const dragCounter = useRef(0);
  const [bgDragOver, setBgDragOver] = useState(false);

  const roots = focusNode ? [focusNode] : view.roots;

  const fitToView = useCallback(() => {
    const outer = containerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    setZoom(1);
    requestAnimationFrame(() => {
      const contentW = inner.scrollWidth;
      const contentH = inner.scrollHeight;
      const availW = outer.clientWidth;
      const availH = outer.clientHeight;
      if (contentW === 0 || contentH === 0) return;
      const scaleX = availW / contentW;
      const scaleY = availH / contentH;
      const fit = Math.min(scaleX, scaleY, 1.5);
      setZoom(Math.max(0.15, Math.round(fit * 100) / 100));
      setAutoFitted(true);
    });
  }, []);

  useEffect(() => {
    setAutoFitted(false);
  }, [view.id, focusNode?.id]);

  useEffect(() => {
    if (autoFitted) return;
    const timer = setTimeout(fitToView, 100);
    return () => clearTimeout(timer);
  }, [autoFitted, fitToView, roots]);

  useEffect(() => {
    const handleResize = () => fitToView();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fitToView]);

  const handleCapture = useCallback(async () => {
    const el = captureRef.current;
    if (!el || capturing) return;
    setCapturing(true);
    try {
      if (onRefreshFromCloud) await onRefreshFromCloud();
      await new Promise((r) => setTimeout(r, 300));
      document.documentElement.setAttribute("data-theme", "light");
      el.style.flexWrap = "wrap";
      el.style.maxWidth = "1800px";
      await new Promise((r) => setTimeout(r, 200));
      const dataUrl = await toPng(el, {
        backgroundColor: "#FCF6F5",
        pixelRatio: 2,
        width: el.scrollWidth,
        height: el.scrollHeight,
        style: {
          transform: "none",
          transformOrigin: "top left",
        },
      });
      el.style.flexWrap = "";
      el.style.maxWidth = "";
      document.documentElement.removeAttribute("data-theme");
      const link = document.createElement("a");
      link.download = `${view.label.replace(/[^a-zA-Z0-9]/g, "-")}-org-chart.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // capture failed silently
    }
    setCapturing(false);
  }, [view.label, capturing, onRefreshFromCloud]);

  if (roots.length === 0) {
    return <EmptyState icon={view.icon} onAddRole={onAddRoot} />;
  }

  return (
    <div className="relative flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
      {/* Top bar: breadcrumb + controls */}
      <div className="mb-2 flex items-center justify-between">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm">
          {breadcrumb.length > 0 ? (
            <>
              <button
                onClick={() => onBreadcrumbBack(-1)}
                className="flex items-center gap-1 text-brand-slate transition hover:text-brand-red"
              >
                <ChevronLeft size={14} />
                {view.label}
              </button>
              {breadcrumb.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  <span className="text-brand-slate">/</span>
                  {i < breadcrumb.length - 1 ? (
                    <button onClick={() => onBreadcrumbBack(i)} className="text-brand-slate transition hover:text-brand-red">
                      {crumb.title}
                    </button>
                  ) : (
                    <span className="font-medium text-brand-ink dark:text-brand-cream">{crumb.title}</span>
                  )}
                </span>
              ))}
            </>
          ) : (
            <span className="text-xs text-brand-slate">Auto-fitted to screen</span>
          )}
        </div>

        {/* Zoom + capture controls */}
        <div className="flex items-center gap-1 rounded-lg border border-brand-ink/10 bg-white p-1 shadow-card dark:border-brand-cream/10 dark:bg-[#221a19]">
          <button
            onClick={() => { setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1))); setAutoFitted(true); }}
            aria-label="Zoom in"
            className="flex h-7 w-7 items-center justify-center rounded text-brand-slate hover:bg-brand-blush hover:text-brand-red dark:hover:bg-brand-cream/10"
          >
            <ZoomIn size={15} />
          </button>
          <span className="min-w-[40px] text-center text-xs tabular-nums text-brand-slate">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => { setZoom((z) => Math.max(0.1, +(z - 0.1).toFixed(1))); setAutoFitted(true); }}
            aria-label="Zoom out"
            className="flex h-7 w-7 items-center justify-center rounded text-brand-slate hover:bg-brand-blush hover:text-brand-red dark:hover:bg-brand-cream/10"
          >
            <ZoomOut size={15} />
          </button>
          <div className="mx-0.5 h-4 w-px bg-brand-ink/10 dark:bg-brand-cream/10" />
          <button
            onClick={() => { setAutoFitted(false); }}
            aria-label="Fit to screen"
            className="flex h-7 w-7 items-center justify-center rounded text-brand-slate hover:bg-brand-blush hover:text-brand-red dark:hover:bg-brand-cream/10"
          >
            <Maximize size={14} />
          </button>
          <div className="mx-0.5 h-4 w-px bg-brand-ink/10 dark:bg-brand-cream/10" />
          <button
            onClick={handleCapture}
            disabled={capturing}
            aria-label="Capture screenshot"
            className="flex h-7 items-center gap-1.5 rounded px-2 text-brand-slate hover:bg-brand-blush hover:text-brand-red disabled:opacity-50 dark:hover:bg-brand-cream/10"
          >
            <Camera size={14} />
            <span className="text-xs">{capturing ? "Capturing..." : "Capture"}</span>
          </button>
        </div>
      </div>

      {/* Chart area */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-auto rounded-lg border border-brand-ink/5 bg-white/50 dark:border-brand-cream/5 dark:bg-brand-ink/20"
      >
        <div
          className={`org-chart flex h-full w-full items-start justify-center p-6 transition-colors ${bgDragOver ? "bg-brand-red/5" : ""}`}
          style={{ overflow: "auto" }}
          onDragEnter={(e) => {
            if (e.dataTransfer.types.includes("application/new-node")) {
              dragCounter.current++;
              setBgDragOver(true);
            }
          }}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("application/new-node")) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }
          }}
          onDragLeave={() => {
            dragCounter.current--;
            if (dragCounter.current <= 0) {
              dragCounter.current = 0;
              setBgDragOver(false);
            }
          }}
          onDrop={(e) => {
            dragCounter.current = 0;
            setBgDragOver(false);
            const raw = e.dataTransfer.getData("application/new-node");
            if (raw) {
              e.preventDefault();
              try {
                onDropNewRoot(JSON.parse(raw));
              } catch {}
            }
          }}
        >
          <div
            ref={innerRef}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              transition: "transform 0.25s ease",
            }}
          >
            <div ref={captureRef} className="flex items-start gap-10">
              {roots.map((root) => (
                <ul key={root.id}>
                  <li>
                    <OrgCard
                      node={root}
                      parentId={null}
                      depth={0}
                      editMode={editMode}
                      forceExpand={!!focusNode}
                      searchMatches={searchMatches}
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
                      onAddNodeAt={onAddNodeAt}
                      onDropFunction={onDropFunction}
                    />
                  </li>
                </ul>
              ))}
            </div>
          </div>
        </div>
      </div>

      {editMode && !focusNode && (
        <button
          onClick={onAddRoot}
          className="mt-3 flex items-center gap-1.5 rounded-md border border-dashed border-brand-ink/20 px-3 py-1.5 text-xs text-brand-slate transition hover:border-brand-red hover:text-brand-red dark:border-brand-cream/20"
        >
          <Plus size={13} aria-hidden="true" />
          Add a top-level role or board
        </button>
      )}
    </div>
  );
}
