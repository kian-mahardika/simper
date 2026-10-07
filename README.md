# SIMPER · Sistem Informasi Perpustakaan PKN STAN

Aplikasi web berbahasa Indonesia dengan katalog, keanggotaan, sirkulasi, sepuluh ruang diskusi, kasus kehilangan dan denda, serta dasbor keuangan. Mode Supabase dapat diaktifkan melalui `config.js` setelah proyek dan merchant QRIS disiapkan.

## Menjalankan web

Gunakan Node.js 20+ dan buka folder ini:

```bash
npm install
npm run dev
```

Buka `http://127.0.0.1:5173`. Untuk Vercel, gunakan folder ini sebagai root. `npm run build` menghasilkan `dist`. Berkas `vercel.json` telah tersedia.

| Peran | NIM | Kata sandi tampilan awal |
| --- | --- | --- |
| Anggota | `4199990001` hingga `4199990012` | `12345` |
| Pustakawan | `4199990901` | `12345` |
| Keuangan | `4199990902` | `12345` |
| Admin | `4199990903` | `12345` |

Jika `config.js` kosong, data awal disimpan di browser dan sandi 12345 hanya berlaku pada perangkat tersebut. Login dan otorisasi di mode ini tidak aman untuk layanan nyata. Saat `config.js` diisi, login menggunakan Supabase Auth dan kata sandi yang dibuat pada proses provisioning; transaksi inti memakai RPC dengan pemeriksaan peran di server. Jangan unggah data pribadi sungguhan ke mode lokal.

## Alur transaksi

1. Anggota memilih buku dari katalog dan mengajukan pinjaman.
2. Pustakawan menetapkan tanggal ambil; sebuah copy dicadangkan. Dasbor anggota menampilkan tanggal ambil.
3. Saat anggota datang, pustakawan memindai KTM dengan pemindai yang mengetik NIM atau mengisi NIM manual. Setelah cocok, pinjaman menjadi Aktif dan jatuh tempo dihitung dari tanggal serah terima berdasarkan parameter saat disetujui.
4. Pengembalian juga memerlukan verifikasi KTM. Hasilnya: dikembalikan, terlambat (Rp1.000 per hari setelah jatuh tempo), atau hilang (nilai penggantian buku).
5. Kasus keterlambatan dan kehilangan muncul di menu **Kehilangan & Denda**. Kwitansi yang telah terverifikasi tampil di register kasus dan dasbor keuangan.

Tombol **Bayar** pada mode lokal menunjukkan nominal kasus. Pada mode Supabase, tombol ini memanggil `create-payment`, menampilkan URL QRIS dinamis dari Midtrans, dan memantau `payment-status`. Webhook penyedia memvalidasi signature dan nominal sebelum menutup kasus dan menerbitkan ID kwitansi. Tanpa konfigurasi merchant, aplikasi tidak membuat QR palsu atau menutup tagihan secara semu.

## Katalog dan data awal

`database/catalog_seed.csv` dan `catalog-data.js` berisi 520 judul unik rancangan, 1.534 eksemplar, lokasi rak, nilai penggantian, dan sampul SVG lokal. Ditambah 18 entri awal di mode lokal, tampilan berisi **538 judul**. Saat Supabase aktif, katalog mengambil 520 judul dari database awal. Sampul adalah ilustrasi desain, bukan foto penerbit. `database/opac_sample_verified.csv` memuat 12 contoh entri dari katalog resmi. `database/catalog_source_notes.md` menjelaskan sumber resmi OPAC dan batas asal data. Anggota dan transaksi awal di tampilan disusun untuk menguji alur, bukan histori operasional nyata.

## Supabase dan QRIS

Berkas utama:

- `supabase/migrations/001_simper.sql`: tabel, constraint, RLS, audit, parameter, serta RPC atomik untuk pengajuan, persetujuan, serah terima, pengembalian, dan settlement.
- `supabase/seed.sql`: 520 buku, 1.534 copy, 12 anggota awal, sepuluh ruangan, dan 21 pinjaman awal, dua kasus, satu kwitansi awal, dan sepuluh pemesanan ruang.
- `supabase/functions/create-payment`: membuat satu order QRIS Midtrans per kasus dari nominal database dan mengembalikan URL QR dinamis.
- `supabase/functions/payment-webhook`: memvalidasi signature, memeriksa status langsung ke Midtrans, menguji nominal, lalu menutup kasus melalui RPC idempoten dan menerbitkan ID kwitansi.
- `supabase/functions/payment-status`: memberi status kasus dan kwitansi sesuai hak akses.
- `supabase/functions/register-member`: membuat akun Auth anggota dari dasbor pustakawan dengan sandi sementara.
- `supabase/scripts/provision-users.mjs`: menghubungkan akun Auth dengan anggota dan peran pada proyek baru. Kata sandi awal dibaca dari environment, bukan disimpan di repositori.

Urutan pemasangan pada proyek Supabase baru: jalankan migrasi lalu seed di SQL Editor; jalankan skrip provision dengan `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, dan `SIMPER_SEED_PASSWORD` (minimal 12 karakter); pasang secret `MIDTRANS_SERVER_KEY`, `MIDTRANS_ENV=sandbox`, dan `SITE_ORIGIN`; lalu deploy empat Edge Function. Daftarkan URL publik `payment-webhook` sebagai HTTP notification Midtrans. Isi hanya URL proyek dan kunci **publishable/anon** di `config.js`, lalu build dan deploy ulang. Login dengan NIM awal dan `SIMPER_SEED_PASSWORD`. Uji pembayaran sandbox untuk `KS-SEED-001` sampai settlement dan kwitansi muncul sebelum beralih ke merchant produksi. Kunci service role dan server key tidak boleh masuk ke aset `dist` atau Vercel frontend.

**Batas pengujian:** koneksi live, autentikasi, RPC, dan QRIS belum dapat diuji dari paket ini tanpa proyek Supabase serta akun merchant. Berkas sudah menyiapkan jalurnya, tetapi verifikasi sandbox dan kebijakan operasional institusi tetap diperlukan. Pengisian URL/kunci publik tidak mengubah transaksi lama yang tersimpan lokal menjadi data Supabase.
