export type OrgNode = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  reportsTo?: string;
  color: string;
  children: OrgNode[];
  empCode?: string;
  designation?: string;
  department?: string;
  location?: string;
  dateOfJoining?: string;
  linksTo?: string;
  jobDescription?: string;
  requiredSkills?: string[];
  functions?: { label: string; icon: string; color: string }[];
};

export type ViewDef = {
  id: string;
  label: string;
  icon: string;
  roots: OrgNode[];
  auto?: boolean;
};

export type OrgData = {
  views: ViewDef[];
};
