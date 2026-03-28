export type MenuKey = "dashboard" | "hardware" | "software" | "usage" | "register" | "user-register" | "settings";

export type SettingsMenuKey = "members" | "org-members" | "audit" | "asset-policy" | "security";

export type AssetType = "hardware" | "software";

export type Role = "User" | "Viewer" | "Manager" | "Admin";

export type Asset = {
  dbId?: string;
  id: string;
  name: string;
  softwareName?: string;
  type: AssetType;
  category: string;
  status: string;
  unitPrice?: number;
  acquiredAt?: string;
  createdAt?: string;
  expiresAt?: string;
  totalQuantity?: number;
  quantity?: number;
  os?: string;
  vendor?: string;
  pcName?: string;
  assignee?: string;
  department?: string;
  macAddress?: string;
  ipAddress?: string;
  note?: string;
};

export type AssetDraft = {
  name: string;
  softwareName?: string;
  category: string;
  status: string;
  unitPrice: number;
  acquiredAt?: string;
  createdAt?: string;
  expiresAt?: string;
  totalQuantity?: number;
  availableQuantity?: number;
  quantity: number;
  os?: string;
  vendor?: string;
  pcName?: string;
  assignee?: string;
  department?: string;
  macAddress?: string;
  ipAddress?: string;
  note?: string;
};

export type ImportedAssetRow = {
  importKind?: "asset" | "assignment";
  assetCode?: string;
  name: string;
  softwareName?: string;
  type: AssetType;
  category: string;
  status?: string;
  unitPrice?: number;
  acquiredAt?: string;
  createdAt?: string;
  expiresAt?: string;
  totalQuantity?: number;
  availableQuantity?: number;
  quantity?: number;
  os?: string;
  vendor?: string;
  pcName?: string;
  assignee?: string;
  department?: string;
  macAddress?: string;
  ipAddress?: string;
  note?: string;
};

export type SoftwareAssignment = {
  id: string;
  softwareAssetCode: string;
  softwareName: string;
  category: string;
  userName: string;
  department: string;
  assignedSeats: number;
  totalSeats?: number;
  availableSeats?: number;
  assignedAt: string;
  expiresAt?: string;
};

export type HardwareAssignment = {
  id: string;
  assetCode: string;
  category: string;
  userName: string;
  department: string;
  assignedAt: string;
  pcName?: string;
  os?: string;
  macAddress?: string;
  ipAddress?: string;
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
  lastLoginIp?: string;
};

export type OrgMember = {
  id: string | number;
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
  assetType: string;
  user: string;
  department: string;
  category: string;
  pcName: string;
  registeredAt: string;
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
  hardwareCategoryPrefixes: Record<string, string>;
  softwareCategoryPrefixes: Record<string, string>;
  sequenceDigits: number;
};
