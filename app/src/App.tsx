import { useState, useMemo, useEffect } from 'react';
import {
  Material,
  MaterialCategory,
  StockStatus,
  Order,
  OrderStatus,
  Supplier,
  Customer,
  WarehouseTransaction,
  StoreSettings,
  CategoryStockAlertSetting,
} from './types';
import {
  INITIAL_MATERIALS,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_TRANSACTIONS,
  INITIAL_SETTINGS,
} from './data/mockData';
import { ThemeVariationId, DensityMode, THEME_VARIATIONS } from './theme/ThemeConfig';
import { Navbar, ActiveNavTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HeaderMetrics } from './components/HeaderMetrics';
import { MaterialTable } from './components/MaterialTable';
import { MaterialModal } from './components/MaterialModal';
import { PosQuickSales } from './components/PosQuickSales';
import { YardMapManagement } from './components/YardMapManagement';
import { OrderManagement } from './components/OrderManagement';
import { WarehouseManagement } from './components/WarehouseManagement';
import { DebtManagement } from './components/DebtManagement';
import { ReportDashboard } from './components/ReportDashboard';
import { UnitConverterModal } from './components/UnitConverterModal';
import { VariationPreviewModal } from './components/VariationPreviewModal';
import { ImportMaterialModal } from './components/ImportMaterialModal';
import { PriceHistoryModal } from './components/PriceHistoryModal';
import { SettingsManagement } from './components/SettingsManagement';

export default function App() {
  // Theme & Style Variation State (persisted in localStorage)
  const [currentThemeId, setCurrentThemeId] = useState<ThemeVariationId>(() => {
    const savedTheme = localStorage.getItem('vlxd_theme_variation');
    return (savedTheme as ThemeVariationId) || 'HIGH_DENSITY_ORANGE';
  });

  const [currentDensity, setCurrentDensity] = useState<DensityMode>(() => {
    const savedDensity = localStorage.getItem('vlxd_density_mode');
    return (savedDensity as DensityMode) || 'COMPACT';
  });

  const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);

  // Main Data State with LocalStorage persistence
  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem('vlxd_materials');
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('vlxd_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('vlxd_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('vlxd_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [transactions, setTransactions] = useState<WarehouseTransaction[]>(() => {
    const saved = localStorage.getItem('vlxd_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('vlxd_store_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // Navigation & Filter state
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('MATERIALS');
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<StockStatus | 'ALL'>('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState<string | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [priceHistoryMaterial, setPriceHistoryMaterial] = useState<Material | null>(null);

  // Sync theme & data to localStorage
  useEffect(() => {
    localStorage.setItem('vlxd_theme_variation', currentThemeId);
  }, [currentThemeId]);

  useEffect(() => {
    localStorage.setItem('vlxd_density_mode', currentDensity);
  }, [currentDensity]);

  useEffect(() => {
    localStorage.setItem('vlxd_materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('vlxd_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('vlxd_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('vlxd_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('vlxd_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('vlxd_store_settings', JSON.stringify(settings));
  }, [settings]);

  const activeTheme = THEME_VARIATIONS[currentThemeId] || THEME_VARIATIONS.HIGH_DENSITY_ORANGE;

  // Derived metrics
  const totalInventoryValue = useMemo(() => {
    return materials.reduce((sum, m) => sum + m.sellingPrice * m.quantity, 0);
  }, [materials]);

  const totalCostValue = useMemo(() => {
    return materials.reduce((sum, m) => sum + m.costPrice * m.quantity, 0);
  }, [materials]);

  const estimatedProfit = totalInventoryValue - totalCostValue;
  const profitMarginPercent = totalInventoryValue > 0 ? (estimatedProfit / totalInventoryValue) * 100 : 0;

  const lowStockMaterials = useMemo(() => {
    return materials.filter((m) => m.quantity <= m.minStock);
  }, [materials]);

  const urgentOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'PENDING' && o.isUrgent);
  }, [orders]);

  const pendingOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'PENDING' || o.status === 'DELIVERING');
  }, [orders]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<MaterialCategory, number> = {
      ALL: materials.length,
      CAT_DA: 0,
      SAT_THEP: 0,
      XI_MANG_GACH: 0,
      SON_CHONG_THAM: 0,
      THIET_BI_DIEN_NUOC: 0,
      GO_COP_PHA: 0,
    };
    materials.forEach((m) => {
      if (counts[m.category] !== undefined) {
        counts[m.category]++;
      }
    });
    return counts;
  }, [materials]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: materials.length,
      INSTOCK: 0,
      LOWSTOCK: 0,
      PENDING: 0,
      OUTOFSTOCK: 0,
    };
    materials.forEach((m) => {
      if (m.quantity <= 0) {
        counts.OUTOFSTOCK++;
      } else if (m.quantity <= m.minStock) {
        counts.LOWSTOCK++;
      } else if (m.status === 'PENDING') {
        counts.PENDING++;
      } else {
        counts.INSTOCK++;
      }
    });
    return counts;
  }, [materials]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (selectedCategory !== 'ALL' && m.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus === 'LOWSTOCK' && m.quantity > m.minStock) {
        return false;
      }
      if (selectedStatus === 'INSTOCK' && (m.quantity <= m.minStock || m.status === 'PENDING')) {
        return false;
      }
      if (selectedStatus === 'PENDING' && m.status !== 'PENDING') {
        return false;
      }
      if (selectedStatus === 'OUTOFSTOCK' && m.quantity > 0) {
        return false;
      }
      if (selectedSupplier !== 'ALL' && m.supplier !== selectedSupplier) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchCode = m.code.toLowerCase().includes(query);
        const matchName = m.name.toLowerCase().includes(query);
        const matchSupplier = m.supplier.toLowerCase().includes(query);
        const matchSpec = m.specifications?.toLowerCase().includes(query);
        if (!matchCode && !matchName && !matchSupplier && !matchSpec) {
          return false;
        }
      }
      return true;
    });
  }, [materials, selectedCategory, selectedStatus, selectedSupplier, searchQuery]);

  // Handlers for Material CRUD
  const handleSaveMaterial = (mat: Material) => {
    if (editingMaterial) {
      setMaterials(materials.map((m) => (m.id === mat.id ? mat : m)));
    } else {
      setMaterials([mat, ...materials]);
    }
  };

  const handleDeleteMaterial = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mặt hàng vật tư này?')) {
      setMaterials(materials.filter((m) => m.id !== id));
    }
  };

  const handleAdjustStock = (id: string, delta: number) => {
    setMaterials(
      materials.map((m) => {
        if (m.id === id) {
          const newQty = Math.max(0, m.quantity + delta);
          let newStatus: StockStatus = m.status;
          if (newQty <= 0) newStatus = 'OUTOFSTOCK';
          else if (newQty <= m.minStock) newStatus = 'LOWSTOCK';
          else newStatus = 'INSTOCK';
          return { ...m, quantity: newQty, status: newStatus };
        }
        return m;
      })
    );
  };

  // Import Materials
  const handleImportMaterials = (newMaterials: Material[]) => {
    setMaterials((prev) => [...newMaterials, ...prev]);
  };

  // Price Fluctuation updates
  const handleUpdateMaterialPrice = (
    materialId: string,
    newSellingPrice: number,
    newCostPrice: number,
    reason: string
  ) => {
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id === materialId) {
          const historyRecord = {
            id: `ph-${Date.now()}`,
            date: new Date().toISOString().replace('T', ' ').slice(0, 16),
            oldCostPrice: m.costPrice,
            newCostPrice,
            oldSellingPrice: m.sellingPrice,
            newSellingPrice,
            reason: reason || 'Điều chỉnh giá theo thị trường',
            updatedBy: 'Quản lý cửa hàng',
          };
          const updatedHistory = [historyRecord, ...(m.priceHistory || [])];
          return {
            ...m,
            sellingPrice: newSellingPrice,
            costPrice: newCostPrice,
            priceHistory: updatedHistory,
          };
        }
        return m;
      })
    );

    // Also update current active price history modal target if open
    if (priceHistoryMaterial && priceHistoryMaterial.id === materialId) {
      setPriceHistoryMaterial((prev) =>
        prev
          ? {
              ...prev,
              sellingPrice: newSellingPrice,
              costPrice: newCostPrice,
              priceHistory: [
                {
                  id: `ph-${Date.now()}`,
                  date: new Date().toISOString().replace('T', ' ').slice(0, 16),
                  oldCostPrice: prev.costPrice,
                  newCostPrice,
                  oldSellingPrice: prev.sellingPrice,
                  newSellingPrice,
                  reason: reason || 'Điều chỉnh giá theo thị trường',
                  updatedBy: 'Quản lý cửa hàng',
                },
                ...(prev.priceHistory || []),
              ],
            }
          : null
      );
    }
  };

  // Handlers for Orders
  const handleAddOrder = (order: Order) => {
    setOrders([order, ...orders]);
    order.items.forEach((item) => {
      setMaterials((prev) =>
        prev.map((m) => {
          if (m.id === item.materialId) {
            const newQty = Math.max(0, m.quantity - item.quantity);
            let newStatus: StockStatus = m.status;
            if (newQty <= 0) newStatus = 'OUTOFSTOCK';
            else if (newQty <= m.minStock) newStatus = 'LOWSTOCK';
            else newStatus = 'INSTOCK';
            return { ...m, quantity: newQty, status: newStatus };
          }
          return m;
        })
      );
    });

    const newTx: WarehouseTransaction = {
      id: `tx-${Date.now()}`,
      code: `XK-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'EXPORT',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      materialId: order.items[0]?.materialId || '',
      materialName: `${order.items[0]?.materialName || 'Vật tư'} + ${order.items.length - 1} loại`,
      quantity: order.items.reduce((s, i) => s + i.quantity, 0),
      unit: 'Tổng ĐVT',
      source: 'Bãi Vật Liệu Số 1',
      destination: `${order.customerName} (${order.deliveryAddress})`,
      operator: 'Nhân viên bán hàng',
      reason: `Xuất bán theo đơn ${order.code}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Update existing order (allow modifying, adding, deleting items, etc.)
  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus, paidAmount?: number) => {
    setOrders(
      orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status,
            paidAmount: paidAmount !== undefined ? paidAmount : o.paidAmount,
          };
        }
        return o;
      })
    );
  };

  const handleAddTransaction = (tx: WarehouseTransaction) => {
    setTransactions([tx, ...transactions]);
  };

  const handleUpdateMaterialStock = (materialId: string, delta: number) => {
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id === materialId) {
          const newQty = Math.max(0, m.quantity + delta);
          let newStatus: StockStatus = m.status;
          if (newQty <= 0) newStatus = 'OUTOFSTOCK';
          else if (newQty <= m.minStock) newStatus = 'LOWSTOCK';
          else newStatus = 'INSTOCK';
          return { ...m, quantity: newQty, status: newStatus };
        }
        return m;
      })
    );
  };

  const handleCollectCustomerDebt = (customerId: string, amount: number) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, debtAmount: Math.max(0, c.debtAmount - amount) } : c))
    );
  };

  const handlePaySupplierDebt = (supplierId: string, amount: number) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? { ...s, currentDebt: Math.max(0, s.currentDebt - amount) } : s))
    );
  };

  // Apply default category threshold alerts to all materials in category
  const handleApplyCategoryThresholdsToMaterials = (
    categoryAlerts: Record<string, CategoryStockAlertSetting>
  ) => {
    setMaterials((prev) =>
      prev.map((m) => {
        const catSetting = categoryAlerts[m.category];
        if (catSetting) {
          const minStock = catSetting.defaultMinStock;
          let newStatus: StockStatus = m.status;
          if (m.quantity <= 0) newStatus = 'OUTOFSTOCK';
          else if (m.quantity <= minStock) newStatus = 'LOWSTOCK';
          else newStatus = 'INSTOCK';
          return { ...m, minStock, status: newStatus };
        }
        return m;
      })
    );
  };

  const handleResetData = () => {
    if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu ban đầu của HomyHubs VLXD?')) {
      setMaterials(INITIAL_MATERIALS);
      setOrders(INITIAL_ORDERS);
      setSuppliers(INITIAL_SUPPLIERS);
      setCustomers(INITIAL_CUSTOMERS);
      setTransactions(INITIAL_TRANSACTIONS);
      setSettings(INITIAL_SETTINGS);
      setCurrentThemeId('HIGH_DENSITY_ORANGE');
      setCurrentDensity('COMPACT');
      localStorage.clear();
    }
  };

  return (
    <div
      className={`w-full h-full min-h-screen ${activeTheme.colors.appBg} flex flex-col font-sans overflow-hidden ${activeTheme.colors.textPrimary} select-text transition-colors`}
      style={{
        // Dynamic theme CSS variables
        ['--theme-primary' as string]: activeTheme.colors.primary,
        ['--theme-primary-hover' as string]: activeTheme.colors.primaryHover,
      }}
    >
      {/* 1. Header Navbar with interactive Menu & Variation Preview Modal Button */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenConverter={() => setIsConverterOpen(true)}
        urgentOrdersCount={urgentOrders.length}
        lowStockCount={lowStockMaterials.length}
        onResetData={handleResetData}
        currentThemeId={currentThemeId}
        onOpenVariationModal={() => setIsVariationModalOpen(true)}
      />

      {/* 2. Main Full-Screen Layout Body */}
      <main className="flex-1 flex overflow-hidden w-full h-full">
        {/* Left Sidebar (Visible on MATERIALS tab for categories and suppliers) */}
        {activeTab === 'MATERIALS' && (
          <Sidebar
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setSelectedStatus('ALL');
            }}
            categoryCounts={categoryCounts}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            statusCounts={statusCounts}
            suppliers={suppliers}
            selectedSupplier={selectedSupplier}
            onSelectSupplier={setSelectedSupplier}
            onOpenConverter={() => setIsConverterOpen(true)}
          />
        )}

        {/* Center Main Viewport */}
        <section
          className={`flex-1 flex flex-col ${
            currentDensity === 'COMPACT'
              ? 'p-2 sm:p-3 gap-2.5 sm:gap-3 text-xs'
              : currentDensity === 'STANDARD'
              ? 'p-3 sm:p-4 gap-3 sm:gap-4 text-xs'
              : 'p-4 sm:p-6 gap-4 sm:gap-5 text-sm'
          } overflow-hidden w-full`}
        >
          {/* Top KPI Metrics Header (except on settings screen) */}
          {activeTab !== 'SETTINGS' && (
            <HeaderMetrics
              totalInventoryValue={totalInventoryValue}
              pendingOrdersCount={pendingOrders.length}
              urgentOrdersCount={urgentOrders.length}
              lowStockCount={lowStockMaterials.length}
              estimatedProfit={estimatedProfit}
              profitMarginPercent={profitMarginPercent}
              onFilterLowStock={() => {
                setActiveTab('MATERIALS');
                setSelectedStatus('LOWSTOCK');
              }}
              onNavigateOrders={() => setActiveTab('ORDERS')}
            />
          )}

          {/* Active View Module Switcher */}
          {activeTab === 'MATERIALS' && (
            <MaterialTable
              materials={filteredMaterials}
              onEditMaterial={(mat) => {
                setEditingMaterial(mat);
                setIsMaterialModalOpen(true);
              }}
              onDeleteMaterial={handleDeleteMaterial}
              onOpenAddModal={() => {
                setEditingMaterial(null);
                setIsMaterialModalOpen(true);
              }}
              onAdjustStock={handleAdjustStock}
              onOpenOrderWithMaterial={() => {
                setActiveTab('POS');
              }}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onOpenPriceHistory={(mat) => setPriceHistoryMaterial(mat)}
              primaryColor={activeTheme.colors.primary}
            />
          )}

          {activeTab === 'POS' && (
            <PosQuickSales
              materials={materials}
              onAddOrder={handleAddOrder}
              primaryColor={activeTheme.colors.primary}
            />
          )}

          {activeTab === 'WAREHOUSE' && (
            <WarehouseManagement
              materials={materials}
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onUpdateMaterialStock={handleUpdateMaterialStock}
            />
          )}

          {activeTab === 'YARD_MAP' && (
            <YardMapManagement
              materials={materials}
            />
          )}

          {activeTab === 'ORDERS' && (
            <OrderManagement
              orders={orders}
              materials={materials}
              customers={customers}
              onAddOrder={handleAddOrder}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdateOrder={handleUpdateOrder}
              primaryColor={activeTheme.colors.primary}
            />
          )}

          {activeTab === 'DEBTS' && (
            <DebtManagement
              customers={customers}
              suppliers={suppliers}
              onCollectCustomerDebt={handleCollectCustomerDebt}
              onPaySupplierDebt={handlePaySupplierDebt}
            />
          )}

          {activeTab === 'REPORTS' && (
            <ReportDashboard
              materials={materials}
              orders={orders}
              customers={customers}
            />
          )}

          {activeTab === 'SETTINGS' && (
            <SettingsManagement
              settings={settings}
              onSaveSettings={setSettings}
              onApplyCategoryThresholdsToMaterials={handleApplyCategoryThresholdsToMaterials}
              primaryColor={activeTheme.colors.primary}
            />
          )}
        </section>
      </main>

      {/* Variation Preview Modal (Design Styles, Color Schemes & Density) */}
      <VariationPreviewModal
        isOpen={isVariationModalOpen}
        onClose={() => setIsVariationModalOpen(false)}
        currentThemeId={currentThemeId}
        onSelectTheme={setCurrentThemeId}
        currentDensity={currentDensity}
        onSelectDensity={setCurrentDensity}
      />

      {/* Material Add / Edit Modal */}
      <MaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSave={handleSaveMaterial}
        initialMaterial={editingMaterial}
        suppliers={suppliers}
      />

      {/* Excel / Google Sheets Material Import Modal */}
      <ImportMaterialModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportMaterials={handleImportMaterials}
        primaryColor={activeTheme.colors.primary}
      />

      {/* Material Price Fluctuation History Modal */}
      <PriceHistoryModal
        isOpen={!!priceHistoryMaterial}
        onClose={() => setPriceHistoryMaterial(null)}
        material={priceHistoryMaterial}
        onUpdatePrices={(matId, cost, selling, r) => handleUpdateMaterialPrice(matId, selling, cost, r)}
        primaryColor={activeTheme.colors.primary}
      />

      {/* VLXD Specialized Unit Converter Modal */}
      <UnitConverterModal
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
      />
    </div>
  );
}
