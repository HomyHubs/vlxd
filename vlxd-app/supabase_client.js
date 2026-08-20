// Supabase REST Client & Data Migration Helper (Zero dependencies, pure HTTP fetch/https)

const https = require('https');
const { URL } = require('url');

class SupabaseClient {
  constructor(supabaseUrl, supabaseKey) {
    this.supabaseUrl = (supabaseUrl || '').replace(/\/+$/, '');
    this.supabaseKey = supabaseKey || '';
  }

  isConfigured() {
    return Boolean(this.supabaseUrl && this.supabaseKey);
  }

  async request(endpoint, method = 'GET', data = null, headers = {}) {
    if (!this.isConfigured()) {
      throw new Error('Supabase URL hoặc API Key chưa được cấu hình.');
    }

    const fullUrl = new URL(`${this.supabaseUrl}/rest/v1/${endpoint.replace(/^\/+/, '')}`);
    const reqHeaders = {
      'apikey': this.supabaseKey,
      'Authorization': `Bearer ${this.supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...headers
    };

    const options = {
      hostname: fullUrl.hostname,
      port: fullUrl.port || 443,
      path: fullUrl.pathname + fullUrl.search,
      method: method.toUpperCase(),
      headers: reqHeaders
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          let parsed;
          try { parsed = body ? JSON.parse(body) : null; } catch (e) { parsed = body; }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Supabase API error (${res.statusCode}): ${JSON.stringify(parsed)}`));
          }
        });
      });

      req.on('error', reject);
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }

  // Data Query Helpers
  async getProducts() {
    return this.request('products?select=*');
  }

  async upsertProducts(products) {
    return this.request('products', 'POST', products, { 'Prefer': 'resolution=merge-duplicates,return=representation' });
  }

  async getSales() {
    return this.request('sales?select=*,sale_items(*)');
  }

  async upsertSales(sales) {
    return this.request('sales', 'POST', sales, { 'Prefer': 'resolution=merge-duplicates,return=representation' });
  }

  async upsertSaleItems(saleItems) {
    return this.request('sale_items', 'POST', saleItems, { 'Prefer': 'resolution=merge-duplicates,return=representation' });
  }

  async getPriceHistory() {
    return this.request('price_history?select=*');
  }

  async upsertPriceHistory(priceHistory) {
    return this.request('price_history', 'POST', priceHistory, { 'Prefer': 'resolution=merge-duplicates,return=representation' });
  }

  // Migration Runner: Push local DB/localStorage dataset to Supabase
  async migrateFromLocal(localData) {
    if (!this.isConfigured()) {
      return { success: false, error: 'Chưa cấu hình Supabase URL & Key' };
    }

    try {
      const results = { products: 0, sales: 0, saleItems: 0, priceHistory: 0 };

      if (Array.isArray(localData.products) && localData.products.length > 0) {
        const mappedProducts = localData.products.map(p => ({
          id: p.id,
          name: p.name,
          cat: p.cat,
          unit: p.unit,
          price: p.price,
          cost_price: p.costPrice || p.cost_price || 0,
          old_price: p.oldPrice || p.old_price || null,
          stock: p.stock || 0,
          min_stock: p.minStock || p.min_stock || 10
        }));
        await this.upsertProducts(mappedProducts);
        results.products = mappedProducts.length;
      }

      if (Array.isArray(localData.priceHistory) && localData.priceHistory.length > 0) {
        const mappedHistory = localData.priceHistory.map(h => ({
          id: h.id || require('crypto').randomUUID(),
          product_id: h.productId || h.product_id,
          name: h.name,
          old_price: h.oldPrice || h.old_price,
          new_price: h.newPrice || h.new_price,
          change_percent: h.changePercent || h.change_percent || 0,
          updated_by: h.updatedBy || h.updated_by || 'system',
          date: h.date || new Date().toISOString()
        }));
        await this.upsertPriceHistory(mappedHistory);
        results.priceHistory = mappedHistory.length;
      }

      if (Array.isArray(localData.sales) && localData.sales.length > 0) {
        const mappedSales = [];
        const mappedItems = [];
        for (const s of localData.sales) {
          mappedSales.push({
            id: s.id,
            code: s.code || `DH-${s.id.slice(0, 8)}`,
            date: s.date,
            customer_name: s.customerName || s.customer_name || 'Khách lẻ',
            customer_phone: s.customerPhone || s.customer_phone || null,
            total: s.total,
            paid_amount: s.paidAmount ?? s.paid_amount ?? s.total,
            debt_amount: s.debtAmount ?? s.debt_amount ?? 0,
            payment_status: s.paymentStatus || s.payment_status || 'paid',
            created_by: s.createdBy || s.created_by || 'system'
          });
          if (Array.isArray(s.items)) {
            for (const item of s.items) {
              mappedItems.push({
                id: item.id || require('crypto').randomUUID(),
                sale_id: s.id,
                product_id: item.productId || item.product_id,
                name: item.name,
                unit: item.unit,
                qty: item.qty,
                price: item.price,
                cost_price: item.costPrice || item.cost_price || 0,
                total_price: (item.qty || 0) * (item.price || 0)
              });
            }
          }
        }
        await this.upsertSales(mappedSales);
        results.sales = mappedSales.length;
        if (mappedItems.length > 0) {
          await this.upsertSaleItems(mappedItems);
          results.saleItems = mappedItems.length;
        }
      }

      return { success: true, results };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = SupabaseClient;
