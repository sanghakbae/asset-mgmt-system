import { AppWindow, BarChart3, ClipboardList, HardDrive, LayoutDashboard, Lock, Plus, Settings, SlidersHorizontal, UserPlus, Users } from "lucide-react";
import type { Asset, AssetPolicySettings, AssetUser, AuditLog, Member, OrgMember, SettingsMenuKey, MenuKey, UsageItem } from "./types";

export const mockAssets: readonly Asset[] = [
  { id: "H-001", name: "맥북 프로", type: "hardware", category: "랩탑", status: "운영", unitPrice: 3200000, quantity: 12, os: "macOS Sonoma", pcName: "SEC-MBP-001", assignee: "홍길동", department: "보안팀", macAddress: "A1:B2:C3:D4:E5:F6", ipAddress: "10.10.1.101", note: "개인 지급 장비" },
  { id: "H-002", name: "델 서버", type: "hardware", category: "서버", status: "유휴", unitPrice: 8700000, quantity: 4, os: "Ubuntu 22.04", pcName: "INF-SRV-002", assignee: "인프라 공용", department: "인프라팀", macAddress: "B2:C3:D4:E5:F6:G7", ipAddress: "10.10.2.15", note: "대기 장비" },
  { id: "H-003", name: "레노버 씽크패드", type: "hardware", category: "랩탑", status: "유휴", unitPrice: 2100000, quantity: 9, os: "Windows 11 Pro", pcName: "DEV-LTP-003", assignee: "미할당", department: "개발팀", macAddress: "C3:D4:E5:F6:G7:H8", ipAddress: "10.10.3.21", note: "예비 랩탑" },
  { id: "H-004", name: "시스코 스위치", type: "hardware", category: "네트워크", status: "운영", unitPrice: 1550000, quantity: 6, os: "Cisco IOS", pcName: "NET-SW-004", assignee: "네트워크 공용", department: "인프라팀", macAddress: "D4:E5:F6:G7:H8:I9", ipAddress: "10.10.4.10", note: "본사 4층" },
  { id: "H-005", name: "파이어월 장비", type: "hardware", category: "보안장비", status: "운영", unitPrice: 4900000, quantity: 3, os: "PAN-OS", pcName: "SEC-FW-005", assignee: "보안 공용", department: "보안팀", macAddress: "E5:F6:G7:H8:I9:J0", ipAddress: "10.10.5.5", note: "운영 중" },
  { id: "H-006", name: "QNAP 스토리지", type: "hardware", category: "스토리지", status: "회수대상", unitPrice: 3800000, quantity: 5, os: "QTS", pcName: "STO-NAS-006", assignee: "인프라 공용", department: "인프라팀", macAddress: "F6:G7:H8:I9:J0:K1", ipAddress: "10.10.6.30", note: "교체 예정" },
  { id: "H-007", name: "HP 워크스테이션", type: "hardware", category: "데스크탑", status: "운영", unitPrice: 2700000, quantity: 7, os: "Windows 11 Pro", pcName: "DSK-WS-007", assignee: "김보안", department: "인프라팀", macAddress: "07:18:29:3A:4B:5C", ipAddress: "10.10.7.44", note: "고사양 작업용" },
  { id: "H-008", name: "AP 컨트롤러", type: "hardware", category: "네트워크", status: "유휴", unitPrice: 980000, quantity: 11, os: "ArubaOS", pcName: "NET-AP-008", assignee: "네트워크 공용", department: "인프라팀", macAddress: "18:29:3A:4B:5C:6D", ipAddress: "10.10.8.18", note: "신규 AP용" },
  { id: "H-009", name: "백업 서버", type: "hardware", category: "서버", status: "유휴", unitPrice: 6400000, quantity: 2, os: "Rocky Linux 9", pcName: "BAK-SRV-009", assignee: "인프라 공용", department: "인프라팀", macAddress: "29:3A:4B:5C:6D:7E", ipAddress: "10.10.9.9", note: "DR 센터" },
  { id: "H-010", name: "보안 게이트웨이", type: "hardware", category: "보안장비", status: "운영", unitPrice: 5200000, quantity: 4, os: "FortiOS", pcName: "SEC-GW-010", assignee: "보안 공용", department: "보안팀", macAddress: "3A:4B:5C:6D:7E:8F", ipAddress: "10.10.10.1", note: "대외망 구간" },
  { id: "S-001", name: "", softwareName: "윈도우 라이선스", type: "software", category: "OS", status: "운영", unitPrice: 320000, totalQuantity: 150, quantity: 150 },
  { id: "S-002", name: "", softwareName: "Burp Suite Pro", type: "software", category: "보안", status: "회수대상", unitPrice: 680000, totalQuantity: 20, quantity: 20 },
  { id: "S-003", name: "", softwareName: "Ubuntu Server", type: "software", category: "OS", status: "운영", unitPrice: 0, totalQuantity: 100, quantity: 100 },
  { id: "S-004", name: "", softwareName: "PostgreSQL", type: "software", category: "데이터베이스", status: "운영", unitPrice: 540000, totalQuantity: 35, quantity: 35 },
  { id: "S-005", name: "", softwareName: "Oracle DB", type: "software", category: "데이터베이스", status: "회수대상", unitPrice: 2200000, totalQuantity: 10, quantity: 10 },
  { id: "S-006", name: "", softwareName: "IntelliJ IDEA", type: "software", category: "개발툴", status: "운영", unitPrice: 210000, totalQuantity: 40, quantity: 40 },
  { id: "S-007", name: "", softwareName: "Visual Studio", type: "software", category: "개발툴", status: "운영", unitPrice: 180000, totalQuantity: 55, quantity: 55 },
  { id: "S-008", name: "", softwareName: "Nginx Plus", type: "software", category: "미들웨어", status: "회수대상", unitPrice: 460000, totalQuantity: 18, quantity: 18 },
  { id: "S-009", name: "", softwareName: "Vault Enterprise", type: "software", category: "보안", status: "운영", unitPrice: 890000, totalQuantity: 14, quantity: 14 },
  { id: "S-010", name: "", softwareName: "Redis Enterprise", type: "software", category: "미들웨어", status: "운영", unitPrice: 730000, totalQuantity: 16, quantity: 16 },
];

export const mockMembers: readonly Member[] = [
  {
    id: 1,
    name: "홍길동",
    email: "hong@company.com",
    department: "보안팀",
    role: "Admin",
    joinedAt: "2026-01-12",
    lastLoginAt: "2026-03-27 09:10",
  },
  {
    id: 2,
    name: "김보안",
    email: "kim@company.com",
    department: "인프라팀",
    role: "Manager",
    joinedAt: "2026-02-01",
    lastLoginAt: "2026-03-27 08:32",
  },
  {
    id: 3,
    name: "이감사",
    email: "lee@company.com",
    department: "감사팀",
    role: "Viewer",
    joinedAt: "2026-02-18",
    lastLoginAt: "2026-03-26 18:05",
  },
];

export const mockOrgMembers: readonly OrgMember[] = [
  { id: 1, name: "신동호", position: "", category: "CEO", cell: "CEO", unit: "CEO", part: "CEO", location: "성수_202" },
  { id: 2, name: "박지연", position: "", category: "개발", cell: "HR", unit: "HR", part: "HR", location: "전주" },
  { id: 3, name: "최재영", position: "리더", category: "개발", cell: "CK", unit: "개발10", part: "개발10", location: "성수_1906" },
  { id: 4, name: "이강원", position: "리더", category: "사업", cell: "운영", unit: "CEM", part: "CEM", location: "성수_201" },
  { id: 5, name: "김희수", position: "", category: "VP", cell: "비즈니스", unit: "비즈니스", part: "비즈니스", location: "성수_201" },
  { id: 6, name: "임수경", position: "리더", category: "개발", cell: "개발연구소", unit: "개발6", part: "개발6", location: "성수_202" },
  { id: 7, name: "송복령", position: "리더", category: "경영", cell: "경영지원", unit: "경영지원", part: "경영지원", location: "성수_201" },
  { id: 8, name: "김태웅", position: "리더", category: "개발", cell: "개발연구소", unit: "개발5", part: "개발5", location: "성수_1906" },
  { id: 9, name: "박채란", position: "", category: "사업", cell: "운영", unit: "CEM", part: "CEM", location: "성수_201" },
  { id: 10, name: "박혜린", position: "", category: "개발", cell: "개발연구소", unit: "개발6", part: "개발6", location: "성수_202" },
];

export const mockAssetUsers: readonly AssetUser[] = [
  {
    id: "1",
    name: "홍길동",
    email: "hong@company.com",
    department: "보안팀",
    position: "팀장",
    assetId: "H-001",
    assetName: "맥북 프로",
    assignedQuantity: 1,
    createdAt: "2026-03-01",
  },
  {
    id: "2",
    name: "김보안",
    email: "kim@company.com",
    department: "인프라팀",
    position: "매니저",
    assetId: "S-002",
    assetName: "Burp Suite Pro",
    assignedQuantity: 2,
    createdAt: "2026-03-05",
  },
];

export const mockAuditLogs: readonly AuditLog[] = [
  {
    id: 1,
    type: "접속 로그",
    actor: "홍길동",
    action: "Google 로그인 성공",
    target: "자산 관리 시스템",
    ip: "10.10.1.15",
    createdAt: "2026-03-27 09:10:11",
  },
  {
    id: 2,
    type: "권한 변경",
    actor: "홍길동",
    action: "회원 권한 변경",
    target: "김보안 → 운영자",
    ip: "10.10.1.15",
    createdAt: "2026-03-27 09:15:44",
  },
  {
    id: 3,
    type: "자산 등록",
    actor: "김보안",
    action: "하드웨어 자산 등록",
    target: "H-003 / 레노버 랩탑",
    ip: "10.10.1.22",
    createdAt: "2026-03-27 09:21:03",
  },
  {
    id: 4,
    type: "보안 설정",
    actor: "홍길동",
    action: "세션 타임아웃 변경",
    target: "30분 → 60분",
    ip: "10.10.1.15",
    createdAt: "2026-03-27 09:40:55",
  },
];

export const usageData: readonly UsageItem[] = [
  {
    id: "H-001",
    name: "맥북 프로",
    type: "하드웨어",
    assignee: "홍길동",
    department: "보안팀",
    usageStatus: "운영",
    createdAt: "2026-03-21 09:30",
  },
  {
    id: "H-002",
    name: "델 서버",
    type: "하드웨어",
    assignee: "인프라 공용",
    department: "인프라팀",
    usageStatus: "유휴",
    createdAt: "2026-03-11 22:10",
  },
  {
    id: "S-001",
    name: "윈도우 라이선스",
    type: "소프트웨어",
    assignee: "김보안",
    department: "인프라팀",
    usageStatus: "회수대상",
    createdAt: "2026-03-08 08:45",
  },
  {
    id: "S-002",
    name: "Burp Suite Pro",
    type: "소프트웨어",
    assignee: "홍길동",
    department: "보안팀",
    usageStatus: "운영",
    createdAt: "2026-03-15 09:12",
  },
];

export const menuItems: readonly { key: MenuKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { key: "register", label: "자산 등록", icon: Plus },
  { key: "user-register", label: "자산 할당", icon: UserPlus },
  { key: "usage", label: "자산 사용 현황", icon: BarChart3 },
  { key: "settings", label: "설정", icon: Settings },
];

export const settingMenus: readonly { key: SettingsMenuKey; label: string; icon: typeof Users }[] = [
  { key: "members", label: "회원 관리", icon: Users },
  { key: "org-members", label: "구성원 관리", icon: Users },
  { key: "audit", label: "감사 로그", icon: ClipboardList },
  { key: "asset-policy", label: "자산 설정", icon: SlidersHorizontal },
  { key: "security", label: "보안 관리", icon: Lock },
];

export const defaultAssetPolicySettings: AssetPolicySettings = {
  hardwareCategories: ["모니터", "랩탑", "데스크탑"],
  softwareCategories: ["OS", "데이터베이스", "보안", "개발툴", "미들웨어"],
  hardwarePrefix: "H",
  softwarePrefix: "S",
  hardwareCategoryPrefixes: {
    모니터: "M",
    랩탑: "L",
    데스크탑: "D",
  },
  softwareCategoryPrefixes: {
    OS: "S",
    데이터베이스: "S",
    보안: "S",
    개발툴: "S",
    미들웨어: "S",
  },
  sequenceDigits: 3,
};
