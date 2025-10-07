PixelDew — Drop-in Checkout (Digital-only)
===============================================

File di paket ini:
- assets/cart.js
- order-success.html
- terms.html
- refund.html

Cara pakai:
1) Copy semua file ini ke project kamu (GitHub Pages) — simpan `cart.js` di folder `assets/`.
2) Pastikan halaman kamu memuat Tailwind CDN dan ada tombol/ikon dengan id `cart-trigger` serta badge `cart-count` (opsional).
3) Tambahkan tombol "Tambah ke Keranjang" untuk produk, panggil `addToCart(ID_PRODUK)`.
4) Di `products.html`/`index.html`, sisipkan `<script src="./assets/cart.js"></script>` sebelum `</body>`.
5) Checkout berjalan dalam popup. Setelah "Bayar Sekarang", user akan diarahkan ke `order-success.html`.
6) Di halaman sukses user bisa unduh invoice HTML.

Promo code:
- PIXEL10  => potongan Rp10.000
- PIXEL25  => potongan Rp25.000

Catatan:
- Semua data transaksi disimpan di localStorage: `pixdew_orders` dan `pixdew_last_order`.
- Anti double-purchase: kalau email & set item sama dalam 24 jam, akan ada warning.
