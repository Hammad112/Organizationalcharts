"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useOrgStore } from "@/lib/useOrgStore";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { OrgNode, ViewDef } from "@/lib/types";
import { Header } from "@/components/Header";
import { ChannelTabs } from "@/components/ChannelTabs";
import { OrgChart } from "@/components/OrgChart";
import { NodeDrawer } from "@/components/NodeDrawer";
import { DragPanel } from "@/components/DragPanel";
import { ToastContainer, type ToastData } from "@/components/Toast";
import { DeleteConfirm } from "@/components/DeleteConfirm";
import { VersionCompare } from "@/components/VersionCompare";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FunctionBlocks } from "@/components/FunctionBlocks";
import { SaveBar } from "@/components/SaveBar";

type Selection = { node: OrgNode; parentId: string | null };

const OVERVIEW_COLORS = ["#990011", "#5C000A", "#2F3C7E", "#C9A227", "#0F6E56", "#5F5E5A"];

function findNode(nodes: OrgNode[], id: string): OrgNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}

function countNodes(nodes: OrgNode[]): number {
  let count = 0;
  function walk(n: OrgNode) { count++; n.children.forEach(walk); }
  nodes.forEach(walk);
  return count;
}

function stripOverviewProps(node: OrgNode): OrgNode {
  const { linksTo, ...clean } = node as OrgNode & { linksTo?: string };
  const cleaned = { ...clean } as Record<string, unknown>;
  delete cleaned._sourceView;
  delete cleaned._color;
  return {
    ...(cleaned as OrgNode),
    children: (cleaned as OrgNode).children.map(stripOverviewProps),
  };
}

export default function Page() {
  const store = useOrgStore();
  const [editMode, setEditMode] = useLocalStorage<boolean>("hum-org-edit-mode", true);
  const [activeViewId, setActiveViewId] = useLocalStorage<string | null>("hum-org-active-view", null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [drillStack, setDrillStack] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [clipboard, setClipboard] = useState<OrgNode[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [pendingDelete, setPendingDelete] = useState<OrgNode | null>(null);

  const views = store.data?.views ?? [];
  const currentViewId = activeViewId && views.some((v) => v.id === activeViewId) ? activeViewId : views[0]?.id;
  const rawActiveView = useMemo(() => views.find((v) => v.id === currentViewId), [views, currentViewId]);

  const activeView = useMemo(() => {
    if (!rawActiveView?.auto) return rawActiveView;
    const otherViews = views.filter((v) => !v.auto && v.id !== rawActiveView.id);

    const flat = new Map<string, OrgNode & { _sourceView: string; _color: string }>();
    function collect(nodes: OrgNode[], color: string, viewId: string) {
      for (const n of nodes) {
        if (!flat.has(n.id)) {
          flat.set(n.id, { ...n, children: [], _sourceView: viewId, _color: color });
        }
        collect(n.children, color, viewId);
      }
    }
    for (let i = 0; i < otherViews.length; i++) {
      collect(otherViews[i].roots, OVERVIEW_COLORS[i % OVERVIEW_COLORS.length], otherViews[i].id);
    }

    const titleToIds = new Map<string, string[]>();
    for (const [id, node] of flat) {
      const existing = titleToIds.get(node.title);
      if (existing) existing.push(id);
      else titleToIds.set(node.title, [id]);
    }

    const childrenOf = new Map<string, string[]>();
    const hasParent = new Set<string>();

    function addChildren(nodes: OrgNode[]) {
      for (const n of nodes) {
        for (const c of n.children) {
          if (!childrenOf.has(n.id)) childrenOf.set(n.id, []);
          const list = childrenOf.get(n.id)!;
          if (!list.includes(c.id)) list.push(c.id);
          hasParent.add(c.id);
        }
        addChildren(n.children);
      }
    }
    for (const v of otherViews) addChildren(v.roots);

    for (const [id, node] of flat) {
      if (node.reportsTo && !hasParent.has(id)) {
        const candidates = titleToIds.get(node.reportsTo);
        if (candidates) {
          const parentId = candidates.find((pid) => pid !== id) ?? candidates[0];
          if (parentId && parentId !== id) {
            if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
            const list = childrenOf.get(parentId)!;
            if (!list.includes(id)) list.push(id);
            hasParent.add(id);
          }
        }
      }
    }

    const built = new Set<string>();
    function buildTree(id: string): OrgNode {
      built.add(id);
      const node = flat.get(id)!;
      const childIds = childrenOf.get(id) ?? [];
      const children = childIds
        .filter((cid) => flat.has(cid) && !built.has(cid))
        .map((cid) => buildTree(cid));
      return {
        ...node,
        color: node.color,
        linksTo: node._sourceView,
        children,
      };
    }

    const rootIds = [...flat.keys()].filter((id) => !hasParent.has(id));
    const roots = rootIds.map((id) => buildTree(id));

    return { ...rawActiveView, roots };
  }, [rawActiveView, views]);

  const focusNode = useMemo(() => {
    if (!activeView || drillStack.length === 0) return null;
    const targetId = drillStack[drillStack.length - 1];
    return findNode(activeView.roots, targetId) ?? null;
  }, [activeView, drillStack]);

  const breadcrumb = useMemo(() => {
    if (!activeView || drillStack.length === 0) return [];
    return drillStack.map((id) => {
      const node = findNode(activeView.roots, id);
      return { id, title: node?.title ?? id };
    });
  }, [activeView, drillStack]);

  const selectionParent = useMemo(() => {
    if (!selection || !activeView || selection.parentId === null) return null;
    return findNode(activeView.roots, selection.parentId);
  }, [selection, activeView]);

  const toast = useCallback((message: string, undo?: () => void) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, undo }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  function findOwnerView(nodeId: string): string | null {
    const search = (nodes: OrgNode[]): boolean => {
      for (const n of nodes) {
        if (n.id === nodeId) return true;
        if (search(n.children)) return true;
      }
      return false;
    };
    for (const v of views) {
      if (v.auto) continue;
      if (search(v.roots)) return v.id;
    }
    return null;
  }

  function resolveViewId(nodeId: string): string | undefined {
    if (rawActiveView?.auto) return findOwnerView(nodeId) ?? undefined;
    return activeView?.id;
  }

  function handleSelect(node: OrgNode, parentId: string | null) {
    setSelection({ node, parentId });
  }

  function handleBreadcrumbBack(index: number) {
    if (index < 0) {
      setDrillStack([]);
    } else {
      setDrillStack((prev) => prev.slice(0, index + 1));
    }
  }

  function handleAddRoot() {
    if (!activeView) return;
    if (rawActiveView?.auto) return;
    const node = store.addNode(activeView.id, null);
    setSelection({ node, parentId: null });
  }

  function handleDropNewRoot(data: { type: string; label: string; color: string }) {
    if (!activeView) return;
    if (rawActiveView?.auto) return;
    const node = store.addNode(activeView.id, null, {
      title: data.label,
      color: data.color,
    });
    setSelection({ node, parentId: null });
  }

  function handleChange(patch: Partial<OrgNode>) {
    if (!activeView || !selection) return;
    const viewId = resolveViewId(selection.node.id) ?? activeView.id;
    store.updateNode(viewId, selection.node.id, patch);
    setSelection((s) => (s ? { ...s, node: { ...s.node, ...patch } } : s));
  }

  function addChildTo(parentNode: OrgNode) {
    if (!activeView) return;
    const viewId = resolveViewId(parentNode.id) ?? activeView.id;
    const child = store.addNode(viewId, parentNode.id);
    setSelection({ node: child, parentId: parentNode.id });
  }

  function handleAddChild() {
    if (!selection) return;
    addChildTo(selection.node);
  }

  function handleQuickAdd(node: OrgNode) {
    addChildTo(node);
  }

  function handleWrapWithParent(node: OrgNode) {
    if (!activeView) return;
    const viewId = resolveViewId(node.id) ?? activeView.id;
    const parent = store.wrapWithParent(viewId, node.id);
    setSelection({ node: parent, parentId: null });
  }

  function handleAddSibling(node: OrgNode, parentId: string | null) {
    if (!activeView) return;
    const viewId = resolveViewId(node.id) ?? activeView.id;
    const sibling = store.addNodeAfter(viewId, node.id);
    setSelection({ node: sibling, parentId });
  }

  function handleMove(direction: -1 | 1) {
    if (!activeView || !selection) return;
    const viewId = resolveViewId(selection.node.id) ?? activeView.id;
    store.moveNode(viewId, selection.parentId, selection.node.id, direction);
  }

  function handleDeleteNode(node: OrgNode) {
    if (!activeView) return;
    if (node.children.length > 0) {
      setPendingDelete(node);
      return;
    }
    doDeleteAll(node);
  }

  function doDeleteAll(node: OrgNode) {
    if (!activeView) return;
    const viewId = resolveViewId(node.id) ?? activeView.id;
    const info = store.deleteNode(viewId, node.id);
    if (selection?.node.id === node.id) setSelection(null);
    setPendingDelete(null);
    if (info) {
      const cleanNode = rawActiveView?.auto ? stripOverviewProps(info.node) : info.node;
      toast(`"${node.title}" and branch deleted`, () => {
        store.restoreNode(viewId, info.parentId, cleanNode, info.index);
      });
    } else {
      toast(`"${node.title}" and branch deleted`);
    }
  }

  function doDeleteOnly(node: OrgNode) {
    if (!activeView) return;
    const viewId = resolveViewId(node.id) ?? activeView.id;
    const info = store.deleteNodeOnly(viewId, node.id);
    if (selection?.node.id === node.id) setSelection(null);
    setPendingDelete(null);
    if (info) {
      const cleanNode = rawActiveView?.auto ? stripOverviewProps(info.node) : info.node;
      toast(`"${node.title}" removed — reports promoted`, () => {
        store.deleteNode(viewId, node.id);
        store.restoreNode(viewId, info.parentId, cleanNode, info.index);
      });
    } else {
      toast(`"${node.title}" removed — reports promoted`);
    }
  }

  function doDeleteDisconnect(node: OrgNode) {
    if (!activeView) return;
    const viewId = resolveViewId(node.id) ?? activeView.id;
    const info = store.deleteNodeDisconnectChildren(viewId, node.id);
    if (selection?.node.id === node.id) setSelection(null);
    setPendingDelete(null);
    if (info) {
      const cleanNode = rawActiveView?.auto ? stripOverviewProps(info.node) : info.node;
      toast(`"${node.title}" removed — reports disconnected`, () => {
        for (const child of node.children) {
          store.deleteNode(viewId, child.id);
        }
        store.restoreNode(viewId, info.parentId, cleanNode, info.index);
      });
    } else {
      toast(`"${node.title}" removed — reports disconnected`);
    }
  }

  function handleDeleteFromDrawer() {
    if (!selection) return;
    handleDeleteNode(selection.node);
  }

  function handleAddTab(label: string) {
    const id = store.addView(label);
    setActiveViewId(id);
    setDrillStack([]);
  }

  function handleRenameTab(id: string, label: string) {
    store.renameView(id, label);
  }

  function handleDeleteTab(id: string) {
    const view = views.find((v) => v.id === id);
    if (!view) return;
    const index = views.findIndex((v) => v.id === id);
    store.deleteView(id);
    if (currentViewId === id) {
      setActiveViewId(null);
      setDrillStack([]);
    }
    toast(`"${view.label}" tab deleted`, () => {
      store.restoreView(view, index);
    });
  }

  function handleSelectTab(id: string) {
    setActiveViewId(id);
    setDrillStack([]);
    setSelection(null);
  }

  function handleDropNew(parentId: string, data: { type: string; label: string; color: string }) {
    const viewId = resolveViewId(parentId);
    if (!viewId) return;
    const node = store.addNode(viewId, parentId, {
      title: data.label,
      color: data.color,
    });
    setSelection({ node, parentId });
  }

  function handleDetach(nodeId: string) {
    const viewId = resolveViewId(nodeId);
    if (!viewId) return;
    store.reparentNode(viewId, nodeId, null);
    toast("Detached from parent");
  }

  function handleDropNewOnWire(childId: string, parentId: string, data: { type: string; label: string; color: string }) {
    const viewId = resolveViewId(childId);
    if (!viewId) return;
    const wrapper = store.wrapWithParent(viewId, childId, {
      title: data.label,
      color: data.color,
    });
    setSelection({ node: wrapper, parentId });
  }

  function handleReparent(nodeId: string, newParentId: string | null) {
    const viewId = resolveViewId(nodeId);
    if (!viewId) return;
    if (newParentId !== null && rawActiveView?.auto) {
      const targetViewId = findOwnerView(newParentId);
      if (targetViewId !== viewId) return;
    }
    store.reparentNode(viewId, nodeId, newParentId);
  }

  function handleAddNodeAt(parentId: string, index: number, data: { type: string; label: string; color: string }) {
    const viewId = resolveViewId(parentId);
    if (!viewId) return;
    const node = store.addNodeAt(viewId, parentId, index, {
      title: data.label,
      color: data.color,
    });
    setSelection({ node, parentId });
  }

  function handleInsertLayer(parentId: string, data: { type: string; label: string; color: string }) {
    const viewId = resolveViewId(parentId);
    if (!viewId) return;
    const layer = store.insertLayerBelow(viewId, parentId, {
      title: data.label,
      color: data.color,
    });
    setSelection({ node: layer, parentId });
  }

  function handleDropFunction(nodeId: string, fn: { label: string; icon: string; color: string }) {
    const viewId = resolveViewId(nodeId);
    if (!viewId) return;
    const view = views.find((v) => v.id === viewId);
    if (!view) return;
    const node = findNode(view.roots, nodeId);
    const existing = node?.functions ?? [];
    if (existing.some((f) => f.label === fn.label)) return;
    store.updateNode(viewId, nodeId, { functions: [...existing, fn] });
  }

  function handleRemoveFunction(nodeId: string, fnLabel: string) {
    const viewId = resolveViewId(nodeId);
    if (!viewId) return;
    const view = views.find((v) => v.id === viewId);
    if (!view) return;
    const node = findNode(view.roots, nodeId);
    const updated = (node?.functions ?? []).filter((f) => f.label !== fnLabel);
    store.updateNode(viewId, nodeId, { functions: updated });
  }

  function handleCopyAll() {
    if (!activeView || rawActiveView?.auto) return;
    const cloned = JSON.parse(JSON.stringify(activeView.roots)) as OrgNode[];
    setClipboard(cloned);
    toast(`Copied ${countNodes(cloned)} nodes from "${activeView.label}"`);
  }

  function handlePaste() {
    if (!activeView || !clipboard || rawActiveView?.auto) return;
    store.pasteNodes(activeView.id, clipboard);
    toast(`Pasted ${countNodes(clipboard)} nodes into "${activeView.label}"`);
  }

  function handleToggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  async function handleAiApply(prompt: string) {
    if (!activeView || rawActiveView?.auto) return;
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roots: activeView.roots, prompt, tabLabel: activeView.label }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "AI request failed");
    store.replaceRoots(activeView.id, json.roots);
    toast("AI changes applied");
  }

  function handleReset() {
    store.resetAll();
    setSelection(null);
    setActiveViewId(null);
    setDrillStack([]);
  }

  const headcounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of views) {
      if (v.auto) continue;
      counts[v.id] = countNodes(v.roots);
    }
    return counts;
  }, [views]);

  // Clear selection if the selected node no longer exists (e.g. remote user deleted it)
  useEffect(() => {
    if (!selection || !activeView) return;
    const stillExists = findNode(activeView.roots, selection.node.id);
    if (!stillExists) setSelection(null);
  }, [activeView, selection]);

  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    const matches = new Set<string>();
    function walk(n: OrgNode) {
      if (n.title.toLowerCase().includes(q) || n.designation?.toLowerCase().includes(q)) {
        matches.add(n.id);
      }
      n.children.forEach(walk);
    }
    if (activeView) activeView.roots.forEach(walk);
    return matches;
  }, [searchQuery, activeView]);

  if (!activeView) {
    return <main className="min-h-screen" />;
  }

  return (
    <ErrorBoundary>
    <main className="min-h-screen">
      <SaveBar
        dirty={store.dirty}
        saving={store.saving}
        lastSavedTo={store.lastSavedTo}
        getVersions={store.getVersions}
        onSaveToTarget={store.saveToTarget}
        onSaveNewVersion={store.saveToNewVersion}
        onDiscard={store.discardChanges}
      />
      <Header
        editMode={editMode}
        onToggleEdit={() => setEditMode((v) => !v)}
        onReset={handleReset}
        onLoadForEditing={store.loadVersionForEditing}
        onDuplicateVersion={store.duplicateVersion}
        onDeleteVersion={store.deleteVersion}
        onCompare={() => setShowCompare(true)}
        onCopyAll={handleCopyAll}
        onPaste={handlePaste}
        onToggleFullscreen={handleToggleFullscreen}
        hasClipboard={!!clipboard}
        isFullscreen={isFullscreen}
        isOverview={!!rawActiveView?.auto}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        getVersions={store.getVersions}
        onAiApply={handleAiApply}
        tabLabel={activeView.label}
      />
      <ChannelTabs
        views={views}
        activeId={activeView.id}
        editMode={editMode}
        headcounts={headcounts}
        onSelect={handleSelectTab}
        onRename={handleRenameTab}
        onDelete={handleDeleteTab}
        onAdd={handleAddTab}
      />
      <div className="px-6 py-8 sm:px-10">
        <OrgChart
          view={activeView}
          editMode={editMode}
          focusNode={focusNode}
          breadcrumb={breadcrumb}
          searchMatches={searchMatches}
          onSelect={handleSelect}
          onAddRoot={handleAddRoot}
          onQuickAdd={handleQuickAdd}
          onAddSibling={handleAddSibling}
          onDelete={handleDeleteNode}

          onWrapWithParent={handleWrapWithParent}
          onBreadcrumbBack={handleBreadcrumbBack}
          onNavigate={handleSelectTab}
          onDropNew={handleDropNew}
          onDropNewRoot={handleDropNewRoot}
          onDetach={handleDetach}
          onDropNewOnWire={handleDropNewOnWire}
          onReparent={handleReparent}
          onInsertLayer={handleInsertLayer}
          onAddNodeAt={handleAddNodeAt}
          onDropFunction={handleDropFunction}
          onRemoveFunction={handleRemoveFunction}
          onRefreshFromCloud={store.refreshFromCloud}
        />
      </div>

      {rawActiveView?.auto && (
        <>
          <div className="h-20" />
          <FunctionBlocks editMode={editMode} />
        </>
      )}

      <DragPanel view={activeView} onReparent={handleReparent} />

      {selection && (
        <NodeDrawer
          node={selection.node}
          parent={selectionParent}
          editMode={editMode}
          views={views}
          onChange={handleChange}
          onAddChild={handleAddChild}
          onMove={handleMove}
          onDelete={handleDeleteFromDrawer}
          onClose={() => setSelection(null)}
        />
      )}

      {pendingDelete && (
        <DeleteConfirm
          node={pendingDelete}
          onDeleteAll={() => doDeleteAll(pendingDelete)}
          onDeleteOnly={() => doDeleteOnly(pendingDelete)}
          onDeleteDisconnect={() => doDeleteDisconnect(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {showCompare && (
        <VersionCompare
          getVersions={store.getVersions}
          getVersionData={store.getVersionData}
          getCurrentData={() => store.data}
          onClose={() => setShowCompare(false)}
        />
      )}
    </main>
    </ErrorBoundary>
  );
}
