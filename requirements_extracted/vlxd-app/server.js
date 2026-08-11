// VLXD Manager — Backend (không cần cài thêm package, chỉ cần Node.js >= 22)
// Chạy: node server.js  →  mở http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'vlxd.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, username TEXT UNIQUE, name TEXT,
  salt TEXT, pass_hash TEXT, role TEXT CHECK(role IN ('admin','editor','viewer'))
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, name TEXT, cat TEXT, unit TEXT,
  price REAL, old_price REAL, stock REAL
);
CREATE TABLE IF NOT EXISTS sales (id TEXT PRIMARY KEY, date TEXT, total REAL);
CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY, sale_id TEXT, product_id TEXT,
  name TEXT, unit TEXT, qty REAL, price REAL
);
CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY, product_id TEXT, name TEXT,
  old_price REAL, new_price REAL, date TEXT
);
`);

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
    const products = db.prepare('SELECT id,name,cat,unit,price,old_price AS oldPrice,stock FROM products').all();
    const sales = db.prepare('SELECT * FROM sales').all().map(row => ({
      id: row.id, date: row.date, total: row.total,
      items: db.prepare('SELECT product_id AS productId,name,unit,qty,price FROM sale_items WHERE sale_id = ?').all(row.id),
    }));
    const priceHistory = db.prepare('SELECT product_id AS productId,name,old_price AS oldPrice,new_price AS newPrice,date FROM price_history ORDER BY date DESC').all();
    return json(res, 200, { products, sales, priceHistory, user: { name: s.name, role: s.role, roleLabel: ROLE_LABEL[s.role] } });
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

  // Ghi đơn bán hàng (trừ tồn kho)
  if (url.pathname === '/api/sales' && req.method === 'POST') {
    const b = await readBody(req);
    const items = Array.isArray(b.items) ? b.items : [];
    if (!items.length) return json(res, 400, { error: 'Đơn hàng trống' });
    const sid = crypto.randomUUID();
    let total = 0;
    const insI = db.prepare('INSERT INTO sale_items (id,sale_id,product_id,name,unit,qty,price) VALUES (?,?,?,?,?,?,?)');
    for (const i of items) {
      const p = db.prepare('SELECT * FROM products WHERE id = ?').get(i.productId);
      const qty = Number(i.qty), price = Number(i.price);
      if (!p || !(qty > 0) || !(price >= 0)) return json(res, 400, { error: 'Dữ liệu đơn hàng không hợp lệ' });
      total += qty * price;
      insI.run(crypto.randomUUID(), sid, p.id, p.name, p.unit, qty, price);
      db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?').run(qty, p.id);
    }
    db.prepare('INSERT INTO sales (id,date,total) VALUES (?,?,?)').run(sid, new Date().toISOString(), total);
    return json(res, 200, { ok: true });
  }

  // Quản lý người dùng (chỉ admin)
  if (url.pathname === '/api/users') {
    if (s.role !== 'admin') return json(res, 403, { error: 'Chỉ quản trị viên mới quản lý người dùng' });
    if (req.method === 'GET') {
      const users = db.prepare('SELECT id,username,name,role FROM users ORDER BY username').all()
        .map(u => ({ ...u, roleLabel: ROLE_LABEL[u.role] }));
      return json(res, 200, users);
    }
    if (req.method === 'POST') {
      const b = await readBody(req);
      const username = String(b.username || '').trim();
      if (!username || !b.password || !['admin', 'editor', 'viewer'].includes(b.role))
        return json(res, 400, { error: 'Thiếu thông tin hoặc quyền không hợp lệ' });
      try {
        createUser(username, String(b.password), b.role, String(b.name || username));
      } catch (e) { return json(res, 400, { error: 'Tên đăng nhập đã tồn tại' }); }
      return json(res, 200, { ok: true });
    }
  }
  const roleMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/role$/);
  if (roleMatch && req.method === 'POST') {
    if (s.role !== 'admin') return json(res, 403, { error: 'Chỉ quản trị viên mới quản lý người dùng' });
    const b = await readBody(req);
    if (!['admin', 'editor', 'viewer'].includes(b.role)) return json(res, 400, { error: 'Quyền không hợp lệ' });
    if (roleMatch[1] === s.userId) return json(res, 400, { error: 'Không thể tự đổi quyền của chính mình' });
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(b.role, roleMatch[1]);
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
server.listen(PORT, () => console.log(`VLXD Manager chạy tại http://localhost:${PORT}`));
