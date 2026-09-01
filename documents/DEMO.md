# Demo & Submission Kit

## Demo video script (target: 75–90 seconds)

| # | Beat | On screen | Narration (ID) |
|---|---|---|---|
| 1 | Problem | Halaman kosong + cursor di editor | "Developer update kode tapi lupa update README. Lama-lama install instruction dan feature list tidak cocok lagi dengan repo." |
| 2 | Tool intro | Landing page `readme-check-agent.vercel.app` | "ReadmeCheck Agent: tempel URL repo publik, agent membandingkan README dengan bukti dari repo itu sendiri." |
| 3 | Findings demo | Paste `https://github.com/AlfinRy/readme-drift-demo` → klik Analyze → loading → kartu findings muncul | "Agent mengambil manifest, changelog, dan file tree — maksimal 20 path — lalu menandai klaim README yang bertentangan, lengkap dengan buktinya." |
| 4 | Confidence + evidence | Zoom pada satu finding card (badge + evidence box) | "Setiap temuan punya section, issue, bukti, dan level confidence. Bukti selalu bisa diperiksa." |
| 5 | Honest empty state | Paste `https://github.com/vercel/next.js` → hasil "No outdated sections detected" | "Untuk repo yang sinkron, agent jujur mengatakan tidak ada masalah. Tidak ada temuan yang diarang-arang." |
| 6 | AI Gateway callout | Header "Powered by Vercel AI Gateway" + panel observability (opsional, bila direkam) | "Semua panggilan model lewat Vercel AI Gateway, di-deploy di Vercel." |

Rekam di 1440p, browser zoom 125%, satu take. Potong jeda menunggu loading dengan jump cut.

## Demo repositories

| Urutan | Repo | Hasil yang diharapkan | Status verifikasi |
|---|---|---|---|
| 1 (findings) | `AlfinRy/readme-drift-demo` | Minimal 2 findings high confidence (Node version + script) | Fixture — buat sebelum rekaman (isi di bawah) |
| 2 (empty) | `vercel/next.js` | "No outdated sections detected", partial context note | Terverifikasi di production, 1 Sep 2026 |

### Fixture repo: `readme-drift-demo`

Buat repo publik baru dengan dua file ini. README-nya sengaja bertentangan dengan manifest:

`README.md`
````markdown
# readme-drift-demo

Demo repository for ReadmeCheck Agent.

## Requirements

This project requires Node.js 16 or newer.

## Development

Run the following command to start the development server:

    npm start
````

`package.json`
```json
{
  "name": "readme-drift-demo",
  "private": true,
  "scripts": {
    "dev": "node server.js"
  },
  "engines": {
    "node": ">=20"
  }
}
```

Expected findings: (1) Requirements — README claims Node 16, manifest requires >=20; (2) Development — README references `npm start`, manifest only defines `dev`.

Fallback jika rate limit saat rekaman: tunggu ±60 detik lalu ulangi; UI menampilkan pesan retry yang jelas (429).

## Draft submission (reply ke thread pengumuman)

> ReadmeCheck Agent — an AI agent that audits a public GitHub README against the repository's own evidence (manifest, changelog, bounded file tree) and flags outdated sections with the evidence behind every finding.
>
> 🔗 Repo: https://github.com/AlfinRy/readme-check-agent
> 🚀 Live demo: https://readme-check-agent.vercel.app
> 🎥 Demo video: [link video]
>
> Built with Next.js App Router + AI SDK. 100% of model calls route through Vercel AI Gateway (MiniMax M3, with MiniMax M2.7 fallback) — no direct provider SDK. Conservative by design: unverifiable claims are not flagged, and a clean repo gets an honest empty result.

## Release candidate checklist

- [ ] `npm run check` lulus dari working tree bersih
- [ ] Production smoke test lulus (homepage + satu analisis)
- [ ] Fixture repo `readme-drift-demo` sudah dibuat dan menghasilkan findings
- [ ] Tag `v0.1.0` dibuat dan di-push
- [ ] Video direkam, link video diisi ke draft submission
