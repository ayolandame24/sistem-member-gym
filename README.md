# FitLedger — Sistem Manajemen Member Gym

Aplikasi manajemen keanggotaan gym berbasis web dengan fitur billing, pembayaran, langganan berulang, akuntansi, dan pelaporan keuangan. Terhubung ke database **Supabase** (PostgreSQL) secara real-time.

---

## 🌐 Demo Aplikasi

> **Akses langsung tanpa instalasi:**

### 👉 [https://ayolandame24.github.io/sistem-member-gym/](https://ayolandame24.github.io/sistem-member-gym/)

---

## 📁 Struktur Proyek

```
sistem-member-gym/
├── backend/
│   ├── schema.sql          # DDL: tabel, enum, index, RLS policy
│   ├── seed.sql            # Data awal: 12 member, invoice, payment, subscription
│   ├── seed_tambahan.sql   # Data tambahan: member & transaksi Oktober 2026
│   ├── triggers.sql        # Trigger & function otomasi bisnis di database
│   └── app.js              # REST API server (Express.js + Supabase)
├── frontend/
│   ├── index.html          # Halaman utama aplikasi (single-page)
│   ├── script.js           # Logika aplikasi: koneksi Supabase, CRUD, UI
│   └── style.css           # Stylesheet lengkap dan responsif
├── index.html              # Entry point root (redirect ke frontend/)
└── README.md               # Dokumentasi ini
```

---

## 🚀 Cara Menjalankan

### ✅ Cara Tercepat — Buka Online

Tidak perlu instalasi apapun. Langsung buka di browser:

**👉 [https://ayolandame24.github.io/sistem-member-gym/](https://ayolandame24.github.io/sistem-member-gym/)**

---

### A. Jalankan Lokal (Tanpa Server)

Clone repo lalu buka file frontend langsung:

```bash
git clone https://github.com/ayolandame24/sistem-member-gym.git
cd sistem-member-gym
```

Kemudian buka `frontend/index.html` di browser, atau gunakan server lokal:

```bash
# Menggunakan Python
python -m http.server 8080 --directory frontend

# Atau menggunakan VS Code Live Server
# Klik kanan frontend/index.html → Open with Live Server
```

Lalu buka: `http://localhost:8080`

---

### B. Backend API (Express.js)

Pastikan Node.js sudah terinstal, lalu:

```bash
# 1. Install dependensi backend
npm install express @supabase/supabase-js cors dotenv

# 2. Jalankan server
node backend/app.js
```

Server berjalan di: `http://localhost:3000`

---

### C. Setup Database (Supabase)

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Buka **SQL Editor** → **New Query**
3. Jalankan file berikut secara berurutan:

```
1. backend/schema.sql       ← Buat semua tabel
2. backend/seed.sql         ← Isi data awal
3. backend/seed_tambahan.sql ← Isi data tambahan (opsional)
4. backend/triggers.sql     ← Aktifkan trigger otomasi
```

---

## 🗄️ Struktur Database

| Tabel | Deskripsi |
|---|---|
| `members` | Data anggota gym (kode, nama, paket, status) |
| `invoices` | Tagihan bulanan per member |
| `payments` | Riwayat transaksi pembayaran |
| `subscriptions` | Langganan berulang (recurring billing) |
| `monthly_revenue` | Ringkasan pendapatan per bulan |

### Trigger Otomatis
- **Auto-Expired**: Member dengan `expiry_date` yang sudah lewat otomatis di-set `Expired`
- **Auto-Overdue**: Invoice `Unpaid` yang melewati `due_date` otomatis di-set `Overdue`
- **Auto-Paid**: Ketika payment `Success` dicatat, invoice terkait otomatis di-set `Paid`
- **Auto-Cancel Billing**: Subscription yang di-`Cancelled` otomatis menghapus `next_billing_date`

---

## 🔌 REST API Endpoints

Base URL: `http://localhost:3000`

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/members` | Daftar semua member |
| `POST` | `/api/members` | Tambah member baru |
| `PUT` | `/api/members/:id` | Update data member |
| `DELETE` | `/api/members/:id` | Hapus member |
| `GET` | `/api/invoices` | Daftar semua invoice |
| `POST` | `/api/invoices` | Buat invoice baru |
| `PATCH` | `/api/invoices/:id/paid` | Tandai invoice lunas |
| `DELETE` | `/api/invoices/:id` | Hapus invoice |
| `GET` | `/api/payments` | Riwayat pembayaran |
| `POST` | `/api/payments` | Catat pembayaran baru |
| `GET` | `/api/subscriptions` | Daftar langganan |
| `POST` | `/api/subscriptions` | Tambah langganan baru |
| `PATCH` | `/api/subscriptions/:id/status` | Update status langganan |
| `GET` | `/api/monthly-revenue` | Data revenue bulanan |
| `GET` | `/api/dashboard` | Ringkasan statistik dashboard |

---

## ✨ Fitur Aplikasi

### 📊 Dashboard
- Statistik real-time: Total Revenue, MRR, Active Members, Outstanding Bills
- Recent payments & outstanding invoices
- Notifikasi dinamis dari data database

### 👥 Members
- CRUD lengkap: Tambah, Edit, Detail, Hapus member
- Filter by status (Active/Expired/Suspended) dan paket membership
- Pagination & pencarian global

### 🧾 Billing
- Buat invoice dengan jumlah otomatis dari paket member
- Tandai lunas, hapus, lihat detail
- Print/Download invoice sebagai PDF
- Filter by status (Paid/Unpaid/Overdue)

### 🔁 Recurring Billing
- Kelola langganan berulang (Jeda / Lanjutkan / Batalkan)
- MRR dihitung real-time dari subscription aktif
- Tambah langganan baru untuk member

### 💳 Payments
- Catat pembayaran manual dengan berbagai metode
- Export data ke CSV
- Filter by status dan metode pembayaran

### 📈 Accounting
- Ringkasan keuangan: Total Revenue, Recognized Revenue, AR, MRR
- Revenue summary tabel 5 bulan terakhir
- Daftar outstanding invoices
- Export CSV

### 📋 Reports
- Laporan revenue YTD dengan persentase growth
- Revenue breakdown per paket membership (progress bar)
- Export CSV

---

## 🛠️ Teknologi

| Layer | Teknologi |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend API | Node.js, Express.js |
| Database | Supabase (PostgreSQL) |
| Deploy | GitHub Pages |
| Repo | [github.com/ayolandame24/sistem-member-gym](https://github.com/ayolandame24/sistem-member-gym) |

---

## 📦 Paket Membership

| Paket | Harga/Bulan |
|---|---|
| Basic | Rp 250.000 |
| Premium | Rp 450.000 |
| Elite | Rp 750.000 |
| Personal Trainer | Rp 1.200.000 |

---

## 👨‍💻 Pengembang

**FitLedger** — Sistem Manajemen Member Gym  
Dikembangkan sebagai proyek tugas mata kuliah Pemrograman Web  
Universitas Diponegoro (UNDIP)
