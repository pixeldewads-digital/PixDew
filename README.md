# PixelDew — Vite + Tailwind (GitHub Pages)

Build super cepat, otomatis deploy ke **GitHub Pages** via Actions.

## Pakai sebagai repo baru
1. Upload semua file ini ke repo kamu (mis. `PixDew`).
2. Edit `vite.config.ts/js` → `base: '/PixDew/'` (samakan dengan nama repo).
3. Di repo GitHub: Settings → Pages → **Source: GitHub Actions** (jangan branch).
4. Push ke `main` → Actions akan build & deploy → situs muncul di `https://USERNAME.github.io/PixDew/`.

## Jalankan lokal (opsional)
```bash
npm i
npm run dev
# build
npm run build
npm run preview
```
