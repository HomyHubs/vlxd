// VLXD Manager — Backend (không cần cài thêm package, chỉ cần Node.js >= 22)
// Chạy: node server.js  →  mở http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const SupabaseClient = require('./supabase_client');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'vlxd.db');
const db = new DatabaseSync(DB_PATH);

let supabase = new SupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);


db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, username TEXT UNIQUE, name TEXT,
  salt TEXT, pass_hash TEXT, role TEXT CHECK(role IN ('admin','editor','viewer'))
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, name TEXT, cat TEXT, unit TEXT,
  price REAL, old_price REAL, stock REAL, cost_price REAL DEFAULT 0, min_stock REAL DEFAULT 10
);
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY, code TEXT, date TEXT, customer_name TEXT DEFAULT 'Khách lẻ',
  customer_phone TEXT, total REAL DEFAULT 0, paid_amount REAL DEFAULT 0,
  debt_amount REAL DEFAULT 0, payment_status TEXT DEFAULT 'paid', created_by TEXT
);
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY, sale_id TEXT, product_id TEXT,
  name TEXT, unit TEXT, qty REAL, price REAL, cost_price REAL DEFAULT 0, total_price REAL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY, product_id TEXT, name TEXT,
  old_price REAL, new_price REAL, change_percent REAL, updated_by TEXT, date TEXT
);
CREATE TABLE IF NOT EXISTS stock_in (
  id TEXT PRIMARY KEY, code TEXT UNIQUE, supplier_name TEXT, total REAL DEFAULT 0, date TEXT, created_by TEXT
);
CREATE TABLE IF NOT EXISTS stock_in_items (
  id TEXT PRIMARY KEY, stock_in_id TEXT, product_id TEXT, product_name TEXT, unit TEXT, qty REAL, cost_price REAL, total_price REAL
);
CREATE TABLE IF NOT EXISTS customer_payments (
  id TEXT PRIMARY KEY, customer_name TEXT, customer_phone TEXT, sale_id TEXT, amount_paid REAL, notes TEXT, date TEXT, created_by TEXT
);
`);

// Safe column migrations for existing databases
function ensureColumn(table, column, typeDef) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some(c => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeDef}`);
  }
}
ensureColumn('products', 'cost_price', 'REAL DEFAULT 0');
ensureColumn('products', 'min_stock', 'REAL DEFAULT 10');
ensureColumn('sales', 'code', 'TEXT');
ensureColumn('sales', 'customer_name', "TEXT DEFAULT 'Khách lẻ'");
ensureColumn('sales', 'customer_phone', 'TEXT');
ensureColumn('sales', 'paid_amount', 'REAL DEFAULT 0');
ensureColumn('sales', 'debt_amount', 'REAL DEFAULT 0');
ensureColumn('sales', 'payment_status', "TEXT DEFAULT 'paid'");
ensureColumn('sales', 'created_by', 'TEXT');
ensureColumn('sale_items', 'cost_price', 'REAL DEFAULT 0');
ensureColumn('sale_items', 'total_price', 'REAL DEFAULT 0');
ensureColumn('price_history', 'change_percent', 'REAL');
ensureColumn('price_history', 'updated_by', 'TEXT');


/* ---------- Auth helpers ---------- */
function hashPassword(pass, salt) {
  return crypto.scryptSync(pass, salt, 32).toString('hex');
}
function createUser(username, password, role, name) {
  const salt = crypto.randomBytes(16).toString('hex');
  db.prepare('INSERT INTO users (id, username, name, salt, pass_hash, role) VALUES (?,?,?,?,?,?)')
    .run(crypto.randomUUID(), username, name, salt, hashPassword(password, salt), role);
}
const sessions = new Map(); // token -> { userId, role, name, exp }

/* ---------- Seed data ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function seed() {
  const count = db.prepare('SELECT COUNT(*) c FROM products').get().c;
  if (count > 0) return;
  const products = [
    ['p1','Xi măng Hà Tiên PCB40','Xi măng','bao',92000,89000,340],
    ['p2','Xi măng Nghi Sơn PCB40','Xi măng','bao',88000,null,280],
    ['p3','Sắt cuộn phi 6 Hòa Phát','Sắt thép','kg',16500,17200,5200],
    ['p4','Thép thanh phi 10 Hòa Phát','Sắt thép','cây',168000,null,460],
    ['p5','Thép thanh phi 16 Pomina','Sắt thép','cây',395000,402000,210],
    ['p6','Gạch đỏ 4 lỗ','Gạch','viên',1250,1180,48000],
    ['p7','Gạch block 10x20x40','Gạch','viên',5800,null,12000],
    ['p8','Cát vàng hạt trung','Cát & Đá','m³',320000,295000,65],
    ['p9','Đá 1x2 xanh','Cát & Đá','m³',385000,null,48],
    ['p10','Đá mi','Cát & Đá','m³',340000,352000,30],
    ['p11','Sơn Dulux nội thất 18L','Sơn','thùng',1650000,null,42],
    ['p12','Sơn Jotun ngoại thất 15L','Sơn','thùng',1980000,1890000,28],
    ['p13','Ống PVC Ø27 Bình Minh','Ống nước','cây',42000,null,380],
    ['p14','Ống PPR Ø25 Tiền Phong','Ống nước','cây',58000,55000,290],
    ['p15','Tôn lạnh 5 zem Hoa Sen','Tôn & Tấm lợp','tấm',165000,null,150],
    ['p16','Ván ép phủ phim 12mm','Tôn & Tấm lợp','tấm',285000,272000,96],
  ];
  const insP = db.prepare('INSERT INTO products (id,name,cat,unit,price,old_price,stock) VALUES (?,?,?,?,?,?,?)');
  products.forEach(p => insP.run(...p));

  const rng = mulberry32(20260807);
  const now = new Date();
  const qtyRange = {bao:[5,60], kg:[20,400], 'cây':[3,40], 'viên':[200,3000], 'm³':[1,8], 'thùng':[1,6], 'tấm':[2,20]};
  const insS = db.prepare('INSERT INTO sales (id,date,total) VALUES (?,?,?)');
  const insI = db.prepare('INSERT INTO sale_items (id,sale_id,product_id,name,unit,qty,price) VALUES (?,?,?,?,?,?,?)');
  for (let d = 170; d >= 1; d--) {
    const day = new Date(now); day.setDate(now.getDate() - d);
    day.setHours(8 + Math.floor(rng() * 10), Math.floor(rng() * 60), 0, 0);
    const orders = rng() < 0.3 ? 0 : 1 + Math.floor(rng() * 3);
    for (let k = 0; k < orders; k++) {
      const used = new Set(); const items = [];
      const n = 1 + Math.floor(rng() * 3);
      for (let j = 0; j < n; j++) {
        const p = products[Math.floor(rng() * products.length)];
        if (used.has(p[0])) continue; used.add(p[0]);
        const r = qtyRange[p[3]] || [1, 10];
        const qty = Math.round((r[0] + rng() * (r[1] - r[0])) * 10) / 10;
        items.push({ productId: p[0], name: p[1], unit: p[3], qty, price: p[4] });
      }
      if (items.length) {
        const sid = crypto.randomUUID();
        const total = items.reduce((s, i) => s + i.qty * i.price, 0);
        insS.run(sid, day.toISOString(), total);
        items.forEach(i => insI.run(crypto.randomUUID(), sid, i.productId, i.name, i.unit, i.qty, i.price));
      }
    }
  }
  const insH = db.prepare('INSERT INTO price_history (id,product_id,name,old_price,new_price,date) VALUES (?,?,?,?,?,?)');
  products.filter(p => p[5]).forEach(p => {
    const d = new Date(now); d.setDate(now.getDate() - (3 + Math.floor(rng() * 20)));
    insH.run(crypto.randomUUID(), p[0], p[1], p[5], p[4], d.toISOString());
  });
}
function seedUsers() {
  const count = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  if (count > 0) return;
  createUser('admin', 'admin123', 'admin', 'Chủ cửa hàng');
  createUser('banhang', 'banhang123', 'editor', 'Nhân viên bán hàng');
  createUser('khach', 'xem123', 'viewer', 'Tài khoản chỉ xem');
}
seed(); seedUsers();

/* ---------- HTTP helpers ---------- */
const ROLE_LABEL = { admin: 'Quản trị', editor: 'Chỉnh sửa', viewer: 'Chỉ xem' };
function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}
function getSession(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  const s = token && sessions.get(token);
  if (!s) return null;
  if (s.exp < Date.now()) { sessions.delete(token); return null; }
  return s;
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = ''; req.on('data', c => b += c); req.on('end', () => {
      try { resolve(b ? JSON.parse(b) : {}); } catch (e) { reject(e); }
    });
  });
}

/* ---------- API ---------- */
async function handleApi(req, res, url) {
  // Login (public)
  if (url.pathname === '/api/login' && req.method === 'POST') {
    const { username, password } = await readBody(req);
    const u = db.prepare('SELECT * FROM users WHERE username = ?').get(String(username || '').trim());
    if (!u || hashPassword(String(password || ''), u.salt) !== u.pass_hash)
      return json(res, 401, { error: 'Sai tên đăng nhập hoặc mật khẩu' });
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, { userId: u.id, role: u.role, name: u.name, exp: Date.now() + 30 * 24 * 3600 * 1000 });
    return json(res, 200, { token, user: { name: u.name, username: u.username, role: u.role, roleLabel: ROLE_LABEL[u.role] } });
  }

  const s = getSession(req);
  if (!s) return json(res, 401, { error: 'Chưa đăng nhập' });
  const isWrite = req.method !== 'GET';
  if (isWrite && s.role === 'viewer')
    return json(res, 403, { error: 'Tài khoản chỉ xem không có quyền chỉnh sửa' });

  // Bootstrap: toàn bộ dữ liệu cho dashboard
  if (url.pathname === '/api/bootstrap' && req.method === 'GET') {
    const products = db.prepare('SELECT id,name,cat,unit,price,cost_price AS costPrice,old_price AS oldPrice,stock,min_stock AS minStock FROM products').all();
    const sales = db.prepare('SELECT * FROM sales').all().map(row => ({
      id: row.id, code: row.code, date: row.date, customerName: row.customer_name, customerPhone: row.customer_phone,
      total: row.total, paidAmount: row.paid_amount, debtAmount: row.debt_amount, paymentStatus: row.payment_status,
      items: db.prepare('SELECT product_id AS productId,name,unit,qty,price,cost_price AS costPrice,total_price AS totalPrice FROM sale_items WHERE sale_id = ?').all(row.id),
    }));
    const priceHistory = db.prepare('SELECT product_id AS productId,name,old_price AS oldPrice,new_price AS newPrice,change_percent AS changePercent,updated_by AS updatedBy,date FROM price_history ORDER BY date DESC').all();
    const stockIn = db.prepare('SELECT * FROM stock_in ORDER BY date DESC').all().map(row => ({
      id: row.id, code: row.code, supplierName: row.supplier_name, total: row.total, date: row.date, createdBy: row.created_by,
      items: db.prepare('SELECT product_id AS productId,product_name AS name,unit,qty,cost_price AS costPrice,total_price AS totalPrice FROM stock_in_items WHERE stock_in_id = ?').all(row.id)
    }));
    const customerPayments = db.prepare('SELECT id, customer_name AS customerName, customer_phone AS customerPhone, sale_id AS saleId, amount_paid AS amountPaid, notes, date, created_by AS createdBy FROM customer_payments ORDER BY date DESC').all();

    return json(res, 200, { products, sales, priceHistory, stockIn, customerPayments, user: { name: s.name, role: s.role, roleLabel: ROLE_LABEL[s.role] } });
  }

  // Task 5: Database schema info
  if (url.pathname === '/api/db/schema' && req.method === 'GET') {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(t => t.name);
    const schema = {};
    for (const table of tables) {
      schema[table] = db.prepare(`PRAGMA table_info(${table})`).all();
    }
    return json(res, 200, { ok: true, tables, schema });
  }

  // Task 4: Supabase Connection & Migration endpoints
  if (url.pathname === '/api/supabase/status' && req.method === 'GET') {
    return json(res, 200, {
      configured: supabase.isConfigured(),
      url: supabase.supabaseUrl ? `${supabase.supabaseUrl.slice(0, 15)}...` : null
    });
  }

  if (url.pathname === '/api/supabase/config' && req.method === 'POST') {
    if (s.role !== 'admin') return json(res, 403, { error: 'Chỉ quản trị viên mới được cấu hình Supabase' });
    const b = await readBody(req);
    if (!b.url || !b.key) return json(res, 400, { error: 'Thiếu Supabase URL hoặc Key' });
    supabase = new SupabaseClient(b.url, b.key);
    return json(res, 200, { ok: true, configured: true });
  }

  if (url.pathname === '/api/supabase/migrate' && req.method === 'POST') {
    if (s.role !== 'admin') return json(res, 403, { error: 'Chỉ quản trị viên mới được migrate dữ liệu' });
    if (!supabase.isConfigured()) return json(res, 400, { error: 'Supabase URL & API Key chưa được cài đặt' });

    // Package local SQLite data for migration
    const localProducts = db.prepare('SELECT * FROM products').all();
    const localSales = db.prepare('SELECT * FROM sales').all().map(row => ({
      ...row,
      items: db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(row.id)
    }));
    const localHistory = db.prepare('SELECT * FROM price_history').all();

    const migrationResult = await supabase.migrateFromLocal({
      products: localProducts,
      sales: localSales,
      priceHistory: localHistory
    });

    if (!migrationResult.success) {
      return json(res, 400, { error: `Migrate thất bại: ${migrationResult.error}` });
    }
    return json(res, 200, { ok: true, details: migrationResult.results });
  }



  // Thêm mặt hàng
  if (url.pathname === '/api/products' && req.method === 'POST') {
    const b = await readBody(req);
    if (!b.name || !(Number(b.price) > 0)) return json(res, 400, { error: 'Thiếu tên hoặc giá bán' });
    db.prepare('INSERT INTO products (id,name,cat,unit,price,old_price,stock) VALUES (?,?,?,?,?,?,?)')
      .run(crypto.randomUUID(), String(b.name).trim(), String(b.cat || 'Khác'), String(b.unit || 'cái'), Number(b.price), null, Number(b.stock) || 0);
    return json(res, 200, { ok: true });
  }

  // Cập nhật giá (ghi lịch sử giá cũ → mới)
  const priceMatch = url.pathname.match(/^\/api\/products\/([^/]+)\/price$/);
  if (priceMatch && req.method === 'POST') {
    const b = await readBody(req);
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(priceMatch[1]);
    if (!p) return json(res, 404, { error: 'Không tìm thấy mặt hàng' });
    const v = Number(b.price);
    if (!(v >= 0)) return json(res, 400, { error: 'Giá không hợp lệ' });
    if (v !== p.price) {
      db.prepare('INSERT INTO price_history (id,product_id,name,old_price,new_price,date) VALUES (?,?,?,?,?,?)')
        .run(crypto.randomUUID(), p.id, p.name, p.price, v, new Date().toISOString());
      db.prepare('UPDATE products SET old_price = ?, price = ? WHERE id = ?').run(p.price, v, p.id);
    }
    return json(res, 200, { ok: true });
  }

  // Ghi đơn bán hàng (hỗ trợ ghi nợ & trừ tồn kho)
  if (url.pathname === '/api/sales' && req.method === 'POST') {
    const b = await readBody(req);
    const items = Array.isArray(b.items) ? b.items : [];
    if (!items.length) return json(res, 400, { error: 'Đơn hàng trống' });
    const sid = crypto.randomUUID();
    const code = `DH-${Date.now().toString().slice(-6)}`;
    const custName = String(b.customerName || 'Khách lẻ').trim();
    const custPhone = b.customerPhone ? String(b.customerPhone).trim() : null;
    let total = 0;
    const insI = db.prepare('INSERT INTO sale_items (id,sale_id,product_id,name,unit,qty,price,cost_price,total_price) VALUES (?,?,?,?,?,?,?,?,?)');
    for (const i of items) {
      const p = db.prepare('SELECT * FROM products WHERE id = ?').get(i.productId);
      const qty = Number(i.qty), price = Number(i.price);
      if (!p || !(qty > 0) || !(price >= 0)) return json(res, 400, { error: 'Dữ liệu đơn hàng không hợp lệ' });
      const itemTotal = qty * price;
      const costPrice = p.cost_price || 0;
      total += itemTotal;
      insI.run(crypto.randomUUID(), sid, p.id, p.name, p.unit, qty, price, costPrice, itemTotal);
      db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?').run(qty, p.id);
    }

    const paidAmount = b.paidAmount !== undefined ? Number(b.paidAmount) : total;
    const debtAmount = Math.max(0, total - paidAmount);
    let status = 'paid';
    if (debtAmount > 0) status = paidAmount > 0 ? 'partial' : 'debt';

    db.prepare('INSERT INTO sales (id,code,date,customer_name,customer_phone,total,paid_amount,debt_amount,payment_status,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(sid, code, new Date().toISOString(), custName, custPhone, total, paidAmount, debtAmount, status, s.name);
    return json(res, 200, { ok: true, id: sid, code, total, debtAmount });
  }

  // Task 3: Tạo phiếu nhập hàng (Stock-In) & tăng tồn kho
  if (url.pathname === '/api/stock-in' && req.method === 'POST') {
    const b = await readBody(req);
    const productId = String(b.productId || '');
    const qty = Number(b.qty);
    const costPrice = Number(b.costPrice);
    const supplierName = String(b.supplierName || 'Nhà cung cấp').trim();

    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!p || !(qty > 0) || !(costPrice >= 0)) return json(res, 400, { error: 'Mặt hàng, số lượng hoặc giá vốn không hợp lệ' });

    const stockInId = crypto.randomUUID();
    const code = `PN-${Date.now().toString().slice(-6)}`;
    const totalPrice = qty * costPrice;

    db.prepare('INSERT INTO stock_in (id,code,supplier_name,total,date,created_by) VALUES (?,?,?,?,?,?)')
      .run(stockInId, code, supplierName, totalPrice, new Date().toISOString(), s.name);

    db.prepare('INSERT INTO stock_in_items (id,stock_in_id,product_id,product_name,unit,qty,cost_price,total_price) VALUES (?,?,?,?,?,?,?,?)')
      .run(crypto.randomUUID(), stockInId, p.id, p.name, p.unit, qty, costPrice, totalPrice);

    // Update product stock inventory and average cost price
    db.prepare('UPDATE products SET stock = stock + ?, cost_price = ? WHERE id = ?').run(qty, costPrice, p.id);

    return json(res, 200, { ok: true, code, totalPrice });
  }

  // Task 2: Ghi nhận thanh toán thu nợ khách hàng
  if (url.pathname === '/api/payments' && req.method === 'POST') {
    const b = await readBody(req);
    const customerName = String(b.customerName || '').trim();
    const customerPhone = b.customerPhone ? String(b.customerPhone).trim() : null;
    const amountPaid = Number(b.amountPaid);
    const notes = String(b.notes || '').trim();

    if (!customerName || !(amountPaid > 0)) return json(res, 400, { error: 'Vui lòng nhập tên khách hàng và số tiền thu nợ' });

    const payId = crypto.randomUUID();
    db.prepare('INSERT INTO customer_payments (id,customer_name,customer_phone,amount_paid,notes,date,created_by) VALUES (?,?,?,?,?,?,?)')
      .run(payId, customerName, customerPhone, amountPaid, notes, new Date().toISOString(), s.name);

    // Reduce debt on pending sales orders for this customer if matching
    const openSales = db.prepare("SELECT * FROM sales WHERE customer_name = ? AND debt_amount > 0 ORDER BY date ASC").all(customerName);
    let rem = amountPaid;
    for (const sale of openSales) {
      if (rem <= 0) break;
      const deduct = Math.min(sale.debt_amount, rem);
      const newPaid = sale.paid_amount + deduct;
      const newDebt = sale.debt_amount - deduct;
      const newStatus = newDebt === 0 ? 'paid' : 'partial';
      db.prepare('UPDATE sales SET paid_amount = ?, debt_amount = ?, payment_status = ? WHERE id = ?')
        .run(newPaid, newDebt, newStatus, sale.id);
      rem -= deduct;
    }

    return json(res, 200, { ok: true, amountPaid });
  }


  // Quản lý người dùng (chỉ admin)
  if (url.pathname === '/api/users') {
    if (s.role !== 'admin') return json(res, 403, { error: 'Chỉ quản trị viên mới có quyền quản lý người dùng' });
    if (req.method === 'GET') {
      const users = db.prepare('SELECT id,username,name,role FROM users ORDER BY username').all()
        .map(u => ({ ...u, roleLabel: ROLE_LABEL[u.role] }));
      return json(res, 200, users);
    }
    if (req.method === 'POST') {
      const b = await readBody(req);
      const username = String(b.username || '').trim().toLowerCase();
      const name = String(b.name || '').trim();
      const password = String(b.password || '');
      const role = String(b.role || '').trim();

      if (!username || username.length < 3)
        return json(res, 400, { error: 'Tên đăng nhập phải có ít nhất 3 ký tự' });
      if (!/^[a-z0-9_.-]+$/.test(username))
        return json(res, 400, { error: 'Tên đăng nhập chỉ chứa chữ thường, số, dấu gạch dưới, gạch ngang hoặc chấm' });
      if (!name)
        return json(res, 400, { error: 'Vui lòng nhập họ và tên người dùng' });
      if (!password || password.length < 4)
        return json(res, 400, { error: 'Mật khẩu phải có ít nhất 4 ký tự' });
      if (!['admin', 'editor', 'viewer'].includes(role))
        return json(res, 400, { error: 'Quyền hạn không hợp lệ' });

      try {
        createUser(username, password, role, name);
      } catch (e) {
        return json(res, 400, { error: 'Tên đăng nhập đã tồn tại' });
      }
      return json(res, 200, { ok: true });
    }
  }

  const roleMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/role$/);
  if (roleMatch && req.method === 'POST') {
    if (s.role !== 'admin') return json(res, 403, { error: 'Chỉ quản trị viên mới có quyền quản lý người dùng' });
    const targetId = roleMatch[1];
    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!targetUser) return json(res, 404, { error: 'Không tìm thấy người dùng' });

    const b = await readBody(req);
    const newRole = String(b.role || '').trim();
    if (!['admin', 'editor', 'viewer'].includes(newRole)) return json(res, 400, { error: 'Quyền hạn không hợp lệ' });
    if (targetId === s.userId) return json(res, 400, { error: 'Không thể tự đổi quyền của chính mình' });

    if (targetUser.role === 'admin' && newRole !== 'admin') {
      const adminCount = db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'admin'").get().c;
      if (adminCount <= 1) return json(res, 400, { error: 'Không thể hạ quyền của quản trị viên duy nhất trong hệ thống' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, targetId);
    for (const [t, sess] of sessions.entries()) {
      if (sess.userId === targetId) sess.role = newRole;
    }
    return json(res, 200, { ok: true });
  }

  const passMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/password$/);
  if (passMatch && req.method === 'POST') {
    if (s.role !== 'admin') return json(res, 403, { error: 'Chỉ quản trị viên mới có quyền đổi mật khẩu' });
    const targetId = passMatch[1];
    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!targetUser) return json(res, 404, { error: 'Không tìm thấy người dùng' });

    const b = await readBody(req);
    const newPass = String(b.password || '');
    if (!newPass || newPass.length < 4) return json(res, 400, { error: 'Mật khẩu mới phải có ít nhất 4 ký tự' });

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(newPass, newSalt);
    db.prepare('UPDATE users SET salt = ?, pass_hash = ? WHERE id = ?').run(newSalt, newHash, targetId);
    return json(res, 200, { ok: true });
  }

  const deleteMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
  if (deleteMatch && req.method === 'DELETE') {
    if (s.role !== 'admin') return json(res, 403, { error: 'Chỉ quản trị viên mới có quyền xóa người dùng' });
    const targetId = deleteMatch[1];
    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!targetUser) return json(res, 404, { error: 'Không tìm thấy người dùng' });

    if (targetId === s.userId) return json(res, 400, { error: 'Không thể tự xóa tài khoản đang đăng nhập' });

    if (targetUser.role === 'admin') {
      const adminCount = db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'admin'").get().c;
      if (adminCount <= 1) return json(res, 400, { error: 'Không thể xóa quản trị viên duy nhất trong hệ thống' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
    for (const [t, sess] of sessions.entries()) {
      if (sess.userId === targetId) sessions.delete(t);
    }
    return json(res, 200, { ok: true });
  }

  // Reset dữ liệu mẫu (chỉ admin)
  if (url.pathname === '/api/reset' && req.method === 'POST') {
    if (s.role !== 'admin') return json(res, 403, { error: 'Chỉ quản trị viên mới được reset dữ liệu' });
    db.exec('DELETE FROM sale_items; DELETE FROM sales; DELETE FROM price_history; DELETE FROM products;');
    seed();
    return json(res, 200, { ok: true });
  }

  json(res, 404, { error: 'API không tồn tại' });
}

/* ---------- Static + server ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    let p = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const file = path.join(__dirname, 'public', path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
    if (!file.startsWith(path.join(__dirname, 'public')) || !fs.existsSync(file) || fs.statSync(file).isDirectory())
      { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    json(res, 500, { error: 'Lỗi máy chủ: ' + e.message });
  }
});
if (require.main === module) {
  server.listen(PORT, () => console.log(`VLXD Manager chạy tại http://localhost:${PORT}`));
}
module.exports = { server, db, sessions, createUser, hashPassword };
