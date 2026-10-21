# Undangan Digital Fahrizal & Dina

Starter website undangan responsif dengan tema hijau tua, ivory, dan emas. Nama orang tua, jam acara, alamat, dan rekening BRI perlu diverifikasi sebelum publikasi.

## Fitur
- Landing page, detail acara, Google Maps, RSVP, ucapan publik, amplop digital.
- Link personal: `https://domain-anda/?to=Nama%20Tamu`.
- Dashboard admin dengan Firebase Authentication, daftar tamu/kode undangan, RSVP privat, catatan amplop privat.
- Ucapan publik memiliki waktu kedaluwarsa 24 jam. Untuk menghapus dokumen secara fisik, ikuti bagian pembersihan di bawah.

## 1. Jalankan lokal
1. Install Node.js LTS.
2. Ekstrak project lalu buka terminal di folder project.
3. Jalankan `npm install`.
4. Salin `.env.example` menjadi `.env`, lalu isi konfigurasi web app Firebase.
5. Jalankan `npm run dev`, buka alamat yang dicetak terminal.

## 2. Buat Firebase
1. Buka https://console.firebase.google.com/ lalu buat project.
2. Tambahkan Web App dan salin konfigurasi ke `.env`.
3. Authentication → Sign-in method → aktifkan Email/Password.
4. Authentication → Users → Add user untuk akun admin. Jangan taruh sandi admin di kode atau GitHub.
5. Buat Cloud Firestore database.
6. Edit `firestore.rules`: ganti `GANTI_DENGAN_EMAIL_ADMIN` dengan email admin, lalu Publish.
7. Uji aturan menggunakan Firebase Rules Playground / Emulator sebelum dipakai sungguhan.

**Penting:** Firebase web config bukan password, tetapi tetap pasang Firestore Rules. Email admin yang ada di rules bukan rahasia; kontrol akses nyata ditegakkan oleh Firebase Auth + Rules. Untuk admin pelanggan, ganti email di rules dengan email pembeli dan jangan beri akses akun admin kepada orang lain.

## 3. Penghapusan otomatis setelah 24 jam
Saat ini halaman publik langsung menyaring ucapan kedaluwarsa setelah 24 jam, tetapi dokumen lama masih ada di Firestore. Agar benar-benar dihapus, aktifkan TTL:
1. Firebase Console → Firestore Database → Time-to-live (TTL).
2. Tambahkan policy collection group `publicMessages`, field timestamp `expiresAt`.
3. TTL dapat memerlukan waktu tambahan sebelum dokumen benar-benar dihapus; bukan tepat pada detik ke-24 jam. Rules tetap mencegah pesan kedaluwarsa dibaca publik.

## 4. Link yang diminta
- Tamu: bagikan `https://DOMAIN-ANDA/?to=Nama%20Tamu`. Link personal mengisi nama sapaan, bukan autentikasi keamanan.
- Daftar tamu: buka `/` lalu Admin → login → tambah nama → Salin link. Tidak disediakan link publik untuk mengelola daftar karena bisa disalahgunakan.
- Admin: `https://DOMAIN-ANDA/` → tombol Admin → login email/sandi. Riwayat amplop dan RSVP dilindungi Firestore Rules.

Untuk kebutuhan link yang benar-benar terpisah, setelah deploy dapat memakai path `/admin` dan `/daftar-tamu` dengan routing tambahan. Dashboard starter ini sengaja menyatukan akses admin agar tidak membuka panel pengelolaan ke publik.

## 5. Publikasikan lewat GitHub + Cloudflare Pages
1. Buat repository baru di https://github.com/new (mis. `undangan-rizal-dina`).
2. Upload semua file project, **jangan upload `.env`**. Upload `.env.example` saja.
3. Login ke https://dash.cloudflare.com/ → Workers & Pages → Create → Pages → Connect to Git.
4. Pilih repo GitHub. Build command: `npm run build`; Build output directory: `dist`.
5. Pada Settings → Environment variables, masukkan semua nilai `VITE_FIREBASE_*` dari `.env`.
6. Deploy dan tunggu URL `*.pages.dev`.
7. Firebase Console → Authentication → Settings → Authorized domains: tambahkan domain `*.pages.dev` Anda.
8. Uji RSVP, ucapan, login admin, serta rules dari jendela incognito.
9. Untuk domain sendiri: Cloudflare Pages → Custom domains → ikuti petunjuk DNS.

## 6. Personalisasi sebelum tayang
- Ganti nama orang tua dan detail jam acara di `src/App.jsx`.
- Konfirmasi alamat persis dari Google Maps dan tampilkan alamat tertulis.
- Lagu “Bergema Sampai Selamanya”: letakkan file audio yang Anda miliki hak untuk menggunakannya di `public/audio/bergema.mp3`, lalu tambahkan elemen `<audio>` dan kontrol play/pause. Starter tidak menyertakan lagu berhak cipta atau audio autoplay.
- Verifikasi nomor DANA dan nomor rekening BRI. Nomor yang diberikan dipakai sebagai contoh keduanya, tetapi jangan menganggap nomor DANA otomatis merupakan nomor rekening BRI.
- Ganti foto Unsplash dengan foto pasangan sendiri yang sudah mendapat izin.
- Tambahkan anti-spam/CAPTCHA atau endpoint backend jika undangan akan menerima banyak RSVP; aturan Firestore bukan sistem anti-bot.
- Untuk catatan amplop: tombol admin hanya mencatat nominal yang dimasukkan admin, bukan bukti transaksi bank. Jangan simpan data finansial sensitif yang tidak diperlukan.

## Catatan privasi dan keamanan
Jangan pernah menyimpan password admin di source code. Firebase Authentication mengelola sandi. RSVP lengkap, daftar tamu, dan amplop hanya bisa dibaca/ditulis akun yang emailnya diizinkan di Firestore Rules. Ucapan yang memang ditampilkan publik dapat dibaca semua orang selama 24 jam. Hindari memasukkan nomor telepon atau data sensitif ke pesan.
