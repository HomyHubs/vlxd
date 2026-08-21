import { useState, useRef, ChangeEvent } from 'react';
import { Material, MaterialCategory, StockStatus } from '../types';
import { Upload, FileSpreadsheet, Globe, Check, AlertCircle, Download, X, Copy, CheckCheck } from 'lucide-react';

interface ImportMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportMaterials: (newMaterials: Material[]) => void;
  existingSuppliers?: { name: string }[];
  primaryColor?: string;
}

export function ImportMaterialModal({
  isOpen,
  onClose,
  onImportMaterials,
  existingSuppliers = [],
  primaryColor = '#f97316',
}: ImportMaterialModalProps) {
  const [activeTab, setActiveTab] = useState<'FILE' | 'GOOGLE_SHEETS' | 'PASTE'>('FILE');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [pastedData, setPastedData] = useState('');
  const [parsedMaterials, setParsedMaterials] = useState<Material[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const sampleCsvContent = `Mã VT,Tên vật tư,Ngành hàng,Đơn vị tính,Tồn kho ban đầu,Định mức an toàn,Giá nhập,Giá bán lẻ,Nhà cung cấp,Vị trí kho bãi
CAT-MO-03,Cát hạt vàng loại đặc biệt,CAT_DA,m³,120,30,310000,380000,Mỏ Cát Tân Châu,Bãi Vật Liệu Số 1
ST-VN-12,Thép thanh Vina Kyoei Φ12,SAT_THEP,Cây,250,50,185000,215000,Vina Kyoei Steel,Kho Sắt Thép B2
XM-IN-50,Xi măng Insee Power Cast PCB50,XI_MANG_GACH,Bao 50kg,400,100,95000,110000,Xi măng Holcim VN,Kho Kín C1
SN-KO-5L,Sơn chống thấm Kova CT-11A 5kg,SON_CHONG_THAM,Thùng,35,15,480000,560000,Kova Paint VN,Kho Sơn Hóa Chất D1`;

  const parseCsvText = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      setImportErrors(['File hoặc nội dung bảng không có đủ dòng dữ liệu hợp lệ']);
      setParsedMaterials([]);
      return;
    }

    const errors: string[] = [];
    const materials: Material[] = [];

    // Skip header line 0
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle CSV or tab-separated (from Google Sheets copy-paste)
      let cols: string[] = [];
      if (line.includes('\t')) {
        cols = line.split('\t');
      } else {
        // Simple CSV splitter
        cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      }

      if (cols.length < 5) {
        errors.push(`Dòng ${i + 1}: Thiếu cột dữ liệu (yêu cầu tối thiểu: Mã, Tên, Ngành, ĐVT, Giá bán)`);
        continue;
      }

      const code = cols[0] || `VT-${Date.now()}-${i}`;
      const name = cols[1] || 'Vật tư chưa đặt tên';
      let category = (cols[2] || 'CAT_DA') as MaterialCategory;
      // Auto normalize category if entered in Vietnamese
      const catUpper = category.toString().toUpperCase();
      if (catUpper.includes('CAT') || catUpper.includes('ĐÁ') || catUpper.includes('DA')) category = 'CAT_DA';
      else if (catUpper.includes('THEP') || catUpper.includes('SAT') || catUpper.includes('SẮT')) category = 'SAT_THEP';
      else if (catUpper.includes('XI MANG') || catUpper.includes('GACH') || catUpper.includes('GẠCH')) category = 'XI_MANG_GACH';
      else if (catUpper.includes('SON') || catUpper.includes('SƠN') || catUpper.includes('THAM')) category = 'SON_CHONG_THAM';
      else if (catUpper.includes('DIEN') || catUpper.includes('NUOC') || catUpper.includes('ĐIỆN')) category = 'THIET_BI_DIEN_NUOC';
      else if (catUpper.includes('GO') || catUpper.includes('GỖ') || catUpper.includes('COP')) category = 'GO_COP_PHA';

      const unit = cols[3] || 'Đơn vị';
      const quantity = parseFloat(cols[4]) || 0;
      const minStock = parseFloat(cols[5]) || 10;
      const costPrice = parseFloat(cols[6]) || 0;
      const sellingPrice = parseFloat(cols[7]) || costPrice * 1.15;
      const supplier = cols[8] || existingSuppliers[0]?.name || 'Nhà cung cấp đối tác';
      const warehouse = cols[9] || 'Kho Tổng';

      const status: StockStatus = quantity <= 0 ? 'OUTOFSTOCK' : quantity <= minStock ? 'LOWSTOCK' : 'INSTOCK';

      materials.push({
        id: `mat-imp-${Date.now()}-${i}`,
        code,
        name,
        category,
        unit,
        quantity,
        minStock,
        costPrice,
        sellingPrice,
        supplier,
        warehouse,
        status,
        priceHistory: [
          {
            id: `ph-imp-${Date.now()}-${i}`,
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            oldCostPrice: costPrice,
            newCostPrice: costPrice,
            oldSellingPrice: sellingPrice,
            newSellingPrice: sellingPrice,
            reason: 'Khởi tạo ban đầu từ file Excel / Google Sheets Import',
            changedBy: 'Admin Import',
          },
        ],
      });
    }

    setImportErrors(errors);
    setParsedMaterials(materials);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      parseCsvText(content);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setImportErrors(['Không thể đọc file đã chọn. Vui lòng kiểm tra lại định dạng .csv hoặc .txt']);
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleGoogleSheetsImport = async () => {
    if (!googleSheetUrl.trim()) {
      setImportErrors(['Vui lòng dán liên kết Google Sheets']);
      return;
    }

    setIsLoading(true);
    setImportErrors([]);

    try {
      let exportUrl = googleSheetUrl;
      // Convert standard Google Sheet URL to export CSV URL if needed
      if (googleSheetUrl.includes('/edit')) {
        exportUrl = googleSheetUrl.replace(/\/edit.*$/, '/export?format=csv');
      } else if (!googleSheetUrl.includes('export?format=csv') && googleSheetUrl.includes('docs.google.com/spreadsheets/d/')) {
        exportUrl = `${googleSheetUrl}/export?format=csv`;
      }

      const res = await fetch(exportUrl);
      if (!res.ok) {
        throw new Error('Google Sheet chưa được chia sẻ công khai ("Bất kỳ ai có liên kết"). Bạn cũng có thể copy dữ liệu bảng và dán vào tab "Dán dữ liệu Bảng" bên cạnh.');
      }
      const csvText = await res.text();
      parseCsvText(csvText);
    } catch (err: any) {
      setImportErrors([
        err.message || 'Lỗi kết nối Google Sheets. Vui lòng mở quyền "Bất kỳ ai có liên kết đều có thể xem" trên Google Sheets hoặc sử dụng tab "Dán dữ liệu trực tiếp".',
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(sampleCsvContent);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  const handleConfirmImport = () => {
    if (parsedMaterials.length === 0) return;
    onImportMaterials(parsedMaterials);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in select-none">
      <div className="bg-white rounded-xl border border-slate-300 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-in zoom-in-95 text-xs">
        {/* Header */}
        <div className="h-14 bg-slate-900 text-white px-5 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <span>Nhập Dữ Liệu Vật Tư (Excel & Google Sheets)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                  Smart Importer
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Thêm hàng loạt vật tư nhanh chóng từ file Excel (.csv, .xlsx) hoặc bảng tính Google
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

        {/* Tab Selector */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex bg-slate-200/80 p-0.5 rounded-lg">
            <button
              onClick={() => {
                setActiveTab('FILE');
                setImportErrors([]);
              }}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'FILE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải file Excel / CSV</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('GOOGLE_SHEETS');
                setImportErrors([]);
              }}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'GOOGLE_SHEETS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Link Google Sheets</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('PASTE');
                setImportErrors([]);
              }}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'PASTE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Dán bảng tính (Copy & Paste)</span>
            </button>
          </div>

          <button
            onClick={handleCopyTemplate}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 bg-white border border-slate-300 px-2.5 py-1.5 rounded-md shadow-2xs cursor-pointer"
          >
            {copiedTemplate ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedTemplate ? 'Đã sao chép mẫu!' : 'Lấy file mẫu chuẩn'}</span>
          </button>
        </div>

        {/* Input Forms */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white shrink-0">
          {activeTab === 'FILE' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50/60 hover:bg-emerald-50/20 cursor-pointer transition-all text-center group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-emerald-100 group-hover:bg-emerald-200 text-emerald-700 flex items-center justify-center mb-2.5 transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <p className="font-extrabold text-sm text-slate-800 group-hover:text-emerald-700">
                {fileName ? `Đã chọn file: ${fileName}` : 'Kéo thả hoặc nhấp để chọn file Excel / CSV'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Hỗ trợ định dạng .csv hoặc xuất từ Excel bảng vật tư VLXD
              </p>
            </div>
          )}

          {activeTab === 'GOOGLE_SHEETS' && (
            <div className="space-y-3">
              <label className="block text-[11px] font-bold text-slate-700">
                Dán đường link chia sẻ Google Sheets:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1aBcDeFg.../edit"
                  className="flex-1 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs outline-none font-mono"
                />
                <button
                  disabled={isLoading || !googleSheetUrl.trim()}
                  onClick={handleGoogleSheetsImport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {isLoading ? 'Đang đọc...' : 'Tải dữ liệu'}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 italic">
                * Lưu ý: Google Sheet cần được mở quyền chia sẻ "Bất kỳ ai có liên kết đều có thể xem".
              </p>
            </div>
          )}

          {activeTab === 'PASTE' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-700">
                  Dán trực tiếp các ô copy từ Excel hoặc Google Sheets:
                </label>
                <button
                  onClick={() => parseCsvText(pastedData)}
                  disabled={!pastedData.trim()}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded font-bold"
                >
                  Phân tích dữ liệu
                </button>
              </div>
              <textarea
                rows={4}
                value={pastedData}
                onChange={(e) => {
                  setPastedData(e.target.value);
                  parseCsvText(e.target.value);
                }}
                placeholder="Copy các dòng từ Excel (Ctrl+C) và dán vào đây (Ctrl+V)..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-[11px] outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {importErrors.length > 0 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg space-y-1">
              <div className="font-bold flex items-center gap-1 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span>Lưu ý khi đọc dữ liệu:</span>
              </div>
              {importErrors.map((err, i) => (
                <p key={i} className="text-[10px]">
                  • {err}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Data Preview Table */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <span>Xem Trước Danh Sách Vật Tư Sẽ Nhập</span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                {parsedMaterials.length} mặt hàng
              </span>
            </h3>
          </div>

          <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-x-auto overflow-y-auto">
            {parsedMaterials.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-slate-400 text-center">
                <FileSpreadsheet className="w-10 h-10 mb-2 opacity-30" />
                <p className="font-semibold text-slate-600">Chưa có dữ liệu nào được phân tích</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Vui lòng tải file Excel, dán link Google Sheets hoặc paste nội dung bảng ở trên
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead className="bg-slate-100 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 font-bold text-slate-700 uppercase text-[10px]">Mã VT</th>
                    <th className="py-2 px-3 font-bold text-slate-700 uppercase text-[10px]">Tên Vật Tư</th>
                    <th className="py-2 px-3 font-bold text-slate-700 uppercase text-[10px]">Ngành Hàng</th>
                    <th className="py-2 px-3 font-bold text-slate-700 uppercase text-[10px]">ĐVT</th>
                    <th className="py-2 px-3 font-bold text-slate-700 uppercase text-[10px] text-right">Tồn Kho</th>
                    <th className="py-2 px-3 font-bold text-slate-700 uppercase text-[10px] text-right">Giá Nhập</th>
                    <th className="py-2 px-3 font-bold text-slate-700 uppercase text-[10px] text-right">Giá Bán</th>
                    <th className="py-2 px-3 font-bold text-slate-700 uppercase text-[10px]">Nhà Cung Cấp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedMaterials.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-slate-700">{m.code}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{m.name}</td>
                      <td className="py-2 px-3">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          {m.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600">{m.unit}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                        {m.quantity.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {m.costPrice.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {m.sellingPrice.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2 px-3 text-slate-600 truncate max-w-xs">{m.supplier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-slate-500 text-[11px]">
            {parsedMaterials.length > 0
              ? `Sẵn sàng nhập ${parsedMaterials.length} mặt hàng vào kho bãi.`
              : 'Chọn hoặc dán dữ liệu bảng tính để tiếp tục.'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold"
            >
              Hủy
            </button>
            <button
              disabled={parsedMaterials.length === 0}
              onClick={handleConfirmImport}
              className="px-5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Xác Nhận Nhập ({parsedMaterials.length} vật tư)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
