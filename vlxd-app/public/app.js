/* VLXD Manager — Frontend (giao tiếp backend qua REST API) */
let state = { products: [], sales: [], priceHistory: [], stockIn: [], customerPayments: [], users: [], user: null };
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
  state.products = data.products || [];
  state.sales = data.sales || [];
  state.priceHistory = data.priceHistory || [];
  state.stockIn = data.stockIn || [];
  state.customerPayments = data.customerPayments || [];
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

  let wRev=0, wPrevRev=0, mRev=0, mPrevRev=0, mOrders=0, mQty=0, mCost=0;
  state.sales.forEach(s=>{
    const d = new Date(s.date);
    if(d >= thisMon) wRev += s.total;
    else if(d >= lastMon) wPrevRev += s.total;
    const mk = monthKey(d);
    if(mk === mNow){
      mRev += s.total;
      mOrders++;
      s.items.forEach(i=>{
        mQty += i.qty;
        const p = state.products.find(prod => prod.id === i.productId);
        const itemCost = i.costPrice || (p ? p.costPrice : 0) || (i.price * 0.8);
        mCost += i.qty * itemCost;
      });
    }
    else if(mk === mPrev) mPrevRev += s.total;
  });
  const dW = wPrevRev ? (wRev-wPrevRev)/wPrevRev*100 : null;
  const dM = mPrevRev ? (mRev-mPrevRev)/mPrevRev*100 : null;
  const mGrossProfit = mRev - mCost;
  const delta = v => v==null ? '<span class="muted">—</span>'
    : `<span class="${v>=0?'up':'down'}">${v>=0?'▲':'▼'} ${Math.abs(v).toFixed(1)}% so kỳ trước</span>`;

  document.getElementById('kpiRow').innerHTML = `
    <div class="card"><div class="kpi-label">Doanh thu tháng này</div><div class="kpi-value">${fmt(mRev)}</div><div class="kpi-delta">${delta(dM)}</div></div>
    <div class="card"><div class="kpi-label">Lãi gộp ước tính</div><div class="kpi-value" style="color:#2e7d32">${fmt(mGrossProfit)}</div><div class="kpi-delta muted">Doanh thu - Giá vốn</div></div>
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
  if(!list.length){ tb.innerHTML = `<tr><td colspan="5"><div class="empty">Chưa có đơn hàng nào</div></td></tr>`; return; }
  tb.innerHTML = list.map(s=>`
    <tr>
      <td style="white-space:nowrap">${fmtDateTime(s.date)}</td>
      <td>
        <details class="sale-detail">
          <summary>Xem ${s.items.length} mặt hàng ▸ (${esc(s.customerName || 'Khách lẻ')})</summary>
          <div class="detail-items">
            ${s.items.map(i=>`<div>• ${esc(i.name)} — ${fmtQty(i.qty)} ${esc(i.unit)} × ${fmt(i.price)} = <strong>${fmt(i.qty*i.price)}</strong></div>`).join('')}
          </div>
        </details>
      </td>
      <td class="num">${s.items.length}</td>
      <td class="num"><strong>${fmt(s.total)}</strong></td>
      <td class="num" style="white-space:nowrap">
        <button class="btn small" onclick="printInvoice('${s.id}')">🖨 In A5</button>
      </td>
    </tr>`).join('');
}

/* ================= Task 8: In hóa đơn bán lẻ khổ A5 ================= */
function printInvoice(saleId) {
  const s = state.sales.find(order => order.id === saleId);
  if (!s) { alert('Không tìm thấy đơn hàng'); return; }

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  const itemsHtml = s.items.map((i, idx) => `
    <tr>
      <td style="border:1px solid #ddd; padding:6px; text-align:center">${idx + 1}</td>
      <td style="border:1px solid #ddd; padding:6px">${esc(i.name)}</td>
      <td style="border:1px solid #ddd; padding:6px; text-align:center">${esc(i.unit)}</td>
      <td style="border:1px solid #ddd; padding:6px; text-align:right">${fmtQty(i.qty)}</td>
      <td style="border:1px solid #ddd; padding:6px; text-align:right">${fmt(i.price)}</td>
      <td style="border:1px solid #ddd; padding:6px; text-align:right">${fmt(i.qty * i.price)}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Hóa đơn bán lẻ - ${esc(s.code || 'VLXD')}</title>
      <style>
        @page { size: A5 landscape; margin: 10mm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #333; margin: 0; padding: 10px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 12px; }
        .header h2 { margin: 0; font-size: 18px; text-transform: uppercase; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background: #f4f4f4; border: 1px solid #ddd; padding: 6px; }
        .total-row { text-align: right; font-size: 14px; font-weight: bold; margin-top: 10px; }
        .footer { margin-top: 30px; display: flex; justify-content: space-between; text-align: center; }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="header">
        <h2>CỬA HÀNG VẬT LIỆU XÂY DỰNG</h2>
        <div>HÓA ĐƠN BÁN LẺ</div>
      </div>
      <div class="meta">
        <div><strong>Mã đơn:</strong> ${esc(s.code || 'DH')}</div>
        <div><strong>Khách hàng:</strong> ${esc(s.customerName || 'Khách lẻ')}</div>
        <div><strong>Ngày:</strong> ${fmtDateTime(s.date)}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>STT</th><th>Mặt hàng</th><th>ĐVT</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div class="total-row">Tổng cộng: ${fmt(s.total)}</div>
      <div class="total-row" style="font-size:12px; font-weight:normal; color:#555">Đã thanh toán: ${fmt(s.paidAmount || s.total)} | Còn nợ: ${fmt(s.debtAmount || 0)}</div>
      <div class="footer">
        <div>Người mua hàng<br><i>(Ký, họ tên)</i></div>
        <div>Người lập hóa đơn<br><i>(Ký, họ tên)</i></div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/* ================= Task 7: Xuất báo cáo Excel / CSV ================= */
function exportSalesReportCSV() {
  if (!state.sales.length) { alert('Không có dữ liệu đơn hàng để xuất báo cáo'); return; }

  let csvContent = '\uFEFFMã đơn,Ngày bán,Khách hàng,Tổng tiền,Đã trả,Còn nợ,Trạng thái\n';
  state.sales.forEach(s => {
    csvContent += `"${s.code || 'DH'}","${fmtDateTime(s.date)}","${s.customerName || 'Khách lẻ'}",${s.total},${s.paidAmount || s.total},${s.debtAmount || 0},"${s.paymentStatus}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Bao_cao_doanh_thu_VLXD_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
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

/* ================= Task 3: Stock-In (Nhập hàng) ================= */
function fillStockInProducts() {
  const byCat = {};
  state.products.forEach(p => { (byCat[p.cat] = byCat[p.cat] || []).push(p); });
  const select = document.getElementById('stProduct');
  if (!select) return;
  select.innerHTML = Object.entries(byCat).map(([c, ps]) =>
    `<optgroup label="${esc(c)}">` + ps.map(p => `<option value="${p.id}">${esc(p.name)} — Tồn: ${fmtQty(p.stock)} ${esc(p.unit)}</option>`).join('') + `</optgroup>`).join('');
  onStockInProductChange();
}

function onStockInProductChange() {
  const p = state.products.find(p => p.id === document.getElementById('stProduct').value);
  if (!p) return;
  document.getElementById('stUnit').textContent = '(' + p.unit + ')';
  document.getElementById('stCostPrice').value = p.costPrice || Math.round(p.price * 0.8);
}

async function saveStockIn() {
  const productId = document.getElementById('stProduct').value;
  const supplierName = document.getElementById('stSupplier').value.trim();
  const qty = parseFloat(document.getElementById('stQty').value);
  const costPrice = parseFloat(document.getElementById('stCostPrice').value);

  if (!productId || !(qty > 0) || !(costPrice >= 0)) {
    alert('Vui lòng kiểm tra lại thông tin nhập hàng');
    return;
  }

  await api('/api/stock-in', {
    method: 'POST',
    body: { productId, supplierName, qty, costPrice }
  });

  const msg = document.getElementById('stockInSuccess');
  msg.style.display = 'block';
  setTimeout(() => msg.style.display = 'none', 3000);

  await loadAll();
}

function renderStockIn() {
  const tb = document.querySelector('#stockInTable tbody');
  if (!tb) return;
  if (!state.stockIn.length) {
    tb.innerHTML = `<tr><td colspan="7"><div class="empty">Chưa có phiếu nhập hàng nào</div></td></tr>`;
    return;
  }
  tb.innerHTML = state.stockIn.map(s => {
    const item = (s.items && s.items[0]) || {};
    return `<tr>
      <td><strong>${esc(s.code || 'PN')}</strong></td>
      <td style="white-space:nowrap">${fmtDateTime(s.date)}</td>
      <td>${esc(s.supplierName || 'Nhà cung cấp')}</td>
      <td>${esc(item.name || 'Mặt hàng')}</td>
      <td class="num">${fmtQty(item.qty || 0)} ${esc(item.unit || '')}</td>
      <td class="num">${fmt(item.costPrice || 0)}</td>
      <td class="num"><strong>${fmt(s.total)}</strong></td>
    </tr>`;
  }).join('');
}

/* ================= Task 2: Customer Debts (Công nợ) ================= */
function renderDebts() {
  let totalDebt = 0;
  let paidMonth = 0;
  const debtors = new Set();
  const now = new Date();
  const mNow = monthKey(now);

  state.sales.forEach(s => {
    if (s.debtAmount > 0) {
      totalDebt += s.debtAmount;
      debtors.add(s.customerName || 'Khách lẻ');
    }
  });

  state.customerPayments.forEach(p => {
    if (monthKey(new Date(p.date)) === mNow) {
      paidMonth += p.amountPaid;
    }
  });

  document.getElementById('kpiTotalDebt').textContent = fmt(totalDebt);
  document.getElementById('kpiPaidDebt').textContent = fmt(paidMonth);
  document.getElementById('kpiDebtCustomerCount').textContent = debtors.size;

  const tb = document.querySelector('#debtsTable tbody');
  if (!tb) return;
  if (!state.sales.length) {
    tb.innerHTML = `<tr><td colspan="7"><div class="empty">Chưa có đơn hàng công nợ</div></td></tr>`;
    return;
  }

  tb.innerHTML = state.sales.slice(0, 50).map(s => {
    const stLabel = s.paymentStatus === 'paid' ? '<span class="badge success">Đã trả</span>' :
      s.paymentStatus === 'partial' ? '<span class="badge warning">Trả 1 phần</span>' :
        '<span class="badge danger">Ghi nợ</span>';
    return `<tr>
      <td><strong>${esc(s.code || 'DH')}</strong></td>
      <td>${esc(s.customerName || 'Khách lẻ')}</td>
      <td>${esc(s.customerPhone || '—')}</td>
      <td>${stLabel}</td>
      <td class="num">${fmt(s.total)}</td>
      <td class="num">${fmt(s.paidAmount || s.total)}</td>
      <td class="num danger"><strong>${fmt(s.debtAmount || 0)}</strong></td>
    </tr>`;
  }).join('');
}

async function saveCustomerPayment() {
  const customerName = document.getElementById('payCustomer').value.trim();
  const customerPhone = document.getElementById('payPhone').value.trim();
  const amountPaid = parseFloat(document.getElementById('payAmount').value);
  const notes = document.getElementById('payNotes').value.trim();

  if (!customerName || !(amountPaid > 0)) {
    alert('Vui lòng nhập tên khách hàng và số tiền thu nợ hợp lệ');
    return;
  }

  await api('/api/payments', {
    method: 'POST',
    body: { customerName, customerPhone, amountPaid, notes }
  });

  document.getElementById('payAmount').value = '';
  document.getElementById('payNotes').value = '';
  const msg = document.getElementById('debtPaymentSuccess');
  msg.style.display = 'block';
  setTimeout(() => msg.style.display = 'none', 3000);

  await loadAll();
}

/* ================= Task 4: Supabase Integration ================= */
async function checkSupabaseStatus() {
  try {
    const status = await api('/api/supabase/status');
    const badge = document.getElementById('spStatusBadge');
    if (badge) {
      badge.textContent = status.configured ? `✓ Đã kết nối Supabase (${status.url})` : 'Trạng thái: Chưa cấu hình';
      badge.style.color = status.configured ? '#2e7d32' : '#666';
    }
  } catch (e) {}
}

async function saveSupabaseConfig() {
  const url = document.getElementById('spUrl').value.trim();
  const key = document.getElementById('spKey').value.trim();
  if (!url || !key) {
    alert('Vui lòng điền đủ Supabase Project URL và API Key');
    return;
  }
  await api('/api/supabase/config', { method: 'POST', body: { url, key } });
  alert('Đã lưu cấu hình Supabase thành công!');
  await checkSupabaseStatus();
}

async function runSupabaseMigrate() {
  const msg = document.getElementById('migrateMsg');
  msg.textContent = 'Đang đồng bộ dữ liệu lên Supabase…';
  msg.style.color = '#1976d2';
  try {
    const res = await api('/api/supabase/migrate', { method: 'POST' });
    msg.textContent = `✓ Migrate thành công! ${res.details.products} sản phẩm, ${res.details.sales} đơn hàng.`;
    msg.style.color = '#2e7d32';
  } catch (err) {
    msg.textContent = '❌ Lỗi migrate: ' + err.message;
    msg.style.color = '#d32f2f';
  }
}

/* ================= User Management ================= */
let userRoleFilter = 'all';
let targetResetUserId = null;

function showUserAlert(msg, isError = false) {
  const alertEl = document.getElementById('userActionAlert');
  if (!alertEl) return;
  alertEl.textContent = msg;
  alertEl.style.display = 'block';
  alertEl.style.backgroundColor = isError ? 'var(--redSoft)' : 'var(--greenSoft)';
  alertEl.style.color = isError ? 'var(--red)' : 'var(--green)';
  setTimeout(() => {
    alertEl.style.display = 'none';
  }, 3500);
}

async function renderUsers() {
  if (!state.user || state.user.role !== 'admin') return;
  try {
    const users = await api('/api/users');
    state.users = users || [];

    const total = state.users.length;
    const admins = state.users.filter(u => u.role === 'admin').length;
    const editors = state.users.filter(u => u.role === 'editor').length;
    const viewers = state.users.filter(u => u.role === 'viewer').length;

    const elTotal = document.getElementById('kpiTotalUsers');
    const elAdmins = document.getElementById('kpiAdminUsers');
    const elEditors = document.getElementById('kpiEditorUsers');
    const elViewers = document.getElementById('kpiViewerUsers');

    if (elTotal) elTotal.textContent = total;
    if (elAdmins) elAdmins.textContent = admins;
    if (elEditors) elEditors.textContent = editors;
    if (elViewers) elViewers.textContent = viewers;

    const cAll = document.getElementById('countAllUsers');
    const cAdm = document.getElementById('countAdminUsers');
    const cEdt = document.getElementById('countEditorUsers');
    const cVw = document.getElementById('countViewerUsers');

    if (cAll) cAll.textContent = total;
    if (cAdm) cAdm.textContent = admins;
    if (cEdt) cEdt.textContent = editors;
    if (cVw) cVw.textContent = viewers;

    filterUsers();
  } catch (err) {
    console.error('Không thể tải danh sách người dùng:', err);
  }
}

function filterUserRole(role) {
  userRoleFilter = role;
  document.querySelectorAll('#userRoleChips .chip').forEach(c => {
    c.classList.toggle('active', c.dataset.role === role);
  });
  filterUsers();
}

function filterUsers() {
  const searchInput = document.getElementById('searchUser');
  const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const tb = document.querySelector('#usersTable tbody');
  if (!tb) return;

  const filtered = (state.users || []).filter(u => {
    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchQuery = !q ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.name && u.name.toLowerCase().includes(q));
    return matchRole && matchQuery;
  });

  if (!filtered.length) {
    tb.innerHTML = `<tr><td colspan="5"><div class="empty">Không tìm thấy người dùng phù hợp</div></td></tr>`;
    return;
  }

  tb.innerHTML = filtered.map(u => {
    const isSelf = state.user && state.user.name === u.name;
    const roleBadgeClass = u.role === 'admin' ? 'role-admin' : (u.role === 'editor' ? 'role-editor' : 'role-viewer');

    return `
      <tr>
        <td>
          <strong>${esc(u.username)}</strong>
          ${isSelf ? '<span class="cat-tag" style="margin-left:6px; font-size:11px">Bạn</span>' : ''}
        </td>
        <td>${esc(u.name || '—')}</td>
        <td><span class="badge role ${roleBadgeClass}">${esc(u.roleLabel || u.role)}</span></td>
        <td>
          <select class="user-role-select" onchange="changeUserRole('${u.id}', this.value)" ${isSelf ? 'disabled title="Không thể tự đổi quyền của mình"' : ''}>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Quản trị (Admin)</option>
            <option value="editor" ${u.role === 'editor' ? 'selected' : ''}>Chỉnh sửa (Editor)</option>
            <option value="viewer" ${u.role === 'viewer' ? 'selected' : ''}>Chỉ xem (Viewer)</option>
          </select>
        </td>
        <td style="text-align:right; white-space:nowrap">
          <button class="btn small" onclick="openResetPasswordModal('${u.id}', '${esc(u.username)}')">Đổi MK</button>
          <button class="btn small danger" onclick="deleteUser('${u.id}', '${esc(u.username)}')" ${isSelf ? 'disabled style="opacity:0.4; cursor:not-allowed"' : ''}>Xóa</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddUserModal() {
  const err = document.getElementById('addUserError');
  if (err) {
    err.textContent = '';
    err.classList.remove('show');
  }
  document.getElementById('nuUsername').value = '';
  document.getElementById('nuName').value = '';
  document.getElementById('nuPassword').value = '';
  document.getElementById('nuRole').value = 'editor';

  document.getElementById('addUserModal').classList.add('open');
  setTimeout(() => document.getElementById('nuUsername').focus(), 50);
}

async function saveNewUser() {
  const err = document.getElementById('addUserError');
  err.classList.remove('show');

  const username = document.getElementById('nuUsername').value.trim();
  const name = document.getElementById('nuName').value.trim();
  const password = document.getElementById('nuPassword').value;
  const role = document.getElementById('nuRole').value;

  if (!username || username.length < 3) {
    err.textContent = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    err.classList.add('show');
    return;
  }
  if (!name) {
    err.textContent = 'Vui lòng nhập họ và tên';
    err.classList.add('show');
    return;
  }
  if (!password || password.length < 6) {
    err.textContent = 'Mật khẩu phải có ít nhất 6 ký tự';
    err.classList.add('show');
    return;
  }

  try {
    await api('/api/users', {
      method: 'POST',
      body: { username, name, password, role }
    });
    closeModal('addUserModal');
    showUserAlert(`✓ Đã tạo thành công tài khoản "${username}"`);
    await renderUsers();
  } catch (ex) {
    err.textContent = ex.message || 'Không thể tạo người dùng';
    err.classList.add('show');
  }
}

async function changeUserRole(userId, newRole) {
  try {
    await api(`/api/users/${userId}/role`, {
      method: 'POST',
      body: { role: newRole }
    });
    showUserAlert('✓ Đã cập nhật quyền hạn người dùng thành công');
    await renderUsers();
  } catch (ex) {
    await renderUsers();
  }
}

function openResetPasswordModal(userId, username) {
  targetResetUserId = userId;
  const userLabel = document.getElementById('resetPasswordUsername');
  if (userLabel) userLabel.textContent = `Tài khoản: ${username}`;

  const err = document.getElementById('resetPasswordError');
  if (err) {
    err.textContent = '';
    err.classList.remove('show');
  }

  document.getElementById('newPasswordInput').value = '';
  document.getElementById('resetPasswordModal').classList.add('open');
  setTimeout(() => document.getElementById('newPasswordInput').focus(), 50);
}

async function saveNewPassword() {
  const err = document.getElementById('resetPasswordError');
  err.classList.remove('show');

  const password = document.getElementById('newPasswordInput').value;
  if (!password || password.length < 6) {
    err.textContent = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    err.classList.add('show');
    return;
  }

  try {
    await api(`/api/users/${targetResetUserId}/password`, {
      method: 'POST',
      body: { password }
    });
    closeModal('resetPasswordModal');
    showUserAlert('✓ Đã đổi mật khẩu thành công');
  } catch (ex) {
    err.textContent = ex.message || 'Không thể đổi mật khẩu';
    err.classList.add('show');
  }
}

async function deleteUser(userId, username) {
  if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}" không?\nThao tác này không thể hoàn tác.`)) {
    return;
  }

  try {
    await api(`/api/users/${userId}`, { method: 'DELETE' });
    showUserAlert(`✓ Đã xóa tài khoản "${username}" thành công`);
    await renderUsers();
  } catch (ex) {}
}

/* ================= Init & Render ================= */
function renderAll() {
  renderDashboard();
  renderProducts();
  fillSaleProducts();
  renderSales();
  renderPriceHistory();
  fillStockInProducts();
  renderStockIn();
  renderDebts();
  checkSupabaseStatus();
  if (state.user && state.user.role === 'admin') {
    renderUsers();
  }
}

(async function init() {
  if (token) {
    try { await enterApp(); return; } catch (e) { /* token hết hạn → hiện login */ }
  }
  document.getElementById('loginScreen').classList.remove('hidden');
})();

