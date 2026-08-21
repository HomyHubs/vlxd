import { useState } from 'react';
import { Material, Order } from '../types';
import { ShoppingCart, Truck, Trash2, Printer, Check, User, Phone, MapPin, Search } from 'lucide-react';

interface PosQuickSalesProps {
  materials: Material[];
  onAddOrder: (order: Order) => void;
  primaryColor?: string;
}

export function PosQuickSales({ materials, onAddOrder, primaryColor = '#f97316' }: PosQuickSalesProps) {
  const [cart, setCart] = useState<{ material: Material; quantity: number }[]>([]);
  const [customerName, setCustomerName] = useState('Khách Mua Lẻ / Công Trình');
  const [phone, setPhone] = useState('0908 123 456');
  const [truckPlate, setTruckPlate] = useState('51C - 889.24 (Xe ben 5 tấn)');
  const [deliveryAddress, setDeliveryAddress] = useState('Công trình Biệt thự Vườn Lài, Q.12');
  const [shippingFee, setShippingFee] = useState(250000);
  const [paidNow, setPaidNow] = useState(true);
  const [searchCategory, setSearchCategory] = useState('ALL');
  const [posSearchText, setPosSearchText] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const categories = [
    { id: 'ALL', label: `Tất cả vật tư (${materials.length})` },
    { id: 'CAT_DA', label: 'Cát & Đá' },
    { id: 'SAT_THEP', label: 'Sắt & Thép' },
    { id: 'XI_MANG_GACH', label: 'Xi măng & Gạch' },
    { id: 'SON_CHONG_THAM', label: 'Sơn & Chống thấm' },
    { id: 'THIET_BI_DIEN_NUOC', label: 'Điện & Nước' },
    { id: 'GO_COP_PHA', label: 'Gỗ & Cốp pha' },
  ];

  const filteredMaterials = materials.filter((m) => {
    if (searchCategory !== 'ALL' && m.category !== searchCategory) return false;
    if (posSearchText.trim()) {
      const q = posSearchText.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q);
    }
    return true;
  });

  const addToCart = (material: Material) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.material.id === material.id);
      if (existing) {
        return prev.map((item) =>
          item.material.id === material.id
            ? { ...item, quantity: item.quantity + (material.unit === 'Tấn' ? 1 : 5) }
            : item
        );
      }
      return [...prev, { material, quantity: material.unit === 'Tấn' ? 1 : 5 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.material.id === id) {
            const newQty = Math.max(1, item.quantity + delta);
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.material.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.material.sellingPrice * item.quantity, 0);
  const total = subtotal + shippingFee;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      code: `POS-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: `${customerName} [${truckPlate}]`,
      customerPhone: phone,
      deliveryAddress,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      items: cart.map((c) => ({
        materialId: c.material.id,
        materialCode: c.material.code,
        materialName: c.material.name,
        quantity: c.quantity,
        unit: c.material.unit,
        unitPrice: c.material.sellingPrice,
        total: c.material.sellingPrice * c.quantity,
      })),
      subtotal,
      discount: 0,
      shippingFee,
      totalAmount: total,
      paidAmount: paidNow ? total : 0,
      status: 'COMPLETED',
      notes: `Xuất bán trực tiếp tại quầy bãi. Xe vận chuyển: ${truckPlate}`,
      isUrgent: false,
    };

    onAddOrder(newOrder);
    setOrderSuccess(newOrder.code);
    setCart([]);
    setTimeout(() => setOrderSuccess(null), 4000);
  };

  return (
    <div className="bg-white flex-1 rounded-lg border border-slate-200 shadow-2xs flex flex-col lg:flex-row overflow-hidden text-xs">
      {/* Left: Material Catalog Grid */}
      <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden bg-slate-50">
        {/* Category Filters with theme color support */}
        <div className="p-2.5 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
            {categories.map((cat) => {
              const isSelected = searchCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSearchCategory(cat.id)}
                  style={{
                    backgroundColor: isSelected ? primaryColor : undefined,
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected ? 'text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2 py-1 border border-slate-200 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={posSearchText}
              onChange={(e) => setPosSearchText(e.target.value)}
              placeholder="Tìm nhanh vật tư POS..."
              className="bg-transparent border-none outline-none text-xs w-36 text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Tiles Grid */}
        <div className="flex-1 p-3 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {filteredMaterials.map((m) => (
            <button
              key={m.id}
              onClick={() => addToCart(m)}
              className="bg-white p-3 rounded-lg border border-slate-200 hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-95 cursor-pointer"
            >
              <div>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {m.code}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">
                    Tồn: {m.quantity} {m.unit}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-xs transition-colors line-clamp-2">
                  {m.name}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{m.warehouse}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono font-extrabold text-slate-900 text-xs">
                  {m.sellingPrice.toLocaleString('vi-VN')} đ
                </span>
                <span
                  className="w-6 h-6 rounded flex items-center justify-center font-bold text-white shadow-2xs group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: primaryColor }}
                >
                  +
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Checkout & Truck Bill */}
      <div className="w-full lg:w-96 bg-white flex flex-col overflow-hidden shrink-0 border-t lg:border-t-0 border-slate-200">
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" style={{ color: primaryColor }} />
            <h3 className="font-bold text-sm">Phiếu Xuất Xe / Bán Lẻ</h3>
          </div>
          <span
            className="text-xs text-white px-2 py-0.5 rounded font-bold"
            style={{ backgroundColor: primaryColor }}
          >
            {cart.length} món
          </span>
        </div>

        {/* Truck / Customer Details */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2 text-slate-700">
          <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded border border-slate-200">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Tên khách / Nhà thầu"
              className="bg-transparent border-none outline-none font-bold text-xs w-full"
            />
          </div>
          <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded border border-slate-200">
            <Truck className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <input
              type="text"
              value={truckPlate}
              onChange={(e) => setTruckPlate(e.target.value)}
              placeholder="Biển số xe ben / Tài xế"
              className="bg-transparent border-none outline-none font-bold text-xs w-full font-mono text-slate-800"
            />
          </div>
          <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded border border-slate-200">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Địa chỉ đổ bãi / Công trình"
              className="bg-transparent border-none outline-none text-xs w-full"
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
              <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
              <p className="font-semibold">Chưa có vật tư nào trong giỏ hàng</p>
              <p className="text-[10px]">Nhấp vào các thẻ vật tư bên trái để tạo phiếu xuất xe</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.material.id}
                className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-bold text-slate-800 truncate">{item.material.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {item.material.sellingPrice.toLocaleString('vi-VN')} đ / {item.material.unit}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.material.id, item.material.unit === 'Tấn' ? -1 : -5)}
                    className="w-5 h-5 rounded bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold font-mono px-1 text-slate-900 text-xs">
                    {item.quantity} {item.material.unit}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.material.id, item.material.unit === 'Tấn' ? 1 : 5)}
                    className="w-5 h-5 rounded bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.material.id)}
                    className="ml-1 text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation & Payment */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>Tiền hàng:</span>
            <span className="font-mono font-bold text-slate-900">{subtotal.toLocaleString('vi-VN')} đ</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Cước xe ben vận chuyển:</span>
            <input
              type="number"
              value={shippingFee}
              onChange={(e) => setShippingFee(Number(e.target.value))}
              className="w-24 bg-white border border-slate-300 rounded px-1.5 py-0.5 font-mono text-right font-bold text-xs"
            />
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-900 font-extrabold text-sm">
            <span>Tổng thanh toán:</span>
            <span className="font-mono text-base" style={{ color: primaryColor }}>
              {total.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[11px] text-slate-700">
              <input
                type="checkbox"
                checked={paidNow}
                onChange={(e) => setPaidNow(e.target.checked)}
                className="w-3.5 h-3.5"
                style={{ accentColor: primaryColor }}
              />
              <span>Thu tiền ngay tại bãi</span>
            </label>
            <span className="text-[10px] text-slate-500 font-mono font-bold">
              {paidNow ? 'ĐÃ THU ĐỦ' : 'GHI NỢ SỔ'}
            </span>
          </div>

          {orderSuccess && (
            <div className="p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Đã in phiếu xuất xe #{orderSuccess} thành công!</span>
            </div>
          )}

          <button
            disabled={cart.length === 0}
            onClick={handleCheckout}
            style={{
              backgroundColor: cart.length > 0 ? primaryColor : undefined,
            }}
            className={`w-full py-2.5 rounded-lg font-bold text-white flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all hover:brightness-110 ${
              cart.length === 0 ? 'bg-slate-300 cursor-not-allowed' : ''
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>XUẤT PHIẾU XE & IN HÓA ĐƠN</span>
          </button>
        </div>
      </div>
    </div>
  );
}
