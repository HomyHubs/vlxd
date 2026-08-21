import { useState, FormEvent } from 'react';
import { StoreSettings, MaterialCategory, CategoryStockAlertSetting } from '../types';
import { Settings, Bell, ShieldAlert, Store, Save, RefreshCw, CheckCircle2, AlertTriangle, Building2, Phone, DollarSign } from 'lucide-react';

interface SettingsManagementProps {
  settings: StoreSettings;
  onSaveSettings: (updated: StoreSettings) => void;
  onApplyCategoryThresholdsToMaterials: (categoryAlerts: Record<string, CategoryStockAlertSetting>) => void;
  primaryColor?: string;
}

export function SettingsManagement({
  settings,
  onSaveSettings,
  onApplyCategoryThresholdsToMaterials,
  primaryColor = '#f97316',
}: SettingsManagementProps) {
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [appliedAlertsSuccess, setAppliedAlertsSuccess] = useState(false);

  const handleCategoryAlertChange = (
    catKey: string,
    field: keyof CategoryStockAlertSetting,
    value: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      categoryAlerts: {
        ...prev.categoryAlerts,
        [catKey]: {
          ...prev.categoryAlerts[catKey],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleApplyToExisting = () => {
    if (
      window.confirm(
        'Bạn có muốn đồng bộ lại định mức tồn an toàn này cho toàn bộ mặt hàng thuộc từng phân loại tương ứng trong kho?'
      )
    ) {
      onApplyCategoryThresholdsToMaterials(formData.categoryAlerts);
      setAppliedAlertsSuccess(true);
      setTimeout(() => setAppliedAlertsSuccess(false), 3500);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg border border-slate-200 shadow-xs text-xs">
      {/* Header */}
      <div className="h-12 bg-slate-900 text-white px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-xs sm:text-sm">Cài Đặt Hệ Thống & Cấu Hình Định Mức Báo Động</h2>
          </div>
        </div>

        {saveSuccess && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1 rounded-full animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã lưu cài đặt thành công!
          </span>
        )}
      </div>

      {/* Main Content Body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* SECTION 1: Cấu hình mức báo động cho mỗi loại vật tư */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4" style={{ color: primaryColor }} />
                <span>1. Cấu Hình Mức Tồn Kho Báo Động Cho Từng Loại Vật Tư</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Khi số lượng tồn kho của từng ngành hàng xuống dưới ngưỡng này, hệ thống sẽ tự động bật cảnh báo thiếu hàng (Low Stock).
              </p>
            </div>

            <button
              type="button"
              onClick={handleApplyToExisting}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đồng bộ áp dụng cho toàn bộ kho</span>
            </button>
          </div>

          {appliedAlertsSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã cập nhật định mức an toàn cho toàn bộ mặt hàng trong danh mục kho bãi thành công!</span>
            </div>
          )}

          {/* Alert Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {(Object.entries(formData.categoryAlerts || {}) as [string, CategoryStockAlertSetting][]).map(([key, item]) => (
              <div
                key={key}
                className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 text-xs">{item.categoryName}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                    {item.unit}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Định mức tối thiểu báo động:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.defaultMinStock}
                      onChange={(e) =>
                        handleCategoryAlertChange(key, 'defaultMinStock', parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-slate-50 border border-slate-300 focus:border-slate-500 rounded px-2.5 py-1.5 font-mono font-bold text-xs"
                    />
                    <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{item.unit}</span>
                  </div>
                </div>

                <div className="pt-1 text-[10px] text-slate-400 italic">
                  * Tồn &le; {item.defaultMinStock} {item.unit} sẽ chuyển trạng thái cảnh báo khẩn.
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: Cấu hình hạn mức tài chính & cảnh báo rủi ro */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-200">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span>2. Cảnh Báo Tài Chính & Hạn Mức Công Nợ</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
              <label className="block font-bold text-slate-800 text-xs">
                Hạn mức nợ tối đa cho 1 nhà thầu / công ty (VNĐ):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="1000000"
                  value={formData.maxCustomerDebtLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, maxCustomerDebtLimit: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:border-slate-500 rounded px-3 py-2 font-mono font-bold text-xs text-red-700"
                />
                <span className="font-bold text-slate-600">VNĐ</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Hệ thống sẽ hiển thị thẻ đỏ cảnh báo trên Sổ Công Nợ khi nhà thầu nợ vượt quá số tiền này.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
              <label className="block font-bold text-slate-800 text-xs">
                Cảnh báo khi Biên lợi nhuận gộp dưới (%):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.minProfitMarginAlertPercent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minProfitMarginAlertPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:border-slate-500 rounded px-3 py-2 font-mono font-bold text-xs text-blue-700"
                />
                <span className="font-bold text-slate-600">%</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Cảnh báo khi giá bán trừ giá vốn không đạt tỷ lệ sinh lời tối thiểu kỳ vọng.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Thông tin Cửa hàng & Bãi VLXD */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-200">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>3. Thông Tin Cửa Hàng & Bãi Vật Liệu (In Phiếu Giao Hàng)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên Cửa Hàng / Doanh Nghiệp:</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Hotline / Số Điện Thoại:</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Địa Chỉ Bãi / Kho Tổng:</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mã Số Thuế (MST):</label>
              <input
                type="text"
                value={formData.taxCode}
                onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Thông Tin Tài Khoản Ngân Hàng:</label>
              <input
                type="text"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs font-mono font-bold text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Footer save button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 text-white font-extrabold rounded-lg shadow-md cursor-pointer transition-all hover:brightness-110 flex items-center gap-2 text-xs sm:text-sm"
            style={{ backgroundColor: primaryColor }}
          >
            <Save className="w-4 h-4" />
            <span>Lưu Toàn Bộ Cài Đặt</span>
          </button>
        </div>
      </form>
    </div>
  );
}
