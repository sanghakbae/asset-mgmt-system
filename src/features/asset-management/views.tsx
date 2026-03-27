import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
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
import { menuItems, settingMenus, usageData } from "./data";
import { canAccessSettingsMenu, canManageAccounts, canManageAssets, canOpenSettings, canViewMenu, getPageDescription, getPageTitle, getSearchPlaceholder, roleBadge, statusBadge } from "./utils";
import type {
  Asset,
  AssetDraft,
  AssetPolicySettings,
  AssetType,
  AssetUser,
  AuditLog,
  ImportedAssetRow,
  ImportedOrgMemberRow,
  Member,
  MenuKey,
  OrgMember,
  Role,
  SettingsMenuKey,
  ThemeKey,
  UserProfile,
} from "./types";

const TABLE_PAGE_SIZE = 25;

type LoginScreenProps = {
  onLogin: () => void;
  isLoading?: boolean;
  errorMessage?: string;
};

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
          <h2 className="text-xl font-semibold tracking-tight">Google 계정으로 로그인</h2>
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
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-slate-300 bg-white text-sm text-slate-900 hover:bg-slate-50"
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
  hardwareCount: number;
  softwareCount: number;
  memberCount: number;
  user: UserProfile;
  onToggleSidebar: () => void;
  onMenuSelect: (key: MenuKey) => void;
  onSettingsMenuSelect: (key: SettingsMenuKey) => void;
  onLogout: () => void;
};

export function Sidebar({
  menu,
  settingsMenu,
  isSidebarCollapsed,
  hardwareCount,
  softwareCount,
  memberCount,
  user,
  onToggleSidebar,
  onMenuSelect,
  onSettingsMenuSelect,
  onLogout,
}: SidebarProps) {
  const visibleMenuItems = menuItems.filter((item) => {
    if (item.key === "settings") return canOpenSettings(user.role);
    if (item.key === "register" || item.key === "user-register") return canManageAssets(user.role);
    return canViewMenu(user.role, item.key);
  });

  const visibleSettingMenus = settingMenus.filter((item) => canAccessSettingsMenu(user.role, item.key));

  return (
    <aside className="flex min-h-screen flex-col border-r border-slate-200 bg-[#eef2f7] shadow-[inset_-1px_0_0_rgba(148,163,184,0.18)] transition-all duration-200">
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

      <nav className="p-3">
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
              <SidebarMetric label="하드웨어" value={hardwareCount} />
              <SidebarMetric label="소프트웨어" value={softwareCount} />
              <SidebarMetric label="회원 수" value={memberCount} />
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
    menu === "hardware" || menu === "software" || menu === "usage" || (menu === "settings" && settingsMenu !== "security");

  return (
    <div className="rounded-[12px] border border-slate-700 bg-slate-800 p-2.5 shadow-[0_12px_28px_rgba(15,23,42,0.2)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="mt-0.5 text-[15px] font-semibold tracking-tight text-white">{getPageTitle(menu, settingsMenu)}</h2>
          <p className="mt-1.5 text-[11px] text-slate-200">{getPageDescription(menu, settingsMenu)}</p>
        </div>

        {showSearch && (
          <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-end">
            <div className="relative min-w-[224px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                className="h-9 rounded-[10px] border-white/20 bg-white pl-10 text-xs"
                placeholder={getSearchPlaceholder(menu, settingsMenu)}
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </div>
            {(menu === "hardware" || menu === "software") && canManageAssets(currentUserRole) && (
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
  onReclaim,
  assets,
  users,
}: {
  onRegister: (user: {
    name: string;
    email: string;
    department: string;
    position: string;
    assetId: string;
    assignedQuantity: number;
  }) => void;
  onReclaim: (userId: number) => void;
  assets: Asset[];
  users: AssetUser[];
}) {
  const { pageItems: pagedUsers, currentPage, totalPages, setCurrentPage } = usePagedData(users);
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    position: "",
    assetType: "hardware" as AssetType,
    assetId: assets[0]?.id ?? "",
    assignedQuantity: 1,
  });

  const selectableAssets = assets.filter((asset) => asset.type === form.assetType);

  useEffect(() => {
    if (!selectableAssets.some((asset) => asset.id === form.assetId) && selectableAssets[0]) {
      setForm((prev) => ({ ...prev, assetId: selectableAssets[0]!.id }));
    }
  }, [form.assetId, selectableAssets]);

  const reset = () =>
    setForm({
      name: "",
      email: "",
      department: "",
      position: "",
      assetType: "hardware",
      assetId: selectableAssets[0]?.id ?? "",
      assignedQuantity: 1,
    });

  const selectedAsset = selectableAssets.find((asset) => asset.id === form.assetId);

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim() || !form.department.trim() || !form.position.trim() || !selectedAsset) return;
    onRegister({
      name: form.name.trim(),
      email: form.email.trim(),
      department: form.department.trim(),
      position: form.position.trim(),
      assetId: form.assetId,
      assignedQuantity: form.assignedQuantity,
    });
    reset();
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-[10px] border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-4 p-3">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              placeholder="이름"
              className="h-11 rounded-[10px]"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <Input
              placeholder="이메일"
              className="h-11 rounded-[10px]"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <Input
              placeholder="부서"
              className="h-11 rounded-[10px]"
              value={form.department}
              onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
            />
            <Input
              placeholder="직책"
              className="h-11 rounded-[10px]"
              value={form.position}
              onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
            />
            <select
              className="h-11 rounded-[10px] border border-slate-200 bg-white px-3 text-sm outline-none"
              value={form.assetType}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  assetType: event.target.value as AssetType,
                  assetId: "",
                }))
              }
            >
              <option value="hardware">하드웨어</option>
              <option value="software">소프트웨어</option>
            </select>
            <select
              className="h-11 rounded-[10px] border border-slate-200 bg-white px-3 text-sm outline-none"
              value={form.assetId}
              onChange={(event) => setForm((prev) => ({ ...prev, assetId: event.target.value }))}
            >
              {selectableAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.id} / {asset.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min={1}
              max={selectedAsset?.quantity ?? 1}
              placeholder="차감 수량"
              className="h-11 rounded-[10px]"
              value={String(form.assignedQuantity)}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  assignedQuantity: Math.max(1, Number(event.target.value) || 1),
                }))
              }
            />
          </div>
          {selectedAsset && (
            <div className="rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              선택 자산 수량 (잔여수량: {selectedAsset.quantity ?? 0})
            </div>
          )}
          <div className="flex justify-end">
            <Button
              className="rounded-[10px]"
              onClick={handleSubmit}
              disabled={
                !form.name ||
                !form.email ||
                !form.department ||
                !form.position ||
                !selectedAsset ||
                form.assignedQuantity > (selectedAsset.quantity ?? 0)
              }
            >
              자산 사용자 등록
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[10px] border-slate-200 bg-white shadow-sm">
        <CardContent className="p-3">
          <div className="mb-3 rounded-[10px] bg-slate-800 px-4 py-3">
            <h3 className="text-base font-semibold text-white">자산 사용자 목록</h3>
            <p className="mt-1 text-sm text-slate-300">자산 할당 대상자를 조회하고 지급된 수량을 회수할 수 있습니다.</p>
          </div>
          <div className="overflow-hidden rounded-[10px] border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-center">이름</TableHead>
                  <TableHead className="text-center">이메일</TableHead>
                  <TableHead className="text-center">부서</TableHead>
                  <TableHead className="text-center">직책</TableHead>
                  <TableHead className="text-center">할당 자산</TableHead>
                  <TableHead className="text-center">차감 수량</TableHead>
                  <TableHead className="text-center">등록일</TableHead>
                  <TableHead className="text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/80">
                    <TableCell className="text-center font-medium">{user.name}</TableCell>
                    <TableCell className="text-center">{user.email}</TableCell>
                    <TableCell className="text-center">{user.department}</TableCell>
                    <TableCell className="text-center">{user.position}</TableCell>
                    <TableCell className="text-center">{user.assetName ?? "-"}</TableCell>
                    <TableCell className="text-center">{user.assignedQuantity ?? 0}</TableCell>
                    <TableCell className="text-center">{user.createdAt}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" className="h-8 rounded-[10px] px-3 text-xs" onClick={() => onReclaim(user.id)}>
                        회수
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
    </div>
  );
}

export function AssetRegistrationForm({
  assetType,
  onAssetTypeChange,
  onSave,
  assets,
  policySettings,
  onImportExcel,
  onExportExcel,
}: {
  assetType: AssetType;
  onAssetTypeChange: (value: AssetType) => void;
  onSave: (draft: AssetDraft, assetType: AssetType) => void;
  assets: Asset[];
  policySettings: AssetPolicySettings;
  onImportExcel: (rows: ImportedAssetRow[]) => void;
  onExportExcel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const filteredAssets = assets.filter((asset) => asset.type === assetType);
  const { pageItems: pagedAssets, currentPage, totalPages, setCurrentPage } = usePagedData(filteredAssets);
  const [draft, setDraft] = useState<AssetDraft>({
    name: "",
    category: assetType === "hardware" ? policySettings.hardwareCategories[0] ?? "노트북" : policySettings.softwareCategories[0] ?? "OS",
    unitPrice: 0,
    quantity: 1,
  });

  useEffect(() => {
    setDraft({
      name: "",
      category: assetType === "hardware" ? policySettings.hardwareCategories[0] ?? "노트북" : policySettings.softwareCategories[0] ?? "OS",
      unitPrice: 0,
      quantity: 1,
    });
  }, [assetType, policySettings]);

  const handleSave = () => {
    const trimmedName = draft.name.trim();
    if (!trimmedName) return;
    onSave({ ...draft, name: trimmedName }, assetType);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const { importAssetsFromExcel } = await import("@/services/excel");
    const importedRows = await importAssetsFromExcel(file);
    onImportExcel(importedRows);
    event.target.value = "";
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-[10px] border-slate-200 bg-white shadow-sm">
        <CardContent className="flex items-center justify-between gap-3 p-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">엑셀 Import / Export</h3>
            <p className="mt-1 text-sm text-slate-500">자산 목록을 엑셀로 가져오거나 내보낼 수 있습니다.</p>
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
        <CardContent className="space-y-3 p-3">
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
              className="h-11 border-slate-200"
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
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

          <FormRow label="단가">
            <Input
              type="number"
              min={0}
              placeholder="예: 3200000"
              className="h-11 border-slate-200"
              value={String(draft.unitPrice)}
              onChange={(event) => setDraft((prev) => ({ ...prev, unitPrice: Math.max(0, Number(event.target.value) || 0) }))}
            />
          </FormRow>

          <FormRow label="수량">
            <Input
              type="number"
              min={1}
              placeholder="예: 10"
              className="h-11 border-slate-200"
              value={String(draft.quantity)}
              onChange={(event) => setDraft((prev) => ({ ...prev, quantity: Math.max(1, Number(event.target.value) || 1) }))}
            />
          </FormRow>

          <div className="flex justify-end">
            <Button className="rounded-[10px]" onClick={handleSave} disabled={!draft.name.trim()}>
              자산 등록
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[10px] border-slate-200 bg-white shadow-sm">
        <CardContent className="p-3">
          <div className="mb-3 rounded-[10px] bg-slate-800 px-4 py-3">
            <h3 className="text-base font-semibold text-white">{assetType === "hardware" ? "하드웨어 자산 목록" : "소프트웨어 자산 목록"}</h3>
            <p className="mt-1 text-sm text-slate-300">등록된 자산 목록입니다.</p>
          </div>
          <div className="overflow-hidden rounded-[10px] border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-center">ID</TableHead>
                  <TableHead className="text-center">이름</TableHead>
                  <TableHead className="text-center">카테고리</TableHead>
                  <TableHead className="text-center">단가</TableHead>
                  <TableHead className="text-center">수량</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedAssets.map((asset) => (
                  <TableRow key={`register-${asset.id}`} className="hover:bg-slate-50/80">
                    <TableCell className="text-center">{asset.id}</TableCell>
                    <TableCell className="text-center">{asset.name}</TableCell>
                    <TableCell className="text-center">{asset.category}</TableCell>
                    <TableCell className="text-center">{(asset.unitPrice ?? 0).toLocaleString()}원</TableCell>
                    <TableCell className="text-center">수량 (잔여수량: {asset.quantity ?? 0})</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`rounded-full ${statusBadge(asset.status)}`}>
                        {asset.status}
                      </Badge>
                    </TableCell>
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

export function OrgMemberManagement({
  data,
  onImportExcel,
  onExportExcel,
}: {
  data: OrgMember[];
  onImportExcel: (rows: ImportedOrgMemberRow[]) => void;
  onExportExcel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { pageItems: pagedMembers, currentPage, totalPages, setCurrentPage } = usePagedData(data);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const { importOrgMembersFromExcel } = await import("@/services/excel");
    const importedRows = await importOrgMembersFromExcel(file);
    onImportExcel(importedRows);
    event.target.value = "";
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedMembers.map((member) => (
                  <TableRow key={member.id} className="hover:bg-slate-50/80">
                    <TableCell className="text-center font-medium">{member.name}</TableCell>
                    <TableCell className="text-center">{member.position || "-"}</TableCell>
                    <TableCell className="text-center">{member.category}</TableCell>
                    <TableCell className="text-center">{member.cell}</TableCell>
                    <TableCell className="text-center">{member.unit}</TableCell>
                    <TableCell className="text-center">{member.part}</TableCell>
                    <TableCell className="text-center">{member.location}</TableCell>
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

export function SummaryCardGrid({
  hardwareCount,
  softwareCount,
  usageCount,
  registerCount,
  assetUserCount,
}: {
  hardwareCount: number;
  softwareCount: number;
  usageCount: number;
  registerCount: number;
  assetUserCount: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <SummaryCard title="하드웨어 자산" subtitle="Physical inventory" value={hardwareCount} icon={<Laptop className="h-5 w-5" />} tone="indigo" />
      <SummaryCard title="소프트웨어 자산" subtitle="Licenses and tools" value={softwareCount} icon={<AppWindow className="h-5 w-5" />} tone="sky" />
      <SummaryCard title="자산 사용 현황" subtitle="Assigned assets" value={usageCount} icon={<Package className="h-5 w-5" />} tone="emerald" />
      <SummaryCard title="자산 등록" subtitle="Registered assets" value={registerCount} icon={<Plus className="h-5 w-5" />} tone="amber" />
      <SummaryCard title="자산 사용자 관리" subtitle="Managed assignees" value={assetUserCount} icon={<UserCircle2 className="h-5 w-5" />} tone="rose" />
    </div>
  );
}

type DashboardAssetListsProps = {
  assets: Asset[];
};

export function DashboardAssetLists({ assets }: DashboardAssetListsProps) {
  const hardwareAssets = assets.filter((asset) => asset.type === "hardware").slice(0, 10);
  const softwareAssets = assets.filter((asset) => asset.type === "software").slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <DashboardAssetTable title="하드웨어 목록" subtitle="최대 10개" assets={hardwareAssets} />
        <DashboardAssetTable title="소프트웨어 목록" subtitle="최대 10개" assets={softwareAssets} />
      </div>
    </div>
  );
}

function DashboardAssetTable({ title, subtitle, assets }: { title: string; subtitle: string; assets: Asset[] }) {
  return (
    <Card className="rounded-[18px] border border-[#e7eaf3] bg-white shadow-[0_18px_40px_rgba(18,24,40,0.05)]">
      <CardContent className="p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#16191f]">{title}</h3>
            <p className="mt-1 text-xs text-[#7a8599]">{subtitle}</p>
          </div>
          <div className="rounded-[12px] bg-[#eef2ff] px-3 py-1.5 text-[11px] font-medium text-[#4b57d1]">Overview</div>
        </div>
        <div className="overflow-hidden rounded-[10px] border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-[88px] text-center">ID</TableHead>
                <TableHead className="w-[140px] text-center">이름</TableHead>
                <TableHead className="w-[96px] text-center">카테고리</TableHead>
                <TableHead className="w-[120px] text-center">수량</TableHead>
                <TableHead className="w-[88px] text-center">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={`${title}-${asset.id}`} className="hover:bg-slate-50/80">
                  <TableCell className="text-center"><AutoFitText value={asset.id} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={asset.name} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={asset.category} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={`수량 (잔여수량: ${asset.quantity ?? 0})`} /></TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`rounded-full ${statusBadge(asset.status)}`}>
                      {asset.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  title,
  subtitle,
  value,
  icon,
  tone,
}: {
  title: string;
  subtitle: string;
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
            <p className={`text-[11px] uppercase tracking-[0.16em] ${styles.subtext}`}>{subtitle}</p>
            <h3 className={`mt-3 text-lg font-semibold ${styles.text}`}>{title}</h3>
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

export function AssetTable({ data }: { data: readonly Asset[] }) {
  const { pageItems, currentPage, totalPages, setCurrentPage } = usePagedData(data);

  return (
    <Card className="rounded-[10px] border border-slate-200 bg-white shadow-sm">
      <CardContent className="p-3">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-slate-900">자산 목록</h3>
          <p className="mt-1 text-sm text-slate-500">등록된 자산을 조회합니다.</p>
        </div>
        <div className="overflow-hidden rounded-[10px] border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-[92px] text-center">ID</TableHead>
                <TableHead className="w-[160px] text-center">이름</TableHead>
                <TableHead className="w-[110px] text-center">카테고리</TableHead>
                <TableHead className="w-[110px] text-center">단가</TableHead>
                <TableHead className="w-[140px] text-center">수량</TableHead>
                <TableHead className="w-[92px] text-center">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((asset) => (
                <TableRow key={asset.id} className="hover:bg-slate-50/80">
                  <TableCell className="text-center"><AutoFitText value={asset.id} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={asset.name} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={asset.category} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={`${(asset.unitPrice ?? 0).toLocaleString()}원`} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={`수량 (잔여수량: ${asset.quantity ?? 0})`} /></TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`rounded-full ${statusBadge(asset.status)}`}>
                      {asset.status}
                    </Badge>
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

export function MemberTable({
  data,
  onRoleChange,
  currentUserRole,
}: {
  data: Member[];
  onRoleChange: (id: number, role: Role) => void;
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
                <TableHead className="w-[96px] text-center">부서</TableHead>
                <TableHead className="text-center">권한</TableHead>
                <TableHead className="w-[100px] text-center">가입일</TableHead>
                <TableHead className="w-[120px] text-center">최종 접속일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((member) => (
                <TableRow key={member.id} className="hover:bg-slate-50/80">
                  <TableCell className="text-center font-medium"><AutoFitText value={member.name} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={member.email} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={member.department} /></TableCell>
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
                <TableHead className="w-[130px] text-center">발생 일시</TableHead>
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

export function UsageTable({ search }: { search: string }) {
  const lowered = search.toLowerCase();
  const filteredUsage = usageData.filter((item) =>
    [item.name, item.assignee, item.department, item.usageStatus].some((value) => value.toLowerCase().includes(lowered))
  );
  const { pageItems, currentPage, totalPages, setCurrentPage } = usePagedData(filteredUsage);

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
                <TableHead className="w-[92px] text-center">자산 ID</TableHead>
                <TableHead className="w-[150px] text-center">자산명</TableHead>
                <TableHead className="w-[90px] text-center">자산 유형</TableHead>
                <TableHead className="w-[100px] text-center">사용자</TableHead>
                <TableHead className="w-[100px] text-center">부서</TableHead>
                <TableHead className="w-[90px] text-center">사용 상태</TableHead>
                <TableHead className="w-[130px] text-center">등록 일시</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((item) => (
                <TableRow key={`${item.id}-${item.assignee}`} className="hover:bg-slate-50/80">
                  <TableCell className="text-center"><AutoFitText value={item.id} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={item.name} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={item.type} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={item.assignee} /></TableCell>
                  <TableCell className="text-center"><AutoFitText value={item.department} /></TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`rounded-full ${statusBadge(item.usageStatus)}`}>
                      {item.usageStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center"><AutoFitText value={item.createdAt} /></TableCell>
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

export function SecuritySettings({
  allowedDomains,
  sessionTimeout,
  setAllowedDomains,
  setSessionTimeout,
}: {
  allowedDomains: string[];
  sessionTimeout: string;
  setAllowedDomains: (value: string[]) => void;
  setSessionTimeout: (value: string) => void;
}) {
  const [domainInput, setDomainInput] = useState("");

  const handleAddDomain = () => {
    const nextDomain = domainInput.trim().toLowerCase();
    if (!nextDomain || allowedDomains.includes(nextDomain)) return;
    setAllowedDomains([...allowedDomains, nextDomain]);
    setDomainInput("");
  };

  const handleRemoveDomain = (domain: string) => {
    setAllowedDomains(allowedDomains.filter((item) => item !== domain));
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
  const [draft, setDraft] = useState({
    hardwareCategories: settings.hardwareCategories.join(", "),
    softwareCategories: settings.softwareCategories.join(", "),
    hardwarePrefix: settings.hardwarePrefix,
    softwarePrefix: settings.softwarePrefix,
    sequenceDigits: String(settings.sequenceDigits),
  });

  useEffect(() => {
    setDraft({
      hardwareCategories: settings.hardwareCategories.join(", "),
      softwareCategories: settings.softwareCategories.join(", "),
      hardwarePrefix: settings.hardwarePrefix,
      softwarePrefix: settings.softwarePrefix,
      sequenceDigits: String(settings.sequenceDigits),
    });
  }, [settings]);

  const handleSave = () => {
    onSave({
      hardwareCategories: draft.hardwareCategories.split(",").map((item) => item.trim()).filter(Boolean),
      softwareCategories: draft.softwareCategories.split(",").map((item) => item.trim()).filter(Boolean),
      hardwarePrefix: draft.hardwarePrefix.trim() || "H",
      softwarePrefix: draft.softwarePrefix.trim() || "S",
      sequenceDigits: Math.max(1, Number(draft.sequenceDigits) || 3),
    });
  };

  return (
    <Card className="rounded-[10px] border-slate-200 bg-white shadow-sm">
      <CardContent className="space-y-4 p-3">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">하드웨어 카테고리</label>
            <Input
              className="h-11 rounded-[10px]"
              value={draft.hardwareCategories}
              onChange={(event) => setDraft((prev) => ({ ...prev, hardwareCategories: event.target.value }))}
              placeholder="노트북, 서버, 네트워크"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">소프트웨어 카테고리</label>
            <Input
              className="h-11 rounded-[10px]"
              value={draft.softwareCategories}
              onChange={(event) => setDraft((prev) => ({ ...prev, softwareCategories: event.target.value }))}
              placeholder="OS, 데이터베이스, 보안"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">하드웨어 ID Prefix</label>
            <Input
              className="h-11 rounded-[10px]"
              value={draft.hardwarePrefix}
              onChange={(event) => setDraft((prev) => ({ ...prev, hardwarePrefix: event.target.value }))}
              placeholder="H"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">소프트웨어 ID Prefix</label>
            <Input
              className="h-11 rounded-[10px]"
              value={draft.softwarePrefix}
              onChange={(event) => setDraft((prev) => ({ ...prev, softwarePrefix: event.target.value }))}
              placeholder="S"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">시퀀스 자릿수</label>
            <Input
              type="number"
              min={1}
              className="h-11 rounded-[10px]"
              value={draft.sequenceDigits}
              onChange={(event) => setDraft((prev) => ({ ...prev, sequenceDigits: event.target.value }))}
              placeholder="3"
            />
          </div>
        </div>
        <div className="rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          예시 ID: {draft.hardwarePrefix || "H"}-{String(1).padStart(Math.max(1, Number(draft.sequenceDigits) || 3), "0")} /{" "}
          {draft.softwarePrefix || "S"}-{String(1).padStart(Math.max(1, Number(draft.sequenceDigits) || 3), "0")}
        </div>
        <div className="flex justify-end">
          <Button className="rounded-[10px]" onClick={handleSave}>
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
    category: assetType === "hardware" ? policySettings.hardwareCategories[0] ?? "노트북" : policySettings.softwareCategories[0] ?? "OS",
    unitPrice: 0,
    quantity: 1,
  });

  useEffect(() => {
    if (!open) return;

    setDraft({
      name: "",
      category: assetType === "hardware" ? policySettings.hardwareCategories[0] ?? "노트북" : policySettings.softwareCategories[0] ?? "OS",
      unitPrice: 0,
      quantity: 1,
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
        unitPrice: draft.unitPrice,
        quantity: draft.quantity,
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

          <FormRow label="수량">
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

function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid items-center gap-3 md:grid-cols-[140px_minmax(0,1fr)]">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div>{children}</div>
    </div>
  );
}

function usePagedData<T>(data: readonly T[]) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / TABLE_PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const startIndex = (currentPage - 1) * TABLE_PAGE_SIZE;
  const pageItems = data.slice(startIndex, startIndex + TABLE_PAGE_SIZE);

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
            className={`flex h-8 min-w-8 items-center justify-center rounded-[10px] px-2 text-xs ${
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
  const textSizeClass = text.length > 24 ? "text-[11px]" : text.length > 14 ? "text-xs" : "text-sm";

  return (
    <span title={text} className={`block truncate leading-4 ${textSizeClass}`}>
      {text}
    </span>
  );
}
