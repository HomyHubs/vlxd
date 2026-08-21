import { useState } from 'react';
import { Customer, Supplier } from '../types';
import { CreditCard, ArrowDownRight, ArrowUpRight, DollarSign, Plus, CheckCircle, Search, UserCheck } from 'lucide-react';

interface DebtManagementProps {
  customers: Customer[];
  suppliers: Supplier[];
  onCollectCustomerDebt: (customerId: string, amount: number) => void;
  onPaySupplierDebt: (supplierId: string, amount: number) => void;
}

export function DebtManagement({
  customers,
  suppliers,
  onCollectCustomerDebt,
  onPaySupplierDebt,
}: DebtManagementProps) {
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'SUPPLIERS'>('CUSTOMERS');
  const [searchKey, setSearchKey] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<{ id: string; name: string; debt: number; type: 'CUS' | 'SUP' } | null>(null);
  const [payAmount, setPayAmount] = useState<number>(10000000);

  const totalCustomerDebt = customers.reduce((sum, c) => sum + c.debtAmount, 0);
  const totalSupplierDebt = suppliers.reduce((sum, s) => sum + s.currentDebt, 0);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchKey.toLowerCase()) ||
      c.phone.includes(searchKey) ||
      c.projectAddress.toLowerCase().includes(searchKey.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(
    (s) => s.name.toLowerCase().includes(searchKey.toLowerCase()) || s.phone.includes(searchKey)
  );

  const handleConfirmPayment = () => {
    if (!selectedEntity || payAmount <= 0) return;
    if (selectedEntity.type === 'CUS') {
      onCollectCustomerDebt(selectedEntity.id, payAmount);
    } else {
      onPaySupplierDebt(selectedEntity.id, payAmount);
    }
    setSelectedEntity(null);
  };

  return (
    <div className="bg-white flex-1 rounded-lg border border-slate-200 shadow-2xs flex flex-col overflow-hidden text-xs">
      {/* Top summary cards */}
      <div className="p-3 sm:p-4 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 shrink-0">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Công nợ phải thu (Khách còn nợ)</p>
              <p className="text-base font-extrabold text-orange-600 font-mono">
                {totalCustomerDebt.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">VND</span>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
            {customers.filter((c) => c.debtAmount > 0).length} nhà thầu nợ
          </span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Công nợ phải trả (Nợ nhà cung cấp)</p>
              <p className="text-base font-extrabold text-slate-900 font-mono">
                {totalSupplierDebt.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">VND</span>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
            {suppliers.filter((s) => s.currentDebt > 0).length} nhà máy
          </span>
        </div>
      </div>

      {/* Action and tabs */}
      <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-0.5 rounded text-xs font-semibold">
            <button
              onClick={() => setActiveTab('CUSTOMERS')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'CUSTOMERS' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Sổ nợ Khách Hàng / Nhà Thầu
            </button>
            <button
              onClick={() => setActiveTab('SUPPLIERS')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'SUPPLIERS' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Sổ nợ Nhà Cung Cấp / Mỏ VLXD
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, công trình..."
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1.5 text-xs w-52 focus:border-orange-500 outline-none"
          />
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        {activeTab === 'CUSTOMERS' ? (
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5 font-bold text-slate-600 uppercase">Khách Hàng / Nhà Thầu</th>
                <th className="py-2.5 px-3 font-bold text-slate-600 uppercase">Loại Khách</th>
                <th className="py-2.5 px-3 font-bold text-slate-600 uppercase">Công Trình / Địa Chỉ</th>
                <th className="py-2.5 px-3 font-bold text-slate-600 uppercase text-right">Tổng Đã Mua</th>
                <th className="py-2.5 px-3 font-bold text-slate-600 uppercase text-right">Dư Nợ Hiện Tại</th>
                <th className="py-2.5 px-3 font-bold text-slate-600 uppercase text-right pr-4">Thu Nợ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cus) => (
                <tr key={cus.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3.5">
                    <div className="font-bold text-slate-900">{cus.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{cus.phone}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                      {cus.customerType === 'COMPANY' ? 'DOANH NGHIỆP' : cus.customerType === 'CONTRACTOR' ? 'CAI THẦU' : 'KHÁCH LẺ'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{cus.projectAddress}</td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                    {cus.totalSpent.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    {cus.debtAmount > 0 ? (
                      <span className="text-orange-600">{cus.debtAmount.toLocaleString('vi-VN')} đ</span>
                    ) : (
                      <span className="text-emerald-600 font-normal">Đã thanh toán hết</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right pr-4">
                    {cus.debtAmount > 0 ? (
                      <button
                        onClick={() => {
                          setSelectedEntity({
                            id: cus.id,
                            name: cus.name,
                            debt: cus.debtAmount,
                            type: 'CUS',
                          });
                          setPayAmount(cus.debtAmount);
                        }}
                        className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold transition-colors"
                      >
                        Thu nợ
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Không nợ</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5 font-bold text-slate-600 uppercase">Nhà Cung Cấp / Nhà Máy</th>
                <th className="py-2.5 px-3 font-bold text-slate-600 uppercase">Số Điện Thoại</th>
                <th className="py-2.5 px-3 font-bold text-slate-600 uppercase">Địa Chỉ Trụ Sở</th>
                <th className="py-2.5 px-3 font-bold text-slate-600 uppercase text-right">Công Nợ Phải Trả</th>
                <th className="py-2.5 px-3 font-bold text-slate-600 uppercase text-right pr-4">Thanh Toán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map((sup) => (
                <tr key={sup.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3.5 font-bold text-slate-900">{sup.name}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{sup.phone}</td>
                  <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{sup.address}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                    {sup.currentDebt > 0 ? (
                      <span className="text-amber-700">{sup.currentDebt.toLocaleString('vi-VN')} đ</span>
                    ) : (
                      <span className="text-emerald-600 font-normal">0 đ (Hết nợ)</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right pr-4">
                    {sup.currentDebt > 0 ? (
                      <button
                        onClick={() => {
                          setSelectedEntity({
                            id: sup.id,
                            name: sup.name,
                            debt: sup.currentDebt,
                            type: 'SUP',
                          });
                          setPayAmount(sup.currentDebt);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold transition-colors"
                      >
                        Trả tiền
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Đã thanh toán</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment recording dialog */}
      {selectedEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl w-full max-w-md p-5 text-slate-800 text-xs">
            <h3 className="font-bold text-sm mb-3">
              {selectedEntity.type === 'CUS' ? 'Ghi Nhận Thu Nợ Khách Hàng' : 'Ghi Nhận Thanh Toán Cho Nhà Cung Cấp'}
            </h3>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 mb-3">
              <p><strong>Đối tượng:</strong> {selectedEntity.name}</p>
              <p><strong>Dư nợ hiện tại:</strong> <span className="font-bold font-mono text-orange-600">{selectedEntity.debt.toLocaleString('vi-VN')} đ</span></p>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Số tiền thanh toán (VNĐ)</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded p-2 font-mono font-bold text-sm outline-none focus:border-orange-500"
              />
              <div className="flex gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setPayAmount(selectedEntity.debt)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-semibold text-slate-700"
                >
                  Toàn bộ ({selectedEntity.debt.toLocaleString('vi-VN')} đ)
                </button>
                <button
                  type="button"
                  onClick={() => setPayAmount(Math.round(selectedEntity.debt / 2))}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-semibold text-slate-700"
                >
                  50% nợ
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                onClick={() => setSelectedEntity(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold shadow-xs"
              >
                Xác nhận ghi sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
