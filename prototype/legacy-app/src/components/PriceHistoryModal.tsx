import { useState } from 'react';
import { Material, PriceHistoryRecord } from '../types';
import { History, TrendingUp, TrendingDown, Plus, X, Calendar, User, Tag, DollarSign, ArrowRight } from 'lucide-react';

interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  onUpdatePrices: (materialId: string, newCostPrice: number, newSellingPrice: number, reason: string) => void;
  primaryColor?: string;
}

export function PriceHistoryModal({
  isOpen,
  onClose,
  material,
  onUpdatePrices,
  primaryColor = '#f97316',
}: PriceHistoryModalProps) {
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [newCost, setNewCost] = useState<number>(0);
  const [newSelling, setNewSelling] = useState<number>(0);
  const [reason, setReason] = useState('');

  if (!isOpen || !material) return null;

  const currentCost = material.costPrice;
  const currentSelling = material.sellingPrice;
  const priceHistory = material.priceHistory || [];

  const handleStartAdjust = () => {
    setNewCost(material.costPrice);
    setNewSelling(material.sellingPrice);
    setReason('');
    setIsAdjusting(true);
  };

  const handleSavePriceChange = () => {
    if (newCost <= 0 || newSelling <= 0) return;
    onUpdatePrices(material.id, newCost, newSelling, reason.trim() || 'Cập nhật giá bán theo biến động thị trường');
    setIsAdjusting(false);
  };

  const margin = currentSelling > 0 ? ((currentSelling - currentCost) / currentSelling) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in select-none">
      <div className="bg-white rounded-xl border border-slate-300 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 text-xs">
        {/* Header */}
        <div className="h-14 bg-slate-900 text-white px-5 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <span>Lịch Sử Biến Động Giá Vật Tư</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/40 px-2 py-0.5 rounded-full font-mono">
                  {material.code}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 truncate max-w-md">
                {material.name} ({material.unit})
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

        {/* Current Price Summary Card */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Giá Vốn Hiện Tại</span>
            <div className="text-base sm:text-lg font-black font-mono text-slate-800 mt-0.5">
              {currentCost.toLocaleString('vi-VN')} <span className="text-xs font-normal">đ/{material.unit}</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Giá Bán Niêm Yết</span>
            <div className="text-base sm:text-lg font-black font-mono text-emerald-600 mt-0.5">
              {currentSelling.toLocaleString('vi-VN')} <span className="text-xs font-normal">đ/{material.unit}</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Biên Lợi Nhuận</span>
              <div className="text-base sm:text-lg font-black font-mono text-blue-600 mt-0.5">
                +{margin.toFixed(1)}%
              </div>
            </div>
            {!isAdjusting && (
              <button
                onClick={handleStartAdjust}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Đổi giá</span>
              </button>
            )}
          </div>
        </div>

        {/* Adjust Price Form (if open) */}
        {isAdjusting && (
          <div className="p-4 bg-blue-50/70 border-b border-blue-200 animate-in slide-in-from-top-2 shrink-0">
            <h4 className="font-extrabold text-blue-900 text-xs mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span>Cập Nhật Mức Giá Mới Cho Vật Tư Này</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Giá vốn mới (VNĐ):</label>
                <input
                  type="number"
                  value={newCost}
                  onChange={(e) => setNewCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Giá bán mới (VNĐ):</label>
                <input
                  type="number"
                  value={newSelling}
                  onChange={(e) => setNewSelling(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold text-xs text-emerald-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Lý do thay đổi giá:</label>
                <input
                  type="text"
                  placeholder="VD: Nhà máy tăng giá thép / Mỏ cát khan hiếm..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAdjusting(false)}
                className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded font-semibold text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleSavePriceChange}
                className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs shadow-xs"
              >
                Lưu Biến Động Giá
              </button>
            </div>
          </div>
        )}

        {/* Price History Timeline */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <h3 className="font-bold text-slate-800 text-xs flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Nhật Ký Thay Đổi Giá Theo Thời Gian ({priceHistory.length} lần điều chỉnh)</span>
            </span>
          </h3>

          {priceHistory.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-slate-600">Chưa có lịch sử thay đổi giá</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Khi bạn chỉnh sửa giá vốn hoặc giá bán, hệ thống sẽ tự động ghi lại biến động vào đây.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {priceHistory.map((item, idx) => {
                const costDelta = item.newCostPrice - item.oldCostPrice;
                const sellingDelta = item.newSellingPrice - item.oldSellingPrice;
                const sellingPercent =
                  item.oldSellingPrice > 0 ? ((sellingDelta / item.oldSellingPrice) * 100).toFixed(1) : '0';

                return (
                  <div
                    key={item.id || idx}
                    className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 shadow-2xs transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.date}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.changedBy || 'Hệ thống'}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {sellingDelta > 0 ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded flex items-center gap-0.5 text-[10px]">
                            <TrendingUp className="w-3 h-3" /> +{sellingPercent}% (Tăng giá)
                          </span>
                        ) : sellingDelta < 0 ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded flex items-center gap-0.5 text-[10px]">
                            <TrendingDown className="w-3 h-3" /> {sellingPercent}% (Giảm giá)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded text-[10px]">
                            Không đổi
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price numbers before -> after */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Giá Vốn (Nhập):</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-500 line-through">
                            {item.oldCostPrice.toLocaleString('vi-VN')} đ
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-extrabold text-slate-900">
                            {item.newCostPrice.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Giá Bán Lẻ:</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-500 line-through">
                            {item.oldSellingPrice.toLocaleString('vi-VN')} đ
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-extrabold text-emerald-700">
                            {item.newSellingPrice.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    {item.reason && (
                      <p className="text-[11px] text-slate-600 bg-amber-50/60 border border-amber-200/60 p-2 rounded italic">
                        <strong>Lý do:</strong> {item.reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-md"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
