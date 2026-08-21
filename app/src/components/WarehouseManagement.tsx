import { useState, FormEvent } from 'react';
import { Material, WarehouseTransaction } from '../types';
import { Plus, ArrowDownLeft, ArrowUpRight, Repeat, Warehouse, Box, Search, CheckCircle2 } from 'lucide-react';

interface WarehouseManagementProps {
  materials: Material[];
  transactions: WarehouseTransaction[];
  onAddTransaction: (transaction: WarehouseTransaction) => void;
  onUpdateMaterialStock: (materialId: string, delta: number) => void;
}

export function WarehouseManagement({
  materials,
  transactions,
  onAddTransaction,
  onUpdateMaterialStock,
}: WarehouseManagementProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'IMPORT' | 'EXPORT' | 'TRANSFER'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState<'IMPORT' | 'EXPORT' | 'TRANSFER'>('IMPORT');
  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id || '');
  const [quantity, setQuantity] = useState(10);
  const [source, setSource] = useState('Kho Tổng');
  const [destination, setDestination] = useState('Bãi Vật Liệu Số 1');
  const [reason, setReason] = useState('Nhập hàng từ nhà máy');
  const [operator, setOperator] = useState('Nguyễn Văn Hậu (Thủ kho)');

  const filteredTransactions = transactions.filter(
    (t) => filterType === 'ALL' || t.type === filterType
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const mat = materials.find((m) => m.id === selectedMaterialId);
    if (!mat) return;

    const newTx: WarehouseTransaction = {
      id: `tx-${Date.now()}`,
      code: `${txType === 'IMPORT' ? 'NK' : txType === 'EXPORT' ? 'XK' : 'CK'}-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(10 + Math.random() * 90)}`,
      type: txType,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      materialId: mat.id,
      materialName: mat.name,
      quantity,
      unit: mat.unit,
      source,
      destination,
      operator,
      reason,
    };

    onAddTransaction(newTx);
    if (txType === 'IMPORT') {
      onUpdateMaterialStock(mat.id, quantity);
    } else if (txType === 'EXPORT') {
      onUpdateMaterialStock(mat.id, -quantity);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white flex-1 rounded-lg border border-slate-200 shadow-2xs flex flex-col overflow-hidden text-xs">
      {/* Top summary banners */}
      <div className="p-3 sm:p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 shrink-0">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Nhập Kho Tháng Này</p>
              <p className="text-sm font-extrabold text-slate-900">48 lượt nhập</p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
            +3.2 tỷ VNĐ
          </span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Xuất Giao Công Trình</p>
              <p className="text-sm font-extrabold text-slate-900">126 chuyến xe</p>
            </div>
          </div>
          <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">
            94% đúng giờ
          </span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Warehouse className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Số Bãi & Kho Bãi</p>
              <p className="text-sm font-extrabold text-slate-900">4 Bãi & Kho chứa</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold text-[11px] shadow-2xs"
          >
            + Phiếu Kho Mới
          </button>
        </div>
      </div>

      {/* Action and filter bar */}
      <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800 text-sm">Nhật Ký Nhập - Xuất - Điều Chuyển Kho</h3>
          <div className="flex bg-slate-100 p-0.5 rounded text-[11px]">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded ${filterType === 'ALL' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-600'}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType('IMPORT')}
              className={`px-2.5 py-1 rounded ${filterType === 'IMPORT' ? 'bg-white font-bold text-emerald-800 shadow-2xs' : 'text-slate-600'}`}
            >
              Nhập kho
            </button>
            <button
              onClick={() => setFilterType('EXPORT')}
              className={`px-2.5 py-1 rounded ${filterType === 'EXPORT' ? 'bg-white font-bold text-blue-800 shadow-2xs' : 'text-slate-600'}`}
            >
              Xuất bãi
            </button>
            <button
              onClick={() => setFilterType('TRANSFER')}
              className={`px-2.5 py-1 rounded ${filterType === 'TRANSFER' ? 'bg-white font-bold text-amber-800 shadow-2xs' : 'text-slate-600'}`}
            >
              Chuyển kho
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[760px]">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3.5 font-bold text-slate-600 uppercase">Mã Phiếu</th>
              <th className="py-2.5 px-3 font-bold text-slate-600 uppercase">Loại Phiếu</th>
              <th className="py-2.5 px-3 font-bold text-slate-600 uppercase">Thời Gian</th>
              <th className="py-2.5 px-3 font-bold text-slate-600 uppercase">Tên Vật Tư</th>
              <th className="py-2.5 px-3 font-bold text-slate-600 uppercase text-right">Số Lượng</th>
              <th className="py-2.5 px-3 font-bold text-slate-600 uppercase">Nguồn Xuất</th>
              <th className="py-2.5 px-3 font-bold text-slate-600 uppercase">Đích Nhận</th>
              <th className="py-2.5 px-3 font-bold text-slate-600 uppercase">Người Thực Hiện</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => {
              return (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3.5 font-mono font-bold text-slate-700">{tx.code}</td>
                  <td className="py-3 px-3">
                    {tx.type === 'IMPORT' && (
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        NHẬP KHO
                      </span>
                    )}
                    {tx.type === 'EXPORT' && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        XUẤT BÃI
                      </span>
                    )}
                    {tx.type === 'TRANSFER' && (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        ĐIỀU CHUYỂN
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{tx.date}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{tx.materialName}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    <span className={tx.type === 'IMPORT' ? 'text-emerald-600' : 'text-blue-600'}>
                      {tx.type === 'IMPORT' ? '+' : '-'}{tx.quantity.toLocaleString('vi-VN')} {tx.unit}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{tx.source}</td>
                  <td className="py-3 px-3 text-slate-800 font-medium">{tx.destination}</td>
                  <td className="py-3 px-3 text-slate-600">{tx.operator}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal for creating warehouse transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl w-full max-w-lg overflow-hidden flex flex-col text-slate-800 animate-in fade-in zoom-in-95">
            <div className="h-12 bg-slate-900 text-white px-4 flex items-center justify-between border-b border-slate-700">
              <h3 className="font-bold text-sm">Lập Phiếu Nhập / Xuất / Điều Chuyển Kho</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Loại Nghiệp Vụ Kho</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('IMPORT');
                      setSource('Nhà máy sản xuất');
                      setDestination('Kho Kín C1');
                    }}
                    className={`py-2 rounded font-bold border transition-colors ${
                      txType === 'IMPORT' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    + Nhập Kho
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('EXPORT');
                      setSource('Bãi Vật Liệu Số 1');
                      setDestination('Xe ben chở công trình');
                    }}
                    className={`py-2 rounded font-bold border transition-colors ${
                      txType === 'EXPORT' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    - Xuất Giao Hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('TRANSFER');
                      setSource('Kho Tổng Bình Dương');
                      setDestination('Kho Chi Nhánh Thủ Đức');
                    }}
                    className={`py-2 rounded font-bold border transition-colors ${
                      txType === 'TRANSFER' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ⇄ Chuyển Kho
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Chọn Mặt Hàng Vật Tư</label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-semibold text-xs outline-none"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name} (Tồn hiện tại: {m.quantity} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Số Lượng Thực Tế</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-bold font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Người Lập / Thủ Kho</label>
                  <input
                    type="text"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nguồn Xuất Đi</label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Đích Đến / Nhận</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Lý Do / Chứng Từ Đi Kèm</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold shadow-xs"
                >
                  Xác Nhận Lưu Phiếu Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
