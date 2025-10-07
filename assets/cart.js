/** assets/cart.js — PixelDew Cart + Checkout Popup (Digital-only, full) **/
(function () {
  const STORAGE_KEY = "pixdew_cart_v1";
  const ORDERS_KEY  = "pixdew_orders";
  const LAST_ORDER_KEY = "pixdew_last_order";

  const CURRENCY = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

  // Katalog contoh (samakan id/price dengan kartu produk)
  window.PIXEL_PRODUCTS = window.PIXEL_PRODUCTS || [
    { id: 1, name: "Template Website Modern",     price: 299000, cat: "Template", emoji: "🎨" },
    { id: 2, name: "Plugin SEO Pro",              price: 199000, cat: "Plugin",   emoji: "🔧" },
    { id: 3, name: "E-Book Digital Marketing",    price: 149000, cat: "E-Book",   emoji: "📚" },
    { id: 4, name: "Icon Pack Premium",           price:  99000, cat: "Assets",   emoji: "🎯" },
  ];

  /* ========== helpers ========== */
  const read = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } };
  const write = (cart) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); updateBadge(); renderCart(); };
  const findProduct = (id) => window.PIXEL_PRODUCTS.find((p) => p.id === id);
  const now = () => new Date().toISOString();
  const addHours = (date, h) => new Date(new Date(date).getTime() + h*3600e3).toISOString();

  function readOrders(){ try{ return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; }catch{ return []; } }
  function writeOrders(list){ localStorage.setItem(ORDERS_KEY, JSON.stringify(list)); }
  function saveLastOrder(o){ localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(o)); }

  function genInvoiceNo(){
    const d = new Date();
    const pad = n => String(n).padStart(2,"0");
    const y = d.getFullYear(), m=pad(d.getMonth()+1), day=pad(d.getDate());
    const rnd = Math.floor(Math.random()*9000)+1000;
    return `PD-${y}${m}${day}-${rnd}`;
  }

  function sameSet(a, b){
    if(a.length !== b.length) return false;
    const as = [...new Set(a)].sort(), bs = [...new Set(b)].sort();
    return as.every((v,i)=> v===bs[i]);
  }

  function antiDoublePurchase(email, itemIds){
    // Cek order dengan email & set item sama dalam 24 jam
    const orders = readOrders();
    const cutoff = new Date(Date.now() - 24*3600e3);
    const recent = orders.filter(o => o.email === email && new Date(o.timestamp) >= cutoff);
    return recent.some(o => sameSet(o.items.map(i=>i.id), itemIds));
  }

  /* ========== Cart API ========== */
  window.Cart = {
    add(id){ const c=read(); const i=c.findIndex(x=>x.id===id); if(i>-1) c[i].qty+=1; else c.push({id,qty:1}); write(c); toast("Ditambahkan ke keranjang"); },
    remove(id){ write(read().filter(i=>i.id!==id)); },
    update(id,delta){ const c=read(); const it=c.find(i=>i.id===id); if(!it) return; it.qty+=delta; if(it.qty<=0){ this.remove(id); return; } write(c); },
    clear(){ write([]); },
    items(){ return read().map(i=>({...i, product: findProduct(i.id)})); },
    subtotal(){ return this.items().reduce((s,i)=> s + (i.product?.price||0)*i.qty, 0); }
  };

  /* ========== Header badge ========== */
  function updateBadge(){
    const el=document.getElementById('cart-count'); if(!el) return;
    const count=read().reduce((s,i)=>s+i.qty,0);
    el.textContent=count;
    el.classList.toggle('hidden', count===0);
  }

  /* ========== Cart modal ========== */
  function ensureCartModal(){
    if(document.getElementById('cart-modal')) return;
    const modal=document.createElement('div');
    modal.id='cart-modal'; modal.className='fixed inset-0 bg-black/50 hidden z-50';
    modal.innerHTML = `
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-2xl font-bold text-ink">Keranjang</h3>
            <button class="text-gray-500 hover:text-ink" id="cart-close" aria-label="Tutup">✕</button>
          </div>
          <div id="cart-items" class="space-y-3"></div>
          <div class="border-t pt-4 mt-4">
            <div class="flex justify-between items-center">
              <span class="font-semibold">Subtotal</span>
              <span class="text-xl font-bold text-brand" id="cart-total">Rp 0</span>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <button id="cart-clear" class="border border-brand text-brand rounded-lg py-3 hover:bg-brand/5">Kosongkan</button>
              <button id="cart-checkout" class="bg-brand hover:bg-brand-dark text-white rounded-lg py-3">Checkout</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e)=>{ if(e.target.id==='cart-modal') hideCart(); });
    document.getElementById('cart-close').onclick = hideCart;
    document.getElementById('cart-clear').onclick = ()=>{ Cart.clear(); };
    document.getElementById('cart-checkout').onclick = ()=>{
      if (Cart.items().length === 0) { toast('Keranjang kosong'); return; }
      hideCart(); showCheckout();
    };
  }

  function renderCart(){
    const wrap=document.getElementById('cart-items'); const totalEl=document.getElementById('cart-total');
    if(!wrap||!totalEl) return;
    const items=Cart.items();
    if(items.length===0){
      wrap.innerHTML = '<div class="text-center text-gray-500 py-10"><div class="text-5xl mb-2">🛒</div>Keranjang masih kosong</div>';
      totalEl.textContent = CURRENCY.format(0);
      return;
    }
    wrap.innerHTML = items.map(({id,qty,product:p})=>`
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 brand-gradient rounded-lg grid place-items-center text-white text-xl">${p.emoji}</div>
          <div>
            <div class="font-semibold text-ink">${p.name}</div>
            <div class="text-sm text-gray-600">${CURRENCY.format(p.price)} × ${qty}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="w-8 h-8 bg-gray-200 rounded-full" onclick="Cart.update(${id},-1)">−</button>
          <span class="w-8 text-center font-semibold">${qty}</span>
          <button class="w-8 h-8 bg-brand text-white rounded-full" onclick="Cart.update(${id},1)">+</button>
          <button class="ml-1 text-red-500" onclick="Cart.remove(${id})">🗑️</button>
        </div>
      </div>`).join('');
    totalEl.textContent = CURRENCY.format(Cart.subtotal());
    updateBadge();
  }

  const showCart = () => { ensureCartModal(); document.getElementById('cart-modal').classList.remove('hidden'); renderCart(); };
  const hideCart = () => { const m=document.getElementById('cart-modal'); if(m) m.classList.add('hidden'); };
  window.addToCart = function(id){ Cart.add(id); };

  /* ========== Checkout modal (digital only) ========== */
  function ensureCheckoutModal(){
    if(document.getElementById('checkout-modal')) return;
    const modal=document.createElement('div');
    modal.id='checkout-modal'; modal.className='fixed inset-0 bg-black/50 hidden z-50';
    modal.innerHTML = `
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-2xl font-bold text-ink">Checkout (Produk Digital)</h3>
            <button class="text-gray-500 hover:text-ink" id="checkout-close" aria-label="Tutup">✕</button>
          </div>

          <div class="grid lg:grid-cols-2 gap-6">
            <!-- LEFT: form contact -->
            <section class="p-5 rounded-xl border">
              <h4 class="font-semibold mb-3">Detail Penerima</h4>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium mb-1">Email <span class="text-red-500">*</span></label>
                  <input id="co-email" type="email" class="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand" placeholder="email@domain.com" required>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Konfirmasi Email <span class="text-red-500">*</span></label>
                  <input id="co-email2" type="email" class="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand" placeholder="ulang email" required>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Nama (opsional)</label>
                  <input id="co-name" class="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand" placeholder="Nama Anda">
                </div>
                <label class="flex items-start gap-3 text-sm">
                  <input id="co-agree" type="checkbox" class="mt-1 accent-brand">
                  <span>Saya telah membaca & menyetujui <a href="./terms.html" class="text-brand underline">Syarat & Ketentuan</a> serta <a href="./refund.html" class="text-brand underline">Kebijakan Refund</a>.</span>
                </label>
                <label class="flex items-center gap-3 text-sm">
                  <input id="co-news" type="checkbox" class="accent-brand">
                  <span>Berlangganan update produk & promo (opsional)</span>
                </label>
              </div>
            </section>

            <!-- RIGHT: summary -->
            <aside class="p-5 rounded-xl border">
              <h4 class="font-semibold mb-3">Ringkasan</h4>
              <div id="co-items" class="space-y-2"></div>
              <div class="border-t my-3"></div>
              <div class="flex justify-between text-sm"><span>Subtotal</span><span id="co-subtotal">Rp 0</span></div>
              <div class="flex justify-between text-sm"><span>Diskon</span><span id="co-discount">Rp 0</span></div>
              <div class="border-t my-3"></div>
              <div class="flex justify-between text-lg font-bold"><span>Total</span><span id="co-total">Rp 0</span></div>

              <div class="mt-4 flex gap-2">
                <input id="co-promo" class="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand" placeholder="Kode promo (PIXEL10/PIXEL25)">
                <button id="co-apply" class="px-4 rounded-lg bg-brand hover:bg-brand-dark text-white">Terapkan</button>
              </div>

              <h4 class="font-semibold mt-5 mb-2">Metode Pembayaran</h4>
              <div class="grid grid-cols-2 gap-2">
                <label class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer"><input type="radio" name="pay" value="va" class="accent-brand" checked><span>Virtual Account</span></label>
                <label class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer"><input type="radio" name="pay" value="ewallet" class="accent-brand"><span>E-Wallet</span></label>
                <label class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer"><input type="radio" name="pay" value="cc" class="accent-brand"><span>Kartu Kredit</span></label>
                <label class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer"><input type="radio" name="pay" value="bank" class="accent-brand"><span>Transfer Manual</span></label>
              </div>

              <button id="co-pay" class="w-full mt-4 bg-brand hover:bg-brand-dark text-white rounded-lg py-3">Bayar Sekarang</button>
              <p class="text-xs text-gray-500 mt-2">File digital & lisensi akan dikirim ke email.</p>
            </aside>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById('checkout-close').onclick = hideCheckout;
    modal.addEventListener('click', (e)=>{ if(e.target.id==='checkout-modal') hideCheckout(); });

    // Promo
    document.getElementById('co-apply').addEventListener('click', (e)=>{
      e.preventDefault();
      const code = (document.getElementById('co-promo').value || '').trim().toUpperCase();
      discount = code==='PIXEL10' ? 10000 : code==='PIXEL25' ? 25000 : 0;
      renderCheckout(); toast(discount ? 'Kode promo diterapkan' : 'Kode tidak valid');
    });

    // Pay
    document.getElementById('co-pay').addEventListener('click', ()=>{
      const email  = (document.getElementById('co-email').value || '').trim();
      const email2 = (document.getElementById('co-email2').value || '').trim();
      const name   = (document.getElementById('co-name').value || '').trim();
      const agree  = document.getElementById('co-agree').checked;
      const news   = document.getElementById('co-news').checked;

      if(!validateEmail(email)){ toast('Masukkan email yang valid'); return; }
      if(email !== email2){ toast('Konfirmasi email tidak cocok'); return; }
      if(!agree){ toast('Centang persetujuan S&K & Refund terlebih dahulu'); return; }

      const items = Cart.items();
      const ids   = items.map(i=>i.id);

      // Anti double purchase 24 jam
      if(antiDoublePurchase(email, ids)){
        const ok = confirm("Email & item yang sama baru saja melakukan pembelian < 24 jam.\nTetap lanjutkan?");
        if(!ok) return;
      }

      // Build order object
      const invoiceNo = genInvoiceNo();
      const subtotal  = Cart.subtotal();
      const total     = Math.max(0, subtotal - discount);

      const order = {
        invoiceNo,
        email,
        name,
        newsletter: !!news,
        items: items.map(i=>({ id:i.id, name:i.product?.name, price:i.product?.price||0, qty:i.qty })),
        subtotal,
        discount,
        total,
        payment_method: (document.querySelector('input[name="pay"]:checked')?.value) || 'va',
        timestamp: now(),
        send_before: addHours(now(), 24) // contoh SLA pengiriman link
      };

      // persist order history + last order
      const history = readOrders();
      history.push(order);
      writeOrders(history);
      saveLastOrder(order);

      // reset & redirect
      Cart.clear();
      hideCheckout();
      toast('Pembayaran diproses...');
      setTimeout(()=>{ window.location.href = './order-success.html'; }, 700);
    });
  }

  let discount = 0;

  function renderCheckout(){
    const itemsWrap=document.getElementById('co-items');
    const subEl=document.getElementById('co-subtotal');
    const discEl=document.getElementById('co-discount');
    const totEl=document.getElementById('co-total');
    if(!itemsWrap||!subEl) return;

    const items=Cart.items();
    if(items.length===0){
      itemsWrap.innerHTML = '<div class="text-gray-500">Keranjang kosong.</div>';
      subEl.textContent = CURRENCY.format(0);
      discEl.textContent = '-' + CURRENCY.format(0);
      totEl.textContent = CURRENCY.format(0);
      return;
    }

    itemsWrap.innerHTML = items.map(({qty,product:p})=>`
      <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 brand-gradient rounded-lg grid place-items-center text-white text-xl">${p.emoji}</div>
          <div>
            <div class="font-semibold">${p.name}</div>
            <div class="text-sm text-gray-600">Qty ${qty}</div>
          </div>
        </div>
        <div class="font-semibold text-ink">${CURRENCY.format((p.price||0)*qty)}</div>
      </div>`).join('');

    const subtotal = Cart.subtotal();
    subEl.textContent = CURRENCY.format(subtotal);
    discEl.textContent = '-' + CURRENCY.format(discount);
    totEl.textContent = CURRENCY.format(Math.max(0, subtotal - discount));
  }

  const showCheckout = () => { ensureCheckoutModal(); document.getElementById('checkout-modal').classList.remove('hidden'); renderCheckout(); };
  const hideCheckout = () => { const m=document.getElementById('checkout-modal'); if(m) m.classList.add('hidden'); };

  /* ========== invoice HTML generator (dipakai di halaman sukses) ========== */
  window.PixeldewInvoice = {
    generateHTML(order){
      const rows = order.items.map(i=>`
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb">${i.name} × ${i.qty}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${CURRENCY.format((i.price||0)*i.qty)}</td>
        </tr>`).join("");
      return `<!doctype html><html><head>
        <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Invoice ${order.invoiceNo}</title>
        <style>
          body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;color:#111827}
          .brand{color:#16A34A}
          .box{max-width:720px;margin:32px auto;border:1px solid #e5e7eb;border-radius:12px;padding:24px}
          table{width:100%;border-collapse:collapse}
          h1{margin:0 0 4px 0}
          .muted{color:#6b7280}
          .total{font-weight:700}
        </style>
      </head><body>
        <div class="box">
          <h1>Invoice <span class="brand">${order.invoiceNo}</span></h1>
          <div class="muted" style="margin-bottom:16px">Tanggal: ${new Date(order.timestamp).toLocaleString('id-ID')}</div>
          <div style="margin-bottom:16px">
            <div>Kepada: <strong>${order.name || "-"}</strong></div>
            <div>Email: <strong>${order.email}</strong></div>
            <div>Metode Bayar: <strong>${order.payment_method.toUpperCase()}</strong></div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;background:#f9fafb">Item</th>
                <th style="text-align:right;padding:8px;border:1px solid #e5e7eb;background:#f9fafb">Jumlah</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr>
                <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">Subtotal</td>
                <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${CURRENCY.format(order.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">Diskon</td>
                <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">-${CURRENCY.format(order.discount||0)}</td>
              </tr>
              <tr>
                <td style="padding:8px;border:1px solid #e5e7eb;text-align:right" class="total">Total</td>
                <td style="padding:8px;border:1px solid #e5e7eb;text-align:right" class="total">${CURRENCY.format(order.total)}</td>
              </tr>
            </tfoot>
          </table>
          <p class="muted" style="margin-top:16px">Link download & lisensi akan dikirim ke email di atas. Estimasi terkirim sebelum: ${new Date(order.send_before).toLocaleString('id-ID')}</p>
          <p class="muted">Terima kasih telah berbelanja di <strong>PixelDew</strong>.</p>
        </div>
      </body></html>`;
    },
    download(order){
      const html = this.generateHTML(order);
      const blob = new Blob([html], {type:"text/html"});
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `Invoice-${order.invoiceNo}.html";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(a.href);
      a.remove();
    }
  };

  /* ========== utils ========== */
  function toast(msg){ const el=document.createElement('div'); el.className='fixed top-4 right-4 z-[60] bg-ink text-white px-4 py-3 rounded-lg shadow'; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .3s'; },1600); setTimeout(()=>{ el.remove(); },2000); }
  function validateEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  /* ========== boot ========== */
  document.addEventListener('DOMContentLoaded', ()=>{ ensureCartModal(); updateBadge(); const trig=document.getElementById('cart-trigger'); if(trig) trig.addEventListener('click', showCart); });

  // expose showCheckout if needed elsewhere
  window.showCheckout = function(){ ensureCheckoutModal(); document.getElementById('checkout-modal').classList.remove('hidden'); renderCheckout(); };
})();
