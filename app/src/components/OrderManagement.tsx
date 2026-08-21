import { useState, FormEvent } from 'react';
import { Order, OrderStatus, Material, Customer, OrderItem } from '../types';
import { Plus, Printer, Edit, Trash2, Search, X, Check, FileText } from 'lucide-react';

interface OrderManagementProps {
  orders: Order[];
  materials: Material[];
  customers: Customer[];
  onAddOrder: (order: Order) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, paidAmount?: number) => void;
  onUpdateOrder: (order: Order) => void;
  primaryColor?: string;
}

export function OrderManagement({
  orders,
  materials,
  customers,
  onAddOrder,
  onUpdateOrderStatus,
  onUpdateOrder,
  primaryColor = '#f97316',
}: OrderManagementProps) {
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchKey, setSearchKey] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Form State (for Create and Edit)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [shippingFee, setShippingFee] = useState(500000);
  const [discount, setDiscount] = useState(0);
  const [selectedItems, setSelectedItems] = useState<{
    materialId: string;
    quantity: number;
    unitPrice: number;
  }[]>([]);

  const handleSelectCustomer = (cusName: string) => {
    const found = customers.find((c) => c.name === cusName);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
      setDeliveryAddress(found.projectAddress);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingOrder(null);
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setOrderNotes('');
    setIsUrgent(false);
    setShippingFee(500000);
    setDiscount(0);
    setSelectedItems([]);
    setIsCreating(true);
  };

  const handleOpenEditModal = (order: Order) => {
    setEditingOrder(order);
    setCustomerName(order.customerName);
    setCustomerPhone(order.customerPhone);
    setDeliveryAddress(order.deliveryAddress);
    setOrderNotes(order.notes || '');
    setIsUrgent(order.isUrgent || false);
    setShippingFee(order.shippingFee || 0);
    setDiscount(order.discount || 0);
    setSelectedItems(
      order.items.map((it) => ({
        materialId: it.materialId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      }))
    );
    setIsCreating(true);
  };

  const handleAddItem = (matId: string) => {
    const mat = materials.find((m) => m.id === matId);
    if (!mat) return;
    if (selectedItems.some((i) => i.materialId === matId)) return;
    setSelectedItems([...selectedItems, { materialId: matId, quantity: 1, unitPrice: mat.sellingPrice }]);
  };

  const handleRemoveItem = (matId: string) => {
    setSelectedItems(selectedItems.filter((i) => i.materialId !== matId));
  };

  const handleUpdateItemQty = (matId: string, qty: number) => {
    setSelectedItems(
      selectedItems.map((i) => (i.materialId === matId ? { ...i, quantity: Math.max(1, qty) } : i))
    );
  };

  const handleUpdateItemPrice = (matId: string, price: number) => {
    setSelectedItems(
      selectedItems.map((i) => (i.materialId === matId ? { ...i, unitPrice: Math.max(0, price) } : i))
    );
  };

  const itemsSubtotal = selectedItems.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice;
  }, 0);

  const grandTotal = Math.max(0, itemsSubtotal - discount + shippingFee);

  const handleSaveOrder = (e: FormEvent) => {
    e.preventDefault();
    if (!customerName || selectedItems.length === 0) return;

    const orderItems: OrderItem[] = selectedItems.map((item) => {
      const mat = materials.find((m) => m.id === item.materialId);
      return {
        materialId: item.materialId,
        materialCode: mat?.code || 'VT-00',
        materialName: mat?.name || 'Vật tư',
        unit: mat?.unit || 'ĐVT',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      };
    });

    if (editingOrder) {
      // Update existing order
      const updated: Order = {
        ...editingOrder,
        customerName,
        customerPhone,
        deliveryAddress,
        items: orderItems,
        subtotal: itemsSubtotal,
        discount,
        shippingFee,
        totalAmount: grandTotal,
        isUrgent,
        notes: orderNotes,
      };
      onUpdateOrder(updated);
    } else {
      // Create new order
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        code: `DH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName,
        customerPhone,
        deliveryAddress,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        items: orderItems,
        subtotal: itemsSubtotal,
        discount,
        shippingFee,
        totalAmount: grandTotal,
        paidAmount: 0,
        status: 'PENDING',
        isUrgent,
        notes: orderNotes,
      };
      onAddOrder(newOrder);
    }

    setIsCreating(false);
    setEditingOrder(null);
  };

  const filteredOrders = orders.filter((ord) => {
    const matchStatus = filterStatus === 'ALL' || ord.status === filterStatus;
    const matchSearch =
      ord.code.toLowerCase().includes(searchKey.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(searchKey.toLowerCase()) ||
      ord.deliveryAddress.toLowerCase().includes(searchKey.toLowerCase());
    return matchStatus && matchSearch;
  });

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">CHỜ XỬ LÝ</span>;
      case 'DELIVERING':
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">ĐANG GIAO XE</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">HOÀN TẤT</span>;
      case 'CANCELLED':
        return <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">ĐÃ HỦY</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">{status}</span>;
    }
  };

  return (
    <div className="bg-white flex-1 rounded-lg border border-slate-200 shadow-2xs flex flex-col overflow-hidden text-xs">
      {/* Top action bar */}
      <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-slate-800 text-base">Quản Lý Đơn Hàng & Báo Giá Công Trình</h2>
          <div className="flex bg-slate-100 p-0.5 rounded text-[11px] font-medium">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                filterStatus === 'ALL' ? 'bg-white font-bold text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Tất cả ({orders.length})
            </button>
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                filterStatus === 'PENDING' ? 'bg-white font-bold text-amber-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Chờ xử lý ({orders.filter((o) => o.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setFilterStatus('DELIVERING')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                filterStatus === 'DELIVERING' ? 'bg-white font-bold text-blue-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Đang giao ({orders.filter((o) => o.status === 'DELIVERING').length})
            </button>
            <button
              onClick={() => setFilterStatus('COMPLETED')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                filterStatus === 'COMPLETED' ? 'bg-white font-bold text-emerald-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Đã xong ({orders.filter((o) => o.status === 'COMPLETED').length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, khách, địa chỉ..."
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1.5 text-xs w-48 outline-none focus:border-slate-400"
            />
          </div>

          <button
            onClick={handleOpenCreateModal}
            style={{ backgroundColor: primaryColor }}
            className="px-3.5 py-1.5 text-white rounded-md font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer hover:brightness-110"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tạo Đơn Hàng Mới</span>
          </button>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[800px]">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3.5 font-bold text-slate-600 uppercase">Mã Đơn</th>
              <th className="py-2.5 px-3.5 font-bold text-slate-600 uppercase">Khách Hàng / Công Trình</th>
              <th className="py-2.5 px-3.5 font-bold text-slate-600 uppercase">Thời Gian</th>
              <th className="py-2.5 px-3.5 font-bold text-slate-600 uppercase">Chi Tiết Vật Tư</th>
              <th className="py-2.5 px-3.5 font-bold text-slate-600 uppercase text-right">Tổng Tiền</th>
              <th className="py-2.5 px-3.5 font-bold text-slate-600 uppercase text-right">Đã Thu</th>
              <th className="py-2.5 px-3.5 font-bold text-slate-600 uppercase">Trạng Thái</th>
              <th className="py-2.5 px-3.5 font-bold text-slate-600 uppercase text-right pr-4">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map((ord) => {
              const isUnpaid = ord.paidAmount < ord.totalAmount;
              const isEditable = ord.status !== 'COMPLETED' && ord.status !== 'CANCELLED';

              return (
                <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{ord.code}</span>
                      {ord.isUrgent && (
                        <span
                          className="text-white text-[9px] px-1 py-0.2 rounded font-bold"
                          style={{ backgroundColor: primaryColor }}
                        >
                          GẤP
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-bold text-slate-800">{ord.customerName}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-xs">{ord.deliveryAddress}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{ord.customerPhone}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{ord.createdAt}</td>
                  <td className="py-3 px-3">
                    <div className="space-y-0.5">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="text-[11px] text-slate-700">
                          • {it.materialName}: <span className="font-bold">{it.quantity} {it.unit}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {ord.totalAmount.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    <span className={isUnpaid ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                      {ord.paidAmount.toLocaleString('vi-VN')} đ
                    </span>
                    {isUnpaid && (
                      <div className="text-[10px] text-red-500">
                        Nợ: {(ord.totalAmount - ord.paidAmount).toLocaleString('vi-VN')} đ
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3">{getOrderStatusBadge(ord.status)}</td>
                  <td className="py-3 px-3 text-right pr-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Edit Button for pending/delivering orders */}
                      {isEditable && (
                        <button
                          onClick={() => handleOpenEditModal(ord)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Sửa vật tư, số lượng, đổi món hoặc thông tin giao hàng"
                        >
                          <Edit className="w-3 h-3 text-amber-700" />
                          <span>Sửa đơn</span>
                        </button>
                      )}

                      <button
                        onClick={() => setPrintingOrder(ord)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-medium text-slate-700 flex items-center gap-1 cursor-pointer"
                        title="In hóa đơn giao hàng"
                      >
                        <Printer className="w-3 h-3" />
                        <span>In phiếu</span>
                      </button>

                      {ord.status === 'PENDING' && (
                        <button
                          onClick={() => onUpdateOrderStatus(ord.id, 'DELIVERING')}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer"
                          title="Chuyển sang xe giao hàng"
                        >
                          Giao xe
                        </button>
                      )}

                      {ord.status === 'DELIVERING' && (
                        <button
                          onClick={() => onUpdateOrderStatus(ord.id, 'COMPLETED', ord.totalAmount)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer"
                          title="Xác nhận khách đã nhận & thanh toán"
                        >
                          Xong & Thu tiền
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New / Edit Order Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl w-full max-w-3xl overflow-hidden flex flex-col text-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh]">
            <div className="h-12 bg-slate-900 text-white px-4 flex items-center justify-between border-b border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center font-bold text-white text-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  {editingOrder ? '✎' : '+'}
                </div>
                <h3 className="font-bold text-sm">
                  {editingOrder ? `Chỉnh Sửa Đơn Hàng [${editingOrder.code}]` : 'Lập Đơn Bán Hàng / Xuất Kho VLXD'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingOrder(null);
                }}
                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Customer selection */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase text-[11px]">
                    1. Thông tin người nhận & Công trình
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-500 font-medium">Chọn nhanh khách quen:</label>
                    <select
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                    >
                      <option value="">-- Chọn khách hàng / Nhà thầu --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.customerType})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Tên khách / Nhà thầu *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-bold outline-none"
                      placeholder="VD: Công ty An Phong"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Số điện thoại *</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono outline-none"
                      placeholder="0918.xxx.xxx"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Giao hàng hỏa tốc</label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <input
                        type="checkbox"
                        id="urgent-check"
                        checked={isUrgent}
                        onChange={(e) => setIsUrgent(e.target.checked)}
                        className="w-4 h-4 rounded cursor-pointer"
                        style={{ accentColor: primaryColor }}
                      />
                      <label htmlFor="urgent-check" className="font-bold cursor-pointer" style={{ color: primaryColor }}>
                        Ưu tiên xe giao gấp trong buổi
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Địa chỉ giao hàng (Công trình) *</label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none"
                    placeholder="VD: Biệt thự Palm City, Song Hành, Thủ Đức"
                  />
                </div>
              </div>

              {/* Items picking (Mua thêm, Bỏ, Đổi vật tư) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase text-[11px]">
                    2. Danh mục vật tư xuất bán (Thêm, Bỏ, Đổi số lượng / Đơn giá)
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-500 font-medium">Mua thêm vật tư:</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddItem(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                      style={{ color: primaryColor }}
                    >
                      <option value="">+ Chọn mặt hàng thêm vào đơn...</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.code} - {m.name} (Tồn {m.quantity} {m.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedItems.length === 0 ? (
                  <div className="p-6 border border-dashed border-slate-300 rounded-lg text-center text-slate-400">
                    Chưa có vật tư nào trong đơn. Vui lòng chọn thêm mặt hàng từ menu trên.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Tên Vật Liệu</th>
                          <th className="py-2 px-2 text-center">ĐVT</th>
                          <th className="py-2 px-2 text-center w-24">Số Lượng</th>
                          <th className="py-2 px-3 text-right">Đơn Giá (đ)</th>
                          <th className="py-2 px-3 text-right">Thành Tiền (đ)</th>
                          <th className="py-2 px-2 text-center w-10">Bỏ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedItems.map((it) => {
                          const mat = materials.find((m) => m.id === it.materialId);
                          const total = it.quantity * it.unitPrice;
                          return (
                            <tr key={it.materialId} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                {mat?.name || 'Vật tư'}
                              </td>
                              <td className="py-2 px-2 text-center text-slate-500">{mat?.unit || 'ĐVT'}</td>
                              <td className="py-2 px-2 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={it.quantity}
                                  onChange={(e) => handleUpdateItemQty(it.materialId, Number(e.target.value))}
                                  className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-center font-bold font-mono"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  value={it.unitPrice}
                                  onChange={(e) => handleUpdateItemPrice(it.materialId, Number(e.target.value))}
                                  className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono text-xs"
                                />
                              </td>
                              <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">
                                {total.toLocaleString('vi-VN')}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(it.materialId)}
                                  className="text-slate-400 hover:text-red-600 font-bold p-1 cursor-pointer"
                                  title="Xóa món này khỏi đơn"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Totals & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Ghi chú giao nhận / Vận chuyển
                  </label>
                  <textarea
                    rows={3}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="VD: Xe ben vào hẻm, đổ vào hố móng..."
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Tiền hàng:</span>
                    <span className="font-mono font-bold">{itemsSubtotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Cước xe vận chuyển:</span>
                    <input
                      type="number"
                      value={shippingFee}
                      onChange={(e) => setShippingFee(Number(e.target.value))}
                      className="w-28 bg-white border border-slate-300 rounded px-2 py-0.5 text-right font-mono"
                    />
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Chiết khấu / Giảm giá:</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-28 bg-white border border-slate-300 rounded px-2 py-0.5 text-right font-mono text-red-600"
                    />
                  </div>
                  <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-slate-900">
                    <span className="font-extrabold text-sm">TỔNG THANH TOÁN:</span>
                    <span className="font-extrabold text-base font-mono" style={{ color: primaryColor }}>
                      {grandTotal.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingOrder(null);
                  }}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={selectedItems.length === 0 || !customerName}
                  style={{ backgroundColor: primaryColor }}
                  className="px-5 py-1.5 text-white rounded font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all hover:brightness-110"
                >
                  {editingOrder ? 'Lưu Cập Nhật Đơn Hàng' : 'Xác Nhận Tạo Đơn & Xuất Kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Print Modal */}
      {printingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-2xl w-full max-w-xl p-6 text-slate-900 font-sans animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-4">
              <div>
                <h1 className="text-lg font-black text-slate-900">CỬA HÀNG VẬT LIỆU XÂY DỰNG HOMYHUBS</h1>
                <p className="text-xs text-slate-500">Đ/C: Quốc Lộ 13, P. Hiệp Bình Phước, TP. Thủ Đức, TP.HCM</p>
                <p className="text-xs text-slate-500">Hotline: 0908.123.456 - Giấy phép KD: 0312345678</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold" style={{ color: primaryColor }}>
                  PHIẾU XUẤT KHO KIÊM GIAO HÀNG
                </div>
                <div className="text-xs font-mono font-bold text-slate-700">{printingOrder.code}</div>
                <div className="text-[10px] text-slate-400">{printingOrder.createdAt}</div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded text-xs space-y-1 mb-4 border border-slate-200">
              <p>
                <strong>Khách hàng:</strong> {printingOrder.customerName} - <strong>SĐT:</strong>{' '}
                {printingOrder.customerPhone}
              </p>
              <p>
                <strong>Công trình:</strong> {printingOrder.deliveryAddress}
              </p>
              {printingOrder.notes && <p><strong>Ghi chú:</strong> {printingOrder.notes}</p>}
            </div>

            <table className="w-full text-xs text-left border border-slate-300 mb-4">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">STT</th>
                  <th className="p-2 border-r border-slate-300">Tên Mặt Hàng</th>
                  <th className="p-2 border-r border-slate-300 text-center">ĐVT</th>
                  <th className="p-2 border-r border-slate-300 text-right">SL</th>
                  <th className="p-2 border-r border-slate-300 text-right">Đơn Giá</th>
                  <th className="p-2 text-right">Thành Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {printingOrder.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-semibold">{item.materialName}</td>
                    <td className="p-2 border-r border-slate-200 text-center">{item.unit}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-bold">{item.quantity}</td>
                    <td className="p-2 border-r border-slate-200 text-right">{item.unitPrice.toLocaleString('vi-VN')}</td>
                    <td className="p-2 text-right font-bold font-mono">{item.total.toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end text-xs space-y-1 mb-6">
              <div className="w-64 space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Tiền hàng:</span>
                  <span className="font-mono">{printingOrder.subtotal.toLocaleString('vi-VN')} đ</span>
                </div>
                {printingOrder.shippingFee > 0 && (
                  <div className="flex justify-between">
                    <span>Cước vận chuyển:</span>
                    <span className="font-mono">{printingOrder.shippingFee.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                {printingOrder.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Chiết khấu:</span>
                    <span className="font-mono">-{printingOrder.discount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm border-t border-slate-300 pt-1 text-slate-900">
                  <span>TỔNG CỘNG:</span>
                  <span className="font-mono" style={{ color: primaryColor }}>
                    {printingOrder.totalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-4 border-t border-slate-200">
              <div>
                <p className="font-bold">Người lập phiếu</p>
                <p className="text-slate-400 mt-8">(Ký, họ tên)</p>
              </div>
              <div>
                <p className="font-bold">Tài xế giao hàng</p>
                <p className="text-slate-400 mt-8">(Ký, họ tên)</p>
              </div>
              <div>
                <p className="font-bold">Người nhận hàng</p>
                <p className="text-slate-400 mt-8">(Ký, họ tên)</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 print:hidden">
              <button
                onClick={() => setPrintingOrder(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-semibold text-xs cursor-pointer"
              >
                Đóng lại
              </button>
              <button
                onClick={() => window.print()}
                style={{ backgroundColor: primaryColor }}
                className="px-4 py-1.5 text-white rounded font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:brightness-110"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In trang này (Ctrl + P)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
