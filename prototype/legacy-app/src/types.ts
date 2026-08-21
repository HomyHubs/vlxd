export type MaterialCategory =
  | 'ALL'
  | 'CAT_DA'
  | 'SAT_THEP'
  | 'XI_MANG_GACH'
  | 'SON_CHONG_THAM'
  | 'THIET_BI_DIEN_NUOC'
  | 'GO_COP_PHA';

export type StockStatus = 'INSTOCK' | 'LOWSTOCK' | 'PENDING' | 'OUTOFSTOCK';

export interface PriceHistoryRecord {
  id: string;
  date: string;
  oldCostPrice: number;
  newCostPrice: number;
  oldSellingPrice: number;
  newSellingPrice: number;
  reason?: string;
  changedBy?: string;
}

export interface Material {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  quantity: number;
  minStock: number;
  costPrice: number;
  sellingPrice: number;
  supplier: string;
  warehouse: string;
  status: StockStatus;
  notes?: string;
  specifications?: string;
  density?: number; // Density for weight calculations if applicable (kg/m3 or kg/m)
  priceHistory?: PriceHistoryRecord[];
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  rating: number;
  status: 'active' | 'inactive';
  currentDebt: number; // Công nợ mình nợ nhà cung cấp
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  projectAddress: string;
  customerType: 'RETAIL' | 'CONTRACTOR' | 'COMPANY'; // Khách lẻ / Thầu thợ / Doanh nghiệp
  totalOrders: number;
  totalSpent: number;
  debtAmount: number; // Tiền khách còn nợ
}

export interface OrderItem {
  materialId: string;
  materialCode: string;
  materialName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type OrderStatus = 'DRAFT' | 'PENDING' | 'PROCESSING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;
  paidAmount: number;
  status: OrderStatus;
  isUrgent?: boolean;
  notes?: string;
}

export interface WarehouseTransaction {
  id: string;
  code: string;
  type: 'IMPORT' | 'EXPORT' | 'TRANSFER';
  date: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  source: string;
  destination: string;
  operator: string;
  reason: string;
}

export interface CategoryStockAlertSetting {
  category: MaterialCategory;
  categoryName: string;
  defaultMinStock: number;
  unit: string;
  urgentLeadDays: number;
}

export interface StoreSettings {
  storeName: string;
  phone: string;
  address: string;
  taxCode: string;
  bankAccount: string;
  bankName: string;
  // Alert thresholds
  categoryAlerts: Record<string, CategoryStockAlertSetting>;
  maxCustomerDebtLimit: number; // Hạn mức nợ tối đa cho 1 nhà thầu
  minProfitMarginAlertPercent: number; // Cảnh báo khi biên lợi nhuận dưới %
  notifyLowStockSound: boolean;
  autoDeductStockOnOrder: boolean;
}
