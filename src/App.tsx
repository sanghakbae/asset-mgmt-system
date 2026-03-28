import { useEffect, useMemo, useState } from "react";
import { defaultAssetPolicySettings, mockAssets, mockAuditLogs, mockMembers, mockOrgMembers } from "@/features/asset-management/data";
import {
  AssetRegistrationForm,
  AuthLoadingScreen,
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
import { canAccessSettingsMenu, canManageAssets, canOpenSettings, canViewMenu, getAssetIdPrefix, getCategoryAssetPrefix, getNextAssetId } from "@/features/asset-management/utils";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getAssetPolicySettings, saveAssetPolicySettings } from "@/services/asset-policy-settings";
import { getCurrentSession, refreshCurrentSession, signInWithGoogle, signOutAuth } from "@/services/auth";
import { createAuditLog, listAuditLogs } from "@/services/audit-logs";
import {
  assignHardwareAsset,
  assignSoftwareSeats,
  createAsset,
  importAssetsBulk,
  listAssets,
  listHardwareAssignments,
  listSoftwareAssignments,
  reclaimHardwareAssignment,
  reclaimSoftwareAssignment,
  updateAsset,
} from "@/services/assets";
import { exportAssetsToExcel, exportOrgMembersToExcel } from "@/services/excel";
import { deleteMember, ensureMemberForAuthUser, listMembers, updateMember } from "@/services/members";
import { importOrgMembersBulk, listOrgMembers, updateOrgMember } from "@/services/org-members";
import { getSecuritySettings, saveSecuritySettings } from "@/services/security-settings";
import type {
  Asset,
  AssetDraft,
  AssetPolicySettings,
  AssetType,
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
  UsageItem,
} from "@/features/asset-management/types";

export default function App() {
  const [search, setSearch] = useState("");
  const [assets, setAssets] = useState<Asset[]>(isSupabaseConfigured ? [] : [...mockAssets]);
  const [assetsError, setAssetsError] = useState<string>("");
  const [isAssetsLoading, setIsAssetsLoading] = useState(false);
  const [menu, setMenu] = useState<MenuKey>("dashboard");
  const [settingsMenu, setSettingsMenu] = useState<SettingsMenuKey>("members");
  const [assetType, setAssetType] = useState<AssetType>("hardware");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState("");
  const [allowedDomains, setAllowedDomains] = useState<string[]>(["muhayu.com"]);
  const [sessionTimeout, setSessionTimeout] = useState("60분");
  const [members, setMembers] = useState<Member[]>(isSupabaseConfigured ? [] : [...mockMembers]);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>(isSupabaseConfigured ? [] : [...mockOrgMembers]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(isSupabaseConfigured ? [] : [...mockAuditLogs]);
  const [hardwareAssignments, setHardwareAssignments] = useState<HardwareAssignment[]>([]);
  const [softwareAssignments, setSoftwareAssignments] = useState<SoftwareAssignment[]>([]);
  const [assetPolicySettings, setAssetPolicySettings] = useState<AssetPolicySettings>(defaultAssetPolicySettings);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [sessionNow, setSessionNow] = useState(() => Date.now());
  const [user, setUser] = useState({
    name: "홍길동",
    email: "hong@muhayu.com",
    department: "보안팀",
    role: "Admin" as Role,
  });

  const loweredSearch = search.toLowerCase();

  const filteredAssets = useMemo(() => {
    if (menu !== "hardware" && menu !== "software") return [];
    if (menu === "hardware") return assets;

    return assets.filter(
      (asset) =>
        asset.type === menu &&
        [asset.name, asset.softwareName ?? "", asset.id, asset.category].some((value) => value.toLowerCase().includes(loweredSearch))
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
    return auditLogs.filter((log) =>
      [log.type, log.actor, log.action, log.target].some((value) => value.toLowerCase().includes(loweredSearch))
    );
  }, [auditLogs, loweredSearch]);

  const resolveDepartmentByName = (name: string, fallback?: string) => {
    const normalizedName = name.trim();
    if (!normalizedName) return fallback?.trim() || "-";

    const orgMember = orgMembers.find((member) => member.name.trim() === normalizedName);
    const orgDepartment = [orgMember?.part, orgMember?.unit, orgMember?.cell, orgMember?.category]
      .map((value) => value?.trim() || "")
      .find(Boolean);
    if (orgDepartment) return orgDepartment;

    const member = members.find((item) => item.name.trim() === normalizedName);
    if (member?.department?.trim()) return member.department.trim();

    return fallback?.trim() || "-";
  };

  const resolvedHardwareAssignments = useMemo(
    () =>
      hardwareAssignments.map((assignment) => ({
        ...assignment,
        department: resolveDepartmentByName(assignment.userName, assignment.department),
      })),
    [hardwareAssignments, members, orgMembers]
  );

  const resolvedSoftwareAssignments = useMemo(
    () =>
      softwareAssignments.map((assignment) => ({
        ...assignment,
        department: resolveDepartmentByName(assignment.userName, assignment.department),
      })),
    [softwareAssignments, members, orgMembers]
  );

  const usageItems = useMemo<UsageItem[]>(() => {
    const hardwareItems = resolvedHardwareAssignments.map((assignment) => ({
        assetType: "하드웨어",
        user: assignment.userName,
        department: assignment.department || "-",
        category: assignment.category || "-",
        pcName: assignment.pcName || "-",
        registeredAt: assignment.assignedAt?.slice(0, 19).replace("T", " ") ?? "-",
      }));
    const softwareItems = resolvedSoftwareAssignments.map((assignment) => ({
      assetType: "소프트웨어",
      user: assignment.userName,
      department: assignment.department || "-",
      category: assignment.softwareName || "-",
      pcName: "-",
      registeredAt: assignment.assignedAt.slice(0, 19).replace("T", " "),
    }));

    return [...hardwareItems, ...softwareItems];
  }, [resolvedHardwareAssignments, resolvedSoftwareAssignments]);

  const hardwareCount = assets.filter((asset) => asset.type === "hardware").length;
  const softwareCount = assets.filter((asset) => asset.type === "software").length;
  const assignedAssetCount = hardwareAssignments.length + softwareAssignments.length;
  const hardwareAssignedCount = hardwareAssignments.length;
  const softwareAssignedCount = useMemo(
    () => softwareAssignments.reduce((sum, assignment) => sum + Math.max(1, assignment.assignedSeats ?? 1), 0),
    [softwareAssignments]
  );
  const hardwareTotalQuantity = useMemo(
    () => assets.filter((asset) => asset.type === "hardware").reduce((sum, asset) => sum + Math.max(0, asset.totalQuantity ?? 0), 0),
    [assets]
  );
  const softwareTotalQuantity = useMemo(
    () => assets.filter((asset) => asset.type === "software").reduce((sum, asset) => sum + Math.max(0, asset.totalQuantity ?? 0), 0),
    [assets]
  );
  const availableQuantity = useMemo(
    () => assets.reduce((sum, asset) => sum + Math.max(0, asset.quantity ?? 0), 0),
    [assets]
  );
  const assignedQuantity = useMemo(
    () =>
      hardwareAssignments.length +
      softwareAssignments.reduce((sum, assignment) => sum + Math.max(1, assignment.assignedSeats ?? 1), 0),
    [hardwareAssignments, softwareAssignments]
  );
  const attentionQuantity = useMemo(() => {
    const now = new Date();
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    const expiredHardware = assets
      .filter((asset) => asset.type === "hardware" && asset.acquiredAt)
      .reduce((sum, asset) => {
        const acquired = new Date(asset.acquiredAt as string);
        if (Number.isNaN(acquired.getTime())) return sum;
        const expiredAt = new Date(acquired);
        expiredAt.setFullYear(expiredAt.getFullYear() + 5);
        return expiredAt <= now ? sum + Math.max(0, asset.totalQuantity ?? 0) : sum;
      }, 0);

    const expiringSoftware = assets
      .filter((asset) => asset.type === "software" && asset.expiresAt)
      .reduce((sum, asset) => {
        const expiresAt = new Date(asset.expiresAt as string);
        if (Number.isNaN(expiresAt.getTime())) return sum;
        return expiresAt <= oneMonthLater ? sum + Math.max(0, asset.totalQuantity ?? 0) : sum;
      }, 0);

    return expiredHardware + expiringSoftware;
  }, [assets]);
  const sessionRemainingLabel = useMemo(() => {
    if (!sessionExpiresAt) return "--:--";
    const remainingMs = Math.max(sessionExpiresAt - sessionNow, 0);
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [sessionExpiresAt, sessionNow]);

  const refreshAuditLogs = async () => {
    if (!isSupabaseConfigured) return;
    const remoteLogs = await listAuditLogs();
    setAuditLogs(remoteLogs);
  };

  const showSuccessPopup = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => {
      setSuccessMessage((current) => (current === message ? "" : current));
    }, 1800);
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "string" && error.trim()) return error;
    try {
      const serialized = JSON.stringify(error);
      return serialized && serialized !== "{}" ? serialized : fallback;
    } catch {
      return fallback;
    }
  };

  const handleRoleChange = (id: number, role: Role) => {
    const targetMember = members.find((member) => member.id === id);
    if (!targetMember) return;

    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, role } : member)));

    if (!isSupabaseConfigured) return;

    void updateMember({ email: targetMember.email, role })
      .then(async () => {
        await createAuditLog({
          type: "권한 변경",
          actor: user.email,
          action: "회원 권한 변경",
          target: `${targetMember.email} -> ${role}`,
        });
        await refreshAuditLogs();
      })
      .catch((error) => {
        setAssetsError(error instanceof Error ? error.message : "회원 권한 저장에 실패했습니다.");
      });
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    setSessionNow(Date.now());

    const timer = window.setInterval(() => {
      setSessionNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isLoggedIn]);

  const handleDepartmentChange = (id: number, department: string) => {
    const targetMember = members.find((member) => member.id === id);
    if (!targetMember) return;

    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, department } : member)));

    if (!isSupabaseConfigured) return;

    void updateMember({ email: targetMember.email, department })
      .then(async () => {
        await createAuditLog({
          type: "회원 변경",
          actor: user.email,
          action: "회원 부서 변경",
          target: `${targetMember.email} -> ${department}`,
        });
        await refreshAuditLogs();
      })
      .catch((error) => {
        setAssetsError(error instanceof Error ? error.message : "회원 부서 저장에 실패했습니다.");
      });
  };

  const handleDeleteMember = (id: number) => {
    const targetMember = members.find((member) => member.id === id);
    if (!targetMember) return;

    setMembers((prev) => prev.filter((member) => member.id !== id));

    if (!isSupabaseConfigured) return;

    void deleteMember(targetMember.email)
      .then(async () => {
        await createAuditLog({
          type: "회원 삭제",
          actor: user.email,
          action: "회원 삭제",
          target: targetMember.email,
        });
        await refreshAuditLogs();
      })
      .catch((error) => {
        setAssetsError(error instanceof Error ? error.message : "회원 삭제에 실패했습니다.");
      });
  };

  const handleAssetUserRegister = async (assetUser: {
    name: string;
    department: string;
    assetId: string;
    os?: string;
    macAddress?: string;
    ipAddress?: string;
  }) => {
    const targetAsset = assets.find((asset) => asset.id === assetUser.assetId);
    if (!targetAsset) {
      setAssetsError("선택한 자산을 찾을 수 없습니다.");
      return;
    }

    try {
      if (targetAsset.type === "hardware") {
        if (isSupabaseConfigured) {
          await assignHardwareAsset(targetAsset.id, {
            userName: assetUser.name,
            department: assetUser.department,
            os: assetUser.os,
            macAddress: assetUser.macAddress,
            ipAddress: assetUser.ipAddress,
          });
          const [refreshedAssets, refreshedHardwareAssignments] = await Promise.all([listAssets(), listHardwareAssignments()]);
          setAssets(refreshedAssets);
          setHardwareAssignments(refreshedHardwareAssignments);
        } else {
          const nextAsset: Asset = {
            ...targetAsset,
            quantity: Math.max((targetAsset.quantity ?? 0) - 1, 0),
          };
          setAssets((prev) => prev.map((asset) => (asset.id === targetAsset.id ? nextAsset : asset)));
        }
      } else if (isSupabaseConfigured) {
        await assignSoftwareSeats(targetAsset.id, {
          userName: assetUser.name,
          department: assetUser.department,
          seats: 1,
        });
        const [refreshedAssets, assignments] = await Promise.all([listAssets(), listSoftwareAssignments()]);
        setAssets(refreshedAssets);
        setSoftwareAssignments(assignments);
      } else {
        const nextQuantity = Math.max((targetAsset.quantity ?? 0) - 1, 0);
        const savedAsset: Asset = {
          ...targetAsset,
          totalQuantity: targetAsset.totalQuantity,
          quantity: nextQuantity,
          status: nextQuantity > 0 ? "운영" : "회수대상",
        };
        const nextAssignment: SoftwareAssignment = {
          id: `local-${Date.now()}`,
          softwareAssetCode: targetAsset.id,
          softwareName: targetAsset.softwareName ?? targetAsset.name,
          category: targetAsset.category,
          userName: assetUser.name,
          department: assetUser.department,
          assignedSeats: 1,
          assignedAt: new Date().toISOString(),
          expiresAt: targetAsset.expiresAt,
        };
        setAssets((prev) => prev.map((asset) => (asset.id === targetAsset.id ? savedAsset : asset)));
        setSoftwareAssignments((prev) => [...prev, nextAssignment]);
      }

      setAssetsError("");
      void createAuditLog({
        type: "자산 사용자 등록",
        actor: user.email,
        action: "자산 사용자 등록",
        target: `${targetAsset.id} / ${assetUser.name}`,
      }).then(refreshAuditLogs);
    } catch (error) {
      setAssetsError(getErrorMessage(error, "자산 사용자 등록에 실패했습니다."));
    }
  };

  const handleAssetUserReclaim = async (targetId: string) => {
    try {
      const softwareAssignment = softwareAssignments.find((assignment) => assignment.id === targetId);
      if (softwareAssignment) {
        if (isSupabaseConfigured) {
          await reclaimSoftwareAssignment(targetId);
          const [refreshedAssets, assignments] = await Promise.all([listAssets(), listSoftwareAssignments()]);
          setAssets(refreshedAssets);
          setSoftwareAssignments(assignments);
        } else {
          setSoftwareAssignments((prev) => prev.filter((assignment) => assignment.id !== targetId));
          setAssets((prev) =>
            prev.map((asset) =>
              asset.id === softwareAssignment.softwareAssetCode
                ? {
                    ...asset,
                    totalQuantity: asset.totalQuantity,
                    quantity: (asset.quantity ?? 0) + softwareAssignment.assignedSeats,
                    status: "운영",
                  }
                : asset
            )
          );
        }
      } else {
        if (isSupabaseConfigured) {
          await reclaimHardwareAssignment(targetId);
          const [refreshedAssets, refreshedHardwareAssignments] = await Promise.all([listAssets(), listHardwareAssignments()]);
          setAssets(refreshedAssets);
          setHardwareAssignments(refreshedHardwareAssignments);
        }
      }

      setAssetsError("");
      void createAuditLog({
        type: "자산 회수",
        actor: user.email,
        action: "자산 사용자 회수",
        target: targetId,
      }).then(refreshAuditLogs);
    } catch (error) {
      setAssetsError(getErrorMessage(error, "자산 회수에 실패했습니다."));
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (isAuthLoading) return;
    if (!isLoggedIn) return;

    let cancelled = false;

    const loadInitialData = async () => {
      setIsAssetsLoading(true);
      setAssetsError("");

      try {
        const [remoteAssets, remoteHardwareAssignments, remoteAssignments, remoteOrgMembers, remoteAssetPolicySettings, remoteSecuritySettings, remoteAuditLogs] = await Promise.all([
          listAssets(),
          listHardwareAssignments(),
          listSoftwareAssignments(),
          listOrgMembers(),
          getAssetPolicySettings(),
          getSecuritySettings(),
          listAuditLogs(),
        ]);
        if (!cancelled) {
          setAssets(remoteAssets);
          setHardwareAssignments(remoteHardwareAssignments);
          setSoftwareAssignments(remoteAssignments);
          setOrgMembers(remoteOrgMembers);
          if (remoteAssetPolicySettings) {
            setAssetPolicySettings(remoteAssetPolicySettings);
          }
          setAuditLogs(remoteAuditLogs);
          if (remoteSecuritySettings) {
            setAllowedDomains(remoteSecuritySettings.allowedDomains);
            setSessionTimeout(remoteSecuritySettings.sessionTimeout);
          }
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

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, isLoggedIn]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsAuthLoading(false);
      return;
    }

    let mounted = true;

    const hydrateSession = async () => {
      try {
        const session = await getCurrentSession();
        await applySession(session?.user?.email ?? null, session?.user ?? null, session?.expires_at ?? null);
      } catch (error) {
        if (mounted) {
          setAuthError(error instanceof Error ? error.message : "로그인 상태를 확인하지 못했습니다.");
          setIsAuthLoading(false);
        }
      }
    };

    const applySession = async (
      email: string | null,
      authUser: Parameters<Parameters<typeof supabase.auth.onAuthStateChange>[0]>[1]["user"] | null,
      expiresAt?: number | null
    ) => {
      if (!mounted) return;

      if (!email || !authUser) {
        setIsLoggedIn(false);
        setSessionExpiresAt(null);
        setIsAuthLoading(false);
        return;
      }

      const normalizedEmail = email.toLowerCase();
      const domain = normalizedEmail.split("@")[1] ?? "";
      const isAllowedDomain =
        allowedDomains.length === 0 ||
        allowedDomains.some((allowedDomain) => {
          const normalizedAllowedDomain = allowedDomain.toLowerCase().trim();
          return domain === normalizedAllowedDomain || domain.endsWith(`.${normalizedAllowedDomain}`);
        });

      if (!isAllowedDomain) {
        await signOutAuth();
        if (mounted) {
          setAuthError("허용되지 않은 도메인입니다.");
          setIsLoggedIn(false);
          setIsAuthLoading(false);
        }
        return;
      }

      try {
        const [currentMember, remoteMembers] = await Promise.all([ensureMemberForAuthUser(authUser), listMembers()]);
        if (!mounted) return;

        setMembers(remoteMembers);
        setUser({
          name: currentMember.name,
          email: currentMember.email,
          department: currentMember.department || "-",
          role: currentMember.role,
        });
        setSessionExpiresAt(expiresAt ? expiresAt * 1000 : null);
        setAuthError("");
        setIsLoggedIn(true);
      } catch (error) {
        if (mounted) {
          setAuthError(error instanceof Error ? error.message : "회원 정보를 불러오지 못했습니다.");
          setIsLoggedIn(false);
        }
      } finally {
        if (mounted) {
          setIsAuthLoading(false);
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session?.user?.email ?? null, session?.user ?? null, session?.expires_at ?? null);
    });

    void hydrateSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [allowedDomains]);

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
    setAssetType("hardware");
    setMenu("register");
  };

  const handleAssetSave = async (draft: AssetDraft, selectedType: AssetType) => {
    try {
      const normalizedSoftwareName = (draft.softwareName ?? draft.name ?? "").trim();
      if (selectedType === "software" && normalizedSoftwareName) {
        const existingSoftware = assets.find(
          (asset) => asset.type === "software" && (asset.softwareName ?? asset.name).trim() === normalizedSoftwareName
        );
        if (existingSoftware && !window.confirm("동일한 소프트웨어가 이미 있습니다. 진짜 덮어쓰겠습니까?")) {
          return;
        }
      }

      const nextAssets = isSupabaseConfigured
        ? await createAsset(draft, selectedType)
        : (() => {
            const localAssets = [...assets];
            if (selectedType === "software" && normalizedSoftwareName) {
              const existingIndex = localAssets.findIndex(
                (asset) => asset.type === "software" && (asset.softwareName ?? asset.name).trim() === normalizedSoftwareName
              );
              if (existingIndex >= 0) {
                const existing = localAssets[existingIndex];
                const updated: Asset = {
                  ...existing,
                  softwareName: normalizedSoftwareName,
                  category: draft.category,
                  unitPrice: draft.unitPrice,
                  expiresAt: draft.expiresAt,
                  totalQuantity: Math.max(1, draft.quantity ?? draft.totalQuantity ?? 1),
                  quantity: Math.max(1, draft.quantity ?? draft.totalQuantity ?? 1),
                  note: draft.note,
                  createdAt: draft.createdAt || existing.createdAt || new Date().toISOString(),
                };
                return [updated];
              }
            }
            const count = selectedType === "hardware" ? Math.max(1, draft.quantity ?? 1) : 1;
            return Array.from({ length: count }, () => {
              const asset: Asset = {
                id: getNextAssetId(localAssets, selectedType, assetPolicySettings, draft.category),
                name: "",
                softwareName: selectedType === "software" ? draft.softwareName ?? draft.name : undefined,
                type: selectedType,
                category: draft.category,
                status: selectedType === "software" ? "사용" : draft.status,
                unitPrice: draft.unitPrice,
                acquiredAt: draft.acquiredAt,
                createdAt: draft.createdAt || new Date().toISOString(),
                expiresAt: selectedType === "software" ? draft.expiresAt : undefined,
                totalQuantity: selectedType === "software" ? Math.max(1, draft.quantity ?? draft.totalQuantity ?? 1) : undefined,
                quantity: selectedType === "software" ? Math.max(1, draft.quantity ?? draft.availableQuantity ?? 1) : undefined,
                os: undefined,
                pcName: undefined,
                assignee: undefined,
                department: undefined,
                macAddress: undefined,
                ipAddress: undefined,
                note: draft.note,
              };
              localAssets.push(asset);
              return asset;
            });
          })();

      setAssets((prev) => {
        if (selectedType === "software" && normalizedSoftwareName) {
          const withoutExisting = prev.filter(
            (asset) => !(asset.type === "software" && (asset.softwareName ?? asset.name).trim() === normalizedSoftwareName)
          );
          return [...withoutExisting, ...nextAssets];
        }
        return [...prev, ...nextAssets];
      });
      setMenu("register");
      setSearch("");
      setAssetsError("");
      showSuccessPopup("자산이 저장되었습니다.");
      const auditTargetName =
        selectedType === "software"
          ? nextAssets[0]?.softwareName ?? nextAssets[0]?.name ?? "-"
          : `${draft.category} ${selectedType === "hardware" ? Math.max(1, draft.quantity ?? 1) : 1}건`;
      void createAuditLog({
        type: "자산 등록",
        actor: user.email,
        action: "자산 등록",
        target: `${nextAssets[0]?.id ?? "-"} / ${auditTargetName}`,
      }).then(refreshAuditLogs);
    } catch (error) {
      setAssetsError(getErrorMessage(error, "자산 저장에 실패했습니다."));
    }
  };

  const handleAssetUpdate = async (updatedAsset: Asset, targetAssetIds?: string[]) => {
    try {
      const idsToUpdate = targetAssetIds && targetAssetIds.length > 0 ? targetAssetIds : [updatedAsset.id];

      if (isSupabaseConfigured) {
        const savedAssets = await Promise.all(idsToUpdate.map((assetId) => updateAsset(assetId, { ...updatedAsset, id: assetId })));
        const savedAssetMap = new Map(savedAssets.map((asset) => [asset.id, asset]));
        setAssets((prev) => prev.map((asset) => savedAssetMap.get(asset.id) ?? asset));
      } else {
        let nextAssets = [...assets];
        const replacementEntries = idsToUpdate.map((assetId) => {
          const originalAsset = nextAssets.find((asset) => asset.id === assetId);
          if (!originalAsset) return null;

          const originalPrefix = getAssetIdPrefix(originalAsset.id);
          const nextPrefix = getCategoryAssetPrefix(assetPolicySettings, updatedAsset.type, updatedAsset.category);
          const savedAsset =
            originalPrefix !== nextPrefix
              ? {
                  ...updatedAsset,
                  id: getNextAssetId(
                    nextAssets.filter((asset) => asset.id !== assetId),
                    updatedAsset.type,
                    assetPolicySettings,
                    updatedAsset.category
                  ),
                }
              : { ...updatedAsset, id: assetId };

          nextAssets = nextAssets.map((asset) => (asset.id === assetId ? savedAsset : asset));
          return [assetId, savedAsset] as const;
        }).filter((entry): entry is readonly [string, Asset] => Boolean(entry));

        const replacementMap = new Map(replacementEntries);
        setAssets((prev) => prev.map((asset) => replacementMap.get(asset.id) ?? asset));
      }

      setAssetsError("");
    } catch (error) {
      setAssetsError(getErrorMessage(error, "자산 수정에 실패했습니다."));
    }
  };

  const handleAssetPolicySettingsSave = async (settings: AssetPolicySettings) => {
    try {
      const savedSettings = isSupabaseConfigured ? await saveAssetPolicySettings(settings) : settings;
      setAssetPolicySettings(savedSettings);
      setAssetsError("");
      showSuccessPopup("자산 설정이 저장되었습니다.");
    } catch (error) {
      setAssetsError(getErrorMessage(error, "자산 설정 저장에 실패했습니다."));
    }
  };

  const handleImportAssets = async (rows: ImportedAssetRow[]) => {
    if (rows.length === 0) {
      setAssetsError("가져올 수 있는 엑셀 행이 없습니다. name, type, category 컬럼을 확인해주세요.");
      return;
    }

    try {
      const hardwareCount = rows.filter((row) => row.type === "hardware").length;
      const softwareCount = rows.filter((row) => row.type === "software").length;

      if (isSupabaseConfigured) {
        const savedAssets = await importAssetsBulk(rows);
        const refreshedHardwareAssignments = await listHardwareAssignments();
        const refreshedAssignments = await listSoftwareAssignments();
        setAssets(savedAssets);
        setHardwareAssignments(refreshedHardwareAssignments);
        setSoftwareAssignments(refreshedAssignments);
      } else {
        let nextAssets = [...assets];
        const importedAssets: Asset[] = rows.map((row) => {
          const generatedId = getNextAssetId(nextAssets, row.type, assetPolicySettings, row.category);
          const asset: Asset = {
            id: generatedId,
            name: row.type === "software" ? "" : row.name,
            softwareName: row.type === "software" ? row.softwareName ?? row.name : undefined,
            type: row.type,
            category: row.category,
            status: row.status ?? "유휴",
            unitPrice: row.unitPrice ?? 0,
            acquiredAt: row.acquiredAt,
            createdAt: new Date().toISOString(),
            totalQuantity: row.type === "software" ? row.totalQuantity ?? row.quantity ?? 0 : undefined,
            quantity: row.type === "software" ? row.availableQuantity ?? row.quantity ?? 0 : row.quantity ?? 0,
            os: row.os,
            pcName: row.pcName,
            assignee: row.assignee,
            department: row.department,
            macAddress: row.macAddress,
            ipAddress: row.ipAddress,
            note: row.note,
          };
          nextAssets = [...nextAssets, asset];
          return asset;
        });

        setAssets((prev) => [...prev, ...importedAssets]);
      }

      setAssetsError("");
      showSuccessPopup(`하드웨어 ${hardwareCount}건, 소프트웨어 ${softwareCount}건 업데이트 완료`);
      void createAuditLog({
        type: "자산 등록",
        actor: user.email,
        action: "자산 엑셀 Import",
        target: `${rows.length}건`,
      }).then(refreshAuditLogs);
    } catch (error) {
      setAssetsError(getErrorMessage(error, "자산 엑셀 가져오기에 실패했습니다."));
    }
  };

  const handleImportOrgMembers = async (rows: ImportedOrgMemberRow[]) => {
    if (rows.length === 0) {
      setAssetsError("가져올 수 있는 구성원 행이 없습니다. 구성원_목록 시트 컬럼을 확인해주세요.");
      return;
    }

    try {
      if (isSupabaseConfigured) {
        const savedMembers = await importOrgMembersBulk(rows);
        setOrgMembers(savedMembers);
      } else {
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
      }

      setAssetsError("");
      showSuccessPopup(`구성원 ${rows.length}건을 가져왔습니다.`);
      void createAuditLog({
        type: "구성원 관리",
        actor: user.email,
        action: "구성원 엑셀 Import",
        target: `${rows.length}건`,
      }).then(refreshAuditLogs);
    } catch (error) {
      setAssetsError(error instanceof Error ? error.message : "구성원 엑셀 가져오기에 실패했습니다.");
    }
  };

  const handleOrgMemberSave = async (member: OrgMember) => {
    try {
      if (isSupabaseConfigured) {
        const savedMember = await updateOrgMember(member);
        setOrgMembers((prev) => prev.map((current) => (current.id === savedMember.id ? savedMember : current)));
      } else {
        setOrgMembers((prev) => prev.map((current) => (current.id === member.id ? member : current)));
      }

      setAssetsError("");
      void createAuditLog({
        type: "구성원 관리",
        actor: user.email,
        action: "구성원 정보 수정",
        target: `${member.name} / ${member.unit} / ${member.location}`,
      }).then(refreshAuditLogs);
    } catch (error) {
      setAssetsError(error instanceof Error ? error.message : "구성원 저장에 실패했습니다.");
      throw error;
    }
  };

  const handleAllowedDomainsChange = async (nextAllowedDomains: string[]) => {
    setAllowedDomains(nextAllowedDomains);

    if (!isSupabaseConfigured) return;

    try {
      const savedSettings = await saveSecuritySettings({
        allowedDomains: nextAllowedDomains,
        sessionTimeout,
      });
      setAllowedDomains(savedSettings.allowedDomains);
      setSessionTimeout(savedSettings.sessionTimeout);
      setAssetsError("");
      void createAuditLog({
        type: "보안 설정",
        actor: user.email,
        action: "허용 도메인 변경",
        target: savedSettings.allowedDomains.join(", "),
      }).then(refreshAuditLogs);
    } catch (error) {
      setAssetsError(error instanceof Error ? error.message : "보안 설정 저장에 실패했습니다.");
    }
  };

  const handleSessionTimeoutChange = async (nextSessionTimeout: string) => {
    setSessionTimeout(nextSessionTimeout);

    if (!isSupabaseConfigured) return;

    try {
      const savedSettings = await saveSecuritySettings({
        allowedDomains,
        sessionTimeout: nextSessionTimeout,
      });
      setAllowedDomains(savedSettings.allowedDomains);
      setSessionTimeout(savedSettings.sessionTimeout);
      setAssetsError("");
      void createAuditLog({
        type: "보안 설정",
        actor: user.email,
        action: "세션 타임아웃 변경",
        target: nextSessionTimeout,
      }).then(refreshAuditLogs);
    } catch (error) {
      setAssetsError(error instanceof Error ? error.message : "보안 설정 저장에 실패했습니다.");
    }
  };

  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isLoggedIn) {
    return (
      <LoginScreen
        errorMessage={authError}
        onLogin={() => {
          if (!isSupabaseConfigured) {
            setIsLoggedIn(true);
            return;
          }

          setAuthError("");
          setIsAuthLoading(true);
          void signInWithGoogle().catch((error) => {
            setAuthError(error instanceof Error ? error.message : "Google 로그인에 실패했습니다.");
            setIsAuthLoading(false);
          });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div
        className="flex min-h-screen w-full flex-col lg:grid"
        style={{ gridTemplateColumns: isSidebarCollapsed ? "72px 1fr" : "260px 1fr" }}
      >
        <Sidebar
          menu={menu}
          settingsMenu={settingsMenu}
          isSidebarCollapsed={isSidebarCollapsed}
          hardwareAssignedCount={hardwareAssignedCount}
          softwareAssignedCount={softwareAssignedCount}
          orgMemberCount={orgMembers.length}
          sessionRemainingLabel={sessionRemainingLabel}
          user={user}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          onMenuSelect={handleMenuSelect}
          onSettingsMenuSelect={(key) => {
            if (!canAccessSettingsMenu(user.role, key)) return;
            setSettingsMenu(key);
            setSearch("");
          }}
          onExtendSession={() => {
            if (!isSupabaseConfigured) {
              setSessionNow(Date.now());
              return;
            }

            void refreshCurrentSession()
              .then((session) => {
                setSessionExpiresAt(session?.expires_at ? session.expires_at * 1000 : null);
                setSessionNow(Date.now());
                setAuthError("");
                showSuccessPopup("세션이 연장되었습니다.");
              })
              .catch((error) => {
                setAssetsError(getErrorMessage(error, "세션 연장에 실패했습니다."));
              });
          }}
          onLogout={() => {
            if (!isSupabaseConfigured) {
              setIsLoggedIn(false);
              return;
            }

            setIsAuthLoading(true);
            void signOutAuth()
              .catch((error) => {
                setAuthError(error instanceof Error ? error.message : "로그아웃에 실패했습니다.");
              })
              .finally(() => {
                setIsLoggedIn(false);
                setIsAuthLoading(false);
              });
          }}
        />

        <main className="w-full min-w-0 p-3 sm:p-4 lg:p-8">
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
                  hardwareTotalQuantity={hardwareTotalQuantity}
                  softwareTotalQuantity={softwareTotalQuantity}
                  assignedQuantity={assignedQuantity}
                  availableQuantity={availableQuantity}
                  attentionQuantity={attentionQuantity}
                />
                <DashboardAssetLists assets={assets} />
              </>
            )}

            {isAssetsLoading && menu === "dashboard" && (
              <div className="rounded-[10px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                자산 목록을 불러오는 중입니다.
              </div>
            )}
            {menu === "usage" && canViewMenu(user.role, "usage") && <UsageTable search={search} data={usageItems} />}
            {menu === "register" && canManageAssets(user.role) && (
              <AssetRegistrationForm
                assetType={assetType}
                onAssetTypeChange={setAssetType}
                onSave={handleAssetSave}
                onUpdateAsset={handleAssetUpdate}
                assets={assets}
                policySettings={assetPolicySettings}
              />
            )}
            {menu === "user-register" && canManageAssets(user.role) && (
              <UserRegistrationForm
                onRegister={handleAssetUserRegister}
                assets={assets}
                hardwareAssignments={resolvedHardwareAssignments}
                softwareAssignments={resolvedSoftwareAssignments}
                policySettings={assetPolicySettings}
                onImportExcel={handleImportAssets}
                onExportExcel={() => exportAssetsToExcel(resolvedHardwareAssignments, resolvedSoftwareAssignments)}
              />
            )}
            {menu === "settings" && settingsMenu === "members" && canAccessSettingsMenu(user.role, "members") && (
              <MemberTable
                data={filteredMembers}
                onRoleChange={handleRoleChange}
                onDepartmentChange={handleDepartmentChange}
                onDeleteMember={handleDeleteMember}
                currentUserRole={user.role}
              />
            )}
            {menu === "settings" && settingsMenu === "org-members" && canAccessSettingsMenu(user.role, "org-members") && (
              <OrgMemberManagement
                data={filteredOrgMembers}
                onImportExcel={handleImportOrgMembers}
                onExportExcel={() => exportOrgMembersToExcel(orgMembers)}
                onSaveMember={handleOrgMemberSave}
              />
            )}
            {menu === "settings" && settingsMenu === "audit" && canAccessSettingsMenu(user.role, "audit") && <AuditLogTable data={filteredLogs} />}
            {menu === "settings" && settingsMenu === "asset-policy" && canAccessSettingsMenu(user.role, "asset-policy") && (
              <AssetPolicySettingsForm settings={assetPolicySettings} onSave={handleAssetPolicySettingsSave} />
            )}
            {menu === "settings" && settingsMenu === "security" && canAccessSettingsMenu(user.role, "security") && (
              <SecuritySettings
                allowedDomains={allowedDomains}
                setAllowedDomains={handleAllowedDomainsChange}
                sessionTimeout={sessionTimeout}
                setSessionTimeout={handleSessionTimeoutChange}
              />
            )}
          </div>
        </main>
      </div>
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 pointer-events-none">
          <div className="rounded-[10px] bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
            {successMessage}
          </div>
        </div>
      )}

    </div>
  );
}
