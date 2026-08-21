import { useState } from 'react';
import { Calculator, X, Layers, Truck, Grid3X3 } from 'lucide-react';

interface UnitConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnitConverterModal({ isOpen, onClose }: UnitConverterModalProps) {
  const [activeTab, setActiveTab] = useState<'STEEL' | 'CONCRETE' | 'BRICK'>('STEEL');

  // Steel calculation state
  const [diameter, setDiameter] = useState<number>(16); // mm
  const [length, setLength] = useState<number>(11.7); // standard 11.7m bar
  const [steelQuantity, setSteelQuantity] = useState<number>(50);

  // Steel weight per meter = d^2 / 162
  const weightPerMeter = (diameter * diameter) / 162;
  const weightPerBar = weightPerMeter * length;
  const totalSteelWeightKg = weightPerBar * steelQuantity;
  const totalSteelWeightTons = totalSteelWeightKg / 1000;

  // Concrete & Sand/Stone truck calculation state
  const [volumeM3, setVolumeM3] = useState<number>(15);
  const [truckCapacity, setTruckCapacity] = useState<number>(5); // 5m3 or 15m3
  const truckTrips = Math.ceil(volumeM3 / truckCapacity);

  // Mix standard (Mác 250 PCB40 per 1m3)
  const cementPerM3 = 350; // kg (~7 bags)
  const sandPerM3 = 0.5; // m3
  const stonePerM3 = 0.85; // m3
  const waterPerM3 = 185; // liters

  // Brick wall calculation state
  const [wallArea, setWallArea] = useState<number>(50); // m2
  const [wallType, setWallType] = useState<'100' | '200'>('100'); // Tường 10 (110mm) hay tường 20 (220mm)
  const bricksPerM2 = wallType === '100' ? 68 : 136; // gạch ống 8x8x18
  const totalBricks = Math.round(wallArea * bricksPerM2);
  const mortarCementBags = Math.round((wallArea * (wallType === '100' ? 0.03 : 0.07) * 320) / 50);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-12 bg-slate-900 text-white px-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-sm">Công Cụ Tính Toán & Quy Đổi VLXD Chuyên Nghiệp</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('STEEL')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'STEEL'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Quy Đổi Sắt Thép (Cây ⇄ Tấn)</span>
          </button>
          <button
            onClick={() => setActiveTab('CONCRETE')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'CONCRETE'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Cát / Đá / Chuyến Xe & Cấp Phối</span>
          </button>
          <button
            onClick={() => setActiveTab('BRICK')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'BRICK'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Tính Gạch Xây Tường (m² ⇄ Viên)</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 text-xs">
          {activeTab === 'STEEL' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Đường kính thanh thép Φ (mm)
                  </label>
                  <select
                    value={diameter}
                    onChange={(e) => setDiameter(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium outline-none focus:border-orange-500 text-xs"
                  >
                    <option value={6}>Φ6 (Thép cuộn / đai)</option>
                    <option value={8}>Φ8 (Thép cuộn / đai)</option>
                    <option value={10}>Φ10 (Thép cây / cuộn)</option>
                    <option value={12}>Φ12</option>
                    <option value={14}>Φ14</option>
                    <option value={16}>Φ16 (Cây 11.7m chuẩn)</option>
                    <option value={18}>Φ18</option>
                    <option value={20}>Φ20 (Cây 11.7m)</option>
                    <option value={22}>Φ22</option>
                    <option value={25}>Φ25</option>
                    <option value={28}>Φ28</option>
                    <option value={32}>Φ32</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Chiều dài cây (mét)
                  </label>
                  <input
                    type="number"
                    value={length}
                    step="0.1"
                    onChange={(e) => setLength(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium outline-none focus:border-orange-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Số lượng cây
                  </label>
                  <input
                    type="number"
                    value={steelQuantity}
                    min="1"
                    onChange={(e) => setSteelQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium outline-none focus:border-orange-500 text-xs"
                  />
                </div>
              </div>

              {/* Steel Result Box */}
              <div className="bg-slate-900 text-white p-4 rounded-lg border border-slate-700">
                <div className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider mb-2">
                  Kết quả tính toán tiêu chuẩn TCVN:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-800 p-2.5 rounded border border-slate-700">
                    <p className="text-[10px] text-slate-400">Trọng lượng / mét</p>
                    <p className="text-base font-bold text-white mt-0.5">{weightPerMeter.toFixed(3)} <span className="text-[10px] font-normal text-slate-400">kg/m</span></p>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded border border-slate-700">
                    <p className="text-[10px] text-slate-400">Trọng lượng 1 cây ({length}m)</p>
                    <p className="text-base font-bold text-white mt-0.5">{weightPerBar.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">kg</span></p>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded border border-slate-700">
                    <p className="text-[10px] text-slate-400">Tổng khối lượng (kg)</p>
                    <p className="text-base font-bold text-orange-400 mt-0.5">{totalSteelWeightKg.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} <span className="text-[10px] font-normal text-slate-400">kg</span></p>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded border border-slate-700">
                    <p className="text-[10px] text-slate-400">Tổng trọng lượng (Tấn)</p>
                    <p className="text-base font-bold text-green-400 mt-0.5">{totalSteelWeightTons.toFixed(3)} <span className="text-[10px] font-normal text-slate-400">Tấn</span></p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic">
                  * Công thức chuẩn: M = (d² / 162) × L. Áp dụng cho thép xây dựng Hòa Phát, Pomina, Miền Nam.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'CONCRETE' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Tổng thể tích Cát / Đá / Bê tông cần cấp (m³)
                  </label>
                  <input
                    type="number"
                    value={volumeM3}
                    min="1"
                    onChange={(e) => setVolumeM3(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium outline-none focus:border-orange-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Loại tải trọng xe ben giao hàng
                  </label>
                  <select
                    value={truckCapacity}
                    onChange={(e) => setTruckCapacity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium outline-none focus:border-orange-500 text-xs"
                  >
                    <option value={3.5}>Xe ben nhỏ 3.5 m³ (Vào hẻm)</option>
                    <option value={5}>Xe ben trung 5.0 m³ (Tiêu chuẩn)</option>
                    <option value={10}>Xe ben 3 chân 10.0 m³</option>
                    <option value={15}>Xe ben 4 chân / Đầu kéo 15.0 m³</option>
                  </select>
                </div>
              </div>

              {/* Truck Result */}
              <div className="bg-slate-900 text-white p-4 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-bold text-orange-400 uppercase">Ước tính vận chuyển & Cấp phối</span>
                  <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-[11px] font-bold border border-orange-500/30">
                    Cần {truckTrips} chuyến xe ({truckCapacity}m³/chuyến)
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-800 p-2 rounded border border-slate-700">
                    <p className="text-[10px] text-slate-400">Xi măng (PCB40)</p>
                    <p className="text-sm font-bold text-white mt-1">{(volumeM3 * cementPerM3 / 50).toFixed(0)} bao</p>
                    <p className="text-[9px] text-slate-500">({(volumeM3 * cementPerM3 / 1000).toFixed(2)} tấn)</p>
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700">
                    <p className="text-[10px] text-slate-400">Cát vàng bê tông</p>
                    <p className="text-sm font-bold text-white mt-1">{(volumeM3 * sandPerM3).toFixed(1)} m³</p>
                    <p className="text-[9px] text-slate-500">(Cát hạt to)</p>
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700">
                    <p className="text-[10px] text-slate-400">Đá 1x2</p>
                    <p className="text-sm font-bold text-white mt-1">{(volumeM3 * stonePerM3).toFixed(1)} m³</p>
                    <p className="text-[9px] text-slate-500">(Đá xanh sàng)</p>
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700">
                    <p className="text-[10px] text-slate-400">Nước sạch</p>
                    <p className="text-sm font-bold text-white mt-1">{(volumeM3 * waterPerM3).toFixed(0)} L</p>
                    <p className="text-[9px] text-slate-500">(185L/m³)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'BRICK' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Diện tích tường cần xây (m²)
                  </label>
                  <input
                    type="number"
                    value={wallArea}
                    min="1"
                    onChange={(e) => setWallArea(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium outline-none focus:border-orange-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Loại kết cấu tường
                  </label>
                  <select
                    value={wallType}
                    onChange={(e) => setWallType(e.target.value as '100' | '200')}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium outline-none focus:border-orange-500 text-xs"
                  >
                    <option value="100">Tường 10 (Dày 110mm - Tường ngăn)</option>
                    <option value="200">Tường 20 (Dày 220mm - Tường chịu lực / bao che)</option>
                  </select>
                </div>
              </div>

              {/* Brick Result */}
              <div className="bg-slate-900 text-white p-4 rounded-lg border border-slate-700">
                <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-2">
                  Dự toán vật tư gạch & vữa xây (Hao hụt 5% đã tính):
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <p className="text-[10px] text-slate-400">Số gạch ống cần mua</p>
                    <p className="text-lg font-bold text-orange-400 mt-1">{totalBricks.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">viên</span></p>
                    <p className="text-[9px] text-slate-500 mt-0.5">({bricksPerM2} viên / m²)</p>
                  </div>
                  <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <p className="text-[10px] text-slate-400">Xi măng xây trát (Mác 75)</p>
                    <p className="text-lg font-bold text-white mt-1">{mortarCementBags} <span className="text-xs font-normal text-slate-400">bao 50kg</span></p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Xi măng PCB30/PCB40</p>
                  </div>
                  <div className="bg-slate-800 p-3 rounded border border-slate-700">
                    <p className="text-[10px] text-slate-400">Cát xây trát hạt mịn</p>
                    <p className="text-lg font-bold text-green-400 mt-1">{(wallArea * (wallType === '100' ? 0.04 : 0.08)).toFixed(1)} <span className="text-xs font-normal text-slate-400">m³</span></p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Cát xây sạch</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-bold text-xs transition-colors"
          >
            Đóng bảng tính
          </button>
        </div>
      </div>
    </div>
  );
}
