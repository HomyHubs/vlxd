import { useState } from 'react';
import { Material, StockStatus } from '../types';
import { Edit2, Trash2, Plus, Minus, Download, FileSpreadsheet, History, CheckSquare } from 'lucide-react';

interface MaterialTableProps {
  materials: Material[];
  onEditMaterial: (material: Material) => void;
  onDeleteMaterial: (id: string) => void;
  onOpenAddModal: () => void;
  onAdjustStock: (id: string, delta: number) => void;
  onOpenOrderWithMaterial?: (material: Material) => void;
  onOpenImportModal?: () => void;
  onOpenPriceHistory?: (material: Material) => void;
  primaryColor?: string;
}

export function MaterialTable({
  materials,
  onEditMaterial,
  onDeleteMaterial,
  onOpenAddModal,
  onAdjustStock,
  onOpenOrderWithMaterial,
  onOpenImportModal,
  onOpenPriceHistory,
  primaryColor = '#f97316',
}: MaterialTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sorting state
  const [sortField, setSortField] = useState<keyof Material>('code');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: keyof Material) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedMaterials = [...materials].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') {
      return sortAsc
        ? (aVal as string).localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal as string);
    }
    if (typeof aVal === 'number') {
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    }
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedMaterials.length / itemsPerPage));
  const currentItems = sortedMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportCSV = () => {
    const headers = 'Mã VT,Tên Vật Liệu,Đơn Vị,Số Lượng,Giá Nhập,Giá Bán,Trạng Thái,Vị Trí Kho\n';
    const rows = materials
      .map(
        (m) =>
          `"${m.code}","${m.name}","${m.unit}",${m.quantity},${m.costPrice},${m.sellingPrice},"${m.status}","${m.warehouse}"`
      )
      .join('\n');
    const blob = new Blob([`\uFEFF${headers}${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_Muc_VLXD_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const getStatusBadge = (status: StockStatus, qty: number, min: number) => {
    switch (status) {
      case 'INSTOCK':
        return (
          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            SẴN HÀNG
          </span>
        );
      case 'LOWSTOCK':
        return (
          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            SẮP HẾT ({qty}/{min})
          </span>
        );
      case 'PENDING':
        return (
          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            CHỜ NHẬP
          </span>
        );
      case 'OUTOFSTOCK':
        return (
          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            HẾT HÀNG
          </span>
        );
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tr`;
    }
    return price.toLocaleString('vi-VN');
  };

  return (
    <div className="bg-white flex-1 rounded-lg border border-slate-200 shadow-2xs flex flex-col overflow-hidden text-xs">
      {/* Table Header Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">
            Danh mục Vật liệu Xây dựng
          </h2>
          <span className="bg-slate-100 text-slate-600 text-[11px] font-mono font-bold px-2 py-0.5 rounded">
            {materials.length} mặt hàng
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenImportModal && (
            <button
              onClick={onOpenImportModal}
              className="text-xs px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Nhập thêm danh sách vật tư từ file Excel (.xlsx / .csv) hoặc link Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import Excel / Sheets</span>
            </button>
          )}

          <button
            onClick={exportCSV}
            className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            title="Xuất bảng Excel/CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            style={{ backgroundColor: primaryColor }}
            className="text-xs px-3 py-1.5 text-white rounded font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer hover:brightness-110"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Thêm Vật Tư</span>
          </button>
        </div>
      </div>

      {/* Table Scrollable Container */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[780px]">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 select-none">
            <tr>
              <th
                onClick={() => handleSort('code')}
                className="py-2.5 px-3.5 font-bold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
              >
                Mã VT {sortField === 'code' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('name')}
                className="py-2.5 px-3.5 font-bold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
              >
                Tên Vật Liệu {sortField === 'name' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="py-2.5 px-3 font-bold text-slate-600 uppercase tracking-wider text-center">
                Đơn Vị
              </th>
              <th
                onClick={() => handleSort('quantity')}
                className="py-2.5 px-3 font-bold text-slate-600 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100"
              >
                Số Lượng {sortField === 'quantity' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('costPrice')}
                className="py-2.5 px-3 font-bold text-slate-600 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100"
              >
                Giá Nhập {sortField === 'costPrice' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('sellingPrice')}
                className="py-2.5 px-3 font-bold text-slate-600 uppercase tracking-wider text-right cursor-pointer hover:bg-slate-100"
              >
                Giá Bán {sortField === 'sellingPrice' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="py-2.5 px-3 font-bold text-slate-600 uppercase tracking-wider">
                Trạng Thái
              </th>
              <th className="py-2.5 px-3 font-bold text-slate-600 uppercase tracking-wider text-right pr-4">
                Thao Tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400">
                  Không tìm thấy mặt hàng nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              currentItems.map((mat) => {
                const isLow = mat.quantity <= mat.minStock;
                return (
                  <tr key={mat.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-500">
                      {mat.code}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="font-semibold text-slate-900">{mat.name}</div>
                      {mat.specifications && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">
                          {mat.specifications}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {mat.unit}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span
                          className={`font-bold font-mono ${
                            isLow ? 'text-red-600' : 'text-slate-800'
                          }`}
                        >
                          {mat.quantity.toLocaleString('vi-VN')}
                        </span>
                        <div className="hidden group-hover:inline-flex items-center gap-0.5">
                          <button
                            onClick={() => onAdjustStock(mat.id, -1)}
                            className="w-4 h-4 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 cursor-pointer"
                            title="Giảm 1 đơn vị"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={() => onAdjustStock(mat.id, 1)}
                            className="w-4 h-4 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 cursor-pointer"
                            title="Tăng 1 đơn vị"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {formatPrice(mat.costPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                      {formatPrice(mat.sellingPrice)}
                    </td>
                    <td className="py-2.5 px-3">
                      {getStatusBadge(mat.status, mat.quantity, mat.minStock)}
                    </td>
                    <td className="py-2.5 px-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        {onOpenPriceHistory && (
                          <button
                            onClick={() => onOpenPriceHistory(mat)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                            title="Xem lịch sử biến động giá của vật tư này"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onOpenOrderWithMaterial && (
                          <button
                            onClick={() => onOpenOrderWithMaterial(mat)}
                            className="p-1 text-slate-500 hover:bg-slate-100 rounded cursor-pointer"
                            title="Lên đơn xuất vật tư này"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onEditMaterial(mat)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                          title="Chỉnh sửa vật tư"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteMaterial(mat.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          title="Xóa vật tư"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* High Density Footer Pagination Bar */}
      <footer className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap justify-between items-center gap-2 shrink-0">
        <span>
          Hiển thị{' '}
          <strong className="text-slate-700">
            {materials.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
          </strong>{' '}
          -{' '}
          <strong className="text-slate-700">
            {Math.min(currentPage * itemsPerPage, materials.length)}
          </strong>{' '}
          / <strong className="text-slate-700">{materials.length}</strong> vật tư
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-2 py-0.5 border border-slate-200 rounded bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
          >
            Trang trước
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isCurrent = currentPage === p;
            return (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                style={{
                  backgroundColor: isCurrent ? primaryColor : undefined,
                  borderColor: isCurrent ? primaryColor : undefined,
                }}
                className={`w-6 h-6 border rounded flex items-center justify-center font-semibold transition-colors cursor-pointer ${
                  isCurrent
                    ? 'text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-0.5 border border-slate-200 rounded bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
          >
            Trang sau
          </button>
        </div>
      </footer>
    </div>
  );
}
