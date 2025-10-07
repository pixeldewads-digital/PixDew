/* PixelDew – Cart (digital-only) */
(function () {
  const KEY = "pixdew_cart_v1";

  const CATALOG = {
    1: { id: 1, name: "Template Website Modern", price: 299000, emoji: "🎨" },
    2: { id: 2, name: "Plugin SEO Pro",         price: 199000, emoji: "🔧" },
    3: { id: 3, name: "E-Book Digital Marketing",price: 149000, emoji: "📚" },
    4: { id: 4, name: "Icon Pack Premium",       price:  99000, emoji: "🎯" }
  };

  const load = () => JSON.parse(localStorage.getItem(KEY) || "[]");
  const save = (cart) => localStorage.setItem(KEY, JSON.stringify(cart));
  const money = (n) => "Rp " + (n || 0).toLocaleString("id-ID");

  window.addToCart = function (id) {
    const p = CATALOG[id];
    if (!p) return alert("Produk tidak ditemukan.");
    const cart = load();
    const found = cart.find((i) => i.id === id);
    if (found) found.qty += 1; else cart.push({ id, qty: 1 });
    save(cart);
    bumpCount();
    toast("✅ Ditambahkan: " + p.name);
  };

  let modalRoot = document.getElementById("cart-root");
  if (!modalRoot) {
    modalRoot = document.createElement("div");
    modalRoot.id = "cart-root";
    document.body.appendChild(modalRoot);
  }

  function bumpCount() {
    const el = document.getElementById("cart-count");
    if (!el) return;
    const total = load().reduce((s, i) => s + i.qty, 0);
    if (total > 0) { el.textContent = String(total); el.classList.remove("hidden"); }
    else { el.textContent = "0"; el.classList.add("hidden"); }
  }

  function toast(msg) {
    const t = document.createElement("div");
    t.className = "fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg text-white bg-brand shadow";
    t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  function openCart() {
    const cart = load();
    const total = cart.reduce((s, i) => s + CATALOG[i.id].price * i.qty, 0);
    modalRoot.innerHTML = `
      <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" id="cart-overlay">
        <div class="bg-white w-full max-w-lg rounded-2xl shadow-xl">
          <div class="flex items-center justify-between px-5 py-4 border-b">
            <h3 class="text-lg font-bold">Keranjang</h3>
            <button class="p-2" id="cart-close" aria-label="Tutup">✕</button>
          </div>
          <div class="p-5 max-h-[60vh] overflow-y-auto" id="cart-items">
            ${cart.length === 0 ? `
              <div class="text-center text-gray-500 py-10">
                <div class="text-5xl mb-2">🛒</div>
                Keranjang kosong
              </div>` :
              cart.map(row => {
                const p = CATALOG[row.id];
                return `
                  <div class="flex items-center justify-between py-3 border-b">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 flex items-center justify-center text-xl">${p.emoji}</div>
                      <div>
                        <div class="font-semibold">${p.name}</div>
                        <div class="text-sm text-gray-500">${money(p.price)}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button class="w-8 h-8 rounded bg-gray-100" data-act="dec" data-id="${p.id}">−</button>
                      <span class="w-8 text-center font-semibold">${row.qty}</span>
                      <button class="w-8 h-8 rounded bg-gray-100" data-act="inc" data-id="${p.id}">+</button>
                      <button class="ml-2 text-red-500" data-act="del" data-id="${p.id}">🗑️</button>
                    </div>
                  </div>`;
              }).join("")
            }
          </div>
          <div class="px-5 pb-5 pt-3 border-t">
            <div class="flex items-center justify-between mb-3">
              <span class="font-semibold">Total</span>
              <span class="text-xl font-bold text-brand">${money(total)}</span>
            </div>
            <button id="checkout-btn"
              class="w-full py-3 rounded-lg bg-brand text-white hover:bg-brand-dark font-semibold"
              ${cart.length === 0 ? "disabled" : ""}>
              Checkout
            </button>
          </div>
        </div>
      </div>`;

    document.getElementById("cart-close").onclick = closeCart;
    document.getElementById("cart-overlay").onclick = (e) => { if (e.target.id === "cart-overlay") closeCart(); };
    document.querySelectorAll("#cart-items [data-act]").forEach(btn => {
      btn.addEventListener("click", () => quantityAction(btn.dataset.act, +btn.dataset.id));
    });
    const co = document.getElementById("checkout-btn");
    if (co) co.onclick = openCheckout;
  }

  function closeCart() { modalRoot.innerHTML = ""; }

  function quantityAction(act, id) {
    const cart = load();
    const row = cart.find(r => r.id === id);
    if (!row) return;
    if (act === "inc") row.qty += 1;
    if (act === "dec") row.qty = Math.max(1, row.qty - 1);
    if (act === "del") cart.splice(cart.indexOf(row), 1);
    save(cart); bumpCount(); openCart();
  }

  function openCheckout() {
    const cart = load();
    if (!cart.length) return;
    const total = cart.reduce((s, i) => s + CATALOG[i.id].price * i.qty, 0);
    modalRoot.innerHTML = `
      <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" id="checkout-overlay">
        <div class="bg-white w-full max-w-md rounded-2xl shadow-xl">
          <div class="flex items-center justify-between px-5 py-4 border-b">
            <h3 class="text-lg font-bold">Checkout</h3>
            <button class="p-2" id="checkout-close" aria-label="Tutup">✕</button>
          </div>
          <form id="checkout-form" class="p-5 space-y-4">
            <div>
              <label class="block mb-1 font-semibold">Email</label>
              <input type="email" required placeholder="email@domain.com"
                class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand" id="co-email">
            </div>
            <div>
              <label class="block mb-1 font-semibold">Konfirmasi Email</label>
              <input type="email" required placeholder="Ulangi email"
                class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand" id="co-email2">
            </div>
            <div class="flex items-start gap-2">
              <input type="checkbox" required id="co-terms" class="mt-1">
              <label for="co-terms" class="text-sm text-gray-600">Saya setuju dengan
                <a href="./terms.html" class="text-brand underline">Syarat & Ketentuan</a> dan
                <a href="./refund.html" class="text-brand underline">Kebijakan Refund</a>.
              </label>
            </div>
            <div class="flex items-center justify-between pt-2">
              <span class="font-semibold">Total</span>
              <span class="text-xl font-bold text-brand">${money(total)}</span>
            </div>
            <button type="submit" class="w-full py-3 rounded-lg bg-brand text-white hover:bg-brand-dark font-semibold">Bayar Sekarang</button>
          </form>
        </div>
      </div>`;

    document.getElementById("checkout-close").onclick = closeCheckout;
    document.getElementById("checkout-overlay").onclick = (e) => { if (e.target.id === "checkout-overlay") closeCheckout(); };
    document.getElementById("checkout-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("co-email").value.trim();
      const email2 = document.getElementById("co-email2").value.trim();
      if (email !== email2) { alert("Email tidak sama."); return; }
      const orderId = "PD-" + Date.now();
      localStorage.removeItem(KEY);
      bumpCount();
      window.location.href = "./order-success.html?email=" + encodeURIComponent(email) + "&order=" + orderId;
    });
  }
  function closeCheckout() { modalRoot.innerHTML = ""; }

  const trigger = document.getElementById("cart-trigger");
  if (trigger) trigger.addEventListener("click", openCart);

  bumpCount();
})();
