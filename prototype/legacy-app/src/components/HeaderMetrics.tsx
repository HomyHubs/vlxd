import { ArrowUpRight, TrendingUp, AlertCircle, ShoppingCart, DollarSign, Package } from 'lucide-react';

interface HeaderMetricsProps {
  totalInventoryValue: number;
  pendingOrdersCount: number;
  urgentOrdersCount: number;
  lowStockCount: number;
  estimatedProfit: number;
  profitMarginPercent: number;
  onFilterLowStock: () => void;
  onNavigateOrders: () => void;
}

export function HeaderMetrics({
  totalInventoryValue,
  pendingOrdersCount,
  urgentOrdersCount,
  lowStockCount,
  estimatedProfit,
  profitMarginPercent,
  onFilterLowStock,
  onNavigateOrders,
}: HeaderMetricsProps) {
  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN');
  };

  return (
    <header className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 shrink-0">
      {/* Metric 1: Inventory Value */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Tổng giá trị tồn kho</p>
          <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600">
            <Package className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-1">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(totalInventoryValue)} <span className="text-[11px] font-normal text-slate-400">VND</span>
          </h2>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>+12.4% so với tháng trước</span>
          </div>
        </div>
      </div>

      {/* Metric 2: Pending Orders */}
      <div
        onClick={onNavigateOrders}
        className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between cursor-pointer hover:border-orange-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Đơn hàng chờ xử lý</p>
          <div className="w-6 h-6 rounded bg-orange-50 flex items-center justify-center text-orange-600">
            <ShoppingCart className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-1">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {pendingOrdersCount} <span className="text-xs font-normal text-slate-400">đơn hàng</span>
          </h2>
          <p className="text-[10px] text-orange-600 font-bold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
            <span>{urgentOrdersCount} đơn hàng giao gấp trong ngày</span>
          </p>
        </div>
      </div>

      {/* Metric 3: Low Stock Warning */}
      <div
        onClick={onFilterLowStock}
        className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between cursor-pointer hover:border-red-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Mặt hàng sắp hết</p>
          <div className="w-6 h-6 rounded bg-red-50 flex items-center justify-center text-red-600">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-1">
          <h2 className="text-xl font-extrabold text-red-600 tracking-tight">
            {lowStockCount < 10 ? `0${lowStockCount}` : lowStockCount} <span className="text-xs font-normal text-slate-400">mặt hàng</span>
          </h2>
          <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
            <span>⚠️ Cần nhập thêm thép & ván ép</span>
            <span className="underline ml-auto font-normal text-slate-400">Xem ngay</span>
          </p>
        </div>
      </div>

      {/* Metric 4: Profit */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Lợi nhuận gộp dự tính</p>
          <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center text-blue-600">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-1">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(estimatedProfit)} <span className="text-[11px] font-normal text-slate-400">VND</span>
          </h2>
          <p className="text-[10px] text-blue-600 font-bold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>Biên lợi nhuận TB: {profitMarginPercent.toFixed(1)}%</span>
          </p>
        </div>
      </div>
    </header>
  );
}
