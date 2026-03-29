import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  AppWindow,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Laptop,
  LogOut,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Shield,
  UserCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { GoogleWorkspaceLicense, GoogleWorkspaceLicenseRun } from "@/services/google-workspace-licenses";
import { menuItems, settingMenus } from "./data";
import {
  canAccessSettingsMenu,
  canManageAccounts,
  canManageAssets,
  canOpenSettings,
  canViewMenu,
  formatAssetDate,
  getDisplayedAssetUnitPrice,
  getPageDescription,
  getPageTitle,
  getSearchPlaceholder,
  hasHardwareDepreciationInputs,
  roleBadge,
  statusBadge,
  toDateInputValue,
} from "./utils";
import type {
  Asset,
  AssetDraft,
  AssetPolicySettings,
  AssetType,
  AssetUser,
  AuditLog,
  HardwareAssignment,
  ImportedAssetRow,
  ImportedOrgMemberRow,
  Member,
  MenuKey,
  OrgMember,
  Role,
  SettingsMenuKey,
  SoftwareAssignment,
  UserProfile,
} from "./types";

const TABLE_PAGE_SIZE = 25;
const REGISTERED_ASSET_PAGE_SIZE = 10;

type LoginScreenProps = {
  onLogin: () => void;
  isLoading?: boolean;
  errorMessage?: string;
};

export function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm rounded-[10px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-slate-900 text-white">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">자산 관리 시스템</h1>
          </div>
        </div>
        <div className="rounded-[10px] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          로그인 상태를 확인하고 있습니다.
        </div>
      </div>
    </div>
  );
}

export function LoginScreen({ onLogin, isLoading = false, errorMessage = "" }: LoginScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm rounded-[10px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-slate-900 text-white">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">자산 관리 시스템</h1>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-slate-500">사내 Google 계정으로 로그인한 사용자만 접근할 수 있습니다.</p>
        </div>

        <div className="mt-4 rounded-[10px] border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          {isLoading ? "로그인 상태를 확인하고 있습니다." : "로그인 후 자산 관리 기능을 사용할 수 있습니다."}
        </div>

        {errorMessage && (
          <div className="mt-3 rounded-[10px] border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {errorMessage}
          </div>
        )}

        <Button
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-slate-900 bg-slate-900 text-sm text-white hover:bg-slate-800"
          onClick={onLogin}
          disabled={isLoading}
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.207 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.278 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917Z" />
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.278 4 24 4c-7.682 0-14.347 4.337-17.694 10.691Z" />
            <path fill="#4CAF50" d="M24 44c5.176 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.143 35.091 26.715 36 24 36c-5.186 0-9.625-3.329-11.283-7.946l-6.522 5.025C9.5 39.556 16.227 44 24 44Z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 0 1-4.084 5.571h.003l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917Z" />
          </svg>
          {isLoading ? "로그인 중..." : "Google로 로그인"}
        </Button>
      </div>
    </div>
  );
}

type SidebarProps = {
  menu: MenuKey;
  settingsMenu: SettingsMenuKey;
  isSidebarCollapsed: boolean;
  hardwareAssignedCount: number;
  softwareAssignedCount: number;
  orgMemberCount: number;
  sessionRemainingLabel: string;
  user: UserProfile;
  onToggleSidebar: () => void;
  onMenuSelect: (key: MenuKey) => void;
  onSettingsMenuSelect: (key: SettingsMenuKey) => void;
  onExtendSession: () => void;
  onLogout: () => void;
};

export function Sidebar({
  menu,
  settingsMenu,
  isSidebarCollapsed,
  hardwareAssignedCount,
  softwareAssignedCount,
  orgMemberCount,
  sessionRemainingLabel,
  user,
  onToggleSidebar,
  onMenuSelect,
  onSettingsMenuSelect,
  onExtendSession,
  onLogout,
}: SidebarProps) {
  const visibleMenuItems = menuItems.filter((item) => {
    if (item.key === "settings") return canOpenSettings(user.role);
    if (item.key === "register" || item.key === "user-register") return canManageAssets(user.role);
    return canViewMenu(user.role, item.key);
  });

  const visibleSettingMenus = settingMenus.filter((item) => canAccessSettingsMenu(user.role, item.key));

  return (
    <>
      <aside className="hidden w-full flex-col border-b border-slate-200 bg-[#eef2f7] shadow-[inset_0_-1px_0_rgba(148,163,184,0.18)] transition-all duration-200 lg:flex lg:min-h-screen lg:border-b-0 lg:border-r lg:shadow-[inset_-1px_0_0_rgba(148,163,184,0.18)]">
        <div className="border-b border-slate-200 bg-white/70 p-4 backdrop-blur">
          {isSidebarCollapsed ? (
            <div className="flex justify-center">
              <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-[10px]" onClick={onToggleSidebar}>
                <PanelLeftOpen className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-slate-900 text-white">
                  <Shield className="h-5 w-5" />
                </div>
                <h1 className="text-lg font-semibold">자산 관리 시스템</h1>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-[10px]" onClick={onToggleSidebar}>
                <PanelLeftClose className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        <nav className="w-full p-3">
          <div className="space-y-2">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const active = menu === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => onMenuSelect(item.key)}
                  className={`flex w-full items-center rounded-[10px] py-3 text-sm transition ${
                    isSidebarCollapsed ? "justify-center px-0" : "justify-between px-4"
                  } ${active ? "bg-white text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.12)] ring-1 ring-slate-200" : "text-slate-600 hover:bg-white/80 hover:shadow-[0_8px_18px_rgba(15,23,42,0.08)]"}`}
                  title={item.label}
                >
                  <span className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"}`}>
                    <Icon className="h-4 w-4" />
                    {!isSidebarCollapsed && item.label}
                  </span>
                  {!isSidebarCollapsed && <ChevronRight className="h-4 w-4 opacity-60" />}
                </button>
              );
            })}
          </div>

          {menu === "settings" && visibleSettingMenus.length > 0 && (
            <div className={`mt-6 rounded-[14px] border border-slate-200 bg-white/75 shadow-[0_14px_30px_rgba(15,23,42,0.08)] backdrop-blur ${isSidebarCollapsed ? "p-1.5" : "p-2"}`}>
              {!isSidebarCollapsed && <p className="px-2 py-2 text-xs font-medium text-slate-500">설정 메뉴</p>}
              <div className="space-y-1">
                {visibleSettingMenus.map((item) => {
                  const Icon = item.icon;
                  const active = settingsMenu === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() => onSettingsMenuSelect(item.key)}
                      className={`flex w-full items-center rounded-[10px] text-sm transition ${
                        isSidebarCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"
                      } ${active ? "bg-slate-800 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
                      title={item.label}
                    >
                      <Icon className="h-4 w-4" />
                      {!isSidebarCollapsed && item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {!isSidebarCollapsed && (
          <div className="mt-auto space-y-4 p-4">
            <Card className="rounded-[14px] border border-slate-200 bg-white/80 shadow-[0_16px_34px_rgba(15,23,42,0.08)] backdrop-blur">
              <CardContent className="space-y-3 p-5">
                <SidebarMetric label="하드웨어 할당" value={hardwareAssignedCount} />
                <SidebarMetric label="소프트웨어 할당" value={softwareAssignedCount} />
                <SidebarMetric label="구성원 수" value={orgMemberCount} />
              </CardContent>
            </Card>

            <Card className="rounded-[14px] border border-slate-200 bg-white/80 shadow-[0_16px_34px_rgba(15,23,42,0.08)] backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-slate-100 text-slate-700">
                    <UserCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">{user.department}</p>
                    <p className="mt-1 text-xs text-slate-500">세션 남은 시간 {sessionRemainingLabel}</p>
                    <Button variant="outline" className="mt-2 h-6 rounded-[8px] px-2 py-0 text-[10px]" onClick={onExtendSession}>
                      연장
                    </Button>
                  </div>
                </div>
                <Button variant="outline" className="mt-4 w-full rounded-[10px]" onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> 로그아웃
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </aside>

      {menu === "settings" && visibleSettingMenus.length > 0 && (
        <div className="fixed inset-x-3 bottom-[88px] z-40 lg:hidden">
          <div className="rounded-[18px] border border-slate-200 bg-white/95 p-2 shadow-[0_18px_40px_rgba(18,24,40,0.12)] backdrop-blur">
            <div className="grid grid-cols-5 gap-1">
              {visibleSettingMenus.map((item) => {
                const Icon = item.icon;
                const active = settingsMenu === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onSettingsMenuSelect(item.key)}
                    className={`flex h-12 items-center justify-center rounded-[14px] transition ${active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                    title={item.label}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-6 gap-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const active = menu === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onMenuSelect(item.key)}
                className={`flex h-14 items-center justify-center rounded-[16px] transition ${active ? "bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]" : "text-slate-500 hover:bg-slate-100"}`}
                title={item.label}
              >
                <Icon className="h-6 w-6" />
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function SidebarMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

type PageHeaderProps = {
  menu: MenuKey;
  settingsMenu: SettingsMenuKey;
  search: string;
  onSearchChange: (value: string) => void;
  onCreateAsset: () => void;
  currentUserRole: Role;
};

export function PageHeader({ menu, settingsMenu, search, onSearchChange, onCreateAsset, currentUserRole }: PageHeaderProps) {
  const showSearch =
    menu === "dashboard" || menu === "hardware" || menu === "usage" || (menu === "settings" && settingsMenu !== "security");
  const isUsagePage = menu === "usage";

  return (
    <div className="w-full rounded-[14px] border border-slate-700 bg-slate-800 px-3 py-3 sm:px-4 shadow-[0_12px_28px_rgba(15,23,42,0.2)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">{getPageTitle(menu, settingsMenu)}</h2>
          <p className="mt-1 text-sm text-slate-200">{getPageDescription(menu, settingsMenu)}</p>
        </div>

        {showSearch && (
          <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-end lg:w-auto">
            <div className={`relative w-full sm:flex-1 lg:w-auto ${isUsagePage ? "sm:min-w-[320px] lg:min-w-[420px]" : "sm:min-w-[224px] lg:min-w-[224px]"}`}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                className={`h-10 rounded-[10px] border-white/20 bg-white pl-10 ${isUsagePage ? "text-xs" : "text-sm"}`}
                placeholder={getSearchPlaceholder(menu, settingsMenu)}
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </div>
            {menu === "hardware" && canManageAssets(currentUserRole) && (
              <Button className="h-9 rounded-[10px] px-4" onClick={onCreateAsset}>
                <Plus className="mr-2 h-4 w-4" /> 자산 추가
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function UserRegistrationForm({
  onRegister,
  assets,
  hardwareAssignments,
  softwareAssignments,
  orgMembers,
  policySettings,
  onImportExcel,
  onExportExcel,
}: {
  onRegister: (user: {
    name: string;
    department: string;
    assetId: string;
  }) => void;
  assets: Asset[];
  hardwareAssignments: HardwareAssignment[];
  softwareAssignments: SoftwareAssignment[];
  orgMembers: OrgMember[];
  policySettings: AssetPolicySettings;
  onImportExcel: (rows: ImportedAssetRow[]) => Promise<void>;
  onExportExcel: () => void;
}) {
  const normalizedHardwareCategoryOptions =
    policySettings.hardwareCategories.length > 0 ? policySettings.hardwareCategories : ["모니터", "랩탑", "데스크탑"];
  const monitorVendorOptions = ["LG", "벤큐", "Dell", "Apple"] as const;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    department: "",
    assetType: "hardware" as AssetType,
    hardwareCategory: normalizedHardwareCategoryOptions[0],
    hardwareVendor: "",
    assetId: "",
  });
  const resolveDepartmentByName = (name: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) return "";

    const orgMember = orgMembers.find((member) => member.name.trim() === normalizedName);
    if (orgMember?.unit?.trim()) return orgMember.unit.trim();
    return "";
  };
  const isMonitorCategory = form.assetType === "hardware" && form.hardwareCategory === "모니터";

  const selectableAssets = assets.filter((asset) =>
    form.assetType === "hardware"
      ? asset.type === "hardware" &&
        asset.category === form.hardwareCategory &&
        (asset.quantity ?? 0) > 0 &&
        (!isMonitorCategory || !form.hardwareVendor || asset.vendor === form.hardwareVendor)
      : asset.type === "software" && (asset.quantity ?? 0) > 0
  );
  const getSelectableAssetLabel = (asset: Asset) =>
    asset.type === "hardware"
      ? `${asset.name || asset.category}${asset.vendor ? ` / ${asset.vendor}` : ""} (${asset.quantity ?? 0}대 남음)`
      : `${asset.softwareName || asset.name || asset.id} (${asset.quantity ?? 0}석 남음)`;

  useEffect(() => {
    if (form.assetId && !selectableAssets.some((asset) => asset.id === form.assetId)) {
      setForm((prev) => ({ ...prev, assetId: "" }));
    }
  }, [form.assetId, selectableAssets]);

  const reset = () =>
    setForm({
      name: "",
      department: "",
      assetType: "hardware",
      hardwareCategory: normalizedHardwareCategoryOptions[0],
      hardwareVendor: "",
      assetId: "",
    });

  const selectedAsset = selectableAssets.find((asset) => asset.id === form.assetId);
  const hardwareExampleAssetName =
    form.hardwareCategory === "모니터" ? "MON-2207" : form.hardwareCategory === "데스크탑" ? "DST-0118" : "LAP-0142";
  const recentHardwareAssignedRows = useMemo(
    () =>
      hardwareAssignments
        .map((assignment) => ({
          key: `hardware-${assignment.id}`,
          userName: assignment.userName,
          department: assignment.department ?? "-",
          assetName: assignment.pcName || assignment.assetCode,
          quantity: "1",
          assignedAt: assignment.assignedAt ? assignment.assignedAt.slice(0, 19).replace("T", " ") : "-",
        }))
        .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))
        .slice(0, 10),
    [hardwareAssignments]
  );
  const recentSoftwareAssignedRows = useMemo(
    () =>
      softwareAssignments
        .map((assignment) => ({
          key: `software-${assignment.id}`,
          userName: assignment.userName,
          department: assignment.department || "-",
          assetName: assignment.softwareName,
          quantity: `${assignment.assignedSeats}`,
          assignedAt: assignment.assignedAt.slice(0, 19).replace("T", " "),
        }))
        .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))
        .slice(0, 10),
    [softwareAssignments]
  );

  const handleSubmit = () => {
    if (!form.name.trim() || !form.department.trim() || !selectedAsset) return;
    onRegister({
      name: form.name.trim(),
      department: form.department.trim(),
      assetId: form.assetId,
    });
    reset();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const { importAssetsFromExcel } = await import("@/services/excel");
      const importedRows = await importAssetsFromExcel(file);
      await onImportExcel(importedRows);
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  const assignmentRows: PairRow[] = [
    {
      key: "name",
      label: "이름",
      input: (
        <Input
          placeholder="예: 홍길동"
          className="h-8 rounded-[8px] border-slate-200 px-2 text-xs"
          value={form.name}
          onChange={(event) =>
            setForm((prev) => {
              const name = event.target.value;
              return { ...prev, name, department: resolveDepartmentByName(name) };
            })
          }
        />
      ),
      sample: "홍길동",
    },
    {
      key: "department",
      label: "소속 유닛",
      input: (
        <Input
          placeholder="이름 입력 시 자동 입력"
          className="h-8 rounded-[8px] border-slate-200 px-2 text-xs"
          value={form.department}
          readOnly
        />
      ),
      sample: "인프라팀",
    },
    {
      key: "assetType",
      label: "자산 유형",
      input: (
        <select
          className="h-8 w-full rounded-[8px] border border-slate-200 bg-white px-2 text-xs outline-none"
          value={form.assetType}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              assetType: event.target.value as AssetType,
              hardwareCategory: normalizedHardwareCategoryOptions[0],
              hardwareVendor: "",
              assetId: "",
            }))
          }
        >
          <option value="hardware">하드웨어</option>
          <option value="software">소프트웨어</option>
        </select>
      ),
      sample: form.assetType === "hardware" ? "하드웨어" : "소프트웨어",
    },
  ];

  if (form.assetType === "hardware") {
    assignmentRows.push({
      key: "hardwareCategory",
      label: "장비 선택",
      input: (
        <select
          className="h-8 w-full rounded-[8px] border border-slate-200 bg-white px-2 text-xs outline-none"
          value={form.hardwareCategory}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              hardwareCategory: event.target.value,
              hardwareVendor: "",
              assetId: "",
            }))
          }
        >
          {normalizedHardwareCategoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      ),
      sample: form.hardwareCategory,
    });
  }

  if (isMonitorCategory) {
    assignmentRows.push({
      key: "hardwareVendor",
      label: "밴더",
      input: (
        <select
          className="h-8 w-full rounded-[8px] border border-slate-200 bg-white px-2 text-xs outline-none"
          value={form.hardwareVendor}
          onChange={(event) => setForm((prev) => ({ ...prev, hardwareVendor: event.target.value, assetId: "" }))}
        >
          <option value="">밴더를 선택하세요</option>
          {monitorVendorOptions.map((vendor) => (
            <option key={vendor} value={vendor}>
              {vendor}
            </option>
          ))}
        </select>
      ),
      sample: "LG",
    });
  }

  assignmentRows.push({
    key: "assetId",
    label: form.assetType === "hardware" ? "자산 선택" : "소프트웨어 선택",
    input: (
      <select
        className="h-8 w-full rounded-[8px] border border-slate-200 bg-white px-2 text-xs outline-none"
        value={form.assetId}
        onChange={(event) => setForm((prev) => ({ ...prev, assetId: event.target.value }))}
      >
        <option value="">자산을 선택하세요</option>
        {selectableAssets.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {getSelectableAssetLabel(asset)}
          </option>
        ))}
      </select>
    ),
    sample: form.assetType === "hardware" ? hardwareExampleAssetName : "Burp Suite Pro (14석 남음)",
  });

  if (form.assetType === "hardware") {
    assignmentRows.push(
      {
        key: "vendor",
        label: "밴더 정보",
        input: (
          <div className="flex h-8 items-center rounded-[8px] border border-slate-200 bg-slate-50 px-2 text-xs text-slate-600">
            {selectedAsset?.vendor?.trim() || "-"}
          </div>
        ),
        sample: form.hardwareCategory === "모니터" ? "LG" : form.hardwareCategory === "데스크탑" ? "Dell" : "HP",
      }
    );
  }

  if (form.assetType === "software") {
    assignmentRows.push(
      {
        key: "seats",
        label: "할당 수량",
        input: (
          <div className="flex h-8 items-center rounded-[8px] border border-slate-200 bg-slate-50 px-2 text-xs text-slate-600">
            1석
          </div>
        ),
        sample: "1석",
      },
      {
        key: "remaining",
        label: "잔여 라이선스",
        input: (
          <div className="flex h-8 items-center rounded-[8px] border border-slate-200 bg-slate-50 px-2 text-xs text-slate-600">
            {selectedAsset ? `${selectedAsset.quantity ?? 0}석` : "-"}
          </div>
        ),
        sample: "14석",
      }
    );
  }

  if (form.assetType === "hardware") {
    assignmentRows.push({
      key: "target",
      label: "할당 대상 장비",
      input: (
        <div className="flex h-8 items-center rounded-[8px] border border-slate-200 bg-slate-50 px-2 text-xs text-slate-600">
          {selectedAsset ? `${selectedAsset.name || selectedAsset.category}${selectedAsset.vendor ? ` / ${selectedAsset.vendor}` : ""}` : "-"}
        </div>
      ),
      sample: hardwareExampleAssetName,
    });
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[10px] border-slate-200 bg-white shadow-sm">
        <CardContent className="flex items-center justify-between gap-3 p-2.5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">엑셀 Import / Export</h3>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              DB 기준 컬럼 형식으로 자산을 가져오거나 내보냅니다. 하드웨어 사용자 정보는 `name`이 아니라 `assignee` 컬럼을 사용합니다.
            </p>
          </div>
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            <Button
              variant="outline"
              className="h-8 rounded-[8px] px-3 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" /> {isImporting ? "Import 중..." : "Import"}
            </Button>
            <Button className="h-8 rounded-[8px] px-3 text-xs" onClick={onExportExcel} disabled={isImporting}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[10px] border-slate-200 bg-white shadow-sm">
        <CardContent className="flex h-[560px] flex-col space-y-3 p-2.5">
          <div className="rounded-[8px] border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm leading-6 text-slate-700">
            실제 보유 중인 자산만 선택해서 사용자에게 할당합니다.
          </div>
          <div className="flex-1 overflow-hidden">
            <PairedFormGrid
              description="실제 할당 예시입니다. 보유 자산 중 선택 가능한 항목만 사용자에게 할당합니다."
              rows={assignmentRows}
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button
              className="h-8 rounded-[8px] px-3 text-xs"
              onClick={handleSubmit}
              disabled={!form.name || !form.department || !selectedAsset}
            >
              자산 사용자 등록
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="h-full rounded-[10px] border-slate-200 bg-white shadow-sm">
          <CardContent className="flex min-h-[420px] flex-col p-3">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-slate-900">현재 하드웨어 할당 현황</h3>
              <p className="mt-1 text-sm text-slate-500">최근 등록된 하드웨어 할당 10건입니다.</p>
            </div>
            <div className="flex-1 overflow-hidden rounded-[10px] border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[120px] text-center">사용자</TableHead>
                    <TableHead className="w-[120px] text-center">소속 유닛</TableHead>
                    <TableHead className="text-center">자산명</TableHead>
                    <TableHead className="w-[90px] text-center">수량</TableHead>
                    <TableHead className="w-[180px] text-center">할당 일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentHardwareAssignedRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                        현재 할당된 하드웨어가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                  {recentHardwareAssignedRows.map((row) => (
                    <TableRow key={row.key} className="hover:bg-slate-50/80">
                      <TableCell className="text-center"><AutoFitText value={row.userName} /></TableCell>
                      <TableCell className="text-center"><AutoFitText value={row.department} /></TableCell>
                      <TableCell className="text-center"><AutoFitText value={row.assetName} /></TableCell>
                      <TableCell className="text-center"><AutoFitText value={row.quantity} /></TableCell>
                      <TableCell className="text-center"><AutoFitText value={row.assignedAt} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full rounded-[10px] border-slate-200 bg-white shadow-sm">
          <CardContent className="flex min-h-[420px] flex-col p-3">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-slate-900">현재 소프트웨어 할당 현황</h3>
              <p className="mt-1 text-sm text-slate-500">최근 등록된 소프트웨어 할당 10건입니다.</p>
            </div>
            <div className="flex-1 overflow-hidden rounded-[10px] border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[120px] text-center">사용자</TableHead>
                    <TableHead className="w-[120px] text-center">소속 유닛</TableHead>
                    <TableHead className="text-center">자산명</TableHead>
                    <TableHead className="w-[90px] text-center">수량</TableHead>
                    <TableHead className="w-[180px] text-center">할당 일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSoftwareAssignedRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                        현재 할당된 소프트웨어가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                  {recentSoftwareAssignedRows.map((row) => (
                    <TableRow key={row.key} className="hover:bg-slate-50/80">
                      <TableCell className="text-center"><AutoFitText value={row.userName} /></TableCell>
                      <TableCell className="text-center"><AutoFitText value={row.department} /></TableCell>
                      <TableCell className="text-center"><AutoFitText value={row.assetName} /></TableCell>
                      <TableCell className="text-center"><AutoFitText value={row.quantity} /></TableCell>
                      <TableCell className="text-center"><AutoFitText value={row.assignedAt} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

export function AssetRegistrationForm({
  assetType,
  onAssetTypeChange,
  onSave,
  onUpdateAsset,
  assets,
  policySettings,
}: {
  assetType: AssetType;
  onAssetTypeChange: (value: AssetType) => void;
  onSave: (draft: AssetDraft, assetType: AssetType) => void;
  onUpdateAsset: (asset: Asset) => void;
  assets: Asset[];
  policySettings: AssetPolicySettings;
}) {
  const hardwareCategoryOptions = ["모니터", "랩탑", "데스크탑"] as const;
  const laptopVendorOptions = ["HP", "삼성", "LG", "Apple"] as const;
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [draft, setDraft] = useState<AssetDraft>({
    name: "",
    category: assetType === "hardware" ? hardwareCategoryOptions[0] : policySettings.softwareCategories[0] ?? "OS",
    status: assetType === "hardware" ? "유휴" : "사용",
    unitPrice: 0,
    acquiredAt: "",
    createdAt: "",
    expiresAt: "",
    totalQuantity: 1,
    availableQuantity: 1,
    quantity: 1,
    os: "",
    pcName: "",
    assignee: "",
    department: "",
    macAddress: "",
    ipAddress: "",
    note: "",
  });
  const requiresHardwareVendor = assetType === "hardware";
  const usesLaptopVendorSelect = assetType === "hardware" && draft.category === "랩탑";
  useEffect(() => {
    setDraft({
      name: "",
      category: assetType === "hardware" ? hardwareCategoryOptions[0] : policySettings.softwareCategories[0] ?? "OS",
      status: assetType === "hardware" ? "유휴" : "사용",
      unitPrice: 0,
      acquiredAt: "",
      createdAt: "",
      expiresAt: "",
      totalQuantity: 1,
      availableQuantity: 1,
      quantity: 1,
      os: "",
      pcName: "",
      assignee: "",
      department: "",
      macAddress: "",
      ipAddress: "",
      note: "",
    });
  }, [assetType, policySettings]);

  const handleSave = () => {
    const trimmedName = draft.name.trim();
    if (!trimmedName) return;
    if (requiresHardwareVendor && !draft.vendor?.trim()) return;
    onSave(
      {
        ...draft,
        name: assetType === "hardware" ? trimmedName : "",
        softwareName: assetType === "software" ? trimmedName : undefined,
        pcName: undefined,
        os: undefined,
        vendor: requiresHardwareVendor ? draft.vendor?.trim() || undefined : undefined,
        macAddress: undefined,
        ipAddress: undefined,
        assignee: undefined,
        department: undefined,
        acquiredAt: draft.acquiredAt || undefined,
        createdAt: draft.createdAt || undefined,
        expiresAt: assetType === "software" ? draft.expiresAt || undefined : undefined,
        note: draft.note?.trim() || undefined,
      },
      assetType
    );
  };

  const registrationRows: PairRow[] = [
    {
      key: "assetType",
      label: "자산 유형",
      input: (
        <select
          className="h-8 w-full rounded-[8px] border border-slate-200 bg-white px-2 text-xs outline-none"
          value={assetType}
          onChange={(event) => onAssetTypeChange(event.target.value as AssetType)}
        >
          <option value="hardware">하드웨어</option>
          <option value="software">소프트웨어</option>
        </select>
      ),
      sample: assetType === "hardware" ? "하드웨어" : "소프트웨어",
    },
  ];

  if (assetType === "hardware") {
    registrationRows.push({
      key: "hardwareName",
      label: "자산명",
      input: (
        <Input
          placeholder="예: 27인치 4K 모니터"
          className="h-8 border-slate-200 px-2 text-xs"
          value={draft.name}
          onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
        />
      ),
      sample: "27인치 4K 모니터",
    });
  }

  if (assetType === "software") {
    registrationRows.push({
      key: "softwareName",
      label: "소프트웨어명",
      input: (
        <Input
          placeholder="예: Burp Suite Pro"
          className="h-8 border-slate-200 px-2 text-xs"
          value={draft.name}
          onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
        />
      ),
      sample: "Burp Suite Pro",
    });
  }

  registrationRows.push({
    key: "category",
    label: "카테고리",
    input: (
      <select
        className="h-8 w-full rounded-[8px] border border-slate-200 bg-white px-2 text-xs outline-none"
        value={draft.category}
        onChange={(event) =>
          setDraft((prev) => {
            const nextCategory = event.target.value;
            const nextVendor =
              nextCategory === "랩탑" && !laptopVendorOptions.includes((prev.vendor ?? "") as (typeof laptopVendorOptions)[number])
                ? laptopVendorOptions[0]
                : prev.vendor;
            return { ...prev, category: nextCategory, vendor: nextVendor };
          })
        }
      >
        {assetType === "hardware"
          ? hardwareCategoryOptions.map((category) => <option key={category}>{category}</option>)
          : policySettings.softwareCategories.map((category) => <option key={category}>{category}</option>)}
      </select>
    ),
    sample: assetType === "hardware" ? draft.category || "랩탑" : "보안",
  });

  registrationRows.push({
    key: "unitPrice",
    label: assetType === "hardware" ? "도입가" : "단가",
    input: (
      <Input
        type="number"
        min={0}
        placeholder="예: 3200000"
        className="h-8 border-slate-200 px-2 text-xs"
        value={String(draft.unitPrice)}
        onChange={(event) => setDraft((prev) => ({ ...prev, unitPrice: Math.max(0, Number(event.target.value) || 0) }))}
      />
    ),
    sample: assetType === "hardware" ? "1,850,000원" : "680,000원",
  });

  registrationRows.push({
    key: "quantity",
    label: "수량",
    input: (
      <Input
        type="number"
        min={1}
        placeholder={assetType === "hardware" ? "예: 10" : "예: 20"}
        className="h-8 border-slate-200 px-2 text-xs"
        value={String(draft.quantity ?? 1)}
        onChange={(event) =>
          setDraft((prev) => {
            const quantity = Math.max(1, Number(event.target.value) || 1);
            return {
              ...prev,
              totalQuantity: quantity,
              availableQuantity: quantity,
              quantity,
            };
          })
        }
      />
    ),
    sample: assetType === "hardware" ? "10" : "20",
  });

  if (assetType === "hardware") {
    if (requiresHardwareVendor) {
      registrationRows.push({
        key: "vendor",
        label: "밴더",
        input: usesLaptopVendorSelect ? (
          <select
            className="h-8 w-full rounded-[8px] border border-slate-200 bg-white px-2 text-xs outline-none"
            value={draft.vendor ?? laptopVendorOptions[0]}
            onChange={(event) => setDraft((prev) => ({ ...prev, vendor: event.target.value }))}
          >
            {laptopVendorOptions.map((vendor) => (
              <option key={vendor} value={vendor}>
                {vendor}
              </option>
            ))}
          </select>
        ) : (
          <Input
            placeholder="예: Dell"
            className="h-8 border-slate-200 px-2 text-xs"
            value={draft.vendor ?? ""}
            onChange={(event) => setDraft((prev) => ({ ...prev, vendor: event.target.value }))}
          />
        ),
        sample: draft.category === "모니터" ? "LG" : draft.category === "데스크탑" ? "Dell" : "HP",
      });
    }

    registrationRows.push({
      key: "acquiredAt",
      label: "도입일",
      input: (
        <Input
          type="date"
          className="h-8 border-slate-200 px-2 text-xs"
          value={draft.acquiredAt ?? ""}
          onChange={(event) => setDraft((prev) => ({ ...prev, acquiredAt: event.target.value }))}
        />
      ),
      sample: "2026-03-28",
    });
  } else {
    registrationRows.push({
      key: "expiresAt",
      label: "라이선스 만료일",
      input: (
        <Input
          type="date"
          className="h-8 border-slate-200 px-2 text-xs"
          value={draft.expiresAt ?? ""}
          onChange={(event) => setDraft((prev) => ({ ...prev, expiresAt: event.target.value }))}
        />
      ),
      sample: "2027-03-28",
    });
  }

  registrationRows.push(
    {
      key: "note",
      label: "비고",
      input: (
        <Input
          placeholder={assetType === "hardware" ? "예: 신규 입고 장비" : "예: 연간 구독"}
          className="h-8 border-slate-200 px-2 text-xs"
          value={draft.note ?? ""}
          onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))}
        />
      ),
      sample: assetType === "hardware" ? "신규 입고 장비" : "연간 구독 라이선스",
    },
    {
      key: "createdAt",
      label: "등록 일시",
      input: (
        <Input
          type="datetime-local"
          className="h-8 border-slate-200 px-2 text-xs"
          value={draft.createdAt ?? ""}
          onChange={(event) => setDraft((prev) => ({ ...prev, createdAt: event.target.value }))}
        />
      ),
      sample: "2026-03-28T09:30",
    }
  );

  return (
    <div className="space-y-6">
      <Card className="rounded-[10px] border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-2.5 p-2.5">
          <div className="rounded-[8px] border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm leading-6 text-slate-700">
            자산 ID와 등록 일시는 저장 시 자동 생성됩니다.
          </div>
          <PairedFormGrid
            description="실제 등록 예시입니다. 입력값과 별개로 등록 형식을 참고할 수 있습니다."
            rows={registrationRows}
          />

          <div className="flex justify-end">
            <Button
              className="h-8 rounded-[8px] px-3 text-xs"
              onClick={handleSave}
              disabled={!draft.name.trim() || (assetType === "hardware" && ((draft.quantity ?? 1) < 1 || !draft.vendor?.trim()))}
            >
              자산 등록
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <RegisteredAssetList
          title="등록된 하드웨어 자산"
          assetType="hardware"
          assets={assets.filter((asset) => asset.type === "hardware")}
          onEdit={setEditingAsset}
        />
        <RegisteredAssetList
          title="등록된 소프트웨어 자산"
          assetType="software"
          assets={assets.filter((asset) => asset.type === "software")}
          onEdit={setEditingAsset}
        />
      </div>

      {editingAsset && (
        <RegisteredAssetEditModal
          asset={editingAsset}
          policySettings={policySettings}
          onClose={() => setEditingAsset(null)}
          onSave={(asset) => {
            onUpdateAsset(asset);
            setEditingAsset(null);
          }}
        />
      )}
    </div>
  );
}

function RegisteredAssetList({
  title,
  assetType,
  assets,
  onEdit,
}: {
  title: string;
  assetType: AssetType;
  assets: Asset[];
  onEdit: (asset: Asset) => void;
}) {
  const filteredAssets = assets;
  const isHardwareExpired = (acquiredAt?: string) => {
    if (!acquiredAt) return false;
    const acquired = new Date(acquiredAt);
    if (Number.isNaN(acquired.getTime())) return false;
    const expiry = new Date(acquired);
    expiry.setFullYear(expiry.getFullYear() + 5);
    return expiry <= new Date();
  };
  const hardwareRows = useMemo(
    () => {
      if (filteredAssets.length === 0) return [];
      return filteredAssets.map((asset) => ({
        key: asset.id,
        representative: asset,
        totalQuantity: asset.totalQuantity ?? asset.quantity ?? 0,
        availableQuantity: asset.quantity ?? 0,
        expiredCount: isHardwareExpired(asset.acquiredAt) ? asset.totalQuantity ?? asset.quantity ?? 0 : 0,
        isExpired: isHardwareExpired(asset.acquiredAt),
        vendor: asset.vendor || "-",
      }));
    },
    [filteredAssets]
  );
  const softwareRows = useMemo(
    () =>
      filteredAssets
        .filter((asset) => asset.type === "software")
        .reduce<
          {
            key: string;
            representative: Asset;
            category: string;
            softwareName: string;
            totalQuantity: number;
            availableQuantity: number;
            expiresAt?: string;
            note?: string;
          }[]
        >((rows, asset) => {
          const softwareName = asset.softwareName ?? asset.name ?? asset.category;
          const key = `${asset.category}::${softwareName}`;
          const existingRow = rows.find((row) => row.key === key);
          if (existingRow) {
            existingRow.totalQuantity += asset.totalQuantity ?? 0;
            existingRow.availableQuantity += asset.quantity ?? 0;
            if (!existingRow.expiresAt && asset.expiresAt) existingRow.expiresAt = asset.expiresAt;
            if (!existingRow.note && asset.note) existingRow.note = asset.note;
            return rows;
          }

          rows.push({
            key,
            representative: asset,
            category: asset.category,
            softwareName,
            totalQuantity: asset.totalQuantity ?? 0,
            availableQuantity: asset.quantity ?? 0,
            expiresAt: asset.expiresAt,
            note: asset.note,
          });
          return rows;
        }, []),
    [filteredAssets]
  );
  const registeredRows = assetType === "hardware" ? hardwareRows : softwareRows;
  const { pageItems, currentPage, totalPages, setCurrentPage } = usePagedData(registeredRows, REGISTERED_ASSET_PAGE_SIZE);

  return (
    <Card className="rounded-[10px] border-slate-200 bg-white shadow-sm">
      <CardContent className="p-3">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            등록 단위로 묶어서 보여줍니다.
          </p>
        </div>
        <div className="min-h-[420px] overflow-hidden rounded-[10px] border border-slate-200">
          <Table className="w-full table-fixed">
            <colgroup>
              {assetType === "hardware" ? (
                <>
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "20%" }} />
                </>
              ) : (
                <>
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "10%" }} />
                </>
              )}
            </colgroup>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                {assetType === "hardware" ? (
                  <>
                    <TableHead className="text-center">자산명</TableHead>
                    <TableHead className="text-center">카테고리</TableHead>
                    <TableHead className="text-center">전체 수량</TableHead>
                    <TableHead className="text-center">잔여 수량</TableHead>
                    <TableHead className="text-center">밴더</TableHead>
                    <TableHead className="text-center">연한 초과</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-center">카테고리</TableHead>
                    <TableHead className="text-center">소프트웨어 이름</TableHead>
                    <TableHead className="text-center">전체 수량</TableHead>
                    <TableHead className="text-center">잔여 수량</TableHead>
                    <TableHead className="text-center">라이선스 만료일</TableHead>
                    <TableHead className="text-center">비고</TableHead>
                  </>
                )}
                <TableHead className="text-center">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assetType === "hardware" &&
                pageItems.map((row) => (
                  <TableRow key={row.key} className="hover:bg-slate-50/80">
                    <TableCell className="text-center"><AutoFitText value={row.representative.name || "-"} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={row.representative.category} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={String(row.totalQuantity)} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={String(row.availableQuantity)} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={row.vendor} /></TableCell>
                    <TableCell className="text-center"><ExpiredCountText value={row.expiredCount} /></TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" className="h-8 rounded-[10px] px-3 text-xs" onClick={() => onEdit(row.representative)}>
                        수정
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              {assetType === "software" &&
                pageItems.map((row) => (
                  <TableRow key={row.key} className="hover:bg-slate-50/80">
                    <TableCell className="text-center"><AutoFitText value={row.category} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={row.softwareName} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={String(row.totalQuantity)} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={String(row.availableQuantity)} /></TableCell>
                    <TableCell className="text-center"><ExpiryDateText value={row.expiresAt} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={row.note || "-"} /></TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" className="h-8 rounded-[10px] px-3 text-xs" onClick={() => onEdit(row.representative)}>
                        수정
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </CardContent>
    </Card>
  );
}

function RegisteredAssetEditModal({
  asset,
  policySettings,
  onClose,
  onSave,
}: {
  asset: Asset;
  policySettings: AssetPolicySettings;
  onClose: () => void;
  onSave: (asset: Asset) => void;
}) {
  const laptopVendorOptions = ["HP", "삼성", "LG", "Apple"] as const;
  const [draft, setDraft] = useState<Asset>({ ...asset });
  const requiresHardwareVendor = draft.type === "hardware";
  const usesLaptopVendorSelect = draft.type === "hardware" && draft.category === "랩탑";

  useEffect(() => {
    setDraft({ ...asset });
  }, [asset]);

  const handleSave = () => {
    const originalTotalQuantity = asset.totalQuantity ?? asset.quantity ?? 0;
    const originalAvailableQuantity = asset.quantity ?? 0;
    const assignedQuantity = Math.max(originalTotalQuantity - originalAvailableQuantity, 0);
    const nextTotalQuantity = Math.max(1, draft.totalQuantity ?? draft.quantity ?? 1);
    const nextAvailableQuantity = Math.max(nextTotalQuantity - assignedQuantity, 0);

    if (draft.type === "hardware" && !draft.name.trim()) return;
    if (requiresHardwareVendor && !draft.vendor?.trim()) return;
    onSave({
      ...draft,
      name: draft.type === "hardware" ? draft.name.trim() : draft.name,
      softwareName: draft.type === "software" ? (draft.softwareName ?? draft.name).trim() : undefined,
      totalQuantity: nextTotalQuantity,
      quantity: nextAvailableQuantity,
      createdAt: draft.createdAt || undefined,
      acquiredAt: draft.acquiredAt || undefined,
      expiresAt: draft.expiresAt || undefined,
      os: undefined,
      vendor: requiresHardwareVendor ? draft.vendor?.trim() || undefined : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-[10px] bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">등록 자산 수정</h3>
          <Button variant="outline" onClick={onClose}>닫기</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {draft.type === "hardware" && (
            <FormRow label="자산명" stacked>
              <Input value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} />
            </FormRow>
          )}
          {draft.type === "software" && (
            <FormRow label="소프트웨어명" stacked>
              <Input value={draft.softwareName ?? draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, softwareName: event.target.value }))} />
            </FormRow>
          )}
          <FormRow label="카테고리" stacked>
            <select
              className="h-10 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm outline-none"
              value={draft.category}
              onChange={(event) =>
                setDraft((prev) => {
                  const nextCategory = event.target.value;
                  const nextVendor =
                    nextCategory === "랩탑" && !laptopVendorOptions.includes((prev.vendor ?? "") as (typeof laptopVendorOptions)[number])
                      ? laptopVendorOptions[0]
                      : prev.vendor;
                  return { ...prev, category: nextCategory, vendor: nextVendor };
                })
              }
            >
              {(draft.type === "hardware" ? policySettings.hardwareCategories : policySettings.softwareCategories).map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </FormRow>
          <FormRow label={draft.type === "hardware" ? "도입가" : "단가"} stacked>
            <Input type="number" min={0} value={String(draft.unitPrice ?? 0)} onChange={(event) => setDraft((prev) => ({ ...prev, unitPrice: Math.max(0, Number(event.target.value) || 0) }))} />
          </FormRow>
          <FormRow label="수량" stacked>
            <Input
              type="number"
              min={1}
              value={String(draft.totalQuantity ?? draft.quantity ?? 1)}
              onChange={(event) => {
                const quantity = Math.max(1, Number(event.target.value) || 1);
                setDraft((prev) => ({ ...prev, totalQuantity: quantity }));
              }}
            />
          </FormRow>
          {draft.type === "hardware" && (
            <FormRow label="도입일" stacked>
              <Input type="date" value={draft.acquiredAt ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, acquiredAt: event.target.value }))} />
            </FormRow>
          )}
          {requiresHardwareVendor && (
            <FormRow label="밴더" stacked>
              {usesLaptopVendorSelect ? (
                <select
                  className="h-10 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm outline-none"
                  value={draft.vendor ?? laptopVendorOptions[0]}
                  onChange={(event) => setDraft((prev) => ({ ...prev, vendor: event.target.value }))}
                >
                  {laptopVendorOptions.map((vendor) => (
                    <option key={vendor} value={vendor}>
                      {vendor}
                    </option>
                  ))}
                </select>
              ) : (
                <Input value={draft.vendor ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, vendor: event.target.value }))} />
              )}
            </FormRow>
          )}
          {draft.type === "software" && (
            <FormRow label="라이선스 만료일" stacked>
              <Input type="date" value={draft.expiresAt ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, expiresAt: event.target.value }))} />
            </FormRow>
          )}
          <FormRow label="등록 일시" stacked>
            <Input type="datetime-local" value={draft.createdAt ? draft.createdAt.slice(0, 16) : ""} onChange={(event) => setDraft((prev) => ({ ...prev, createdAt: event.target.value }))} />
          </FormRow>
          <FormRow label="비고" stacked>
            <Input value={draft.note ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))} />
          </FormRow>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSave}>저장</Button>
        </div>
      </div>
    </div>
  );
}

export function OrgMemberManagement({
  data,
  onImportExcel,
  onExportExcel,
  onSaveMember,
}: {
  data: OrgMember[];
  onImportExcel: (rows: ImportedOrgMemberRow[]) => void;
  onExportExcel: () => void;
  onSaveMember: (member: OrgMember) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { pageItems: pagedMembers, currentPage, totalPages, setCurrentPage } = usePagedData(data);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [draft, setDraft] = useState<OrgMember | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const { importOrgMembersFromExcel } = await import("@/services/excel");
    const importedRows = await importOrgMembersFromExcel(file);
    onImportExcel(importedRows);
    event.target.value = "";
  };

  const startEditing = (member: OrgMember) => {
    setEditingId(member.id);
    setDraft({ ...member });
  };

  const handleSave = async () => {
    if (!draft) return;

    setIsSaving(true);
    try {
      await onSaveMember(draft);
      setEditingId(null);
      setDraft(null);
      setShowSavedToast(true);
      window.setTimeout(() => setShowSavedToast(false), 1800);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-[10px] border-slate-200 bg-white shadow-sm">
        <CardContent className="flex items-center justify-between gap-3 p-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">엑셀 Import / Export</h3>
            <p className="mt-1 text-sm text-slate-500">구성원 목록을 엑셀로 가져오거나 내보낼 수 있습니다.</p>
          </div>
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            <Button variant="outline" className="rounded-[10px]" onClick={() => fileInputRef.current?.click()}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Import
            </Button>
            <Button className="rounded-[10px]" onClick={onExportExcel}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[10px] border-slate-200 bg-white shadow-sm">
        <CardContent className="p-3">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-slate-900">구성원 목록</h3>
            <p className="mt-1 text-sm text-slate-500">사내 구성원 목록입니다.</p>
          </div>
          <div className="overflow-hidden rounded-[10px] border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-center">이름</TableHead>
                  <TableHead className="text-center">직책</TableHead>
                  <TableHead className="text-center">분류</TableHead>
                  <TableHead className="text-center">셀</TableHead>
                  <TableHead className="text-center">유닛</TableHead>
                  <TableHead className="text-center">파트</TableHead>
                  <TableHead className="text-center">위치</TableHead>
                  <TableHead className="w-[72px] text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedMembers.map((member) => (
                  <TableRow key={member.id} className="hover:bg-slate-50/80">
                    <TableCell className="text-center font-medium">
                      {editingId === member.id && draft ? (
                        <Input className="h-8 rounded-[10px] text-xs" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
                      ) : (
                        member.name
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingId === member.id && draft ? (
                        <Input className="h-8 rounded-[10px] text-xs" value={draft.position || ""} onChange={(event) => setDraft({ ...draft, position: event.target.value })} />
                      ) : (
                        member.position || "-"
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingId === member.id && draft ? (
                        <Input className="h-8 rounded-[10px] text-xs" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
                      ) : (
                        member.category
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingId === member.id && draft ? (
                        <Input className="h-8 rounded-[10px] text-xs" value={draft.cell} onChange={(event) => setDraft({ ...draft, cell: event.target.value })} />
                      ) : (
                        member.cell
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingId === member.id && draft ? (
                        <Input className="h-8 rounded-[10px] text-xs" value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} />
                      ) : (
                        member.unit
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingId === member.id && draft ? (
                        <Input className="h-8 rounded-[10px] text-xs" value={draft.part} onChange={(event) => setDraft({ ...draft, part: event.target.value })} />
                      ) : (
                        member.part
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingId === member.id && draft ? (
                        <Input className="h-8 rounded-[10px] text-xs" value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} />
                      ) : (
                        member.location
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        className="h-6 rounded-[8px] px-2 py-0 text-[10px]"
                        disabled={isSaving && editingId === member.id}
                        onClick={() => (editingId === member.id ? void handleSave() : startEditing(member))}
                      >
                        {editingId === member.id ? "저장" : "수정"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>
      {showSavedToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 pointer-events-none">
          <div className="rounded-[10px] bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
            저장이 완료되었습니다.
          </div>
        </div>
      )}
    </div>
  );
}

export function SummaryCardGrid({
  hardwareTotalQuantity,
  softwareTotalQuantity,
  assignedQuantity,
  availableQuantity,
  attentionQuantity,
}: {
  hardwareTotalQuantity: number;
  softwareTotalQuantity: number;
  assignedQuantity: number;
  availableQuantity: number;
  attentionQuantity: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <SummaryCard title="하드웨어 총수량" value={hardwareTotalQuantity} icon={<Laptop className="h-5 w-5" />} tone="indigo" />
      <SummaryCard title="소프트웨어 총수량" value={softwareTotalQuantity} icon={<AppWindow className="h-5 w-5" />} tone="sky" />
      <SummaryCard title="할당 수량" value={assignedQuantity} icon={<UserCircle2 className="h-5 w-5" />} tone="emerald" />
      <SummaryCard title="잔여 수량" value={availableQuantity} icon={<Package className="h-5 w-5" />} tone="amber" />
      <SummaryCard title="연한/만료 주의" value={attentionQuantity} icon={<Plus className="h-5 w-5" />} tone="rose" />
    </div>
  );
}

type DashboardAssetListsProps = {
  assets: Asset[];
};

export function DashboardAssetLists({ assets }: DashboardAssetListsProps) {
  const hardwareRows = assets
    .filter((asset) => asset.type === "hardware")
    .reduce<{ category: string; os: string; vendor: string; totalQuantity: number; availableQuantity: number; expiredQuantity: number }[]>((rows, asset) => {
      const os = (asset.os ?? "").trim() || "-";
      const existingRow = rows.find((row) => row.category === asset.category && row.os === os);
      const acquired = asset.acquiredAt ? new Date(asset.acquiredAt) : null;
      const isExpired =
        acquired && !Number.isNaN(acquired.getTime()) ? new Date(acquired.getFullYear() + 5, acquired.getMonth(), acquired.getDate()) <= new Date() : false;
      if (existingRow) {
        existingRow.totalQuantity += asset.totalQuantity ?? 0;
        existingRow.availableQuantity += asset.quantity ?? 0;
        existingRow.expiredQuantity += isExpired ? asset.totalQuantity ?? 0 : 0;
        existingRow.vendor = Array.from(new Set([existingRow.vendor, asset.vendor || "-"].filter(Boolean))).join(" / ");
        return rows;
      }

      rows.push({
        category: asset.category,
        os,
        vendor: asset.vendor || "-",
        totalQuantity: asset.totalQuantity ?? 0,
        availableQuantity: asset.quantity ?? 0,
        expiredQuantity: isExpired ? asset.totalQuantity ?? 0 : 0,
      });
      return rows;
    }, [])
    .sort((a, b) => a.category.localeCompare(b.category, "ko") || a.os.localeCompare(b.os, "ko"));

  const softwareRows = assets
    .filter((asset) => asset.type === "software")
    .reduce<{ category: string; softwareName: string; totalQuantity: number; availableQuantity: number; expiresAt?: string }[]>((rows, asset) => {
      const softwareName = asset.softwareName ?? asset.name;
      const existingRow = rows.find((row) => row.category === asset.category && row.softwareName === softwareName);
      if (existingRow) {
        existingRow.totalQuantity += asset.totalQuantity ?? 0;
        existingRow.availableQuantity += asset.quantity ?? 0;
        if (!existingRow.expiresAt && asset.expiresAt) existingRow.expiresAt = asset.expiresAt;
        return rows;
      }

      rows.push({
        category: asset.category,
        softwareName,
        totalQuantity: asset.totalQuantity ?? 0,
        availableQuantity: asset.quantity ?? 0,
        expiresAt: asset.expiresAt,
      });
      return rows;
    }, [])
    .sort((a, b) => a.category.localeCompare(b.category, "ko") || a.softwareName.localeCompare(b.softwareName, "ko"));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <DashboardHardwareAssetTable rows={hardwareRows} />
      <DashboardSoftwareAssetTable rows={softwareRows} />
    </div>
  );
}

function DashboardCardShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-[18px] border border-[#e7eaf3] bg-white shadow-[0_18px_40px_rgba(18,24,40,0.05)]">
      <CardContent className="p-4">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#16191f]">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardHardwareAssetTable({
  rows,
}: {
  rows: { category: string; os: string; vendor: string; totalQuantity: number; availableQuantity: number; expiredQuantity: number }[];
}) {
  return (
    <DashboardCardShell title="하드웨어 자산 목록" description="엑셀 import 기준 카테고리와 OS 수량을 표시합니다.">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="w-[120px] text-center">카테고리</TableHead>
            <TableHead className="w-[140px] text-center">OS 정보</TableHead>
            <TableHead className="w-[110px] text-center">전체 수량</TableHead>
            <TableHead className="w-[110px] text-center">잔여 수량</TableHead>
            <TableHead className="w-[120px] text-center">밴더</TableHead>
            <TableHead className="w-[110px] text-center">연한 초과</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-6 text-center text-sm text-slate-500">
                등록된 하드웨어 자산이 없습니다.
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={`${row.category}-${row.os}`} className="hover:bg-slate-50/80">
              <TableCell className="text-center font-medium"><AutoFitText value={row.category} /></TableCell>
              <TableCell className="text-center"><AutoFitText value={row.os} /></TableCell>
              <TableCell className="text-center"><AutoFitText value={String(row.totalQuantity)} /></TableCell>
              <TableCell className="text-center"><AutoFitText value={String(row.availableQuantity)} /></TableCell>
              <TableCell className="text-center"><AutoFitText value={row.vendor} /></TableCell>
              <TableCell className="text-center"><ExpiredCountText value={row.expiredQuantity} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DashboardCardShell>
  );
}

function DashboardSoftwareAssetTable({
  rows,
}: {
  rows: { category: string; softwareName: string; totalQuantity: number; availableQuantity: number; expiresAt?: string }[];
}) {
  return (
    <DashboardCardShell title="소프트웨어 자산 목록" description="엑셀 import 기준 소프트웨어 사용 수량을 표시합니다.">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="w-[120px] text-center">카테고리</TableHead>
            <TableHead className="text-center">소프트웨어 이름</TableHead>
            <TableHead className="w-[110px] text-center">전체 수량</TableHead>
            <TableHead className="w-[110px] text-center">잔여 수량</TableHead>
            <TableHead className="w-[140px] text-center">라이선스 만료일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                등록된 소프트웨어 자산이 없습니다.
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={`${row.category}-${row.softwareName}`} className="hover:bg-slate-50/80">
              <TableCell className="text-center font-medium"><AutoFitText value={row.category} /></TableCell>
              <TableCell className="text-center"><AutoFitText value={row.softwareName} /></TableCell>
              <TableCell className="text-center"><AutoFitText value={String(row.totalQuantity)} /></TableCell>
              <TableCell className="text-center"><AutoFitText value={String(row.availableQuantity)} /></TableCell>
              <TableCell className="text-center"><ExpiryDateText value={row.expiresAt} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DashboardCardShell>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  tone: "indigo" | "sky" | "emerald" | "amber" | "rose";
}) {
  const toneStyles = {
    indigo: {
      card: "border-[#cfd7ff] bg-[#eef2ff]",
      text: "text-[#1e2a78]",
      subtext: "text-[#5b68b7]",
      chip: "bg-white/80 text-[#4452c9]",
      icon: "bg-white/85 text-[#4452c9]",
    },
    sky: {
      card: "border-[#cfe8ff] bg-[#eef8ff]",
      text: "text-[#0f4878]",
      subtext: "text-[#4f83af]",
      chip: "bg-white/80 text-[#2d7ab7]",
      icon: "bg-white/85 text-[#2d7ab7]",
    },
    emerald: {
      card: "border-[#cdebdc] bg-[#edf9f2]",
      text: "text-[#17603f]",
      subtext: "text-[#4d8c70]",
      chip: "bg-white/80 text-[#2d8a5b]",
      icon: "bg-white/85 text-[#2d8a5b]",
    },
    amber: {
      card: "border-[#f2e1bc] bg-[#fff7e8]",
      text: "text-[#7a4b05]",
      subtext: "text-[#a37a3d]",
      chip: "bg-white/80 text-[#c17a12]",
      icon: "bg-white/85 text-[#c17a12]",
    },
    rose: {
      card: "border-[#f0d3dd] bg-[#fff1f5]",
      text: "text-[#7d2947]",
      subtext: "text-[#a7637b]",
      chip: "bg-white/80 text-[#c24d77]",
      icon: "bg-white/85 text-[#c24d77]",
    },
  } as const;

  const styles = toneStyles[tone];

  return (
    <Card className={`rounded-[20px] border shadow-[0_18px_36px_rgba(15,23,42,0.06)] ${styles.card}`}>
      <CardContent className="flex min-h-[148px] flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className={`text-lg font-semibold ${styles.text}`}>{title}</h3>
          </div>
          <div className={`rounded-[14px] p-3 ${styles.icon}`}>
            {icon}
          </div>
        </div>
        <div>
          <p className={`text-4xl font-semibold tracking-[-0.03em] ${styles.text}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AssetTable({
  data,
  currentUserRole,
  onSaveAsset,
}: {
  data: readonly Asset[];
  currentUserRole: Role;
  onSaveAsset: (asset: Asset) => void;
}) {
  const { pageItems, currentPage, totalPages, setCurrentPage } = usePagedData(data);
  const isHardwareTable = data[0]?.type === "hardware";
  const hardwareRows = useMemo(
    () =>
      data.reduce<{ category: string; os: string; vendor: string; totalQuantity: number; availableQuantity: number; expiredQuantity: number }[]>((rows, asset) => {
        if (asset.type !== "hardware") return rows;

        const category = asset.category;
        const os = (asset.os ?? "").trim() || "-";
        const existingRow = rows.find((row) => row.category === category && row.os === os);
        const acquired = asset.acquiredAt ? new Date(asset.acquiredAt) : null;
        const isExpired =
          acquired && !Number.isNaN(acquired.getTime()) ? new Date(acquired.getFullYear() + 5, acquired.getMonth(), acquired.getDate()) <= new Date() : false;
        if (existingRow) {
          existingRow.totalQuantity += asset.totalQuantity ?? 0;
          existingRow.availableQuantity += asset.quantity ?? 0;
          existingRow.expiredQuantity += isExpired ? asset.totalQuantity ?? 0 : 0;
          existingRow.vendor = Array.from(new Set([existingRow.vendor, asset.vendor || "-"].filter(Boolean))).join(" / ");
          return rows;
        }

        rows.push({
          category,
          os,
          vendor: asset.vendor || "-",
          totalQuantity: asset.totalQuantity ?? 0,
          availableQuantity: asset.quantity ?? 0,
          expiredQuantity: isExpired ? asset.totalQuantity ?? 0 : 0,
        });
        return rows;
      }, []),
    [data]
  );

  return (
    <Card className="rounded-[10px] border border-slate-200 bg-white shadow-sm">
      <CardContent className="p-3">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-slate-900">{isHardwareTable ? "하드웨어 자산 목록" : "소프트웨어 자산 목록"}</h3>
        </div>
        <div className="overflow-hidden rounded-[10px] border border-slate-200">
          <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-[120px] text-center">카테고리</TableHead>
                  {isHardwareTable && <TableHead className="w-[130px] text-center">OS 정보</TableHead>}
                  {!isHardwareTable && <TableHead className="w-[220px] text-center">소프트웨어 이름</TableHead>}
                  <TableHead className="w-[110px] text-center">전체 수량</TableHead>
                  <TableHead className="w-[110px] text-center">잔여 수량</TableHead>
                  {isHardwareTable && <TableHead className="w-[120px] text-center">밴더</TableHead>}
                  {isHardwareTable && <TableHead className="w-[110px] text-center">연한 초과</TableHead>}
                  {!isHardwareTable && <TableHead className="w-[140px] text-center">라이선스 만료일</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
              {isHardwareTable &&
                hardwareRows.map((row) => (
                  <TableRow key={`${row.category}-${row.os}`} className="hover:bg-slate-50/80">
                    <TableCell className="text-center"><AutoFitText value={row.category} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={row.os} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={String(row.totalQuantity)} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={String(row.availableQuantity)} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={row.vendor} /></TableCell>
                    <TableCell className="text-center"><ExpiredCountText value={row.expiredQuantity} /></TableCell>
                  </TableRow>
                ))}
              {!isHardwareTable &&
                pageItems.map((asset) => (
                  <TableRow key={asset.id} className="hover:bg-slate-50/80">
                    <TableCell className="text-center"><AutoFitText value={asset.category} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={asset.softwareName ?? asset.name} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={String(asset.totalQuantity ?? 0)} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={String(asset.quantity ?? 0)} /></TableCell>
                    <TableCell className="text-center"><ExpiryDateText value={asset.expiresAt} /></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        {!isHardwareTable && <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
      </CardContent>
    </Card>
  );
}

export function MemberTable({
  data,
  onRoleChange,
  onDepartmentChange,
  onDeleteMember,
  currentUserRole,
}: {
  data: Member[];
  onRoleChange: (id: number, role: Role) => void;
  onDepartmentChange: (id: number, department: string) => void;
  onDeleteMember: (id: number) => void;
  currentUserRole: Role;
}) {
  const { pageItems, currentPage, totalPages, setCurrentPage } = usePagedData(data);

  return (
    <Card className="rounded-[10px] border border-slate-200 bg-white shadow-sm">
      <CardContent className="p-3">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-slate-900">회원 목록</h3>
          <p className="mt-1 text-sm text-slate-500">권한과 접속 정보를 관리합니다.</p>
        </div>
        <div className="overflow-hidden rounded-[10px] border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-[90px] text-center">이름</TableHead>
                <TableHead className="w-[150px] text-center">이메일</TableHead>
                <TableHead className="w-[160px] text-center">소속 유닛</TableHead>
                <TableHead className="text-center">권한</TableHead>
                <TableHead className="w-[150px] text-center">가입일</TableHead>
                <TableHead className="w-[180px] text-center">최종 접속일</TableHead>
                <TableHead className="w-[110px] text-center">접속자 IP</TableHead>
                <TableHead className="w-[72px] text-center">삭제</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((member) => (
                <TableRow key={member.id} className="hover:bg-slate-50/80">
                  <TableCell className="text-center font-medium"><AutoFitText value={member.name} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={member.email} /></TableCell>
                  <TableCell className="text-center">
                    <Input
                      className="h-8 min-w-[140px] rounded-[10px] text-xs"
                      value={member.department}
                      onChange={(event) => onDepartmentChange(member.id, event.target.value)}
                      disabled={!canManageAccounts(currentUserRole)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <select
                      className="h-8 rounded-[10px] border border-slate-200 bg-white px-2.5 text-xs outline-none"
                      value={member.role}
                      onChange={(event) => onRoleChange(member.id, event.target.value as Role)}
                      disabled={!canManageAccounts(currentUserRole)}
                    >
                      <option>Admin</option>
                      <option>Manager</option>
                      <option>Viewer</option>
                      <option>User</option>
                    </select>
                  </TableCell>
                  <TableCell className="text-center"><AutoFitText value={member.joinedAt} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={member.lastLoginAt} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={member.lastLoginIp ?? "-"} /></TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      className="h-8 rounded-[10px] px-3 text-xs"
                      onClick={() => onDeleteMember(member.id)}
                      disabled={!canManageAccounts(currentUserRole)}
                    >
                      삭제
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </CardContent>
    </Card>
  );
}

export function AuditLogTable({ data }: { data: readonly AuditLog[] }) {
  const { pageItems, currentPage, totalPages, setCurrentPage } = usePagedData(data);

  return (
    <Card className="rounded-[10px] border border-slate-200 bg-white shadow-sm">
      <CardContent className="p-3">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-slate-900">감사 로그 목록</h3>
          <p className="mt-1 text-sm text-slate-500">시스템 로그를 조회합니다.</p>
        </div>
        <div className="overflow-hidden rounded-[10px] border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-[90px] text-center">로그 유형</TableHead>
                <TableHead className="w-[90px] text-center">사용자</TableHead>
                <TableHead className="w-[150px] text-center">행위</TableHead>
                <TableHead className="w-[150px] text-center">대상</TableHead>
                <TableHead className="w-[100px] text-center">IP</TableHead>
                <TableHead className="w-[190px] text-center">발생 일시</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/80">
                  <TableCell className="text-center"><AutoFitText value={log.type} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={log.actor} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={log.action} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={log.target} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={log.ip} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={log.createdAt} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </CardContent>
    </Card>
  );
}

export function UsageTable({ search, data }: { search: string; data: readonly UsageItem[] }) {
  const lowered = search.toLowerCase();
  const visibleItems = [...data]
    .filter((item) => [item.user, item.department, item.assetType, item.category, item.pcName, item.registeredAt].some((value) => value.toLowerCase().includes(lowered)))
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
    .slice(0, 50);

  return (
    <Card className="rounded-[10px] border-slate-200 bg-white shadow-sm">
      <CardContent className="p-3">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-slate-900">자산 사용 목록</h3>
          <p className="mt-1 text-sm text-slate-500">지급된 자산 현황을 조회합니다.</p>
        </div>
        <div className="overflow-hidden rounded-[10px] border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-[100px] text-center">사용자</TableHead>
                <TableHead className="w-[100px] text-center">소속 유닛</TableHead>
                <TableHead className="w-[90px] text-center">자산 유형</TableHead>
                <TableHead className="w-[120px] text-center">카테고리</TableHead>
                <TableHead className="w-[150px] text-center">PC Name</TableHead>
                <TableHead className="w-[180px] text-center">할당 일시</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleItems.map((item, index) => (
                <TableRow key={`${item.user}-${item.category}-${item.registeredAt}-${index}`} className="hover:bg-slate-50/80">
                  <TableCell className="text-center"><AutoFitText value={item.user} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={item.department} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={item.assetType} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={item.category} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={item.pcName} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={item.registeredAt} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function SecuritySettings({
  allowedDomains,
  sessionTimeout,
  setAllowedDomains,
  setSessionTimeout,
  googleWorkspaceLicenses,
  googleWorkspaceLicenseRun,
  isGoogleWorkspaceSyncing,
  isGoogleWorkspaceImporting,
  onGoogleWorkspaceSync,
  onGoogleWorkspaceImport,
  members,
}: {
  allowedDomains: string[];
  sessionTimeout: string;
  setAllowedDomains: (value: string[]) => void;
  setSessionTimeout: (value: string) => void;
  googleWorkspaceLicenses: GoogleWorkspaceLicense[];
  googleWorkspaceLicenseRun: GoogleWorkspaceLicenseRun | null;
  isGoogleWorkspaceSyncing: boolean;
  isGoogleWorkspaceImporting: boolean;
  onGoogleWorkspaceSync: () => void;
  onGoogleWorkspaceImport: (file: File) => Promise<void>;
  members: Member[];
}) {
  const [domainInput, setDomainInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { pageItems, currentPage, totalPages, setCurrentPage } = usePagedData(googleWorkspaceLicenses);
  const memberNameByEmail = useMemo(
    () => new Map(members.map((member) => [member.email.trim().toLowerCase(), member.name.trim()])),
    [members]
  );
  const latestSyncedLabel = googleWorkspaceLicenseRun?.finishedAt
    ? formatAssetDate(googleWorkspaceLicenseRun.finishedAt)
    : googleWorkspaceLicenseRun?.startedAt
      ? formatAssetDate(googleWorkspaceLicenseRun.startedAt)
      : "-";

  const handleAddDomain = () => {
    const nextDomain = domainInput.trim().toLowerCase();
    if (!nextDomain || allowedDomains.includes(nextDomain)) return;
    setAllowedDomains([...allowedDomains, nextDomain]);
    setDomainInput("");
  };

  const handleRemoveDomain = (domain: string) => {
    setAllowedDomains(allowedDomains.filter((item) => item !== domain));
  };

  const handleLicenseFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await onGoogleWorkspaceImport(file);
  };

  const getLicenseDisplayName = (license: GoogleWorkspaceLicense) => {
    const matchedName = memberNameByEmail.get(license.userEmail.trim().toLowerCase());
    if (matchedName) return matchedName;
    if (license.userId && !license.userId.includes("@")) return license.userId;
    return license.userEmail.split("@")[0] || license.userEmail;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="rounded-[18px] border border-[#e7eaf3] bg-white shadow-[0_18px_40px_rgba(18,24,40,0.05)]">
        <CardContent className="p-3">
          <h3 className="text-lg font-semibold">가입 도메인 지정</h3>
          <p className="mt-2 text-sm text-slate-500">지정한 여러 도메인의 Google 계정만 회원 가입 및 로그인할 수 있습니다.</p>
          <div className="mt-5 space-y-2">
            <label className="block text-sm font-medium text-slate-700">허용 도메인 추가</label>
            <div className="flex gap-2">
              <Input
                className="h-11 rounded-[10px]"
                value={domainInput}
                onChange={(event) => setDomainInput(event.target.value)}
                placeholder="company.com"
              />
              <Button className="h-11 rounded-[10px]" onClick={handleAddDomain}>
                추가
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {allowedDomains.map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => handleRemoveDomain(domain)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
                title="클릭해서 삭제"
              >
                {domain} x
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[18px] border border-[#e7eaf3] bg-white shadow-[0_18px_40px_rgba(18,24,40,0.05)]">
        <CardContent className="p-3">
          <h3 className="text-lg font-semibold">세션 타임아웃</h3>
          <p className="mt-2 text-sm text-slate-500">사용자의 비활성 시간이 일정 시간을 초과하면 자동 로그아웃 처리합니다.</p>
          <div className="mt-5 space-y-2">
            <label className="block text-sm font-medium text-slate-700">타임아웃 시간</label>
            <select
              className="h-11 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm outline-none"
              value={sessionTimeout}
              onChange={(event) => setSessionTimeout(event.target.value)}
            >
              <option>15분</option>
              <option>30분</option>
              <option>60분</option>
              <option>120분</option>
            </select>
          </div>
          <Button className="mt-4 rounded-[10px]">타임아웃 저장</Button>
        </CardContent>
      </Card>

      <Card className="rounded-[18px] border border-[#e7eaf3] bg-white shadow-[0_18px_40px_rgba(18,24,40,0.05)] lg:col-span-2">
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Google Workspace 라이선스 업로드</h3>
              <p className="mt-2 text-sm text-slate-500">
                Admin 콘솔에서 내보낸 CSV/XLSX 파일을 업로드해서 현재 할당된 라이선스 목록을 기준 데이터로 반영합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleLicenseFileChange}
              />
              <Button
                className="rounded-[10px]"
                onClick={() => fileInputRef.current?.click()}
                disabled={isGoogleWorkspaceImporting}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {isGoogleWorkspaceImporting ? "업로드 중..." : "CSV/XLSX 업로드"}
              </Button>
              <Button className="rounded-[10px]" onClick={onGoogleWorkspaceSync} disabled={isGoogleWorkspaceSyncing}>
                {isGoogleWorkspaceSyncing ? "동기화 중..." : "API 동기화"}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">최근 동기화</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{latestSyncedLabel}</p>
            </div>
            <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">동기화 상태</p>
              <div className="mt-1">
                <Badge className={googleWorkspaceLicenseRun?.status === "success" ? "bg-emerald-100 text-emerald-700" : googleWorkspaceLicenseRun?.status === "error" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}>
                  {googleWorkspaceLicenseRun?.status === "success" ? "성공" : googleWorkspaceLicenseRun?.status === "error" ? "실패" : googleWorkspaceLicenseRun?.status === "running" ? "진행 중" : "미실행"}
                </Badge>
              </div>
            </div>
            <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">최근 스냅샷 수</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {googleWorkspaceLicenseRun?.totalAssignments ?? googleWorkspaceLicenses.length}건
              </p>
            </div>
          </div>

          {googleWorkspaceLicenseRun?.errorMessage && (
            <div className="mt-4 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {googleWorkspaceLicenseRun.errorMessage}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-[12px] border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-center">이름</TableHead>
                  <TableHead className="text-center">사용자 이메일</TableHead>
                  <TableHead className="text-center">SKU</TableHead>
                  <TableHead className="text-center">SKU ID</TableHead>
                  <TableHead className="text-center">Product ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {googleWorkspaceLicenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500">
                      아직 동기화된 Google Workspace 라이선스가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
                {pageItems.map((license) => (
                  <TableRow key={license.id} className="hover:bg-slate-50/80">
                    <TableCell className="text-center"><AutoFitText value={getLicenseDisplayName(license)} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={license.userEmail} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={license.skuName || "-"} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={license.skuId} /></TableCell>
                    <TableCell className="text-center"><AutoFitText value={license.productId} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>
    </div>
  );
}

export function AssetPolicySettingsForm({
  settings,
  onSave,
}: {
  settings: AssetPolicySettings;
  onSave: (settings: AssetPolicySettings) => void;
}) {
  const getNormalizedPrefixMap = (categories: string[], current: Record<string, string>, fallback: string) =>
    Object.fromEntries(categories.map((category) => [category, current[category] || fallback]));

  const [draft, setDraft] = useState({
    hardwareCategories: settings.hardwareCategories.join(", "),
    softwareCategories: settings.softwareCategories.join(", "),
    hardwarePrefix: settings.hardwarePrefix,
    softwarePrefix: settings.softwarePrefix,
    hardwareCategoryPrefixes: getNormalizedPrefixMap(settings.hardwareCategories, settings.hardwareCategoryPrefixes, settings.hardwarePrefix),
    softwareCategoryPrefixes: getNormalizedPrefixMap(settings.softwareCategories, settings.softwareCategoryPrefixes, settings.softwarePrefix),
    sequenceDigits: String(settings.sequenceDigits),
  });

  useEffect(() => {
    setDraft({
      hardwareCategories: settings.hardwareCategories.join(", "),
      softwareCategories: settings.softwareCategories.join(", "),
      hardwarePrefix: settings.hardwarePrefix,
      softwarePrefix: settings.softwarePrefix,
      hardwareCategoryPrefixes: getNormalizedPrefixMap(settings.hardwareCategories, settings.hardwareCategoryPrefixes, settings.hardwarePrefix),
      softwareCategoryPrefixes: getNormalizedPrefixMap(settings.softwareCategories, settings.softwareCategoryPrefixes, settings.softwarePrefix),
      sequenceDigits: String(settings.sequenceDigits),
    });
  }, [settings]);

  const handleSave = () => {
    const hardwareCategories = draft.hardwareCategories.split(",").map((item) => item.trim()).filter(Boolean);
    const softwareCategories = draft.softwareCategories.split(",").map((item) => item.trim()).filter(Boolean);

    onSave({
      hardwareCategories,
      softwareCategories,
      hardwarePrefix: draft.hardwarePrefix.trim() || "H",
      softwarePrefix: draft.softwarePrefix.trim() || "S",
      hardwareCategoryPrefixes: getNormalizedPrefixMap(hardwareCategories, draft.hardwareCategoryPrefixes, draft.hardwarePrefix.trim() || "H"),
      softwareCategoryPrefixes: getNormalizedPrefixMap(softwareCategories, draft.softwareCategoryPrefixes, draft.softwarePrefix.trim() || "S"),
      sequenceDigits: Math.max(1, Number(draft.sequenceDigits) || 3),
    });
  };

  const hardwareCategories = draft.hardwareCategories.split(",").map((item) => item.trim()).filter(Boolean);
  const softwareCategories = draft.softwareCategories.split(",").map((item) => item.trim()).filter(Boolean);

  return (
    <Card className="rounded-[10px] border-slate-200 bg-white shadow-sm">
      <CardContent className="space-y-4 p-3">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4 rounded-[10px] border border-slate-200 bg-slate-50 p-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">하드웨어 카테고리</label>
              <Input
                className="mt-2 h-9 rounded-[10px] bg-white text-xs"
                value={draft.hardwareCategories}
                onChange={(event) => setDraft((prev) => ({ ...prev, hardwareCategories: event.target.value }))}
                placeholder="모니터, 랩탑, 데스크탑"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">하드웨어 기본 Prefix</label>
              <Input
                className="mt-2 h-9 rounded-[10px] bg-white text-xs"
                value={draft.hardwarePrefix}
                onChange={(event) => setDraft((prev) => ({ ...prev, hardwarePrefix: event.target.value }))}
                placeholder="H"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">하드웨어 카테고리별 ID Prefix</label>
              <div className="grid gap-3 md:grid-cols-1 xl:grid-cols-2">
                {hardwareCategories.map((category) => (
                  <div key={category} className="space-y-2">
                    <label className="block text-xs font-medium text-slate-500">{category}</label>
                    <Input
                      className="h-9 rounded-[10px] bg-white text-xs"
                      value={draft.hardwareCategoryPrefixes[category] ?? draft.hardwarePrefix}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          hardwareCategoryPrefixes: { ...prev.hardwareCategoryPrefixes, [category]: event.target.value },
                        }))
                      }
                      placeholder={draft.hardwarePrefix || "H"}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4 rounded-[10px] border border-slate-200 bg-slate-50 p-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">소프트웨어 카테고리</label>
              <Input
                className="mt-2 h-9 rounded-[10px] bg-white text-xs"
                value={draft.softwareCategories}
                onChange={(event) => setDraft((prev) => ({ ...prev, softwareCategories: event.target.value }))}
                placeholder="OS, 데이터베이스, 보안"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">소프트웨어 기본 Prefix</label>
              <Input
                className="mt-2 h-9 rounded-[10px] bg-white text-xs"
                value={draft.softwarePrefix}
                onChange={(event) => setDraft((prev) => ({ ...prev, softwarePrefix: event.target.value }))}
                placeholder="S"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">소프트웨어 카테고리별 ID Prefix</label>
              <div className="grid gap-3 md:grid-cols-1 xl:grid-cols-2">
                {softwareCategories.map((category) => (
                  <div key={category} className="space-y-2">
                    <label className="block text-xs font-medium text-slate-500">{category}</label>
                    <Input
                      className="h-9 rounded-[10px] bg-white text-xs"
                      value={draft.softwareCategoryPrefixes[category] ?? draft.softwarePrefix}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          softwareCategoryPrefixes: { ...prev.softwareCategoryPrefixes, [category]: event.target.value },
                        }))
                      }
                      placeholder={draft.softwarePrefix || "S"}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-medium text-slate-700">시퀀스 자릿수</label>
            <Input
              type="number"
              min={1}
              className="h-9 rounded-[10px] text-xs"
              value={draft.sequenceDigits}
              onChange={(event) => setDraft((prev) => ({ ...prev, sequenceDigits: event.target.value }))}
              placeholder="3"
            />
          </div>
        </div>
        <div className="rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          예시 ID: {(draft.hardwareCategoryPrefixes[hardwareCategories[0]] || draft.hardwarePrefix || "H")}-{String(1).padStart(Math.max(1, Number(draft.sequenceDigits) || 3), "0")} /{" "}
          {(draft.softwareCategoryPrefixes[softwareCategories[0]] || draft.softwarePrefix || "S")}-{String(1).padStart(Math.max(1, Number(draft.sequenceDigits) || 3), "0")}
        </div>
        <div className="flex justify-end">
          <Button className="h-9 rounded-[10px] px-3 text-xs" onClick={handleSave}>
            자산 설정 저장
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AssetRegistrationModal({
  assetType,
  open,
  onClose,
  onAssetTypeChange,
  onSave,
  policySettings,
}: {
  assetType: AssetType;
  open: boolean;
  onClose: () => void;
  onAssetTypeChange: (value: AssetType) => void;
  onSave: (draft: AssetDraft, assetType: AssetType) => void;
  policySettings: AssetPolicySettings;
}) {
  const [draft, setDraft] = useState<AssetDraft>({
    name: "",
    category: assetType === "hardware" ? policySettings.hardwareCategories[0] ?? "모니터" : policySettings.softwareCategories[0] ?? "OS",
    status: assetType === "hardware" ? "유휴" : "운영",
    unitPrice: 0,
    acquiredAt: "",
    totalQuantity: 1,
    availableQuantity: 1,
    quantity: 1,
    note: "",
  });

  useEffect(() => {
    if (!open) return;

    setDraft({
      name: "",
      category: assetType === "hardware" ? policySettings.hardwareCategories[0] ?? "모니터" : policySettings.softwareCategories[0] ?? "OS",
      status: assetType === "hardware" ? "유휴" : "운영",
      unitPrice: 0,
      acquiredAt: "",
      totalQuantity: 1,
      availableQuantity: 1,
      quantity: 1,
      note: "",
    });
  }, [assetType, open, policySettings]);

  if (!open) return null;

  const handleSave = () => {
    const trimmedName = draft.name.trim();
    if (!trimmedName) return;

    onSave(
      {
        name: trimmedName,
        category: draft.category,
        status: draft.status,
        unitPrice: draft.unitPrice,
        acquiredAt: draft.acquiredAt || undefined,
        totalQuantity: draft.totalQuantity,
        availableQuantity: draft.availableQuantity,
        quantity: draft.quantity,
        note: draft.note?.trim() || undefined,
      },
      assetType
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-xl rounded-[10px] bg-white p-3 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">자산 등록</h2>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>

        <div className="space-y-3">
          <FormRow label="자산 유형">
            <select
              className="h-11 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm outline-none"
              value={assetType}
              onChange={(event) => onAssetTypeChange(event.target.value as AssetType)}
            >
              <option value="hardware">하드웨어</option>
              <option value="software">소프트웨어</option>
            </select>
          </FormRow>

          <FormRow label="자산명">
            <Input
              placeholder="예: 맥북 프로 16형"
              className="h-11 rounded-[10px]"
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
            />
          </FormRow>

          <FormRow label="단가">
            <Input
              type="number"
              min={0}
              placeholder="예: 3200000"
              className="h-11 rounded-[10px]"
              value={String(draft.unitPrice)}
              onChange={(event) => setDraft((prev) => ({ ...prev, unitPrice: Math.max(0, Number(event.target.value) || 0) }))}
            />
          </FormRow>

          {assetType === "hardware" && (
            <FormRow label="도입일">
              <Input
                type="date"
                className="h-11 rounded-[10px]"
                value={draft.acquiredAt ?? ""}
                onChange={(event) => setDraft((prev) => ({ ...prev, acquiredAt: event.target.value }))}
              />
            </FormRow>
          )}

          <FormRow label={assetType === "hardware" ? "수량" : "전체 수량"}>
            <Input
              type="number"
              min={1}
              placeholder="예: 10"
              className="h-11 rounded-[10px]"
              value={String(draft.quantity)}
              onChange={(event) => setDraft((prev) => ({ ...prev, quantity: Math.max(1, Number(event.target.value) || 1) }))}
            />
          </FormRow>

          <FormRow label="카테고리">
            <select
              className="h-11 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm outline-none"
              value={draft.category}
              onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
            >
              {assetType === "hardware"
                ? policySettings.hardwareCategories.map((category) => <option key={category}>{category}</option>)
                : policySettings.softwareCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </FormRow>

          {assetType === "hardware" && (
            <div className="rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              하드웨어 감가 금액은 사용 연한 5년 기준으로 계산됩니다. 도입일 또는 도입가가 없으면 목록에
              <span className="ml-1 font-medium text-rose-600">도입일 및 도입가 필요</span>
              로 표시됩니다.
            </div>
          )}

          <div className="min-h-[316px] space-y-3">
            {assetType === "hardware" ? (
              <>
                <FormRow label="시리얼 번호">
                  <Input placeholder="예: C02ABC123XYZ" className="h-11 rounded-[10px]" />
                </FormRow>
                <FormRow label="모델">
                  <Input placeholder="예: MacBook Pro 16" className="h-11 rounded-[10px]" />
                </FormRow>
                <FormRow label="제조사">
                  <Input placeholder="예: Apple" className="h-11 rounded-[10px]" />
                </FormRow>
                <FormRow label="위치">
                  <Input placeholder="예: 본사 3층 자산실" className="h-11 rounded-[10px]" />
                </FormRow>
              </>
            ) : (
              <>
                <FormRow label="라이선스 키">
                  <Input placeholder="예: XXXX-XXXX-XXXX" className="h-11 rounded-[10px]" />
                </FormRow>
                <FormRow label="벤더">
                  <Input placeholder="예: Microsoft" className="h-11 rounded-[10px]" />
                </FormRow>
                <FormRow label="버전">
                  <Input placeholder="예: 2025.1" className="h-11 rounded-[10px]" />
                </FormRow>
                <FormRow label="사용 수량">
                  <Input placeholder="예: 50" className="h-11 rounded-[10px]" />
                </FormRow>
                <FormRow label="만료일">
                  <Input placeholder="예: 2027-12-31" className="h-11 rounded-[10px]" />
                </FormRow>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!draft.name.trim()}>
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}

function FormRow({ label, children, stacked = false }: { label: string; children: ReactNode; stacked?: boolean }) {
  return (
    <div className={stacked ? "space-y-1.5 bg-white p-3" : "grid items-center gap-3 grid-cols-[120px_minmax(0,1fr)] bg-white p-3 md:grid-cols-[140px_minmax(0,1fr)]"}>
      <label className={stacked ? "text-sm font-semibold text-slate-800" : "text-sm font-medium text-slate-700"}>{label}</label>
      <div>{children}</div>
    </div>
  );
}

type PairRow = {
  key: string;
  label: string;
  input: ReactNode;
  sample: string;
};

function PairedFormGrid({ description, rows }: { description: string; rows: PairRow[] }) {
  return (
    <div className="h-full space-y-2">
      <div className="grid h-full w-full gap-2 lg:grid-cols-2">
        <div className="overflow-y-auto rounded-[8px] border border-slate-200">
          <div className="grid gap-px bg-slate-200">
            <RegistrationHeaderRow description="실제 입력값입니다. 왼쪽에서 등록하거나 할당할 값을 입력합니다." />
            {rows.map((row) => (
              <RegistrationRow key={row.key} label={row.label}>
                {row.input}
              </RegistrationRow>
            ))}
          </div>
        </div>
        <div className="rounded-[12px] border border-slate-900 bg-slate-900 p-2 shadow-sm">
          <div className="h-full overflow-y-auto rounded-[10px] border border-slate-700 bg-white">
            <div className="grid gap-px bg-slate-200">
              <SampleHeaderRow description={description} />
              {rows.map((row) => (
                <ExampleRow key={row.key} label={row.label} value={row.sample} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegistrationHeaderRow({ description }: { description: string }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-px bg-slate-200">
      <div className="bg-slate-900 px-2.5 pt-1.5 pb-1 text-center text-sm font-semibold whitespace-nowrap text-slate-100">INPUT</div>
      <div className="bg-slate-50 px-2.5 pt-1.5 pb-1 text-left text-xs leading-4 text-slate-600">{description}</div>
    </div>
  );
}

function SampleHeaderRow({ description }: { description: string }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-px bg-slate-700">
      <div className="bg-slate-900 px-2.5 pt-1.5 pb-1 text-center text-sm font-semibold whitespace-nowrap text-slate-100">SAMPLE</div>
      <div className="bg-slate-900 px-2.5 pt-1.5 pb-1 text-left text-xs leading-4 text-slate-300">{description}</div>
    </div>
  );
}

function ExampleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-px bg-slate-200">
      <div className="flex min-h-[30px] items-center justify-center bg-slate-50 px-2.5 py-1 text-center text-sm font-semibold whitespace-nowrap text-slate-700">{label}</div>
      <div className="flex min-h-[30px] items-center bg-white px-2.5 py-1 text-sm font-medium leading-5 text-rose-600">{value}</div>
    </div>
  );
}

function RegistrationRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-px bg-slate-200">
      <div className="flex items-center justify-center bg-slate-50 px-2.5 py-1 text-center text-sm font-semibold whitespace-nowrap text-slate-700">{label}</div>
      <div className="flex min-h-[30px] items-center bg-white px-2.5 py-1 text-sm">{children}</div>
    </div>
  );
}

function usePagedData<T>(data: readonly T[], pageSize: number = TABLE_PAGE_SIZE) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = data.slice(startIndex, startIndex + pageSize);

  return { pageItems, currentPage, totalPages, setCurrentPage };
}

function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-3 flex items-center justify-center gap-1">
      {Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        const active = page === currentPage;

        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`flex h-9 min-w-9 items-center justify-center rounded-[10px] px-3 text-sm ${
              active ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {page}
          </button>
        );
      })}
    </div>
  );
}

function AutoFitText({ value }: { value: string | number }) {
  const text = String(value);
  const sizeClass = text.length > 24 ? "text-[10px] leading-[14px]" : text.length > 14 ? "text-[11px] leading-[16px]" : "text-[12px] leading-[18px]";

  return (
    <span title={text} className={`block truncate whitespace-nowrap ${sizeClass}`}>
      {text}
    </span>
  );
}

function ExpiryDateText({ value }: { value?: string }) {
  const text = value || "-";
  const isNearExpiry = (() => {
    if (!value) return false;
    const expiry = new Date(value);
    if (Number.isNaN(expiry.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threshold = new Date(today);
    threshold.setMonth(threshold.getMonth() + 1);

    return expiry >= today && expiry <= threshold;
  })();

  return (
    <span
      title={text}
      className={`block truncate whitespace-nowrap text-[12px] leading-[18px] ${isNearExpiry ? "font-bold text-red-600" : ""}`}
    >
      {text}
    </span>
  );
}

function ExpiredStatusText({ expired }: { expired: boolean }) {
  return (
    <span
      className={`block truncate whitespace-nowrap text-[12px] leading-[18px] ${expired ? "font-bold text-red-600" : ""}`}
    >
      {expired ? "예" : "-"}
    </span>
  );
}

function ExpiredCountText({ value }: { value: number }) {
  const expired = value > 0;
  return (
    <span
      className={`block truncate whitespace-nowrap text-[12px] leading-[18px] ${expired ? "font-bold text-red-600" : ""}`}
    >
      {String(value)}
    </span>
  );
}
