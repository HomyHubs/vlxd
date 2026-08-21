export type ThemeVariationId =
  | 'HIGH_DENSITY_ORANGE'
  | 'BLUEPRINT_TECH'
  | 'DARK_TERMINAL_PRO'
  | 'WARM_EARTH_CLAY'
  | 'EMERALD_ECO_STEEL';

export type DensityMode = 'COMPACT' | 'STANDARD' | 'SPACIOUS';

export interface ThemeVariation {
  id: ThemeVariationId;
  name: string;
  subtitle: string;
  category: string;
  isDark: boolean;
  colors: {
    primary: string; // e.g. '#f97316'
    primaryHover: string;
    primaryLight: string;
    primaryText: string;
    navBg: string;
    navBorder: string;
    appBg: string;
    cardBg: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    tableHeaderBg: string;
    tableRowHover: string;
    accentBadge: string;
    badgeBorder: string;
    badgeText: string;
  };
  previewColors: [string, string, string]; // 3 representative color swatches
  description: string;
}

export const THEME_VARIATIONS: Record<ThemeVariationId, ThemeVariation> = {
  HIGH_DENSITY_ORANGE: {
    id: 'HIGH_DENSITY_ORANGE',
    name: 'High Density (Cam Công Trình)',
    subtitle: 'Slate Dark & Cam Kỹ Thuật',
    category: 'Mặc định VLXD',
    isDark: false,
    previewColors: ['#0f172a', '#f97316', '#f1f5f9'],
    description: 'Phong cách mật độ dữ liệu cao với gam màu cam cơ giới công trình trên nền Slate đậm.',
    colors: {
      primary: '#f97316',
      primaryHover: '#ea580c',
      primaryLight: '#fff7ed',
      primaryText: '#c2410c',
      navBg: 'bg-slate-900',
      navBorder: 'border-slate-700',
      appBg: 'bg-slate-100',
      cardBg: 'bg-white',
      cardBorder: 'border-slate-200',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-600',
      textMuted: 'text-slate-400',
      tableHeaderBg: 'bg-slate-50',
      tableRowHover: 'hover:bg-slate-50/80',
      accentBadge: 'bg-orange-50',
      badgeBorder: 'border-orange-200',
      badgeText: 'text-orange-700',
    },
  },
  BLUEPRINT_TECH: {
    id: 'BLUEPRINT_TECH',
    name: 'Blueprint Tech (Kỹ Thuật Xây Dựng)',
    subtitle: 'Deep Navy & Xanh Bản Vẽ',
    category: 'Kiến trúc & Kết cấu',
    isDark: false,
    previewColors: ['#032b5f', '#2563eb', '#f0f7ff'],
    description: 'Tông màu xanh kỹ thuật đồ họa và bản vẽ kết cấu thép, tạo cảm giác chính xác, hiện đại.',
    colors: {
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      primaryLight: '#eff6ff',
      primaryText: '#1e40af',
      navBg: 'bg-slate-950',
      navBorder: 'border-blue-900/60',
      appBg: 'bg-slate-100/90',
      cardBg: 'bg-white',
      cardBorder: 'border-blue-100',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-600',
      textMuted: 'text-slate-400',
      tableHeaderBg: 'bg-blue-50/50',
      tableRowHover: 'hover:bg-blue-50/40',
      accentBadge: 'bg-blue-50',
      badgeBorder: 'border-blue-200',
      badgeText: 'text-blue-700',
    },
  },
  DARK_TERMINAL_PRO: {
    id: 'DARK_TERMINAL_PRO',
    name: 'Dark Pro Yard (Ca Đêm Kiểm Kho)',
    subtitle: 'Zinc-950 & Neon Amber Tương Phản Cao',
    category: 'Giao diện Tối & Ban Đêm',
    isDark: true,
    previewColors: ['#09090b', '#f59e0b', '#27272a'],
    description: 'Chế độ nền tối tuyệt đối với các điểm sáng Amber/Emerald chống mỏi mắt cho ca làm việc đêm.',
    colors: {
      primary: '#f59e0b',
      primaryHover: '#d97706',
      primaryLight: '#292524',
      primaryText: '#fbbf24',
      navBg: 'bg-black',
      navBorder: 'border-zinc-800',
      appBg: 'bg-zinc-950',
      cardBg: 'bg-zinc-900',
      cardBorder: 'border-zinc-800',
      textPrimary: 'text-zinc-100',
      textSecondary: 'text-zinc-400',
      textMuted: 'text-zinc-500',
      tableHeaderBg: 'bg-zinc-900/90',
      tableRowHover: 'hover:bg-zinc-800/60',
      accentBadge: 'bg-amber-950/60',
      badgeBorder: 'border-amber-700/50',
      badgeText: 'text-amber-400',
    },
  },
  WARM_EARTH_CLAY: {
    id: 'WARM_EARTH_CLAY',
    name: 'Warm Earth (Gạch Ngói & Cát Vàng)',
    subtitle: 'Stone Warm & Đất Nung Terracotta',
    category: 'Mộc mạc & Truyền thống',
    isDark: false,
    previewColors: ['#292524', '#c2410c', '#f5f5f4'],
    description: 'Lấy cảm hứng từ màu gạch ngói, đất sét nung và cát thạch anh với nền Stone ấm tự nhiên.',
    colors: {
      primary: '#c2410c',
      primaryHover: '#9a3412',
      primaryLight: '#fff7ed',
      primaryText: '#9a3412',
      navBg: 'bg-stone-900',
      navBorder: 'border-stone-700',
      appBg: 'bg-stone-100',
      cardBg: 'bg-white',
      cardBorder: 'border-stone-200',
      textPrimary: 'text-stone-900',
      textSecondary: 'text-stone-600',
      textMuted: 'text-stone-400',
      tableHeaderBg: 'bg-stone-50',
      tableRowHover: 'hover:bg-stone-100/60',
      accentBadge: 'bg-orange-50',
      badgeBorder: 'border-orange-200',
      badgeText: 'text-orange-800',
    },
  },
  EMERALD_ECO_STEEL: {
    id: 'EMERALD_ECO_STEEL',
    name: 'Emerald Eco-Steel (Thép Xanh Công Nghiệp)',
    subtitle: 'Forest Teal & Xanh Bền Vững',
    category: 'Bền vững & Sinh thái',
    isDark: false,
    previewColors: ['#064e3b', '#059669', '#ecfdf5'],
    description: 'Sắc xanh ngọc lục bảo kết hợp thép xám, mang cảm giác tinh gọn, chuẩn chỉ và bền vững.',
    colors: {
      primary: '#059669',
      primaryHover: '#047857',
      primaryLight: '#ecfdf5',
      primaryText: '#065f46',
      navBg: 'bg-emerald-950',
      navBorder: 'border-emerald-900/70',
      appBg: 'bg-slate-100',
      cardBg: 'bg-white',
      cardBorder: 'border-emerald-100',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-600',
      textMuted: 'text-slate-400',
      tableHeaderBg: 'bg-emerald-50/40',
      tableRowHover: 'hover:bg-emerald-50/30',
      accentBadge: 'bg-emerald-50',
      badgeBorder: 'border-emerald-200',
      badgeText: 'text-emerald-700',
    },
  },
};
