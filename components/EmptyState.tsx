import { Plus } from "lucide-react";
import { ICONS, ICON_CYCLE } from "@/lib/icons";

export function EmptyState({ icon, onAddRole }: { icon: string; onAddRole: () => void }) {
  const Icon = ICONS[icon] ?? ICONS[ICON_CYCLE[0]];
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-brand-ink/15 py-14 text-center dark:border-brand-cream/15">
      <Icon size={26} />
      <p className="max-w-xs text-sm text-brand-slate">No structure defined yet for this view.</p>
      <button
        onClick={onAddRole}
        className="mt-1 flex items-center gap-1.5 rounded-md bg-brand-red px-3.5 py-2 text-sm text-brand-cream transition hover:bg-brand-maroon"
      >
        <Plus size={14} aria-hidden="true" />
        Add a role
      </button>
    </div>
  );
}
