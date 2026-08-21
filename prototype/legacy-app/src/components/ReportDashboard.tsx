import { Material, Order, Customer } from '../types';
import { BarChart3, TrendingUp, DollarSign, PackageCheck, AlertCircle, PieChart, ShieldAlert } from 'lucide-react';

interface ReportDashboardProps {
  materials: Material[];
  orders: Order[];
  customers: Customer[];
}

export function ReportDashboard({ materials, orders, customers }: ReportDashboardProps) {
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaidRevenue = orders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalCost = materials.reduce((sum, m) => sum + m.costPrice * m.quantity, 0);
  const totalSellingVal = materials.reduce((sum, m) => sum + m.sellingPrice * m.quantity, 0);
  const totalPotentialProfit = totalSellingVal - totalCost;

  // Category breakdown
  const categoryStats = {
    CAT_DA: { name: 'Cát & Đá', count: 0, val: 0 },
    SAT_THEP: { name: 'Sắt & Thép', count: 0, val: 0 },
    XI_MANG_GACH: { name: 'Xi măng & Gạch', count: 0, val: 0 },
    SON_CHONG_THAM: { name: 'Sơn & Chống thấm', count: 0, val: 0 },
    THIET_BI_DIEN_NUOC: { name: 'Thiết bị điện & Nước', count: 0, val: 0 },
    GO_COP_PHA: { name: 'Gỗ & Cốp pha', count: 0, val: 0 },
  };

  materials.forEach((m) => {
    if (categoryStats[m.category as keyof typeof categoryStats]) {
      categoryStats[m.category as keyof typeof categoryStats].count += 1;
      categoryStats[m.category as keyof typeof categoryStats].val += m.quantity * m.sellingPrice;
    }
  });

  return (
    <div className="bg-white flex-1 rounded-lg border border-slate-200 shadow-2xs flex flex-col overflow-hidden text-xs">
      <div className="p-3 sm:p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
        <div>
          <h2 className="font-bold text-slate-800 text-base">Báo Cáo Hoạt Động Kinh Doanh & Tồn Kho</h2>
          <p className="text-[11px] text-slate-400">Số liệu cập nhật theo thời gian thực từ hệ thống kho bãi</p>
        </div>
        <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded text-[11px] border border-emerald-200">
          Chỉ số tài chính: Tốt
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Top 3 Analytical Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-900 text-white p-4 rounded-lg border border-slate-800 shadow-xs">
            <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold uppercase">
              <span>Doanh số bán hàng</span>
              <DollarSign className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-2xl font-black text-white mt-1 font-mono">{totalRevenue.toLocaleString('vi-VN')} đ</p>
            <div className="mt-2 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Đã thực thu: {totalPaidRevenue.toLocaleString('vi-VN')} đ ({((totalPaidRevenue / (totalRevenue || 1)) * 100).toFixed(0)}%)</span>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-lg border border-slate-800 shadow-xs">
            <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold uppercase">
              <span>Giá trị kho & Lợi nhuận dự tính</span>
              <PackageCheck className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-orange-400 mt-1 font-mono">{totalPotentialProfit.toLocaleString('vi-VN')} đ</p>
            <div className="mt-2 text-[10px] text-slate-300 font-semibold">
              Vốn lưu động đang nằm trong kho: {totalCost.toLocaleString('vi-VN')} đ
            </div>
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-lg border border-slate-800 shadow-xs">
            <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold uppercase">
              <span>Khách hàng & Đơn hàng</span>
              <BarChart3 className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white mt-1 font-mono">{orders.length} <span className="text-sm font-normal text-slate-400">đơn</span></p>
            <div className="mt-2 text-[10px] text-slate-300 font-semibold">
              {customers.length} nhà thầu / đối tác thi công thường xuyên
            </div>
          </div>
        </div>

        {/* Category Value Proportion */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800 text-sm">Cơ Cấu Giá Trị Vật Tư Theo Nhóm Ngành Hàng</h3>
            <span className="text-slate-500 text-[11px]">Tổng giá trị: {totalSellingVal.toLocaleString('vi-VN')} đ</span>
          </div>

          <div className="space-y-2.5">
            {Object.entries(categoryStats).map(([key, stat]) => {
              const percent = totalSellingVal > 0 ? (stat.val / totalSellingVal) * 100 : 0;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-slate-700 font-semibold text-xs">
                    <span>{stat.name} ({stat.count} mặt hàng)</span>
                    <span className="font-mono">{stat.val.toLocaleString('vi-VN')} đ ({percent.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        key === 'SAT_THEP'
                          ? 'bg-orange-500'
                          : key === 'XI_MANG_GACH'
                          ? 'bg-blue-600'
                          : key === 'CAT_DA'
                          ? 'bg-amber-500'
                          : key === 'SON_CHONG_THAM'
                          ? 'bg-emerald-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.max(2, percent)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Inventory Alert List */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1.5 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>Mặt Hàng Cần Nhập Thêm Khẩn Cấp (Dưới Định Mức Tồn An Toàn)</span>
          </h3>
          <div className="divide-y divide-slate-100">
            {materials
              .filter((m) => m.quantity <= m.minStock)
              .map((m) => (
                <div key={m.id} className="py-2 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{m.name}</span>
                    <span className="text-slate-400 font-mono ml-2">({m.code})</span>
                    <p className="text-[10px] text-slate-500">Nhà cung cấp: {m.supplier} - Vị trí: {m.warehouse}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-red-600">
                      Tồn: {m.quantity} {m.unit}
                    </span>{' '}
                    <span className="text-slate-400 text-[10px]">/ Định mức: {m.minStock} {m.unit}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
