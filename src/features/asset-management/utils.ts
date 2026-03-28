import type { Asset, AssetPolicySettings, AssetType, MenuKey, Role, SettingsMenuKey } from "./types";

export function statusBadge(status: string) {
  const styles: Record<string, string> = {
    사용: "bg-emerald-50 text-emerald-700 border-emerald-200",
    운영: "bg-emerald-50 text-emerald-700 border-emerald-200",
    유휴: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return styles[status] || "bg-slate-100 text-slate-700 border-slate-200";
}

export function roleBadge(role: Role) {
  const styles: Record<Role, string> = {
    Admin: "bg-slate-900 text-white border-slate-900",
    Manager: "bg-blue-50 text-blue-700 border-blue-200",
    Viewer: "bg-amber-50 text-amber-700 border-amber-200",
    User: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return styles[role];
}

export function canViewMenu(role: Role, menu: MenuKey) {
  if (role === "Admin") return true;
  if (role === "Manager") return ["dashboard", "usage", "register", "user-register", "settings"].includes(menu);
  if (role === "Viewer") return ["dashboard", "usage"].includes(menu);
  return ["dashboard"].includes(menu);
}

export function canOpenSettings(role: Role) {
  return role === "Admin" || role === "Manager";
}

export function canAccessSettingsMenu(role: Role, settingsMenu: SettingsMenuKey) {
  if (role === "Admin") return true;
  if (role === "Manager") return settingsMenu !== "members";
  return false;
}

export function canManageAssets(role: Role) {
  return role === "Admin" || role === "Manager";
}

export function canManageAccounts(role: Role) {
  return role === "Admin";
}

export function getPageTitle(menu: MenuKey, settingsMenu: SettingsMenuKey) {
  if (menu === "dashboard") return "자산 현황";
  if (menu === "hardware") return "자산 현황";
  if (menu === "software") return "자산 현황";
  if (menu === "usage") return "자산 사용 현황";
  if (menu === "register") return "자산 등록";
  if (menu === "user-register") return "자산 할당";
  if (menu === "settings" && settingsMenu === "members") return "회원 관리";
  if (menu === "settings" && settingsMenu === "org-members") return "구성원 관리";
  if (menu === "settings" && settingsMenu === "audit") return "감사 로그";
  if (menu === "settings" && settingsMenu === "asset-policy") return "자산 설정";
  return "보안 관리";
}

export function getPageDescription(menu: MenuKey, settingsMenu: SettingsMenuKey) {
  if (menu === "dashboard") return "하드웨어와 소프트웨어 자산 현황을 함께 확인합니다.";
  if (menu === "hardware") return "하드웨어와 소프트웨어 자산 현황을 함께 확인합니다.";
  if (menu === "software") return "하드웨어와 소프트웨어 자산 현황을 함께 확인합니다.";
  if (menu === "usage") return "자산별 사용 여부, 사용자, 부서, 최근 사용 정보를 확인합니다.";
  if (menu === "register") return "하드웨어 및 소프트웨어 자산을 등록하고 목록을 관리합니다.";
  if (menu === "user-register") return "등록된 자산을 사용자에게 할당하고 기존 할당 자산을 회수합니다.";
  if (menu === "settings" && settingsMenu === "members") return "회원 목록을 조회하고 권한을 변경합니다.";
  if (menu === "settings" && settingsMenu === "org-members") return "사내 구성원 목록을 조회하고 엑셀로 가져오거나 내보낼 수 있습니다.";
  if (menu === "settings" && settingsMenu === "audit") return "접속 로그를 포함한 모든 감사 로그를 조회합니다.";
  if (menu === "settings" && settingsMenu === "asset-policy") return "하드웨어/소프트웨어 카테고리와 ID 형식을 관리합니다.";
  return "가입 도메인과 세션 타임아웃 정책을 관리합니다.";
}

export function getSearchPlaceholder(menu: MenuKey, settingsMenu: SettingsMenuKey) {
  if (menu === "settings" && settingsMenu === "members") return "이름, 이메일, 부서 검색";
  if (menu === "settings" && settingsMenu === "org-members") return "이름, 분류, 셀, 유닛, 파트, 위치 검색";
  if (menu === "settings" && settingsMenu === "audit") return "유형, 사용자, 행위, 대상 검색";
  if (menu === "usage") return "자산명, 사용자, 부서, 상태 검색";
  if (menu === "user-register") return "";
  return "자산명, ID, 카테고리 검색";
}

export function getCategoryAssetPrefix(policy: AssetPolicySettings, assetType: AssetType, category?: string) {
  if (!category) return assetType === "hardware" ? policy.hardwarePrefix : policy.softwarePrefix;

  if (assetType === "hardware") {
    return policy.hardwareCategoryPrefixes[category] || policy.hardwarePrefix;
  }

  return policy.softwareCategoryPrefixes[category] || policy.softwarePrefix;
}

export function getAssetIdPrefix(assetId: string) {
  const separatorIndex = assetId.indexOf("-");
  if (separatorIndex <= 0) return "";
  return assetId.slice(0, separatorIndex);
}

export function getNextAssetId(assets: readonly Asset[], assetType: AssetType, policy: AssetPolicySettings, category?: string) {
  const prefix = getCategoryAssetPrefix(policy, assetType, category);
  const maxSequence = assets
    .filter((asset) => asset.type === assetType && asset.id.startsWith(`${prefix}-`))
    .map((asset) => Number.parseInt(asset.id.slice(prefix.length + 1), 10))
    .filter((value) => Number.isFinite(value))
    .reduce((max, current) => Math.max(max, current), 0);

  return `${prefix}-${String(maxSequence + 1).padStart(policy.sequenceDigits, "0")}`;
}

export function getDisplayedAssetUnitPrice(asset: Asset) {
  const basePrice = asset.unitPrice ?? 0;
  if (asset.type !== "hardware") return basePrice;
  if (!asset.acquiredAt) return basePrice;

  const acquiredAt = new Date(asset.acquiredAt);
  if (Number.isNaN(acquiredAt.getTime())) return basePrice;

  const now = new Date();
  const elapsedYears = Math.max(0, (now.getTime() - acquiredAt.getTime()) / (1000 * 60 * 60 * 24 * 365));
  const remainingRatio = Math.max(0, 1 - elapsedYears / 5);

  return Math.round(basePrice * remainingRatio);
}

export function hasHardwareDepreciationInputs(asset: Asset) {
  if (asset.type !== "hardware") return false;
  if (!asset.acquiredAt || (asset.unitPrice ?? 0) <= 0) return false;

  const acquiredAt = new Date(asset.acquiredAt);
  return !Number.isNaN(acquiredAt.getTime());
}

export function formatAssetDate(value?: string) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

export function toDateInputValue(value?: string) {
  if (!value) return "";
  return formatAssetDate(value) === "-" ? "" : formatAssetDate(value);
}

export function normalizeImportedText(value: unknown) {
  const text = String(value ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return text.trim();
}

export function maskMiddleCharacters(value?: string) {
  const text = String(value ?? "");
  if (!text || text === "-") return text || "-";

  const normalized = text.replace(/\n/g, " ").trim();
  if (normalized.length <= 1) return normalized;
  if (normalized.length === 2) return `${normalized[0]}*`;

  return `${normalized[0]}${"*".repeat(Math.max(1, normalized.length - 2))}${normalized[normalized.length - 1]}`;
}
