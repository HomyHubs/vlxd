import { MaterialCategory, StockStatus, Supplier } from '../types';
import { Layers, AlertTriangle, CheckCircle2, Clock, Calculator, Building2 } from 'lucide-react';

interface SidebarProps {
  selectedCategory: MaterialCategory;
  onSelectCategory: (category: MaterialCategory) => void;
  categoryCounts: Record<MaterialCategory, number>;
  selectedStatus: StockStatus | 'ALL';
  onSelectStatus: (status: StockStatus | 'ALL') => void;
  statusCounts: {
    ALL: number;
    INSTOCK: number;
    LOWSTOCK: number;
    PENDING: number;
    OUTOFSTOCK: number;
  };
  suppliers: Supplier[];
  selectedSupplier: string | 'ALL';
  onSelectSupplier: (supplier: string | 'ALL') => void;
  onOpenConverter: () => void;
}

const CATEGORIES: { id: MaterialCategory; label: string }[] = [
  { id: 'ALL', label: 'Tất cả vật tư' },
  { id: 'CAT_DA', label: 'Cát & Đá' },
  { id: 'SAT_THEP', label: 'Sắt & Thép' },
  { id: 'XI_MANG_GACH', label: 'Xi măng & Gạch' },
  { id: 'SON_CHONG_THAM', label: 'Sơn & Chống thấm' },
  { id: 'THIET_BI_DIEN_NUOC', label: 'Thiết bị điện & Nước' },
  { id: 'GO_COP_PHA', label: 'Gỗ & Cốp pha' },
];

export function Sidebar({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  selectedStatus,
  onSelectStatus,
  statusCounts,
  suppliers,
  selectedSupplier,
  onSelectSupplier,
  onOpenConverter,
}: SidebarProps) {
  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto select-none">
      {/* Category List */}
      <div className="p-3 border-b border-slate-100">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
          Phân loại vật liệu
        </h3>
        <ul className="space-y-0.5">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <li key={cat.id}>
                <button
                  onClick={() => onSelectCategory(cat.id)}
                  className={`w-full text-left text-xs py-1.5 px-2.5 rounded-md font-medium flex justify-between items-center transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-orange-50 text-orange-600 font-bold border border-orange-200/80 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected
                        ? 'bg-orange-200/70 text-orange-800 font-bold'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Stock Filter Filter */}
      <div className="p-3 border-b border-slate-100">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
          Trạng thái tồn kho
        </h3>
        <div className="space-y-1 text-xs">
          <button
            onClick={() => onSelectStatus('ALL')}
            className={`w-full py-1.5 px-2.5 rounded-md flex justify-between items-center transition-colors ${
              selectedStatus === 'ALL'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Tất cả kho</span>
            <span className="text-[10px] opacity-80">{statusCounts.ALL}</span>
          </button>

          <button
            onClick={() => onSelectStatus('LOWSTOCK')}
            className={`w-full py-1.5 px-2.5 rounded-md flex justify-between items-center transition-colors ${
              selectedStatus === 'LOWSTOCK'
                ? 'bg-red-600 text-white font-bold'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              <span>Sắp hết hàng</span>
            </span>
            <span className={`text-[10px] px-1.5 rounded font-bold ${
              selectedStatus === 'LOWSTOCK' ? 'bg-red-800 text-white' : 'bg-red-100 text-red-700'
            }`}>
              {statusCounts.LOWSTOCK}
            </span>
          </button>

          <button
            onClick={() => onSelectStatus('PENDING')}
            className={`w-full py-1.5 px-2.5 rounded-md flex justify-between items-center transition-colors ${
              selectedStatus === 'PENDING'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Chờ nhập thêm</span>
            </span>
            <span className={`text-[10px] px-1.5 rounded font-bold ${
              selectedStatus === 'PENDING' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {statusCounts.PENDING}
            </span>
          </button>

          <button
            onClick={() => onSelectStatus('INSTOCK')}
            className={`w-full py-1.5 px-2.5 rounded-md flex justify-between items-center transition-colors ${
              selectedStatus === 'INSTOCK'
                ? 'bg-emerald-700 text-white font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Đầy đủ tồn kho</span>
            </span>
            <span className="text-[10px] text-slate-500">{statusCounts.INSTOCK}</span>
          </button>
        </div>
      </div>

      {/* Key Suppliers */}
      <div className="p-3 flex-1 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Nhà cung cấp chính
          </h3>
          {selectedSupplier !== 'ALL' && (
            <button
              onClick={() => onSelectSupplier('ALL')}
              className="text-[10px] text-orange-600 hover:underline font-bold"
            >
              Bỏ lọc
            </button>
          )}
        </div>
        <div className="space-y-1.5">
          {suppliers.slice(0, 5).map((sup) => {
            const isSelected = selectedSupplier === sup.name;
            return (
              <div
                key={sup.id}
                onClick={() => onSelectSupplier(isSelected ? 'ALL' : sup.name)}
                className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors text-xs ${
                  isSelected
                    ? 'bg-slate-100 font-bold text-slate-900 border border-slate-300'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      sup.currentDebt > 100000000
                        ? 'bg-amber-500'
                        : sup.status === 'active'
                        ? 'bg-green-500'
                        : 'bg-slate-400'
                    }`}
                  ></div>
                  <span className="truncate text-xs">{sup.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Quick Converter Widget */}
      <div className="p-3 bg-slate-50">
        <button
          onClick={onOpenConverter}
          className="w-full py-2 px-2.5 bg-white hover:bg-orange-50 border border-orange-300 rounded-md text-orange-600 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Bộ tính khối lượng VLXD</span>
        </button>
      </div>
    </aside>
  );
}
