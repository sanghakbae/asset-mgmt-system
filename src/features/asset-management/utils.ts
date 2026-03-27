import type { Asset, AssetPolicySettings, AssetType, MenuKey, Role, SettingsMenuKey } from "./types";

export function statusBadge(status: string) {
  const styles: Record<string, string> = {
    사용중: "bg-emerald-50 text-emerald-700 border-emerald-200",
    사용가능: "bg-slate-100 text-slate-700 border-slate-200",
    활성: "bg-blue-50 text-blue-700 border-blue-200",
    할당됨: "bg-violet-50 text-violet-700 border-violet-200",
    대기중: "bg-amber-50 text-amber-700 border-amber-200",
    할당중: "bg-sky-50 text-sky-700 border-sky-200",
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
  if (role === "Manager") return ["dashboard", "hardware", "software", "usage", "register", "user-register", "settings"].includes(menu);
  if (role === "Viewer") return ["dashboard", "hardware", "software", "usage"].includes(menu);
  return ["hardware", "software"].includes(menu);
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
  if (menu === "hardware") return "하드웨어 자산";
  if (menu === "software") return "소프트웨어 자산";
  if (menu === "usage") return "자산 사용 현황";
  if (menu === "register") return "자산 등록";
  if (menu === "user-register") return "자산 사용자 관리";
  if (menu === "settings" && settingsMenu === "members") return "회원 관리";
  if (menu === "settings" && settingsMenu === "org-members") return "구성원 관리";
  if (menu === "settings" && settingsMenu === "audit") return "감사 로그";
  if (menu === "settings" && settingsMenu === "asset-policy") return "자산 설정";
  if (menu === "settings" && settingsMenu === "theme") return "테마 설정";
  return "보안 관리";
}

export function getPageDescription(menu: MenuKey, settingsMenu: SettingsMenuKey) {
  if (menu === "dashboard") return "전체 자산 상태를 확인합니다.";
  if (menu === "hardware") return "노트북, 서버, 네트워크 장비 등을 관리합니다.";
  if (menu === "software") return "소프트웨어 및 라이선스를 관리합니다.";
  if (menu === "usage") return "자산별 사용 여부, 사용자, 부서, 최근 사용 정보를 확인합니다.";
  if (menu === "register") return "하드웨어 및 소프트웨어 자산을 등록하고 목록을 관리합니다.";
  if (menu === "user-register") return "자산을 지급할 사용자를 등록하고 기존 지급 자산을 회수합니다.";
  if (menu === "settings" && settingsMenu === "members") return "회원 목록을 조회하고 권한을 변경합니다.";
  if (menu === "settings" && settingsMenu === "org-members") return "사내 구성원 목록을 조회하고 엑셀로 가져오거나 내보낼 수 있습니다.";
  if (menu === "settings" && settingsMenu === "audit") return "접속 로그를 포함한 모든 감사 로그를 조회합니다.";
  if (menu === "settings" && settingsMenu === "asset-policy") return "하드웨어/소프트웨어 카테고리와 ID 형식을 관리합니다.";
  if (menu === "settings" && settingsMenu === "theme") return "앱 배경 테마를 빠르게 바꿀 수 있습니다.";
  return "가입 도메인과 세션 타임아웃 정책을 관리합니다.";
}

export function getSearchPlaceholder(menu: MenuKey, settingsMenu: SettingsMenuKey) {
  if (menu === "settings" && settingsMenu === "members") return "이름, 이메일, 부서 검색";
  if (menu === "settings" && settingsMenu === "org-members") return "이름, 분류, 셀, 유닛, 파트, 위치 검색";
  if (menu === "settings" && settingsMenu === "audit") return "유형, 사용자, 행위, 대상 검색";
  if (menu === "settings" && settingsMenu === "theme") return "";
  if (menu === "usage") return "자산명, 사용자, 부서, 상태 검색";
  if (menu === "user-register") return "";
  return "자산명, ID, 카테고리 검색";
}

export function getNextAssetId(assets: readonly Asset[], assetType: AssetType, policy: AssetPolicySettings) {
  const prefix = assetType === "hardware" ? policy.hardwarePrefix : policy.softwarePrefix;
  const maxSequence = assets
    .filter((asset) => asset.type === assetType)
    .map((asset) => Number.parseInt(asset.id.replace(`${prefix}-`, ""), 10))
    .filter((value) => Number.isFinite(value))
    .reduce((max, current) => Math.max(max, current), 0);

  return `${prefix}-${String(maxSequence + 1).padStart(policy.sequenceDigits, "0")}`;
}
