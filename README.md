Halo, ada update dari backend TradeMe setelah Tahap 3 selesai.

**1. Autentikasi**
- Login mengembalikan `access_token` yang digunakan untuk mengakses endpoint terproteksi.
- Request terproteksi harus mengirim header `Authorization: Bearer <access_token>`.
- Token berlaku selama 15 menit.
- Setelah logout, token tidak bisa digunakan kembali.

**2. Informasi akun dan role**
- Respons login berisi data akun, termasuk `id`, `nama`, `email`, dan `role`.
- Role Admin adalah `admin`, sedangkan pengguna biasa adalah `pengguna`.
- Frontend dapat menggunakan data dari respons login untuk menyesuaikan tampilan berdasarkan role.

**3. Pembatasan akses**
- `GET /api/profile` hanya dapat digunakan oleh pengguna biasa.
- `POST /api/kategori` hanya dapat digunakan Admin.
- Pembatasan tampilan di frontend bukan pengganti validasi akses di backend.

**4. Penanganan error**
- `401`: autentikasi gagal, misalnya token tidak valid, kedaluwarsa, atau sudah tidak berlaku.
- `403`: akun tidak memiliki izin untuk mengakses endpoint.
- `503`: layanan autentikasi sementara tidak tersedia.

**5. Logout dan sesi**
- Logout dilakukan melalui `POST /api/auth/logout`.
- Setelah logout, frontend menghapus token yang tersimpan dan mengarahkan pengguna ke halaman login.
- Jika token kedaluwarsa, frontend perlu menangani sesi yang berakhir dan meminta pengguna login kembali.

**Catatan:** Jangan menggunakan `/api/auth/me`. Gunakan data akun dari respons login sesuai kebutuhan frontend.