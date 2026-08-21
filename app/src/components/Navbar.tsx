import { useState } from 'react';
import {
  Search,
  Calculator,
  RefreshCw,
  LayoutGrid,
  Menu,
  X,
  ShoppingCart,
  Warehouse,
  FileSpreadsheet,
  BarChart3,
  CreditCard,
  Map,
  Palette,
  Settings
} from 'lucide-react';
import { ThemeVariationId, THEME_VARIATIONS } from '../theme/ThemeConfig';

export type ActiveNavTab = 'MATERIALS' | 'POS' | 'WAREHOUSE' | 'YARD_MAP' | 'ORDERS' | 'DEBTS' | 'REPORTS' | 'SETTINGS';

interface NavbarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenConverter: () => void;
  urgentOrdersCount: number;
  lowStockCount: number;
  onResetData: () => void;
  currentThemeId: ThemeVariationId;
  onOpenVariationModal: () => void;
}

export function Navbar({
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  onOpenConverter,
  urgentOrdersCount,
  lowStockCount,
  onResetData,
  currentThemeId,
  onOpenVariationModal,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentTheme = THEME_VARIATIONS[currentThemeId] || THEME_VARIATIONS.HIGH_DENSITY_ORANGE;

  const navItems = [
    { id: 'MATERIALS' as ActiveNavTab, label: 'Vật tư & Tồn kho', icon: LayoutGrid, count: lowStockCount, countType: 'alert' },
    { id: 'POS' as ActiveNavTab, label: 'POS Bán nhanh', icon: ShoppingCart, count: 0 },
    { id: 'WAREHOUSE' as ActiveNavTab, label: 'Kho & Nhập xuất', icon: Warehouse, count: 0 },
    { id: 'YARD_MAP' as ActiveNavTab, label: 'Sơ đồ bãi 2D', icon: Map, count: 0 },
    { id: 'ORDERS' as ActiveNavTab, label: 'Đơn hàng & Báo giá', icon: FileSpreadsheet, count: urgentOrdersCount, countType: 'urgent' },
    { id: 'DEBTS' as ActiveNavTab, label: 'Sổ Công nợ', icon: CreditCard, count: 0 },
    { id: 'REPORTS' as ActiveNavTab, label: 'Báo cáo', icon: BarChart3, count: 0 },
    { id: 'SETTINGS' as ActiveNavTab, label: 'Cài đặt & Báo động', icon: Settings, count: 0 },
  ];

  return (
    <header className={`${currentTheme.colors.navBg} text-white border-b ${currentTheme.colors.navBorder} select-none z-30 shrink-0 relative transition-colors`}>
      <div className="h-14 flex items-center justify-between px-3 sm:px-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-md bg-white/10 text-slate-200 hover:text-white lg:hidden cursor-pointer"
            title="Mở menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onSelectTab('MATERIALS')}
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center font-black text-lg text-white shadow-xs transition-transform group-hover:scale-105"
              style={{ backgroundColor: currentTheme.colors.primary }}
            >
              V
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-sm sm:text-base leading-tight flex items-center gap-1">
                HomyHubs <span style={{ color: currentTheme.colors.primary }} className="font-bold">VLXD</span>
              </span>
              <span className="text-[9px] text-slate-400 font-mono tracking-wider hidden xs:block">
                QUẢN LÝ KHO & BÃI VẬT LIỆU
              </span>
            </div>
          </div>

          <div className="hidden 2xl:block h-5 w-px bg-white/20 mx-1"></div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-0.5 text-xs font-semibold">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-2.5 py-1.5 rounded-md transition-colors relative flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-white bg-white/15 border border-white/20 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: isActive ? currentTheme.colors.primary : undefined }}
                  />
                  <span>{item.label}</span>
                  {item.count > 0 && item.countType === 'alert' && (
                    <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 rounded text-[10px] font-bold border border-red-500/40">
                      {item.count}
                    </span>
                  )}
                  {item.count > 0 && item.countType === 'urgent' && (
                    <span className="px-1.5 py-0.2 bg-orange-500/20 text-orange-400 rounded text-[10px] font-bold border border-orange-500/40 animate-pulse">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* VARIATION PREVIEW BUTTON (Theme & Style Switcher) */}
          <button
            onClick={onOpenVariationModal}
            className="flex items-center gap-1.5 text-xs text-white px-2.5 sm:px-3 py-1.5 rounded-md font-bold transition-all shadow-xs cursor-pointer active:scale-95 hover:brightness-110"
            style={{ backgroundColor: currentTheme.colors.primary }}
            title="Mở bảng chọn biến thể giao diện và màu sắc (Variation Preview)"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Variation Preview</span>
            <span className="sm:hidden">Theme</span>
            <span className="text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-mono hidden md:inline">
              5 Styles
            </span>
          </button>

          {/* Quick Calculator Button */}
          <button
            onClick={onOpenConverter}
            className="hidden md:flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer"
            title="Tính quy đổi Thép, Cát, Gạch"
          >
            <Calculator className="w-3.5 h-3.5" style={{ color: currentTheme.colors.primary }} />
            <span className="hidden xl:inline">Tính quy đổi</span>
          </button>

          {/* Global Search */}
          <div className="bg-white/10 rounded-md px-2 py-1.5 flex items-center gap-1.5 border border-white/15 focus-within:border-white/40 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm vật liệu..."
              className="bg-transparent border-none outline-none text-xs w-20 sm:w-28 md:w-36 text-slate-200 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button onClick={() => onSearchChange('')} className="text-slate-400 hover:text-white text-[10px] cursor-pointer">
                ✕
              </button>
            )}
          </div>

          {/* Reset sample data */}
          <button
            onClick={onResetData}
            title="Khôi phục dữ liệu ban đầu"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white/10 border border-white/15 text-slate-300 hover:text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar / Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-900/95 border-t border-white/15 p-2 space-y-1 animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-md text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  isActive
                    ? 'text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
                style={{ backgroundColor: isActive ? currentTheme.colors.primary : undefined }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white rounded text-[10px] font-bold">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2 border-t border-white/15 flex gap-2">
            <button
              onClick={() => {
                onOpenVariationModal();
                setIsMobileMenuOpen(false);
              }}
              className="flex-1 py-2 px-3 rounded-md text-center text-xs font-bold text-white shadow-xs cursor-pointer"
              style={{ backgroundColor: currentTheme.colors.primary }}
            >
              🎨 Chọn Biến Thể Giao Diện
            </button>
            <button
              onClick={() => {
                onOpenConverter();
                setIsMobileMenuOpen(false);
              }}
              className="py-2 px-3 rounded-md text-xs font-semibold bg-white/10 text-slate-200 hover:bg-white/20 cursor-pointer"
            >
              Tính quy đổi
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
