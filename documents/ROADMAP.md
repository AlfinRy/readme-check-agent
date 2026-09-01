# Roadmap: ReadmeCheck Agent

Roadmap ini menargetkan seluruh fitur, deployment, dan materi demo selesai paling lambat **Sabtu, 5 September 2026 pukul 20.00 WIB (H-1)**. Hari H hanya digunakan untuk final smoke test dan submission, bukan pengembangan fitur baru.

**Deadline resmi:** Minggu, 6 September 2026 pukul 14.00 WIB (UTC+7)

**Target submit internal:** Minggu, 6 September 2026 pukul 11.00 WIB, menyisakan buffer tiga jam.

| Fase | Tanggal | Fokus |
|---|---|---|
| H-5 | Selasa, 1 September 2026 | Fondasi dan AI Gateway |
| H-4 | Rabu, 2 September 2026 | Data GitHub |
| H-3 | Kamis, 3 September 2026 | Agent dan API |
| H-2 | Jumat, 4 September 2026 | UI dan feature freeze |
| H-1 | Sabtu, 5 September 2026 | Stabilization, deployment, dan demo |
| H | Minggu, 6 September 2026 | Final check dan submission sebelum 14.00 WIB |

## Definition of Done MVP

MVP dianggap selesai ketika:

- URL repository GitHub publik dapat divalidasi dan dianalisis dari UI.
- Server mengambil README, manifest, changelog (jika ada), serta ringkasan tree maksimal 15–20 path.
- Analisis menggunakan `zai/glm-5.3` melalui Vercel AI Gateway dan menghasilkan output terstruktur.
- UI menampilkan loading, temuan berdasarkan confidence, empty state, dan error state.
- Aplikasi lolos lint, type-check, test, dan production build.
- Aplikasi berhasil di-deploy dan diuji pada minimal tiga repository publik.
- Repository publik memiliki README proyek dan materi demo siap sebelum hari H.

## Aturan Eksekusi Quest

Setiap quest harus menjadi satu unit kerja kecil yang dapat diverifikasi.

1. Kerjakan hanya satu quest pada satu waktu.
2. Jalankan acceptance check quest tersebut.
3. Perbarui checkbox roadmap bila quest selesai.
4. Commit hanya file yang berkaitan dengan quest tersebut.
5. Push langsung setelah commit berhasil.
6. Jangan memulai quest berikutnya jika working tree belum bersih atau push gagal.

Format commit yang digunakan:

```text
<type>: <hasil quest>
```

Contoh alur:

```bash
git status --short
git add <file-yang-relevan>
git commit -m "feat: validate GitHub repository URLs"
git push origin HEAD
git status --short
```

Jenis commit utama: `docs`, `chore`, `feat`, `test`, `fix`, dan `refactor`.

---

## H-5 — Selasa, 1 September 2026 — Fondasi dan Koneksi AI Gateway

**Target harian:** aplikasi dapat berjalan secara lokal dan server berhasil memanggil GLM-5.3 melalui AI Gateway.

### Quest 0 — Kunci scope dan roadmap

- [x] Simpan keputusan final PRD.
- [x] Tambahkan roadmap delivery dan aturan commit/push per quest.

**Acceptance check:** PRD dan roadmap tidak memiliki keputusan MVP yang masih ambigu.

**Commit:** `docs: lock MVP scope and delivery roadmap`

### Quest 1 — Scaffold aplikasi Next.js

- [ ] Buat Next.js App Router dengan TypeScript dan Tailwind.
- [ ] Tambahkan struktur awal `app`, `components`, dan `lib`.
- [ ] Tambahkan scripts lint, type-check, test, dan build.
- [ ] Sediakan `.env.example` tanpa secret.

**Acceptance check:** development server berjalan; lint, type-check, dan build lulus.

**Commit:** `chore: scaffold Next.js application`

### Quest 2 — Smoke test Vercel AI Gateway

- [ ] Pasang Vercel AI SDK dan dependency schema yang diperlukan.
- [ ] Konfigurasikan model `zai/glm-5.3` hanya di server.
- [ ] Buat endpoint smoke test sementara atau test terisolasi.
- [ ] Pastikan secret tidak masuk ke client bundle maupun Git.

**Acceptance check:** satu prompt sederhana berhasil melewati AI Gateway dan mengembalikan respons dari model yang dipilih.

**Commit:** `feat: connect GLM model through AI Gateway`

**Checkpoint H-5:** fondasi dan integrasi AI tidak lagi menjadi risiko untuk hari berikutnya.

---

## H-4 — Rabu, 2 September 2026 — Akuisisi dan Penyaringan Data GitHub

**Target harian:** semua evidence yang dibutuhkan agent dapat diambil dan dibatasi secara deterministik.

### Quest 3 — Parser dan validator URL repository

- [ ] Terima format `https://github.com/owner/repo` dengan variasi trailing slash dan `.git` yang aman.
- [ ] Tolak host selain GitHub, path tidak lengkap, dan URL malformed.
- [ ] Tambahkan unit test untuk kasus valid dan invalid.

**Acceptance check:** parser selalu menghasilkan `{ owner, repo }` yang bersih atau typed validation error.

**Commit:** `feat: validate GitHub repository URLs`

### Quest 4 — GitHub client dan normalisasi error

- [ ] Ambil metadata repository/default branch dan README.
- [ ] Bedakan error not found/private, rate limit, README tidak ada, dan upstream failure.
- [ ] Gunakan header GitHub API yang sesuai dan dukung token server-side opsional tanpa mewajibkannya.
- [ ] Tambahkan test dengan HTTP request yang di-mock.

**Acceptance check:** README repository publik dapat diambil dan seluruh error utama memiliki pesan yang aman untuk UI.

**Commit:** `feat: fetch repository metadata and README`

### Quest 5 — Evidence collector dengan hard cap

- [ ] Ambil recursive tree dari default branch.
- [ ] Pilih manifest yang relevan, changelog jika tersedia, dan folder/file high-signal.
- [ ] Batasi tree ke top-level + satu level subfolder dan maksimal 15–20 path.
- [ ] Tandai `truncated: true` bila context dipotong.
- [ ] Tambahkan test untuk repo kecil, repo besar, tanpa manifest, dan tree terpotong.

**Acceptance check:** collector menghasilkan payload ringkas dan stabil tanpa mengirim seluruh codebase.

**Commit:** `feat: collect bounded repository evidence`

**Checkpoint H-4:** pipeline GitHub telah selesai dan dapat diuji tanpa model/UI.

---

## H-3 — Kamis, 3 September 2026 — Agent dan Endpoint Analisis End-to-End

**Target harian:** URL repository dapat diproses server menjadi findings terstruktur yang konservatif.

### Quest 6 — Schema dan prompt documentation auditor

- [ ] Definisikan schema finding: `section`, `issue`, `evidence`, dan `confidence`.
- [ ] Definisikan response berisi `findings` dan pesan ringkas.
- [ ] Susun system prompt agar hanya menandai kontradiksi yang didukung evidence.
- [ ] Jelaskan kepada model jika tree terpotong.
- [ ] Lindungi prompt dari instruksi yang tertanam di README.

**Acceptance check:** schema menolak output tidak valid dan prompt tidak memaksa temuan palsu.

**Commit:** `feat: define documentation audit schema and prompt`

### Quest 7 — Implementasi `/api/analyze`

- [ ] Validasi request di server.
- [ ] Orkestrasi parser URL, GitHub client, evidence collector, dan AI Gateway.
- [ ] Gunakan structured output dengan reasoning effort medium jika didukung konfigurasi provider.
- [ ] Kembalikan status HTTP dan response error yang konsisten.
- [ ] Tambahkan pembatas ukuran input dan timeout yang masuk akal untuk Vercel.

**Acceptance check:** request valid menghasilkan findings terstruktur atau empty result; failure tidak membocorkan secret/internal stack.

**Commit:** `feat: add repository analysis endpoint`

### Quest 8 — Evaluasi kualitas pada repository nyata

- [ ] Uji minimal tiga repository: satu terlihat sinkron, satu sengaja outdated, dan satu OSS populer.
- [ ] Catat expected finding dan false positive dalam fixture/evaluation notes.
- [ ] A/B reasoning effort bila opsi model tersedia.
- [ ] Tune prompt secara konservatif berdasarkan hasil evaluasi.

**Acceptance check:** agent tidak mengarang evidence, dapat menghasilkan empty findings, dan mendeteksi sedikitnya satu kontradiksi yang sengaja dibuat.

**Commit:** `test: add agent evaluation cases`

**Checkpoint H-3:** backend MVP telah bekerja end-to-end; hari berikutnya hanya berfokus pada pengalaman pengguna.

---

## H-2 — Jumat, 4 September 2026 — UI dan Integrasi Pengguna

**Target harian:** alur paste URL sampai membaca hasil siap digunakan dan direkam.

### Quest 9 — Form analisis dan validasi client

- [ ] Buat halaman utama dengan value proposition singkat dan satu primary action.
- [ ] Tambahkan input URL, contoh URL, validasi inline, dan submit state.
- [ ] Pastikan form dapat digunakan dengan keyboard dan memiliki label yang aksesibel.

**Acceptance check:** URL invalid tidak memanggil API; URL valid memulai analisis satu kali.

**Commit:** `feat: add repository analysis form`

### Quest 10 — Findings dan semua UI state

- [ ] Tampilkan finding cards yang dikelompokkan berdasarkan high, medium, lalu low confidence.
- [ ] Tampilkan section, issue, evidence, dan confidence badge.
- [ ] Tambahkan loading, empty, repo error, rate-limit error, dan generic error state.
- [ ] Tambahkan aksi retry tanpa kehilangan URL input.

**Acceptance check:** setiap response state dapat ditampilkan tanpa crash dan urutan confidence konsisten.

**Commit:** `feat: display analysis findings and states`

### Quest 11 — Responsive, accessibility, dan polish

- [ ] Rapikan hierarchy, spacing, contrast, focus state, dan mobile layout.
- [ ] Pastikan loading diumumkan secara aksesibel dan motion tidak berlebihan.
- [ ] Cek tidak ada horizontal overflow serta layout stabil saat hasil muncul.
- [ ] Tambahkan metadata halaman dasar.

**Acceptance check:** alur utama nyaman pada mobile/desktop dan tidak memiliki issue accessibility kritis yang terlihat.

**Commit:** `fix: polish responsive and accessible interface`

**Checkpoint H-2:** feature freeze. Tidak ada fitur stretch yang dikerjakan setelah checkpoint ini.

---

## H-1 — Sabtu, 5 September 2026 — Stabilization, Deployment, dan Materi Submission

**Target harian:** release candidate online dan semua bahan submission siap. Hari H tidak memerlukan coding.

### Quest 12 — Hardening dan regression test

- [ ] Uji URL malformed, repo tidak ada/private, README tidak ada, rate limit, timeout, output model invalid, dan empty findings.
- [ ] Jalankan seluruh test, lint, type-check, dan production build.
- [ ] Perbaiki hanya bug blocker atau high-impact.

**Acceptance check:** seluruh quality gate lulus dari working tree bersih.

**Commit:** `test: harden critical analysis flows`

### Quest 13 — Deploy production ke Vercel

- [ ] Hubungkan public repository ke Vercel.
- [ ] Konfigurasikan environment variable AI Gateway dan optional GitHub token.
- [ ] Deploy production dan lakukan smoke test dari perangkat/browser berbeda.
- [ ] Verifikasi model call benar-benar melalui AI Gateway.

**Acceptance check:** URL production dapat menyelesaikan minimal satu analisis repository publik.

**Commit:** `chore: configure production deployment`

> Jika konfigurasi deployment hanya berubah di dashboard Vercel, commit dokumentasi konfigurasi/deployment agar quest tetap memiliki jejak di Git.

### Quest 14 — README proyek dan dokumentasi publik

- [ ] Jelaskan masalah, solusi, arsitektur singkat, tech stack, local setup, environment variables, limitations, dan penggunaan AI Gateway.
- [ ] Tambahkan screenshot atau GIF jika sudah tersedia.
- [ ] Cantumkan URL demo production.
- [ ] Pastikan tidak ada secret atau klaim yang belum benar.

**Acceptance check:** orang lain dapat memahami dan menjalankan proyek hanya dari README.

**Commit:** `docs: add project setup and architecture guide`

### Quest 15 — Siapkan demo dan release candidate

- [ ] Susun script demo maksimal 90 detik: problem → paste URL → findings → AI Gateway.
- [ ] Pilih repository demo yang hasilnya stabil dan siapkan fallback.
- [ ] Rekam demo atau siapkan hosted demo final.
- [ ] Buat draft teks submission berisi repo link dan demo link.
- [ ] Tag release candidate setelah final smoke test.

**Acceptance check:** video/link dapat dibuka publik dan draft submission siap dikirim tanpa perubahan kode.

**Commit:** `docs: prepare hackathon demo and submission`

Tag dan push release candidate:

```bash
git tag -a v0.1.0 -m "ReadmeCheck Agent hackathon MVP"
git push origin HEAD
git push origin v0.1.0
```

**Checkpoint H-1:** code complete, production live, demo siap, dan submission tinggal dikirim.

---

## Hari H — Minggu, 6 September 2026 — Final Check dan Submission

**Target harian:** lakukan final check pada pagi hari dan submit paling lambat pukul **11.00 WIB**; jangan menambahkan fitur baru. Deadline resmi adalah pukul **14.00 WIB**.

### Quest 16 — Final smoke test dan submit

- [ ] Buka production URL dari incognito/device lain.
- [ ] Analisis satu repository demo dan verifikasi hasil.
- [ ] Verifikasi repo, deployment, serta video dapat diakses publik.
- [ ] Kirim submission sesuai format hackathon.
- [ ] Simpan link submission di README atau `documents/SUBMISSION.md`.

**Acceptance check:** submission sudah terkirim dan link submission tercatat di repository.

**Commit:** `docs: record hackathon submission`

Jika ditemukan blocker pada hari H, buat satu hotfix kecil, jalankan ulang quality gate, lalu gunakan commit terpisah:

```text
fix: resolve submission blocker
```

---

## Quality Gate Wajib

Jalankan sebelum setiap push yang mengubah kode (sesuaikan nama script setelah scaffold):

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Untuk quest dokumentasi, minimal periksa:

```bash
git diff --check
git status --short
```

## Progress Ringkas

| Hari | Outcome | Status |
|---|---|---|
| 1 Sep 2026 (H-5) | Fondasi Next.js + AI Gateway bekerja | Belum dimulai |
| 2 Sep 2026 (H-4) | Evidence GitHub terambil dan dibatasi | Belum dimulai |
| 3 Sep 2026 (H-3) | Agent endpoint bekerja end-to-end | Belum dimulai |
| 4 Sep 2026 (H-2) | UI lengkap dan feature freeze | Belum dimulai |
| 5 Sep 2026 (H-1) | Production + dokumentasi + demo siap | Belum dimulai |
| 6 Sep 2026 (H) | Final check dan submission sebelum 14.00 WIB | Belum dimulai |
