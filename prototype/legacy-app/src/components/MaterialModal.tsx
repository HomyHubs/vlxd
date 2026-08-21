import { useState, useEffect, FormEvent } from 'react';
import { Material, MaterialCategory, StockStatus } from '../types';
import { X, Save, Plus } from 'lucide-react';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: Material) => void;
  initialMaterial?: Material | null;
  suppliers: { name: string }[];
}

export function MaterialModal({
  isOpen,
  onClose,
  onSave,
  initialMaterial,
  suppliers,
}: MaterialModalProps) {
  const [formData, setFormData] = useState<Partial<Material>>({
    code: '',
    name: '',
    category: 'CAT_DA',
    unit: 'm³',
    quantity: 100,
    minStock: 20,
    costPrice: 150000,
    sellingPrice: 190000,
    supplier: suppliers[0]?.name || 'Hòa Phát Steel',
    warehouse: 'Bãi Vật Liệu Số 1 (Thủ Đức)',
    status: 'INSTOCK',
    specifications: '',
    notes: '',
  });

  useEffect(() => {
    if (initialMaterial) {
      setFormData(initialMaterial);
    } else {
      setFormData({
        id: `mat-${Date.now()}`,
        code: `VT-${Math.floor(1000 + Math.random() * 9000)}`,
        name: '',
        category: 'CAT_DA',
        unit: 'm³',
        quantity: 100,
        minStock: 20,
        costPrice: 150000,
        sellingPrice: 190000,
        supplier: suppliers[0]?.name || 'Hòa Phát Steel',
        warehouse: 'Bãi Vật Liệu Số 1 (Thủ Đức)',
        status: 'INSTOCK',
        specifications: '',
        notes: '',
      });
    }
  }, [initialMaterial, isOpen, suppliers]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    // Determine status
    let status: StockStatus = 'INSTOCK';
    const qty = Number(formData.quantity) || 0;
    const min = Number(formData.minStock) || 0;
    if (qty <= 0) {
      status = 'OUTOFSTOCK';
    } else if (qty <= min) {
      status = 'LOWSTOCK';
    } else {
      status = 'INSTOCK';
    }

    const updated: Material = {
      id: formData.id || `mat-${Date.now()}`,
      code: formData.code || '',
      name: formData.name || '',
      category: (formData.category as MaterialCategory) || 'CAT_DA',
      unit: formData.unit || 'Cái',
      quantity: qty,
      minStock: min,
      costPrice: Number(formData.costPrice) || 0,
      sellingPrice: Number(formData.sellingPrice) || 0,
      supplier: formData.supplier || 'Nội bộ',
      warehouse: formData.warehouse || 'Kho Tổng',
      status: formData.status || status,
      specifications: formData.specifications,
      notes: formData.notes,
    };

    onSave(updated);
    onClose();
  };

  const margin = formData.sellingPrice && formData.costPrice
    ? (((formData.sellingPrice - formData.costPrice) / formData.sellingPrice) * 100).toFixed(1)
    : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-xl w-full max-w-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 text-slate-800 text-xs">
        {/* Header */}
        <div className="h-12 bg-slate-900 text-white px-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center font-bold text-white text-xs">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-sm">
              {initialMaterial ? 'Cập Nhật Thông Tin Vật Tư' : 'Thêm Mặt Hàng Vật Liệu Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Mã Vật Tư (Mã VT) *
              </label>
              <input
                type="text"
                required
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold outline-none focus:border-orange-500"
                placeholder="VD: ST-HP-16"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Tên Vật Liệu Xây Dựng *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium outline-none focus:border-orange-500"
                placeholder="VD: Thép cây Hòa Phát Φ16 (Dài 11.7m)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Phân loại nhóm *
              </label>
              <select
                value={formData.category || 'CAT_DA'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as MaterialCategory })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 font-medium outline-none focus:border-orange-500"
              >
                <option value="CAT_DA">Cát & Đá</option>
                <option value="SAT_THEP">Sắt & Thép</option>
                <option value="XI_MANG_GACH">Xi măng & Gạch</option>
                <option value="SON_CHONG_THAM">Sơn & Chống thấm</option>
                <option value="THIET_BI_DIEN_NUOC">Thiết bị điện & Nước</option>
                <option value="GO_COP_PHA">Gỗ & Cốp pha</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Đơn vị tính (ĐVT) *
              </label>
              <input
                type="text"
                required
                value={formData.unit || ''}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium outline-none focus:border-orange-500"
                placeholder="m³, Tấn, Bao 50kg, Cây, Viên"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Trạng thái
              </label>
              <select
                value={formData.status || 'INSTOCK'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as StockStatus })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 font-medium outline-none focus:border-orange-500"
              >
                <option value="INSTOCK">SẴN HÀNG</option>
                <option value="LOWSTOCK">SẮP HẾT</option>
                <option value="PENDING">CHỜ NHẬP</option>
                <option value="OUTOFSTOCK">HẾT HÀNG</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Tồn kho hiện tại
              </label>
              <input
                type="number"
                step="any"
                value={formData.quantity ?? 0}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-900 outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Mức tồn tối thiểu
              </label>
              <input
                type="number"
                step="any"
                value={formData.minStock ?? 0}
                onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-medium outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Giá nhập gốc (VNĐ)
              </label>
              <input
                type="number"
                value={formData.costPrice ?? 0}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-bold outline-none focus:border-orange-500 text-slate-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Giá bán niêm yết (VNĐ)
              </label>
              <input
                type="number"
                value={formData.sellingPrice ?? 0}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-bold text-orange-600 outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
            <span>Biên lợi nhuận gộp tạm tính: <strong className="text-emerald-600">{margin}%</strong></span>
            <span>Chênh lệch: <strong className="text-slate-800">{((formData.sellingPrice || 0) - (formData.costPrice || 0)).toLocaleString('vi-VN')} VNĐ/{formData.unit || 'ĐVT'}</strong></span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Nhà cung cấp
              </label>
              <input
                type="text"
                value={formData.supplier || ''}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium outline-none focus:border-orange-500"
                placeholder="VD: Hòa Phát Steel"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Vị trí lưu kho / Bãi vật liệu
              </label>
              <input
                type="text"
                value={formData.warehouse || ''}
                onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium outline-none focus:border-orange-500"
                placeholder="VD: Kho Sắt Thép B2"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Quy chuẩn kỹ thuật / Tiêu chuẩn TCVN
            </label>
            <input
              type="text"
              value={formData.specifications || ''}
              onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium outline-none focus:border-orange-500"
              placeholder="VD: Mác thép CB300-V, tiêu chuẩn TCVN 1651-2:2018"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{initialMaterial ? 'Lưu thay đổi' : 'Thêm vật tư vào kho'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
