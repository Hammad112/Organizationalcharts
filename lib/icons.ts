import {
  Network,
  Cpu,
  Shield,
  Database,
  Users,
  Building2,
  Briefcase,
  Globe,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  network: Network,
  cpu: Cpu,
  shield: Shield,
  database: Database,
  users: Users,
  building: Building2,
  briefcase: Briefcase,
  globe: Globe,
};

// New tabs cycle through this order so each one gets a distinct icon
// without asking the user to pick one.
export const ICON_CYCLE = [
  "users",
  "building",
  "briefcase",
  "globe",
  "network",
  "cpu",
  "shield",
  "database",
];

export function iconForIndex(index: number) {
  return ICON_CYCLE[index % ICON_CYCLE.length];
}
