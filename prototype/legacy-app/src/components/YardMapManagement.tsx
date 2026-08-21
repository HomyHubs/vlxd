import { useState } from 'react';
import { Material } from '../types';
import { Map, Layers, Navigation, Box, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface YardMapProps {
  materials: Material[];
}

export function YardMapManagement({ materials }: YardMapProps) {
  const [selectedZone, setSelectedZone] = useState<string>('ZONE_A');

  const zones = [
    {
      id: 'ZONE_A',
      name: 'Khu Vực Bãi Cát & Đá Hộc',
      code: 'Bãi Số 1 (Lộ thiên)',
      capacity: '85%',
      capacityNum: 85,
      type: 'CAT_DA',
      surface: 'Bãi bê tông chịu tải 50 tấn',
      notes: 'Xe ben 15 tấn vào thuận tiện',
    },
    {
      id: 'ZONE_B',
      name: 'Bãi Sắt Cây & Thép Cuộn',
      code: 'Bãi Số 2 (Có cẩu trục)',
      capacity: '62%',
      capacityNum: 62,
      type: 'SAT_THEP',
      surface: 'Bãi kệ đỡ chữ A chống ẩm',
      notes: 'Có cẩu tháp 10 tấn bốc xếp',
    },
    {
      id: 'ZONE_C',
      name: 'Nhà Kho Kín Xi Măng & Gạch',
      code: 'Kho Mái Tôn C1',
      capacity: '94%',
      capacityNum: 94,
      type: 'XI_MANG_GACH',
      surface: 'Sàn nâng pallet chống ngập',
      notes: 'Độ ẩm chuẩn < 60%, bảo quản khô',
    },
    {
      id: 'ZONE_D',
      name: 'Kho Hóa Chất Sơn & Phụ Kiện',
      code: 'Kho Dược & Phụ Liệu D1',
      capacity: '40%',
      capacityNum: 40,
      type: 'SON_CHONG_THAM',
      surface: 'Kho có hệ thống PCCC tự động',
      notes: 'Kệ 4 tầng công nghiệp',
    },
  ];

  const currentZoneInfo = zones.find((z) => z.id === selectedZone) || zones[0];
  const zoneMaterials = materials.filter((m) => m.category === currentZoneInfo.type);

  return (
    <div className="bg-white flex-1 rounded-lg border border-slate-200 shadow-2xs flex flex-col overflow-hidden text-xs">
      {/* Top Header */}
      <div className="p-3 sm:p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
        <div>
          <h2 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <Map className="w-4 h-4 text-orange-500" />
            <span>Sơ Đồ Bãi Chứa Vật Liệu & Kho Hàng Trực Quan (2D Yard Layout)</span>
          </h2>
          <p className="text-[11px] text-slate-400">Xem diện tích, tỷ lệ lấp đầy kho và vị trí bốc xếp xe cẩu</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded text-[11px] border border-emerald-200">
            Tổng diện tích bãi: 3,500 m²
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Visual Map Layout */}
        <div className="flex-1 bg-slate-900 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto">
          {/* Top Entry Gate */}
          <div className="flex justify-between items-center mb-3">
            <div className="px-3 py-1 bg-slate-800 text-orange-400 rounded border border-slate-700 font-mono text-[11px] flex items-center gap-1.5 font-bold">
              <Navigation className="w-3.5 h-3.5 rotate-45 text-orange-500" />
              <span>CỔNG VÀO XE BEN & TRẠM CÂN ĐIỆN TỬ 80 TẤN</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">ĐƯỜNG NỘI BỘ RỘNG 12M</span>
          </div>

          {/* 4 Interactive Yard Zones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {zones.map((zone) => {
              const isSelected = selectedZone === zone.id;
              return (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id)}
                  className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                    isSelected
                      ? 'bg-slate-800 border-orange-500 ring-2 ring-orange-500/50 shadow-lg'
                      : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-slate-500'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-[10px] font-extrabold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30">
                        {zone.code}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          zone.capacityNum > 90
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : zone.capacityNum > 70
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}
                      >
                        Đầy {zone.capacity}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-sm group-hover:text-orange-400 transition-colors">
                      {zone.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">{zone.surface}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/60">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>Khả năng chứa bãi</span>
                      <span>{zone.capacity}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          zone.capacityNum > 90 ? 'bg-red-500' : zone.capacityNum > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${zone.capacityNum}%` }}
                      ></div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Exit Gate */}
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>CỔNG RA & BÀN KIỂM PHIẾU XUẤT</span>
            </span>
            <span>Bán kính quay xe ben: 18m</span>
          </div>
        </div>

        {/* Right Details Panel for Selected Zone */}
        <div className="w-full lg:w-80 bg-white p-4 border-l border-slate-200 overflow-y-auto flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200">
              <Layers className="w-4 h-4 text-orange-500" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{currentZoneInfo.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono">{currentZoneInfo.code}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 mb-4 text-[11px]">
              <p><strong>Cơ sở vật chất:</strong> {currentZoneInfo.surface}</p>
              <p><strong>Lưu ý bốc dỡ:</strong> {currentZoneInfo.notes}</p>
              <p>
                <strong>Trạng thái sức chứa:</strong>{' '}
                <span className="font-bold text-orange-600">{currentZoneInfo.capacity}</span>
              </p>
            </div>

            <h4 className="font-bold text-slate-800 text-xs mb-2">Vật tư đang lưu trữ tại khu vực này:</h4>
            <div className="space-y-2">
              {zoneMaterials.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Chưa có vật tư phân vào khu vực này</p>
              ) : (
                zoneMaterials.map((m) => (
                  <div key={m.id} className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{m.name}</span>
                      <span className="text-orange-600 font-mono">
                        {m.quantity} {m.unit}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between mt-1">
                      <span>{m.code}</span>
                      <span>Vị trí: {m.warehouse}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-center">
            <button
              onClick={() => alert(`Đã kích hoạt chế độ tái sắp xếp sơ đồ cho ${currentZoneInfo.name}`)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs"
            >
              Tái Sắp Xếp Vị Trí Lưu Kho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
