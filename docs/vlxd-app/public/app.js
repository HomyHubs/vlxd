/* VLXD Manager — Frontend (giao tiếp backend qua REST API) */
let state = { products: [], sales: [], priceHistory: [], user: null };
let token = localStorage.getItem('vlxd_token') || null;
let draft = [];
let activeCat = 'all';
let editingId = null;

/* ================= API layer ================= */
async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.method || 'GET',
    headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401) { logout(); throw new Error('unauthorized'); }
  if (res.status === 403) {
    const e = await res.json().catch(() => ({}));
    alert(e.error || 'Tài khoản của bạn không có quyền thực hiện thao tác này.');
    throw new Error('forbidden');
  }
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    alert(e.error || 'Có lỗi xảy ra, vui lòng thử lại.');
    throw new Error('server');
  }
  return res.json();
}

async function loadAll() {
  const data = await api('/api/bootstrap');
  state.products = data.products;
  state.sales = data.sales;
  state.priceHistory = data.priceHistory;
  state.user = data.user;
  applyRole();
  renderAll();
}

/* ================= Auth ================= */
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = document.getElementById('loginError');
  err.classList.remove('show');
  try {
    const res = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById('loginUser').value,
        password: document.getElementById('loginPass').value,
      }),
    });
    const data = await res.json();
    if (!res.ok) { err.textContent = data.error || 'Đăng nhập thất bại'; err.classList.add('show'); return; }
    token = data.token;
    localStorage.setItem('vlxd_token', token);
    await enterApp();
  } catch (ex) { err.textContent = 'Không kết nối được máy chủ'; err.classList.add('show'); }
});

async function enterApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('sidebar').style.display = '';
  document.getElementById('mainContent').style.display = '';
  await loadAll();
}

function logout() {
  localStorage.removeItem('vlxd_token');
  token = null;
  location.reload();
}
document.getElementById('logoutBtn').addEventListener('click', logout);

function applyRole() {
  const u = state.user;
  document.body.classList.toggle('viewer', u.role === 'viewer');
  document.getElementById('navUsers').style.display = u.role === 'admin' ? '' : 'none';
  document.getElementById('resetWrap').style.display = u.role === 'admin' ? '' : 'none';
  document.getElementById('userChip').innerHTML =
    `<div class="user-chip"><strong>${esc(u.name)}</strong><span class="badge role role-${u.role}">${esc(u.roleLabel)}</span></div>`;
}

/* ================= Helpers ================= */
const nf = new Intl.NumberFormat('vi-VN');
const fmt = v => nf.format(Math.round(v)) + ' ₫';
function fmtCompact(v){
  if(v>=1e9) return (v/1e9).toLocaleString('vi-VN',{maximumFractionDigits:1})+' tỷ';
  if(v>=1e6) return (v/1e6).toLocaleString('vi-VN',{maximumFractionDigits:1})+' tr';
  if(v>=1e3) return (v/1e3).toLocaleString('vi-VN',{maximumFractionDigits:0})+'k';
  return String(Math.round(v));
}
const fmtQty = q => (Math.round(q*10)/10).toLocaleString('vi-VN');
const fmtDate = iso => new Date(iso).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'});
const fmtDateTime = iso => new Date(iso).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'}) + ' ' + new Date(iso).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
function mondayOf(d){ const x=new Date(d); const day=(x.getDay()+6)%7; x.setHours(0,0,0,0); x.setDate(x.getDate()-day); return x; }
function monthKey(d){ const x=new Date(d); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0'); }
const esc = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ================= Navigation ================= */
function goView(name){
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.view===name));
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active', v.id==='view-'+name));
  if(name==='users') renderUsers();
  window.scrollTo(0,0);
}
document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click', ()=>goView(b.dataset.view)));

/* ================= Dashboard ================= */
function renderDashboard(){
  const now = new Date();
  document.getElementById('todayLabel').textContent =
    'Hôm nay: ' + now.toLocaleDateString('vi-VN',{weekday:'long', day:'2-digit', month:'2-digit', year:'numeric'});

  const thisMon = mondayOf(now);
  const lastMon = new Date(thisMon); lastMon.setDate(lastMon.getDate()-7);
  const mNow = monthKey(now);
  const prevMonthD = new Date(now); prevMonthD.setMonth(prevMonthD.getMonth()-1);
  const mPrev = monthKey(prevMonthD);

  let wRev=0, wPrevRev=0, mRev=0, mPrevRev=0, mOrders=0, mQty=0;
  state.sales.forEach(s=>{
    const d = new Date(s.date);
    if(d >= thisMon) wRev += s.total;
    else if(d >= lastMon) wPrevRev += s.total;
    const mk = monthKey(d);
    if(mk === mNow){ mRev += s.total; mOrders++; s.items.forEach(i=>mQty+=i.qty); }
    else if(mk === mPrev) mPrevRev += s.total;
  });
  const dW = wPrevRev ? (wRev-wPrevRev)/wPrevRev*100 : null;
  const dM = mPrevRev ? (mRev-mPrevRev)/mPrevRev*100 : null;
  const delta = v => v==null ? '<span class="muted">—</span>'
    : `<span class="${v>=0?'up':'down'}">${v>=0?'▲':'▼'} ${Math.abs(v).toFixed(1)}% so kỳ trước</span>`;

  document.getElementById('kpiRow').innerHTML = `
    <div class="card"><div class="kpi-label">Doanh thu tuần này</div><div class="kpi-value">${fmt(wRev)}</div><div class="kpi-delta">${delta(dW)}</div></div>
    <div class="card"><div class="kpi-label">Doanh thu tháng này</div><div class="kpi-value">${fmt(mRev)}</div><div class="kpi-delta">${delta(dM)}</div></div>
    <div class="card"><div class="kpi-label">Đơn hàng tháng này</div><div class="kpi-value">${mOrders}</div><div class="kpi-delta muted">đơn đã ghi</div></div>
    <div class="card"><div class="kpi-label">Sản lượng bán tháng này</div><div class="kpi-value">${fmtQty(mQty)}</div><div class="kpi-delta muted">tổng số lượng các mặt hàng</div></div>`;

  const weeks = [];
  for(let i=7;i>=0;i--){
    const mon = new Date(thisMon); mon.setDate(mon.getDate()-7*i);
    weeks.push({mon, label: mon.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'}), value:0});
  }
  state.sales.forEach(s=>{
    const monT = mondayOf(new Date(s.date)).getTime();
    const w = weeks.find(w=>w.mon.getTime()===monT);
    if(w) w.value += s.total;
  });
  document.getElementById('weeklyChart').innerHTML = barChart(weeks.map(w=>({label:w.label, value:w.value})));

  const months = [];
  for(let i=5;i>=0;i--){
    const d = new Date(now); d.setDate(1); d.setMonth(d.getMonth()-i);
    months.push({key:monthKey(d), label:'T'+(d.getMonth()+1), value:0});
  }
  state.sales.forEach(s=>{
    const mk = monthKey(new Date(s.date));
    const m = months.find(m=>m.key===mk);
    if(m) m.value += s.total;
  });
  document.getElementById('monthlyChart').innerHTML = lineChart(months.map(m=>({label:m.label, value:m.value})));

  const agg = {};
  state.sales.forEach(s=>{ if(monthKey(new Date(s.date))===mNow) s.items.forEach(i=>{
    agg[i.productId] = agg[i.productId] || {name:i.name, unit:i.unit, qty:0, rev:0};
    agg[i.productId].qty += i.qty; agg[i.productId].rev += i.qty*i.price;
  });});
  const top = Object.values(agg).sort((a,b)=>b.qty-a.qty).slice(0,5);
  const maxQ = top.length ? top[0].qty : 1;
  document.getElementById('topProducts').innerHTML = top.length ? top.map((t,i)=>`
    <div class="rank-row">
      <div class="rank-no">${i+1}</div>
      <div class="rank-name" title="${esc(t.name)}">${esc(t.name)}</div>
      <div class="rank-bar-wrap"><div class="rank-bar" style="width:${Math.max(4, t.qty/maxQ*100)}%"></div></div>
      <div class="rank-val">${fmtQty(t.qty)} ${esc(t.unit)}</div>
    </div>`).join('') : '<div class="empty">Chưa có đơn bán trong tháng này</div>';

  const catAgg = {};
  state.sales.forEach(s=>{ if(monthKey(new Date(s.date))===mNow) s.items.forEach(i=>{
    const p = state.products.find(p=>p.id===i.productId);
    const c = p ? p.cat : 'Khác';
    catAgg[c] = (catAgg[c]||0) + i.qty;
  });});
  const cats = Object.entries(catAgg).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxC = cats.length ? cats[0][1] : 1;
  document.getElementById('topCategories').innerHTML = cats.length ? cats.map(([c,q],i)=>`
    <div class="rank-row">
      <div class="rank-no">${i+1}</div>
      <div class="rank-name">${esc(c)}</div>
      <div class="rank-bar-wrap"><div class="rank-bar" style="width:${Math.max(4, q/maxC*100)}%; background:#72BC8F"></div></div>
      <div class="rank-val">${fmtQty(q)}</div>
    </div>`).join('') : '<div class="empty">Chưa có dữ liệu tháng này</div>';
}

function barChart(data){
  const W=640,H=230,padL=8,padB=28,padT=22;
  const max = Math.max(...data.map(d=>d.value),1);
  const bw = (W-padL*2)/data.length;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">`;
  data.forEach((d,i)=>{
    const h = d.value ? Math.max(4,(d.value/max)*(H-padB-padT)) : 2;
    const x = padL + i*bw + bw*0.18, w = bw*0.64, y = H-padB-h;
    const isLast = i===data.length-1;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${isLast?'#2783DE':'#BBD7F2'}"></rect>`;
    if(d.value) s += `<text x="${x+w/2}" y="${y-6}" text-anchor="middle" font-size="11" fill="#7D7A75">${fmtCompact(d.value)}</text>`;
    s += `<text x="${x+w/2}" y="${H-8}" text-anchor="middle" font-size="11" fill="${isLast?'#2C2C2B':'#7D7A75'}" ${isLast?'font-weight="700"':''}>${d.label}</text>`;
  });
  s += `<line x1="${padL}" y1="${H-padB}" x2="${W-padL}" y2="${H-padB}" stroke="#E6E5E3"/>`;
  return s+'</svg>';
}

function lineChart(data){
  const W=640,H=230,padL=8,padB=28,padT=24;
  const max = Math.max(...data.map(d=>d.value),1);
  const step = (W-padL*2-40)/(data.length-1);
  const pts = data.map((d,i)=>{
    const x = padL+20+i*step;
    const y = H-padB-(d.value/max)*(H-padB-padT);
    return {x,y,...d};
  });
  const path = pts.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ');
  const area = path + ` L${pts[pts.length-1].x} ${H-padB} L${pts[0].x} ${H-padB} Z`;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">`;
  s += `<path d="${area}" fill="#E5F2FC"></path>`;
  s += `<path d="${path}" fill="none" stroke="#2783DE" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"></path>`;
  pts.forEach((p,i)=>{
    const isLast = i===pts.length-1;
    s += `<circle cx="${p.x}" cy="${p.y}" r="${isLast?5:3.5}" fill="${isLast?'#2783DE':'#fff'}" stroke="#2783DE" stroke-width="2"></circle>`;
    if(p.value) s += `<text x="${p.x}" y="${p.y-10}" text-anchor="middle" font-size="11" fill="#7D7A75">${fmtCompact(p.value)}</text>`;
    s += `<text x="${p.x}" y="${H-8}" text-anchor="middle" font-size="11" fill="${isLast?'#2C2C2B':'#7D7A75'}" ${isLast?'font-weight="700"':''}>${p.label}</text>`;
  });
  s += `<line x1="${padL}" y1="${H-padB}" x2="${W-padL}" y2="${H-padB}" stroke="#E6E5E3"/>`;
  return s+'</svg>';
}

/* ================= Products ================= */
function renderCatChips(){
  const cats = ['all', ...new Set(state.products.map(p=>p.cat))];
  document.getElementById('catChips').innerHTML = cats.map(c=>
    `<button class="chip ${c===activeCat?'active':''}" onclick="setCat('${esc(c)}')">${c==='all'?'Tất cả':esc(c)}</button>`).join('');
}
function setCat(c){ activeCat=c; renderCatChips(); renderProducts(); }

function renderProducts(){
  renderCatChips();
  const q = (document.getElementById('productSearch').value||'').toLowerCase().trim();
  const list = state.products.filter(p=>
    (activeCat==='all' || p.cat===activeCat) && (!q || p.name.toLowerCase().includes(q)));
  document.getElementById('productCount').textContent =
    `${state.products.length} mặt hàng · ${new Set(state.products.map(p=>p.cat)).size} chủng loại`;
  const tb = document.querySelector('#productTable tbody');
  if(!list.length){ tb.innerHTML = `<tr><td colspan="6"><div class="empty">Không tìm thấy mặt hàng phù hợp</div></td></tr>`; return; }
  tb.innerHTML = list.map(p=>`
    <tr>
      <td><strong>${esc(p.name)}</strong></td>
      <td><span class="cat-tag">${esc(p.cat)}</span></td>
      <td>${esc(p.unit)}</td>
      <td class="num">
        <span class="price-now">${fmt(p.price)}</span>
        ${p.oldPrice ? `<span class="price-old">${fmt(p.oldPrice)}</span>` : ''}
      </td>
      <td class="num ${p.stock<=50?'stock-low':''}">${fmtQty(p.stock)}</td>
      <td class="num requires-edit" style="white-space:nowrap">
        <button class="btn small" onclick="openPriceModal('${p.id}')">Cập nhật giá</button>
        <button class="btn small" onclick="quickSell('${p.id}')">Bán</button>
      </td>
    </tr>`).join('');
}

/* ---- Price update ---- */
function openPriceModal(id){
  editingId = id;
  const p = state.products.find(p=>p.id===id);
  document.getElementById('priceModalName').textContent = p.name + ' (' + p.unit + ')';
  document.getElementById('priceModalCurrent').textContent = fmt(p.price);
  document.getElementById('newPriceInput').value = '';
  document.getElementById('priceModal').classList.add('open');
  setTimeout(()=>document.getElementById('newPriceInput').focus(),50);
}
async function savePrice(){
  const v = parseFloat(document.getElementById('newPriceInput').value);
  if(!(v>=0)) { alert('Vui lòng nhập giá mới hợp lệ'); return; }
  await api(`/api/products/${editingId}/price`, { method:'POST', body:{ price: v } });
  closeModal('priceModal');
  await loadAll();
}

/* ---- Add product ---- */
function openAddProduct(){
  document.getElementById('npCat').innerHTML =
    [...new Set(state.products.map(p=>p.cat))].map(c=>`<option>${esc(c)}</option>`).join('');
  document.getElementById('addModal').classList.add('open');
}
async function saveNewProduct(){
  const name = document.getElementById('npName').value.trim();
  const price = parseFloat(document.getElementById('npPrice').value);
  if(!name || !(price>0)){ alert('Vui lòng nhập tên và giá bán hợp lệ'); return; }
  await api('/api/products', { method:'POST', body:{
    name, cat: document.getElementById('npCat').value,
    unit: document.getElementById('npUnit').value,
    price, stock: parseFloat(document.getElementById('npStock').value)||0,
  }});
  closeModal('addModal');
  document.getElementById('npName').value=''; document.getElementById('npPrice').value='';
  await loadAll();
}

function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-bg').forEach(m=>m.addEventListener('click', e=>{ if(e.target===m) m.classList.remove('open'); }));

/* ================= Sales ================= */
function fillSaleProducts(){
  const byCat = {};
  state.products.forEach(p=>{ (byCat[p.cat]=byCat[p.cat]||[]).push(p); });
  document.getElementById('saleProduct').innerHTML = Object.entries(byCat).map(([c,ps])=>
    `<optgroup label="${esc(c)}">` + ps.map(p=>`<option value="${p.id}">${esc(p.name)} — ${fmt(p.price)}/${esc(p.unit)}</option>`).join('') + `</optgroup>`).join('');
  onSaleProductChange();
}
function onSaleProductChange(){
  const p = state.products.find(p=>p.id===document.getElementById('saleProduct').value);
  if(!p) return;
  document.getElementById('saleUnit').textContent = '(' + p.unit + ')';
  document.getElementById('salePrice').value = p.price;
}
function addSaleItem(){
  const p = state.products.find(p=>p.id===document.getElementById('saleProduct').value);
  const qty = parseFloat(document.getElementById('saleQty').value);
  const price = parseFloat(document.getElementById('salePrice').value);
  if(!p || !(qty>0) || !(price>=0)){ alert('Vui lòng kiểm tra mặt hàng, số lượng và đơn giá'); return; }
  const ex = draft.find(i=>i.productId===p.id);
  if(ex){ ex.qty += qty; ex.price = price; }
  else draft.push({productId:p.id, name:p.name, unit:p.unit, qty, price});
  renderDraft();
}
function removeDraft(id){ draft = draft.filter(i=>i.productId!==id); renderDraft(); }
function renderDraft(){
  const has = draft.length>0;
  document.getElementById('saleDraftWrap').style.display = has?'':'none';
  document.getElementById('saleTotalWrap').style.display = has?'flex':'none';
  document.getElementById('saveSaleBtn').style.display = has?'':'none';
  document.getElementById('saleDraftBody').innerHTML = draft.map(i=>`
    <tr>
      <td>${esc(i.name)}</td>
      <td class="num">${fmtQty(i.qty)} ${esc(i.unit)}</td>
      <td class="num">${fmt(i.price)}</td>
      <td class="num"><strong>${fmt(i.qty*i.price)}</strong></td>
      <td class="num"><button class="btn small" onclick="removeDraft('${i.productId}')">✕</button></td>
    </tr>`).join('');
  document.getElementById('saleTotal').textContent = fmt(draft.reduce((s,i)=>s+i.qty*i.price,0));
}
async function saveSale(){
  if(!draft.length) return;
  await api('/api/sales', { method:'POST', body:{ items: draft.map(i=>({productId:i.productId, qty:i.qty, price:i.price})) } });
  draft = [];
  renderDraft();
  await loadAll();
  const msg = document.getElementById('saleSuccess');
  msg.style.display='block'; setTimeout(()=>msg.style.display='none', 3000);
}
function quickSell(id){
  goView('sales');
  document.getElementById('saleProduct').value = id;
  onSaleProductChange();
  document.getElementById('saleQty').focus();
}
function renderSales(){
  const list = [...state.sales].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,60);
  const tb = document.querySelector('#salesTable tbody');
  if(!list.length){ tb.innerHTML = `<tr><td colspan="4"><div class="empty">Chưa có đơn hàng nào</div></td></tr>`; return; }
  tb.innerHTML = list.map(s=>`
    <tr>
      <td style="white-space:nowrap">${fmtDateTime(s.date)}</td>
      <td>
        <details class="sale-detail">
          <summary>Xem ${s.items.length} mặt hàng ▸</summary>
          <div class="detail-items">
            ${s.items.map(i=>`<div>• ${esc(i.name)} — ${fmtQty(i.qty)} ${esc(i.unit)} × ${fmt(i.price)} = <strong>${fmt(i.qty*i.price)}</strong></div>`).join('')}
          </div>
        </details>
      </td>
      <td class="num">${s.items.length}</td>
      <td class="num"><strong>${fmt(s.total)}</strong></td>
    </tr>`).join('');
}

/* ================= Price history ================= */
function renderPriceHistory(){
  const tb = document.querySelector('#priceHistoryTable tbody');
  if(!state.priceHistory.length){ tb.innerHTML = `<tr><td colspan="5"><div class="empty">Chưa có lần cập nhật giá nào</div></td></tr>`; return; }
  tb.innerHTML = state.priceHistory.slice(0,80).map(h=>{
    const pct = h.oldPrice ? (h.newPrice-h.oldPrice)/h.oldPrice*100 : 0;
    const up = pct >= 0;
    return `<tr>
      <td style="white-space:nowrap">${fmtDate(h.date)}</td>
      <td><strong>${esc(h.name)}</strong></td>
      <td class="num"><span class="price-old" style="display:inline">${fmt(h.oldPrice)}</span></td>
      <td class="num"><span class="price-now">${fmt(h.newPrice)}</span></td>
      <td class="num"><span class="badge ${up?'up':'down'}">${up?'+':''}${pct.toFixed(1)}%</span></td>
    </tr>`;
  }).join('');
}

/* ================= Users (admin) ================= */
async function renderUsers(){
  if(state.user.role!=='admin') return;
  const users = await api('/api/users');
  const tb = document.querySelector('#usersTable tbody');
  tb.innerHTML = users.map(u=>`
    <tr>
      <td><strong>${esc(u.username)}</strong></td>
      <td>${esc(u.name)}</td>
      <td>
        <select style="width:auto; min-height:32px; padding:4px 8px" onchange="changeRole('${u.id}', this.value)" ${u.id===state.user.id?'disabled':''}>
          <option value="viewer" ${u.role==='viewer'?'selected':''}>Chỉ xem</option>
          <option value="editor" ${u.role==='editor'?'selected':''}>Chỉnh sửa</option>
          <option value="admin" ${u.role==='admin'?'selected':''}>Quản trị</option>
        </select>
      </td>
    </tr>`).join('');
}
async function addUser(){
  const username = document.getElementById('auUser').value.trim();
  const name = document.getElementById('auName').value.trim();
  const password = document.getElementById('auPass').value;
  const role = document.getElementById('auRole').value;
  if(!username || !password){ alert('Vui lòng nhập tên đăng nhập và mật khẩu'); return; }
  await api('/api/users', { method:'POST', body:{ username, name, password, role } });
  document.getElementById('auUser').value=''; document.getElementById('auName').value=''; document.getElementById('auPass').value='';
  await renderUsers();
}
async function changeRole(id, role){
  await api(`/api/users/${id}/role`, { method:'POST', body:{ role } });
  await renderUsers();
}

/* ================= Reset (admin) ================= */
document.getElementById('resetBtn').addEventListener('click', async ()=>{
  if(!confirm('Xóa toàn bộ dữ liệu hiện tại và khôi phục dữ liệu mẫu?')) return;
  await api('/api/reset', { method:'POST' });
  draft = [];
  renderDraft();
  await loadAll();
});

/* ================= Init ================= */
function renderAll(){
  renderDashboard(); renderProducts(); fillSaleProducts(); renderSales(); renderPriceHistory();
}
(async function init(){
  if(token){
    try { await enterApp(); return; } catch(e) { /* token hết hạn → hiện login */ }
  }
  document.getElementById('loginScreen').classList.remove('hidden');
})();
