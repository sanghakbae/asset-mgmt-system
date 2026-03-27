import { useEffect, useMemo, useState } from "react";
import { defaultAssetPolicySettings, mockAssetUsers, mockAssets, mockAuditLogs, mockMembers, mockOrgMembers } from "@/features/asset-management/data";
import {
  AssetRegistrationForm,
  AssetTable,
  AuditLogTable,
  DashboardAssetLists,
  LoginScreen,
  MemberTable,
  OrgMemberManagement,
  PageHeader,
  AssetPolicySettingsForm,
  SecuritySettings,
  Sidebar,
  SummaryCardGrid,
  UserRegistrationForm,
  UsageTable,
} from "@/features/asset-management/views";
import { canAccessSettingsMenu, canManageAssets, canOpenSettings, canViewMenu, getNextAssetId } from "@/features/asset-management/utils";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createAsset, listAssets } from "@/services/assets";
import { exportAssetsToExcel, exportOrgMembersToExcel } from "@/services/excel";
import type { Asset, AssetDraft, AssetPolicySettings, AssetType, AssetUser, ImportedAssetRow, ImportedOrgMemberRow, Member, MenuKey, OrgMember, Role, SettingsMenuKey } from "@/features/asset-management/types";

export default function App() {
  const [search, setSearch] = useState("");
  const [assets, setAssets] = useState<Asset[]>([...mockAssets]);
  const [assetsError, setAssetsError] = useState<string>("");
  const [isAssetsLoading, setIsAssetsLoading] = useState(false);
  const [menu, setMenu] = useState<MenuKey>("hardware");
  const [settingsMenu, setSettingsMenu] = useState<SettingsMenuKey>("members");
  const [assetType, setAssetType] = useState<AssetType>("hardware");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState<string[]>(["company.com"]);
  const [sessionTimeout, setSessionTimeout] = useState("60분");
  const [members, setMembers] = useState<Member[]>([...mockMembers]);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([...mockOrgMembers]);
  const [assetUsers, setAssetUsers] = useState<AssetUser[]>([...mockAssetUsers]);
  const [assetPolicySettings, setAssetPolicySettings] = useState<AssetPolicySettings>(defaultAssetPolicySettings);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user] = useState({
    name: "홍길동",
    email: "hong@company.com",
    department: "보안팀",
    role: "Admin" as Role,
  });

  const loweredSearch = search.toLowerCase();

  const filteredAssets = useMemo(() => {
    if (menu !== "hardware" && menu !== "software") return [];

    return assets.filter(
      (asset) =>
        asset.type === menu &&
        [asset.name, asset.id, asset.category].some((value) => value.toLowerCase().includes(loweredSearch))
    );
  }, [assets, loweredSearch, menu]);

  const filteredMembers = useMemo(() => {
    return members.filter((member) =>
      [member.name, member.email, member.department].some((value) => value.toLowerCase().includes(loweredSearch))
    );
  }, [loweredSearch, members]);

  const filteredOrgMembers = useMemo(() => {
    return orgMembers.filter((member) =>
      [member.name, member.category, member.cell, member.unit, member.part, member.location].some((value) =>
        value.toLowerCase().includes(loweredSearch)
      )
    );
  }, [loweredSearch, orgMembers]);

  const filteredLogs = useMemo(() => {
    return mockAuditLogs.filter((log) =>
      [log.type, log.actor, log.action, log.target].some((value) => value.toLowerCase().includes(loweredSearch))
    );
  }, [loweredSearch]);

  const hardwareCount = assets.filter((asset) => asset.type === "hardware").length;
  const softwareCount = assets.filter((asset) => asset.type === "software").length;

  const handleRoleChange = (id: number, role: Role) => {
    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, role } : member)));
  };

  const handleAssetUserRegister = (assetUser: {
    name: string;
    email: string;
    department: string;
    position: string;
    assetId: string;
    assignedQuantity: number;
  }) => {
    const targetAsset = assets.find((asset) => asset.id === assetUser.assetId);
    if (!targetAsset || (targetAsset.quantity ?? 0) < assetUser.assignedQuantity) {
      setAssetsError("선택한 자산의 잔여수량이 부족합니다.");
      return;
    }

    const nextAssetUser: AssetUser = {
      id: assetUsers.length === 0 ? 1 : Math.max(...assetUsers.map((current) => current.id)) + 1,
      name: assetUser.name,
      email: assetUser.email,
      department: assetUser.department,
      position: assetUser.position,
      assetId: targetAsset.id,
      assetName: targetAsset.name,
      assignedQuantity: assetUser.assignedQuantity,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === targetAsset.id
          ? { ...asset, quantity: Math.max(0, (asset.quantity ?? 0) - assetUser.assignedQuantity) }
          : asset
      )
    );
    setAssetUsers((prev) => [...prev, nextAssetUser]);
    setAssetsError("");
  };

  const handleAssetUserReclaim = (userId: number) => {
    const targetUser = assetUsers.find((item) => item.id === userId);
    if (!targetUser?.assetId) return;

    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === targetUser.assetId
          ? { ...asset, quantity: (asset.quantity ?? 0) + (targetUser.assignedQuantity ?? 0) }
          : asset
      )
    );
    setAssetUsers((prev) => prev.filter((item) => item.id !== userId));
    setAssetsError("");
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let cancelled = false;

    const loadAssets = async () => {
      setIsAssetsLoading(true);
      setAssetsError("");

      try {
        const remoteAssets = await listAssets();
        if (!cancelled) {
          setAssets(remoteAssets);
        }
      } catch (error) {
        if (!cancelled) {
          setAssetsError(error instanceof Error ? error.message : "자산 목록을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setIsAssetsLoading(false);
        }
      }
    };

    void loadAssets();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (menu === "settings" && !canOpenSettings(user.role)) {
      setMenu(canViewMenu(user.role, "dashboard") ? "dashboard" : "hardware");
      return;
    }

    if (menu === "settings" && !canAccessSettingsMenu(user.role, settingsMenu)) {
      setSettingsMenu(user.role === "Admin" ? "members" : "asset-policy");
    }

    if (!canViewMenu(user.role, menu) && menu !== "register" && menu !== "user-register" && menu !== "settings") {
      setMenu(canViewMenu(user.role, "dashboard") ? "dashboard" : "hardware");
    }
  }, [menu, settingsMenu, user.role]);

  const handleMenuSelect = (key: MenuKey) => {
    if (!canViewMenu(user.role, key)) return;
    setSearch("");

    if (key === "register") {
      if (!canManageAssets(user.role)) return;
      setAssetType("hardware");
      setMenu("register");
      return;
    }

    setMenu(key);
  };

  const openAssetModalForCurrentMenu = () => {
    if (!canManageAssets(user.role)) return;
    setAssetType(menu === "software" ? "software" : "hardware");
    setMenu("register");
  };

  const handleAssetSave = async (draft: AssetDraft, selectedType: AssetType) => {
    try {
      const nextAsset = isSupabaseConfigured
        ? await createAsset(draft, selectedType)
        : {
            id: getNextAssetId(assets, selectedType, assetPolicySettings),
            name: draft.name,
            type: selectedType,
            category: draft.category,
            status: selectedType === "hardware" ? "사용가능" : "활성",
            unitPrice: draft.unitPrice,
            quantity: draft.quantity,
          };

      setAssets((prev) => [...prev, nextAsset]);
      setMenu("register");
      setSearch("");
      setAssetsError("");
    } catch (error) {
      setAssetsError(error instanceof Error ? error.message : "자산 저장에 실패했습니다.");
    }
  };

  const handleImportAssets = (rows: ImportedAssetRow[]) => {
    if (rows.length === 0) {
      setAssetsError("가져올 수 있는 엑셀 행이 없습니다. name, type, category 컬럼을 확인해주세요.");
      return;
    }

    let nextAssets = [...assets];
    const importedAssets: Asset[] = rows.map((row) => {
      const generatedId = getNextAssetId(nextAssets, row.type, assetPolicySettings);
      const asset: Asset = {
        id: generatedId,
        name: row.name,
        type: row.type,
        category: row.category,
        status: row.status ?? (row.type === "hardware" ? "사용가능" : "활성"),
        unitPrice: row.unitPrice ?? 0,
        quantity: row.quantity ?? 0,
      };
      nextAssets = [...nextAssets, asset];
      return asset;
    });

    setAssets((prev) => [...prev, ...importedAssets]);
    setAssetsError("");
    setMenu("dashboard");
  };

  const handleImportOrgMembers = (rows: ImportedOrgMemberRow[]) => {
    if (rows.length === 0) {
      setAssetsError("가져올 수 있는 구성원 행이 없습니다. 구성원_목록 시트 컬럼을 확인해주세요.");
      return;
    }

    const importedMembers: OrgMember[] = rows.map((row, index) => ({
      id: index + 1,
      name: row.name,
      position: row.position,
      category: row.category,
      cell: row.cell,
      unit: row.unit,
      part: row.part,
      location: row.location,
    }));

    setOrgMembers(importedMembers);
    setAssetsError("");
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div
        className="grid min-h-screen"
        style={{ gridTemplateColumns: isSidebarCollapsed ? "72px 1fr" : "260px 1fr" }}
      >
        <Sidebar
          menu={menu}
          settingsMenu={settingsMenu}
          isSidebarCollapsed={isSidebarCollapsed}
          hardwareCount={hardwareCount}
          softwareCount={softwareCount}
          memberCount={members.length}
          user={user}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          onMenuSelect={handleMenuSelect}
          onSettingsMenuSelect={(key) => {
            if (!canAccessSettingsMenu(user.role, key)) return;
            setSettingsMenu(key);
            setSearch("");
          }}
          onLogout={() => setIsLoggedIn(false)}
        />

        <main className="p-6 lg:p-8">
          <div className="w-full space-y-6">
            {assetsError && (
              <div className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {assetsError}
              </div>
            )}

            <PageHeader
              menu={menu}
              settingsMenu={settingsMenu}
              search={search}
              onSearchChange={setSearch}
              onCreateAsset={openAssetModalForCurrentMenu}
              currentUserRole={user.role}
            />

            {menu === "dashboard" && canViewMenu(user.role, "dashboard") && (
              <>
                <SummaryCardGrid
                  hardwareCount={hardwareCount}
                  softwareCount={softwareCount}
                  usageCount={assetUsers.length}
                  registerCount={assets.length}
                  assetUserCount={assetUsers.length}
                />
                <DashboardAssetLists assets={assets} />
              </>
            )}

            {isAssetsLoading && (menu === "hardware" || menu === "software" || menu === "dashboard") && (
              <div className="rounded-[10px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                자산 목록을 불러오는 중입니다.
              </div>
            )}

            {menu === "hardware" && canViewMenu(user.role, "hardware") && <AssetTable data={filteredAssets} />}
            {menu === "software" && canViewMenu(user.role, "software") && <AssetTable data={filteredAssets} />}
            {menu === "usage" && canViewMenu(user.role, "usage") && <UsageTable search={search} />}
            {menu === "register" && canManageAssets(user.role) && (
              <AssetRegistrationForm
                assetType={assetType}
                onAssetTypeChange={setAssetType}
                onSave={handleAssetSave}
                assets={assets}
                policySettings={assetPolicySettings}
                onImportExcel={handleImportAssets}
                onExportExcel={() => exportAssetsToExcel(assets)}
              />
            )}
            {menu === "user-register" && canManageAssets(user.role) && (
              <UserRegistrationForm
                onRegister={handleAssetUserRegister}
                onReclaim={handleAssetUserReclaim}
                users={assetUsers}
                assets={assets}
              />
            )}
            {menu === "settings" && settingsMenu === "members" && canAccessSettingsMenu(user.role, "members") && (
              <MemberTable data={filteredMembers} onRoleChange={handleRoleChange} currentUserRole={user.role} />
            )}
            {menu === "settings" && settingsMenu === "org-members" && canAccessSettingsMenu(user.role, "org-members") && (
              <OrgMemberManagement
                data={filteredOrgMembers}
                onImportExcel={handleImportOrgMembers}
                onExportExcel={() => exportOrgMembersToExcel(orgMembers)}
              />
            )}
            {menu === "settings" && settingsMenu === "audit" && canAccessSettingsMenu(user.role, "audit") && <AuditLogTable data={filteredLogs} />}
            {menu === "settings" && settingsMenu === "asset-policy" && canAccessSettingsMenu(user.role, "asset-policy") && (
              <AssetPolicySettingsForm settings={assetPolicySettings} onSave={setAssetPolicySettings} />
            )}
            {menu === "settings" && settingsMenu === "security" && canAccessSettingsMenu(user.role, "security") && (
              <SecuritySettings
                allowedDomains={allowedDomains}
                setAllowedDomains={setAllowedDomains}
                sessionTimeout={sessionTimeout}
                setSessionTimeout={setSessionTimeout}
              />
            )}
          </div>
        </main>
      </div>

    </div>
  );
}
