"use client";

import { useEffect, useRef, useState } from "react";
import { defaultData } from "./defaultData";
import type { OrgData, OrgNode, ViewDef } from "./types";
import { iconForIndex } from "./icons";
import { cloudSave, cloudLoad, cloudDelete } from "./supabase";

const STORAGE_KEY = "hum-org-data-v2";

function cloneDefault(): OrgData {
  return JSON.parse(JSON.stringify(defaultData));
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function mapRoots(views: ViewDef[], viewId: string, fn: (roots: OrgNode[]) => OrgNode[]): ViewDef[] {
  return views.map((v) => (v.id === viewId ? { ...v, roots: fn(v.roots) } : v));
}

function insertChild(node: OrgNode, parentId: string, child: OrgNode): OrgNode {
  if (node.id === parentId) return { ...node, children: [...node.children, child] };
  return { ...node, children: node.children.map((c) => insertChild(c, parentId, child)) };
}

function insertAfterInList(nodes: OrgNode[], afterId: string, newNode: OrgNode): OrgNode[] {
  const result: OrgNode[] = [];
  for (const n of nodes) {
    result.push(n);
    if (n.id === afterId) result.push(newNode);
  }
  return result;
}

function insertAfterDeep(node: OrgNode, afterId: string, newNode: OrgNode): OrgNode {
  const newChildren = insertAfterInList(node.children, afterId, newNode);
  if (newChildren.length !== node.children.length) {
    return { ...node, children: newChildren };
  }
  return { ...node, children: node.children.map((c) => insertAfterDeep(c, afterId, newNode)) };
}

function wrapDeep(node: OrgNode, targetId: string, wrapper: OrgNode): OrgNode {
  const idx = node.children.findIndex((c) => c.id === targetId);
  if (idx >= 0) {
    const target = node.children[idx];
    const newWrapper = {
      ...wrapper,
      reportsTo: node.title,
      children: [{ ...target, reportsTo: wrapper.title }],
    };
    const copy = [...node.children];
    copy[idx] = newWrapper;
    return { ...node, children: copy };
  }
  return { ...node, children: node.children.map((c) => wrapDeep(c, targetId, wrapper)) };
}

function patchNode(node: OrgNode, nodeId: string, patch: Partial<OrgNode>): OrgNode {
  if (node.id === nodeId) return { ...node, ...patch };
  return { ...node, children: node.children.map((c) => patchNode(c, nodeId, patch)) };
}

function removeNode(nodes: OrgNode[], nodeId: string): OrgNode[] {
  return nodes.filter((n) => n.id !== nodeId).map((n) => ({ ...n, children: removeNode(n.children, nodeId) }));
}

function removeNodePromoteChildren(nodes: OrgNode[], nodeId: string): OrgNode[] {
  const result: OrgNode[] = [];
  for (const n of nodes) {
    if (n.id === nodeId) {
      result.push(...n.children);
    } else {
      result.push({ ...n, children: removeNodePromoteChildren(n.children, nodeId) });
    }
  }
  return result;
}

function findNodeWithParent(
  nodes: OrgNode[],
  nodeId: string,
  parent: OrgNode | null = null
): { node: OrgNode; parent: OrgNode | null; index: number } | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === nodeId) return { node: nodes[i], parent, index: i };
    const found = findNodeWithParent(nodes[i].children, nodeId, nodes[i]);
    if (found) return found;
  }
  return null;
}

function findNodeById(nodes: OrgNode[], id: string): OrgNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNodeById(n.children, id);
    if (found) return found;
  }
  return null;
}

function reorderList<T extends { id: string }>(list: T[], id: string, direction: -1 | 1): T[] {
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return list;
  const target = idx + direction;
  if (target < 0 || target >= list.length) return list;
  const copy = [...list];
  [copy[idx], copy[target]] = [copy[target], copy[idx]];
  return copy;
}

function reorderChild(node: OrgNode, parentId: string, nodeId: string, direction: -1 | 1): OrgNode {
  if (node.id === parentId) return { ...node, children: reorderList(node.children, nodeId, direction) };
  return { ...node, children: node.children.map((c) => reorderChild(c, parentId, nodeId, direction)) };
}

function restoreNodeAt(nodes: OrgNode[], parentId: string | null, node: OrgNode, index: number): OrgNode[] {
  if (parentId === null) {
    const copy = [...nodes];
    copy.splice(index, 0, node);
    return copy;
  }
  return nodes.map((n) => {
    if (n.id === parentId) {
      const copy = [...n.children];
      copy.splice(index, 0, node);
      return { ...n, children: copy };
    }
    return { ...n, children: restoreNodeAt(n.children, parentId, node, index) };
  });
}

function getParentTitle(views: ViewDef[], viewId: string, parentId: string): string {
  const view = views.find((v) => v.id === viewId);
  if (!view) return "";
  const parent = findNodeById(view.roots, parentId);
  return parent?.title ?? "";
}

function findSiblingParentTitle(views: ViewDef[], viewId: string, siblingId: string): string {
  const view = views.find((v) => v.id === viewId);
  if (!view) return "";
  const found = findNodeWithParent(view.roots, siblingId);
  return found?.parent?.title ?? "";
}

export function useOrgStore() {
  const [data, setDataRaw] = useState<OrgData | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedTo, setLastSavedTo] = useState<string | null>(null);
  const dataRef = useRef<OrgData | null>(null);
  const savedSnapshotRef = useRef<string>("");

  function setData(updater: (prev: OrgData) => OrgData) {
    setDataRaw((prev) => {
      if (!prev) return prev;
      try {
        const next = updater(prev);
        dataRef.current = next;
        return next;
      } catch (e) {
        console.warn("[useOrgStore] setData error:", e);
        return prev;
      }
    });
    setDirty(true);
  }

  // Mark dirty whenever data changes after hydration
  useEffect(() => {
    if (!hydrated || !data) return;
    const snap = JSON.stringify(data);
    if (snap !== savedSnapshotRef.current) {
      setDirty(true);
    }
  }, [data, hydrated]);

  useEffect(() => {
    async function hydrate() {
      try {
        const cloud = await cloudLoad(STORAGE_KEY);
        const result = (cloud as OrgData) ?? cloneDefault();
        if (result && result.views && Array.isArray(result.views)) {
          setDataRaw(result);
          dataRef.current = result;
          savedSnapshotRef.current = JSON.stringify(result);
        } else {
          const fallback = cloneDefault();
          setDataRaw(fallback);
          dataRef.current = fallback;
          savedSnapshotRef.current = JSON.stringify(fallback);
        }
      } catch {
        const fallback = cloneDefault();
        setDataRaw(fallback);
        dataRef.current = fallback;
        savedSnapshotRef.current = JSON.stringify(fallback);
      }
      setHydrated(true);
    }
    hydrate();
  }, []);

  // --- Explicit save ---
  async function saveToTarget(target: string): Promise<boolean> {
    const current = dataRef.current;
    if (!current) return false;
    setSaving(true);
    try {
      if (target === "__main__") {
        await cloudSave(STORAGE_KEY, current);
      } else {
        const key = STORAGE_KEY + "-ver-" + target;
        await cloudSave(key, current);
        // Update version index
        const existing = versionsRef.current.filter((v) => v.name !== target);
        existing.unshift({ name: target, date: new Date().toISOString() });
        versionsRef.current = existing;
        await cloudSave(STORAGE_KEY + "-versions-index", existing);
      }
      savedSnapshotRef.current = JSON.stringify(current);
      setDirty(false);
      setLastSavedTo(target);
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveToNewVersion(name: string): Promise<boolean> {
    return saveToTarget(name);
  }

  // --- Discard unsaved changes (reload from cloud) ---
  async function discardChanges() {
    const cloud = await cloudLoad(STORAGE_KEY);
    const result = (cloud as OrgData) ?? cloneDefault();
    setDataRaw(result);
    dataRef.current = result;
    savedSnapshotRef.current = JSON.stringify(result);
    setDirty(false);
    setLastSavedTo(null);
  }

  // --- Load a version into the editor (local only, not saved anywhere) ---
  async function loadVersionForEditing(name: string) {
    const cloud = await cloudLoad(STORAGE_KEY + "-ver-" + name);
    if (cloud) {
      const parsed = cloud as OrgData;
      setDataRaw(parsed);
      dataRef.current = parsed;
      savedSnapshotRef.current = JSON.stringify(parsed);
      setDirty(false);
      setLastSavedTo(name);
    }
  }

  function resetAll() {
    const fresh = cloneDefault();
    setDataRaw(fresh);
    dataRef.current = fresh;
    cloudSave(STORAGE_KEY, fresh);
    savedSnapshotRef.current = JSON.stringify(fresh);
    setDirty(false);
  }

  function addView(label: string) {
    const id = newId("view");
    setData((prev) => ({
      ...prev,
      views: [...prev.views, { id, label, icon: iconForIndex(prev.views.length), roots: [] }],
    }));
    return id;
  }
  function renameView(viewId: string, label: string) {
    setData((prev) => ({ ...prev, views: prev.views.map((v) => (v.id === viewId ? { ...v, label } : v)) }));
  }
  function deleteView(viewId: string): ViewDef | undefined {
    let deleted: ViewDef | undefined;
    setDataRaw((prev) => {
      if (!prev) return prev;
      deleted = prev.views.find((v) => v.id === viewId);
      const next = { ...prev, views: prev.views.filter((v) => v.id !== viewId) };
      dataRef.current = next;
      return next;
    });
    setDirty(true);
    return deleted;
  }
  function restoreView(view: ViewDef, index: number) {
    setData((prev) => {
      const copy = [...prev.views];
      copy.splice(index, 0, view);
      return { ...prev, views: copy };
    });
  }
  function moveView(viewId: string, direction: -1 | 1) {
    setData((prev) => ({ ...prev, views: reorderList(prev.views, viewId, direction) }));
  }

  function addNode(viewId: string, parentId: string | null, seed?: Partial<OrgNode>) {
    const nodeId = newId("node");
    const baseSeed = { ...seed };
    let returnNode: OrgNode | null = null;
    setData((prev) => {
      const reportsTo = baseSeed.reportsTo || (parentId ? getParentTitle(prev.views, viewId, parentId) : "");
      const node: OrgNode = {
        id: nodeId,
        title: baseSeed.title ?? "New role",
        subtitle: baseSeed.subtitle ?? "",
        description: baseSeed.description ?? "",
        reportsTo,
        color: baseSeed.color ?? "#990011",
        children: [],
      };
      returnNode = node;
      return {
        ...prev,
        views: mapRoots(prev.views, viewId, (roots) =>
          parentId === null ? [...roots, node] : roots.map((r) => insertChild(r, parentId, node))
        ),
      };
    });
    return returnNode!;
  }

  function wrapWithParent(viewId: string, nodeId: string, seed?: Partial<OrgNode>) {
    const parentId = newId("node");
    const parent: OrgNode = {
      id: parentId,
      title: seed?.title ?? "New role",
      subtitle: seed?.subtitle ?? "",
      description: seed?.description ?? "",
      reportsTo: seed?.reportsTo ?? "",
      color: seed?.color ?? "#990011",
      children: [],
    };
    setData((prev) => ({
      ...prev,
      views: mapRoots(prev.views, viewId, (roots) => {
        const rootIdx = roots.findIndex((r) => r.id === nodeId);
        if (rootIdx >= 0) {
          const target = { ...roots[rootIdx], reportsTo: parent.title };
          const newParent = { ...parent, reportsTo: roots[rootIdx].reportsTo, children: [target] };
          const copy = [...roots];
          copy[rootIdx] = newParent;
          return copy;
        }
        return roots.map((r) => wrapDeep(r, nodeId, parent));
      }),
    }));
    return parent;
  }

  function addNodeAfter(viewId: string, afterNodeId: string, seed?: Partial<OrgNode>) {
    const nodeId = newId("node");
    let returnNode: OrgNode | null = null;
    setData((prev) => {
      const reportsTo = seed?.reportsTo || findSiblingParentTitle(prev.views, viewId, afterNodeId);
      const node: OrgNode = {
        id: nodeId,
        title: seed?.title ?? "New role",
        subtitle: seed?.subtitle ?? "",
        description: seed?.description ?? "",
        reportsTo,
        color: seed?.color ?? "#990011",
        children: [],
      };
      returnNode = node;
      return {
        ...prev,
        views: mapRoots(prev.views, viewId, (roots) => {
          const afterRoot = insertAfterInList(roots, afterNodeId, node);
          if (afterRoot.length !== roots.length) return afterRoot;
          return roots.map((r) => insertAfterDeep(r, afterNodeId, node));
        }),
      };
    });
    return returnNode!;
  }

  function updateNode(viewId: string, nodeId: string, patch: Partial<OrgNode>) {
    setData((prev) => ({
      ...prev,
      views: mapRoots(prev.views, viewId, (roots) => roots.map((r) => patchNode(r, nodeId, patch))),
    }));
  }

  function deleteNode(viewId: string, nodeId: string): { node: OrgNode; parentId: string | null; index: number } | null {
    let info: { node: OrgNode; parentId: string | null; index: number } | null = null;
    setDataRaw((prev) => {
      if (!prev) return prev;
      const view = prev.views.find((v) => v.id === viewId);
      if (!view) return prev;
      const found = findNodeWithParent(view.roots, nodeId);
      if (found) {
        info = { node: JSON.parse(JSON.stringify(found.node)), parentId: found.parent?.id ?? null, index: found.index };
      }
      const next = {
        ...prev,
        views: mapRoots(prev.views, viewId, (roots) => removeNode(roots, nodeId)),
      };
      dataRef.current = next;
      return next;
    });
    setDirty(true);
    return info;
  }

  function deleteNodeOnly(viewId: string, nodeId: string): { node: OrgNode; parentId: string | null; index: number } | null {
    let info: { node: OrgNode; parentId: string | null; index: number } | null = null;
    setDataRaw((prev) => {
      if (!prev) return prev;
      const view = prev.views.find((v) => v.id === viewId);
      if (!view) return prev;
      const found = findNodeWithParent(view.roots, nodeId);
      if (found) {
        info = { node: JSON.parse(JSON.stringify(found.node)), parentId: found.parent?.id ?? null, index: found.index };
      }
      const next = {
        ...prev,
        views: mapRoots(prev.views, viewId, (roots) => removeNodePromoteChildren(roots, nodeId)),
      };
      dataRef.current = next;
      return next;
    });
    setDirty(true);
    return info;
  }

  function deleteNodeDisconnectChildren(viewId: string, nodeId: string): { node: OrgNode; parentId: string | null; index: number } | null {
    let info: { node: OrgNode; parentId: string | null; index: number } | null = null;
    setDataRaw((prev) => {
      if (!prev) return prev;
      const view = prev.views.find((v) => v.id === viewId);
      if (!view) return prev;
      const found = findNodeWithParent(view.roots, nodeId);
      if (!found) return prev;
      info = { node: JSON.parse(JSON.stringify(found.node)), parentId: found.parent?.id ?? null, index: found.index };
      const orphans = found.node.children.map((c) => {
        const clone = JSON.parse(JSON.stringify(c)) as OrgNode;
        clone.reportsTo = "";
        return clone;
      });
      const withoutNode = removeNode(view.roots, nodeId);
      const next = {
        ...prev,
        views: prev.views.map((v) =>
          v.id === viewId ? { ...v, roots: [...withoutNode, ...orphans] } : v
        ),
      };
      dataRef.current = next;
      return next;
    });
    setDirty(true);
    return info;
  }

  function restoreNode(viewId: string, parentId: string | null, node: OrgNode, index: number) {
    setData((prev) => ({
      ...prev,
      views: mapRoots(prev.views, viewId, (roots) => restoreNodeAt(roots, parentId, node, index)),
    }));
  }

  function reparentNode(viewId: string, nodeId: string, newParentId: string | null) {
    setData((prev) => {
      const view = prev.views.find((v) => v.id === viewId);
      if (!view) return prev;
      const found = findNodeWithParent(view.roots, nodeId);
      if (!found) return prev;
      if (newParentId === nodeId) return prev;
      const movingNode = JSON.parse(JSON.stringify(found.node)) as OrgNode;
      const isDescendant = (node: OrgNode, targetId: string): boolean => {
        if (node.id === targetId) return true;
        return node.children.some((c) => isDescendant(c, targetId));
      };
      if (newParentId && isDescendant(movingNode, newParentId)) return prev;
      const withoutNode = removeNode(view.roots, nodeId);
      let newRoots: OrgNode[];
      if (newParentId === null) {
        movingNode.reportsTo = "";
        newRoots = [...withoutNode, movingNode];
      } else {
        const newParent = findNodeById(view.roots, newParentId);
        if (newParent) movingNode.reportsTo = newParent.title;
        newRoots = withoutNode.map((r) => insertChild(r, newParentId, movingNode));
      }
      return {
        ...prev,
        views: prev.views.map((v) => (v.id === viewId ? { ...v, roots: newRoots } : v)),
      };
    });
  }

  function moveNode(viewId: string, parentId: string | null, nodeId: string, direction: -1 | 1) {
    setData((prev) => ({
      ...prev,
      views: mapRoots(prev.views, viewId, (roots) =>
        parentId === null
          ? reorderList(roots, nodeId, direction)
          : roots.map((r) => reorderChild(r, parentId, nodeId, direction))
      ),
    }));
  }

  function insertLayerBelow(viewId: string, parentNodeId: string, seed?: Partial<OrgNode>): OrgNode {
    const layerId = newId("node");
    const baseSeed = { ...seed };
    let returnLayer: OrgNode | null = null;
    setData((prev) => {
      const reportsTo = baseSeed.reportsTo || getParentTitle(prev.views, viewId, parentNodeId);
      const layer: OrgNode = {
        id: layerId,
        title: baseSeed.title ?? "New role",
        subtitle: baseSeed.subtitle ?? "",
        description: baseSeed.description ?? "",
        reportsTo,
        color: baseSeed.color ?? "#990011",
        children: [],
      };
      returnLayer = layer;
      return {
        ...prev,
        views: mapRoots(prev.views, viewId, (roots) =>
          roots.map((r) => {
            if (r.id === parentNodeId) {
              const updatedChildren = r.children.map((c) => ({ ...c, reportsTo: layer.title }));
              return { ...r, children: [{ ...layer, children: updatedChildren }] };
            }
            return {
              ...r,
              children: r.children.map(function deep(n: OrgNode): OrgNode {
                if (n.id === parentNodeId) {
                  const updatedChildren = n.children.map((c) => ({ ...c, reportsTo: layer.title }));
                  return { ...n, children: [{ ...layer, children: updatedChildren }] };
                }
                return { ...n, children: n.children.map(deep) };
              }),
            };
          })
        ),
      };
    });
    return returnLayer!;
  }

  // ---- Versions ----
  const versionsRef = useRef<{ name: string; date: string }[]>([]);

  useEffect(() => {
    async function loadIndex() {
      const cloud = await cloudLoad(STORAGE_KEY + "-versions-index");
      if (cloud && Array.isArray(cloud)) {
        versionsRef.current = cloud as { name: string; date: string }[];
      }
    }
    if (hydrated) loadIndex();
  }, [hydrated]);

  async function getVersionData(name: string): Promise<OrgData | null> {
    const cloud = await cloudLoad(STORAGE_KEY + "-ver-" + name);
    return cloud ? (cloud as OrgData) : null;
  }

  function getVersions(): { name: string; date: string }[] {
    return versionsRef.current;
  }

  async function duplicateVersion(sourceName: string, newName: string) {
    const sourceData = await cloudLoad(STORAGE_KEY + "-ver-" + sourceName);
    if (!sourceData) return;
    const existing = versionsRef.current.filter((v) => v.name !== newName);
    existing.unshift({ name: newName, date: new Date().toISOString() });
    versionsRef.current = existing;
    await cloudSave(STORAGE_KEY + "-ver-" + newName, sourceData);
    await cloudSave(STORAGE_KEY + "-versions-index", existing);
  }

  async function deleteVersion(name: string) {
    const filtered = versionsRef.current.filter((v) => v.name !== name);
    versionsRef.current = filtered;
    await cloudDelete(STORAGE_KEY + "-ver-" + name);
    await cloudSave(STORAGE_KEY + "-versions-index", filtered);
  }

  function addNodeAt(viewId: string, parentId: string, index: number, seed?: Partial<OrgNode>) {
    const nodeId = newId("node");
    const baseSeed = { ...seed };
    let returnNode: OrgNode | null = null;
    setData((prev) => {
      const reportsTo = baseSeed.reportsTo || getParentTitle(prev.views, viewId, parentId);
      const node: OrgNode = {
        id: nodeId,
        title: baseSeed.title ?? "New role",
        subtitle: baseSeed.subtitle ?? "",
        description: baseSeed.description ?? "",
        reportsTo,
        color: baseSeed.color ?? "#990011",
        children: [],
      };
      returnNode = node;
      return {
        ...prev,
        views: mapRoots(prev.views, viewId, (roots) =>
          roots.map(function deep(n: OrgNode): OrgNode {
            if (n.id === parentId) {
              const copy = [...n.children];
              copy.splice(index, 0, node);
              return { ...n, children: copy };
            }
            return { ...n, children: n.children.map(deep) };
          })
        ),
      };
    });
    return returnNode!;
  }

  function pasteNodes(viewId: string, nodes: OrgNode[]) {
    function reId(node: OrgNode): OrgNode {
      return {
        ...node,
        id: newId("node"),
        children: node.children.map(reId),
      };
    }
    const fresh = nodes.map(reId);
    setData((prev) => ({
      ...prev,
      views: mapRoots(prev.views, viewId, (roots) => [...roots, ...fresh]),
    }));
  }

  async function refreshFromCloud() {
    const cloud = await cloudLoad(STORAGE_KEY);
    if (cloud) {
      const loaded = cloud as OrgData;
      setDataRaw(loaded);
      dataRef.current = loaded;
      savedSnapshotRef.current = JSON.stringify(loaded);
      setDirty(false);
    }
  }

  function replaceRoots(viewId: string, newRoots: OrgNode[]) {
    setData((prev) => ({
      ...prev,
      views: prev.views.map((v) => (v.id === viewId ? { ...v, roots: newRoots } : v)),
    }));
  }

  return {
    data,
    hydrated,
    dirty,
    saving,
    lastSavedTo,
    saveToTarget,
    saveToNewVersion,
    discardChanges,
    loadVersionForEditing,
    resetAll,
    addView,
    renameView,
    deleteView,
    restoreView,
    moveView,
    addNode,
    addNodeAfter,
    wrapWithParent,
    updateNode,
    deleteNode,
    deleteNodeOnly,
    deleteNodeDisconnectChildren,
    restoreNode,
    moveNode,
    reparentNode,
    insertLayerBelow,
    getVersions,
    duplicateVersion,
    deleteVersion,
    getVersionData,
    addNodeAt,
    pasteNodes,
    replaceRoots,
    refreshFromCloud,
  };
}

export type OrgStore = ReturnType<typeof useOrgStore>;
