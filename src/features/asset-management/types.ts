export type MenuKey = "dashboard" | "hardware" | "software" | "usage" | "register" | "user-register" | "settings";

export type SettingsMenuKey = "members" | "org-members" | "audit" | "asset-policy" | "security" | "theme";

export type AssetType = "hardware" | "software";

export type Role = "User" | "Viewer" | "Manager" | "Admin";

export type Asset = {
  id: string;
  name: string;
  type: AssetType;
  category: string;
  status: string;
  unitPrice?: number;
  quantity?: number;
};

export type AssetDraft = {
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
};

export type ImportedAssetRow = {
  name: string;
  type: AssetType;
  category: string;
  status?: string;
  unitPrice?: number;
  quantity?: number;
};

export type AssetUser = {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  assetId?: string;
  assetName?: string;
  assignedQuantity?: number;
  createdAt: string;
};

export type Member = {
  id: number;
  name: string;
  email: string;
  department: string;
  role: Role;
  joinedAt: string;
  lastLoginAt: string;
};

export type OrgMember = {
  id: number;
  name: string;
  position: string;
  category: string;
  cell: string;
  unit: string;
  part: string;
  location: string;
};

export type ImportedOrgMemberRow = {
  name: string;
  position: string;
  category: string;
  cell: string;
  unit: string;
  part: string;
  location: string;
};

export type AuditLog = {
  id: number;
  type: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
  createdAt: string;
};

export type UsageItem = {
  id: string;
  name: string;
  type: string;
  assignee: string;
  department: string;
  usageStatus: string;
  createdAt: string;
};

export type UserProfile = {
  name: string;
  email: string;
  department: string;
  role: Role;
};

export type AssetPolicySettings = {
  hardwareCategories: string[];
  softwareCategories: string[];
  hardwarePrefix: string;
  softwarePrefix: string;
  sequenceDigits: number;
};

export type ThemeKey =
  | "slate"
  | "graphite"
  | "steel"
  | "ocean"
  | "forest"
  | "plum"
  | "charcoal"
  | "indigo"
  | "sand"
  | "mint";

export type AppThemePreset = {
  key: ThemeKey;
  label: string;
  appBackground: string;
  sidebarBackground: string;
  navBackground: string;
  settingPanelBackground: string;
  headerBackground: string;
  headerText: string;
  headerSubtext: string;
  sectionHeaderBackground: string;
  sectionHeaderText: string;
  sectionHeaderSubtext: string;
  settingsCardBackground: string;
};
