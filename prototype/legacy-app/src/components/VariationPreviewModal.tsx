import { useState } from 'react';
import { ThemeVariationId, DensityMode, THEME_VARIATIONS, ThemeVariation } from '../theme/ThemeConfig';
import { Palette, Check, Sparkles, Sliders, Moon, Sun, X, Eye, RefreshCw, LayoutTemplate } from 'lucide-react';

interface VariationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: ThemeVariationId;
  onSelectTheme: (id: ThemeVariationId) => void;
  currentDensity: DensityMode;
  onSelectDensity: (density: DensityMode) => void;
}

export function VariationPreviewModal({
  isOpen,
  onClose,
  currentThemeId,
  onSelectTheme,
  currentDensity,
  onSelectDensity,
}: VariationPreviewModalProps) {
  const [hoveredThemeId, setHoveredThemeId] = useState<ThemeVariationId | null>(null);

  if (!isOpen) return null;

  const activeOrHoveredTheme = THEME_VARIATIONS[hoveredThemeId || currentThemeId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in select-none">
      <div className="bg-white rounded-xl border border-slate-300 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95">
        {/* Header */}
        <div className="h-14 bg-slate-900 text-white px-5 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shadow-xs">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <span>Variation Preview (Biến Thể Giao Diện & Màu Sắc)</span>
                <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded-full font-mono">
                  5 Styles
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Lựa chọn phong cách thiết kế, bảng màu và mật độ hiển thị phù hợp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Theme Variations Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-orange-500" />
                <span>1. Chọn Biến Thể Phong Cách & Màu Chủ Đạo</span>
              </h3>
              <span className="text-[11px] text-slate-500">Chạm để áp dụng ngay</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {Object.values(THEME_VARIATIONS).map((theme) => {
                const isSelected = currentThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onSelectTheme(theme.id)}
                    onMouseEnter={() => setHoveredThemeId(theme.id)}
                    onMouseLeave={() => setHoveredThemeId(null)}
                    className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                      isSelected
                        ? 'bg-slate-50 border-orange-500 ring-2 ring-orange-500/50 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Color swatches bar */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-md border border-slate-200">
                          {theme.previewColors.map((color, idx) => (
                            <span
                              key={idx}
                              className="w-4 h-4 rounded-full border border-black/10 shadow-2xs inline-block"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>

                        {isSelected ? (
                          <span className="flex items-center gap-1 text-[11px] font-extrabold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> Đang dùng
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 group-hover:text-slate-700 font-mono">
                            {theme.category}
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm group-hover:text-orange-600 transition-colors">
                        {theme.name}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">{theme.subtitle}</p>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                        {theme.description}
                      </p>
                    </div>

                    {/* Micro Live UI Preview Strip */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-bold text-white shadow-2xs"
                          style={{ backgroundColor: theme.colors.primary }}
                        >
                          Nút bấm
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold border"
                          style={{
                            backgroundColor: theme.colors.primaryLight,
                            borderColor: theme.colors.primary,
                            color: theme.colors.primaryText,
                          }}
                        >
                          Tag #{theme.id.slice(0, 4)}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-orange-500 flex items-center gap-0.5">
                        <Eye className="w-3 h-3" /> Xem thử
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Density Mode Selector */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-500" />
                <span>2. Chọn Mật Độ Hiển Thị (Density Level)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => onSelectDensity('COMPACT')}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                  currentDensity === 'COMPACT'
                    ? 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/40 text-orange-950 font-bold'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-extrabold text-xs">Siêu Mật Độ (Compact)</span>
                  {currentDensity === 'COMPACT' && <Check className="w-3.5 h-3.5 text-orange-600" />}
                </div>
                <p className="text-[10px] text-slate-500 font-normal">
                  Chữ 11-12px, padding hẹp, chứa tối đa 25+ dòng dữ liệu trên 1 màn hình.
                </p>
              </button>

              <button
                onClick={() => onSelectDensity('STANDARD')}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                  currentDensity === 'STANDARD'
                    ? 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/40 text-orange-950 font-bold'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-extrabold text-xs">Tiêu Chuẩn (Standard)</span>
                  {currentDensity === 'STANDARD' && <Check className="w-3.5 h-3.5 text-orange-600" />}
                </div>
                <p className="text-[10px] text-slate-500 font-normal">
                  Cân bằng tối ưu giữa mật độ thông tin và độ thoáng dễ nhìn.
                </p>
              </button>

              <button
                onClick={() => onSelectDensity('SPACIOUS')}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                  currentDensity === 'SPACIOUS'
                    ? 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/40 text-orange-950 font-bold'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-extrabold text-xs">Thoáng Rộng (Spacious)</span>
                  {currentDensity === 'SPACIOUS' && <Check className="w-3.5 h-3.5 text-orange-600" />}
                </div>
                <p className="text-[10px] text-slate-500 font-normal">
                  Khoảng cách nút bấm rộng, phù hợp thao tác cảm ứng trên máy tính bảng.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-600 text-xs">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>
              Đang áp dụng:{' '}
              <strong className="text-slate-900">{THEME_VARIATIONS[currentThemeId].name}</strong> (
              {currentDensity})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSelectTheme('HIGH_DENSITY_ORANGE');
                onSelectDensity('COMPACT');
              }}
              className="px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Đặt lại mặc định
            </button>
            <button
              onClick={onClose}
              className="px-5 py-1.5 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              Áp dụng & Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
