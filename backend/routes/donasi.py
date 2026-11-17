import json
import os
from uuid import uuid4
from flask import Blueprint, jsonify, request, g, current_app, send_from_directory
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash
from database import get_db_connection
from routes.auth_utils import token_required, admin_required

donasi_bp = Blueprint("donasi", __name__)

def _get_user_id_from_g(current_user):
    sub = current_user.get("sub")
    try:
        return int(sub) if sub is not None else None
    except (TypeError, ValueError):
        return None

# ---------------------------------------------------------------------------
# ADMIN: Buat Akun Yayasan Mitra
# ---------------------------------------------------------------------------
@donasi_bp.post('/api/admin/yayasan')
@admin_required
def admin_create_yayasan():
    body = request.get_json(silent=True) or {}
    nama = body.get('nama_yayasan')
    alamat = body.get('alamat')
    email = body.get('email')
    password = body.get('password', 'Yayasan123!') # default password

    if not nama or not email:
        return jsonify({"status": "error", "message": "Nama dan email wajib diisi"}), 400

    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Cek email unik
        cursor.execute("SELECT user_id FROM user WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"status": "error", "message": "Email sudah terdaftar"}), 409

        # Buat akun user dengan awalan [YAYASAN]
        nama_lengkap = f"[YAYASAN] {nama}"
        hashed_pw = generate_password_hash(password)
        
        cursor.execute("""
            INSERT INTO user (nama, email, password, alamat, role)
            VALUES (%s, %s, %s, %s, 'pengguna')
        """, (nama_lengkap, email, hashed_pw, alamat))
        
        connection.commit()
        return jsonify({"status": "success", "message": "Yayasan berhasil ditambahkan", "data": {"user_id": cursor.lastrowid}}), 201
    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()


# ---------------------------------------------------------------------------
# GET endpoint – List Yayasan Mitra (Diambil dari tabel user)
# ---------------------------------------------------------------------------
@donasi_bp.get('/api/yayasan')
def get_yayasan_list():
    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        # Hanya ambil user yang namanya mengandung [YAYASAN]
        cursor.execute("""
            SELECT user_id AS yayasan_id, REPLACE(nama, '[YAYASAN] ', '') AS nama_yayasan, alamat, foto_profil AS logo
            FROM user 
            WHERE nama LIKE '[YAYASAN]%'
        """)
        data = cursor.fetchall()
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()


# ---------------------------------------------------------------------------
# POST endpoint – Donor mendaftarkan barangnya untuk didonasikan (Alur 1 & Alur Lama)
# ---------------------------------------------------------------------------
@donasi_bp.post('/api/donasi')
@token_required
def create_donasi():
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    body = request.get_json(silent=True) or {}
    barang_id = body.get('barang_id')
    yayasan_id = body.get('yayasan_id')
    penerima_id = body.get('penerima_id') # Pengajuan ID atau User ID penerima

    if not barang_id:
        return jsonify({"status": "error", "message": "barang_id wajib diisi"}), 400

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Cek barang
        cursor.execute("SELECT pemilik_id, status_barang FROM barang WHERE barang_id = %s", (barang_id,))
        barang = cursor.fetchone()

        if not barang:
            return jsonify({"status": "error", "message": "Barang tidak ditemukan"}), 404
        if barang['pemilik_id'] != user_id:
            return jsonify({"status": "error", "message": "Akses ditolak: Anda bukan pemilik barang"}), 403
        if barang['status_barang'] != 'tersedia':
            return jsonify({"status": "error", "message": f"Barang berstatus '{barang['status_barang']}', hanya 'tersedia' yang bisa didonasikan"}), 400

        # Cek apakah barang sudah pernah didonasikan
        cursor.execute("SELECT donasi_id FROM donasi WHERE barang_id = %s", (barang_id,))
        if cursor.fetchone():
            return jsonify({"status": "error", "message": "Barang ini sudah terdaftar dalam program donasi"}), 409

        # LOGIKA REVISI STATUS & ALUR DONASI
        if penerima_id:
            # Cek apakah penerima_id adalah pengajuan_id
            cursor.execute("SELECT pengajuan_id, user_id FROM pengajuan_donasi WHERE pengajuan_id = %s", (penerima_id,))
            pengajuan = cursor.fetchone()
            
            if pengajuan:
                target_user_id = pengajuan['user_id']
                pengajuan_id_val = pengajuan['pengajuan_id']
            else:
                cursor.execute("SELECT user_id FROM user WHERE user_id = %s", (penerima_id,))
                user_row = cursor.fetchone()
                if not user_row:
                    return jsonify({"status": "error", "message": "Penerima tidak ditemukan"}), 404
                target_user_id = user_row['user_id']
                pengajuan_id_val = None

            # Insert langsung disetujui dan diproses (status 'diproses')
            cursor.execute("""
                INSERT INTO donasi (barang_id, donor_id, penerima_id, pengajuan_id, status_verifikasi, status_donasi)
                VALUES (%s, %s, %s, %s, 'disetujui', 'diproses')
            """, (barang_id, user_id, target_user_id, pengajuan_id_val))
            msg = "Barang berhasil didonasikan ke penerima."

        elif yayasan_id:
            # Validasi yayasan ada di tabel user
            cursor.execute("SELECT user_id FROM user WHERE user_id = %s", (yayasan_id,))
            if not cursor.fetchone():
                return jsonify({"status": "error", "message": "Yayasan tidak ditemukan"}), 404
            
            # Insert langsung disetujui dan diproses (karena sudah ada yayasan tujuan)
            cursor.execute("""
                INSERT INTO donasi (barang_id, donor_id, penerima_id, status_verifikasi, status_donasi)
                VALUES (%s, %s, %s, 'disetujui', 'diproses')
            """, (barang_id, user_id, yayasan_id))
            msg = "Barang berhasil didonasikan langsung ke Yayasan."

        else:
            # Insert langsung disetujui dan berstatus tersedia (siap disalurkan admin)
            cursor.execute("""
                INSERT INTO donasi (barang_id, donor_id, status_verifikasi, status_donasi)
                VALUES (%s, %s, 'disetujui', 'tersedia')
            """, (barang_id, user_id))
            msg = "Barang berhasil didonasikan. Menunggu penyaluran dari admin."

        # Update status barang menjadi didonasikan
        cursor.execute("UPDATE barang SET status_barang = 'didonasikan' WHERE barang_id = %s", (barang_id,))

        connection.commit()
        
        # Ambil ID yang benar (mengatasi bug lastrowid = 0)
        cursor.execute("SELECT LAST_INSERT_ID() AS new_id")
        row_id = cursor.fetchone()
        new_donasi_id = row_id['new_id'] if row_id and row_id.get('new_id') else cursor.lastrowid

        return jsonify({
            "status": "success",
            "message": msg,
            "data": {"donasi_id": new_donasi_id, "barang_id": barang_id}
        }), 201

    except Exception:
        if connection: connection.rollback()
        import logging
        logging.exception("Gagal membuat donasi")
        return jsonify({"status": "error", "message": "Terjadi kesalahan sistem"}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()




@donasi_bp.get('/api/donasi')
def get_donasi_list():
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Ambil donasi yang sudah disetujui dan tersedia
        cursor.execute("""
            SELECT d.donasi_id, d.barang_id, b.nama_barang, b.deskripsi, b.foto_barang, 
                   d.status_donasi, u.nama AS nama_donor
            FROM donasi d
            JOIN barang b ON d.barang_id = b.barang_id
            JOIN user u ON d.donor_id = u.user_id
            WHERE d.status_verifikasi = 'disetujui' AND d.status_donasi = 'tersedia'
        """)
        data = cursor.fetchall()
        return jsonify({"status": "success", "data": data}), 200
    except Exception:
        import logging
        logging.exception("Gagal mengambil list donasi")
        return jsonify({"status": "error", "message": "Terjadi kesalahan sistem"}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()



@donasi_bp.get('/api/donasi/donor')
@token_required
def get_donasi_donor():
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT d.donasi_id, d.barang_id, b.nama_barang, d.status_verifikasi, d.status_donasi
            FROM donasi d
            JOIN barang b ON d.barang_id = b.barang_id
            WHERE d.donor_id = %s
            ORDER BY d.donasi_id DESC
        """, (user_id,))
        data = cursor.fetchall()
        return jsonify({"status": "success", "data": data}), 200
    except Exception:
        import logging
        logging.exception("Gagal mengambil donasi donor")
        return jsonify({"status": "error", "message": "Terjadi kesalahan sistem"}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()



# ---------------------------------------------------------------------------
# CHUNK 2: PENGAJUAN PENERIMA DONASI
# ---------------------------------------------------------------------------

@donasi_bp.post('/api/donasi/pengajuan')
@token_required
def create_pengajuan_donasi():
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    tipe_pemohon = request.form.get("tipe_pemohon") or (request.get_json(silent=True) or {}).get("tipe_pemohon")
    lokasi = request.form.get("lokasi") or (request.get_json(silent=True) or {}).get("lokasi")
    alasan_kebutuhan = request.form.get("alasan_kebutuhan") or (request.get_json(silent=True) or {}).get("alasan_kebutuhan")
    
    # Data User C (Penerima)
    nama_penerima = request.form.get("nama_penerima") or (request.get_json(silent=True) or {}).get("nama_penerima")
    alamat_penerima = request.form.get("alamat_penerima") or (request.get_json(silent=True) or {}).get("alamat_penerima")

    if not alasan_kebutuhan or not tipe_pemohon:
        return jsonify({"status": "error", "message": "alasan_kebutuhan dan tipe_pemohon wajib diisi"}), 400

    # Dokumen pendukung (opsional)
    dokumen_pendukung = None
    if request.content_type and "multipart/form-data" in request.content_type:
        file = request.files.get("dokumen") or request.files.get("dokumen_pendukung")
        if file and file.filename:
            upload_dir = os.path.abspath(os.path.join(current_app.root_path, "uploads", "donasi"))
            os.makedirs(upload_dir, exist_ok=True)
            ext = os.path.splitext(secure_filename(file.filename))[1].lower() or ".pdf"
            filename = f"{uuid4().hex}{ext}"
            file_path = os.path.join(upload_dir, filename)
            file.save(file_path)
            dokumen_pendukung = f"/uploads/donasi/{filename}"

    # Siasati kolom DB: Gabungkan data ke dalam JSON string
    payload_data = {
        "tipe_pemohon": tipe_pemohon,
        "lokasi": lokasi,
        "alasan_asli": str(alasan_kebutuhan).strip(),
        "nama_penerima": nama_penerima or "Tidak disebutkan",
        "alamat_penerima": alamat_penerima or "-"
    }
    alasan_kebutuhan_json = json.dumps(payload_data)

    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Insert ke DB (user_id adalah ID User A yang mengajukan)
        cursor.execute("""
            INSERT INTO pengajuan_donasi (user_id, dokumen_pendukung, alasan_kebutuhan, status_verifikasi)
            VALUES (%s, %s, %s, 'pending')
        """, (user_id, dokumen_pendukung, alasan_kebutuhan_json))

        connection.commit()
        return jsonify({
            "status": "success",
            "message": "Permohonan donasi berhasil diajukan. Menunggu verifikasi admin.",
            "data": {"pengajuan_id": cursor.lastrowid}
        }), 201

    except Exception:
        if connection: connection.rollback()
        return jsonify({"status": "error", "message": "Terjadi kesalahan sistem"}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()


# ---------------------------------------------------------------------------
# GET endpoint – List Penerima Terverifikasi (User C)
# ---------------------------------------------------------------------------
@donasi_bp.get('/api/penerima')
def get_penerima_list():
    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT pengajuan_id, user_id, alasan_kebutuhan
            FROM pengajuan_donasi
            WHERE status_verifikasi = 'disetujui'
        """)
        rows = cursor.fetchall()

        for row in rows:
            try:
                data = json.loads(row['alasan_kebutuhan'])
                row['nama_penerima'] = data.get('nama_penerima', 'Tidak disebutkan')
                row['alamat_penerima'] = data.get('alamat_penerima', '-')
                row['alasan_asli'] = data.get('alasan_asli', '-')
                row['tipe_pemohon'] = data.get('tipe_pemohon', 'perorangan')
            except (json.JSONDecodeError, TypeError):
                row['nama_penerima'] = 'Data Lama'
                row['alamat_penerima'] = '-'
                row['alasan_asli'] = row['alasan_kebutuhan']

        return jsonify({"status": "success", "data": rows}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()


@donasi_bp.get('/api/donasi/pengajuan/saya')
@token_required
def get_pengajuan_donasi_saya():
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT pengajuan_id, user_id, dokumen_pendukung, alasan_kebutuhan, status_verifikasi
            FROM pengajuan_donasi
            WHERE user_id = %s
            ORDER BY pengajuan_id DESC
        """, (user_id,))
        rows = cursor.fetchall()

        # Parse JSON alasan_kebutuhan agar konsisten
        for row in rows:
            try:
                data = json.loads(row['alasan_kebutuhan'])
                row['tipe_pemohon'] = data.get('tipe_pemohon', 'perorangan')
                row['lokasi'] = data.get('lokasi', '-')
                row['alasan_asli'] = data.get('alasan_asli', row['alasan_kebutuhan'])
            except (json.JSONDecodeError, TypeError):
                row['tipe_pemohon'] = 'perorangan'
                row['lokasi'] = '-'
                row['alasan_asli'] = row['alasan_kebutuhan']

        return jsonify({
            "status": "success",
            "data": rows
        }), 200

    except Exception:
        import logging
        logging.exception("Gagal mengambil riwayat pengajuan donasi")
        return jsonify({"status": "error", "message": "Terjadi kesalahan sistem"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@donasi_bp.get("/uploads/donasi/<path:filename>")
def serve_donasi_dokumen(filename):
    return send_from_directory(
        os.path.join(current_app.root_path, "uploads", "donasi"),
        filename
    )


# ---------------------------------------------------------------------------
# CHUNK 3: ADMIN VERIFIKASI
# ---------------------------------------------------------------------------

@donasi_bp.get('/api/admin/donasi')
@admin_required
def admin_get_donasi():
    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT d.donasi_id, d.barang_id, b.nama_barang, u.nama AS nama_donor, 
                   d.status_verifikasi, d.status_donasi
            FROM donasi d
            JOIN barang b ON d.barang_id = b.barang_id
            JOIN user u ON d.donor_id = u.user_id
            ORDER BY d.donasi_id DESC
        """)
        return jsonify({"status": "success", "data": cursor.fetchall()}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()


@donasi_bp.post('/api/admin/donasi/<int:donasi_id>/verify')
@admin_required
def admin_verify_donasi(donasi_id):
    body = request.get_json(silent=True) or {}
    action = body.get('status')
    if action not in ('terima', 'tolak'):
        return jsonify({"status": "error", "message": "Parameter 'status' harus 'terima' atau 'tolak'"}), 400

    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM donasi WHERE donasi_id = %s FOR UPDATE", (donasi_id,))
        donasi = cursor.fetchone()
        if not donasi:
            return jsonify({"status": "error", "message": "Data donasi tidak ditemukan"}), 404

        new_verif = 'disetujui' if action == 'terima' else 'ditolak'
        cursor.execute("UPDATE donasi SET status_verifikasi = %s WHERE donasi_id = %s", (new_verif, donasi_id))
        connection.commit()

        return jsonify({"status": "success", "message": f"Donasi berhasil di-{new_verif}"}), 200
    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()



@donasi_bp.get('/api/admin/donasi/pengajuan')
@admin_required
def admin_get_pengajuan_donasi():
    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT p.pengajuan_id, p.user_id, u.nama AS nama_pemohon, p.alasan_kebutuhan, 
                   p.dokumen_pendukung, p.status_verifikasi
            FROM pengajuan_donasi p
            JOIN user u ON p.user_id = u.user_id
            ORDER BY p.pengajuan_id DESC
        """)
        rows = cursor.fetchall()
        
        # Parse JSON alasan_kebutuhan
        for row in rows:
            try:
                data = json.loads(row['alasan_kebutuhan'])
                row['tipe_pemohon'] = data.get('tipe_pemohon', 'perorangan')
                row['lokasi'] = data.get('lokasi', '-')
                row['alasan_asli'] = data.get('alasan_asli', row['alasan_kebutuhan'])
            except (json.JSONDecodeError, TypeError):
                # Fallback jika data lama (bukan JSON)
                row['tipe_pemohon'] = 'perorangan'
                row['lokasi'] = '-'
                row['alasan_asli'] = row['alasan_kebutuhan']

        return jsonify({"status": "success", "data": rows}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()


@donasi_bp.post('/api/admin/donasi/pengajuan/<int:pengajuan_id>/verify')
@admin_required
def admin_verify_pengajuan(pengajuan_id):
    body = request.get_json(silent=True) or {}
    action = body.get('status')
    if action not in ('terima', 'tolak'):
        return jsonify({"status": "error", "message": "Parameter 'status' harus 'terima' atau 'tolak'"}), 400

    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM pengajuan_donasi WHERE pengajuan_id = %s FOR UPDATE", (pengajuan_id,))
        pengajuan = cursor.fetchone()
        if not pengajuan:
            return jsonify({"status": "error", "message": "Pengajuan tidak ditemukan"}), 404

        new_verif = 'disetujui' if action == 'terima' else 'ditolak'
        cursor.execute("UPDATE pengajuan_donasi SET status_verifikasi = %s WHERE pengajuan_id = %s", (new_verif, pengajuan_id))
        
        # LOGIKA BARU: Jika yayasan disetujui, buatkan akun user [YAYASAN]
        if new_verif == 'disetujui':
            try:
                data_alasan = json.loads(pengajuan['alasan_kebutuhan'])
                tipe_pemohon = data_alasan.get('tipe_pemohon')
                
                if tipe_pemohon == 'yayasan':
                    # Ambil data user pemohon untuk dijadikan email yayasan
                    cursor.execute("SELECT nama, email FROM user WHERE user_id = %s", (pengajuan['user_id'],))
                    user_pemohon = cursor.fetchone()
                    
                    if user_pemohon:
                        # Buat email dummy yayasan dari email pemohon
                        email_yayasan = f"yayasan_{user_pemohon['email']}"
                        
                        # Cek apakah sudah ada
                        cursor.execute("SELECT user_id FROM user WHERE email = %s", (email_yayasan,))
                        if not cursor.fetchone():
                            nama_yayasan = f"[YAYASAN] {user_pemohon['nama']}"
                            # Gunakan password default atau hash acak
                            hashed_pw = generate_password_hash('Yayasan123!')
                            cursor.execute("""
                                INSERT INTO user (nama, email, password, alamat, role)
                                VALUES (%s, %s, %s, %s, 'pengguna')
                            """, (nama_yayasan, email_yayasan, hashed_pw, data_alasan.get('lokasi')))
            except Exception as e:
                # Abaikan error parsing jika data lama tidak berbentuk JSON
                pass

        connection.commit()
        return jsonify({"status": "success", "message": f"Pengajuan berhasil di-{new_verif}"}), 200
    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()



# ---------------------------------------------------------------------------
# CHUNK 4: PENYALURAN & UPDATE STATUS
# ---------------------------------------------------------------------------

@donasi_bp.post('/api/admin/donasi/<int:donasi_id>/salurkan')
@admin_required
def admin_salurkan_donasi(donasi_id):
    body = request.get_json(silent=True) or {}
    pengajuan_id = body.get('pengajuan_id')

    if not pengajuan_id:
        return jsonify({"status": "error", "message": "pengajuan_id wajib diisi"}), 400

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # 1. Cek apakah donasi ada
        cursor.execute("SELECT * FROM donasi WHERE donasi_id = %s FOR UPDATE", (donasi_id,))
        donasi = cursor.fetchone()
        if not donasi:
            return jsonify({"status": "error", "message": "Data donasi tidak ditemukan"}), 404

        if donasi['status_donasi'] != 'tersedia':
            return jsonify({"status": "error", "message": f"Status donasi saat ini '{donasi['status_donasi']}', hanya bisa disalurkan jika 'tersedia'"}), 400

        # 2. Cek apakah pengajuan ada & sudah disetujui
        cursor.execute("SELECT * FROM pengajuan_donasi WHERE pengajuan_id = %s FOR UPDATE", (pengajuan_id,))
        pengajuan = cursor.fetchone()
        if not pengajuan:
            return jsonify({"status": "error", "message": "Pengajuan penerima tidak ditemukan"}), 404
        if pengajuan['status_verifikasi'] != 'disetujui':
            return jsonify({"status": "error", "message": "Pengajuan penerima belum disetujui admin"}), 400

        # 3. Update tabel donasi (set penerima & status diproses)
        cursor.execute("""
            UPDATE donasi 
            SET penerima_id = %s, pengajuan_id = %s, status_donasi = 'diproses'
            WHERE donasi_id = %s
        """, (pengajuan['user_id'], pengajuan_id, donasi_id))

        # 4. Update status barang menjadi 'didonasikan'
        cursor.execute("UPDATE barang SET status_barang = 'didonasikan' WHERE barang_id = %s", (donasi['barang_id'],))

        connection.commit()
        return jsonify({"status": "success", "message": "Donasi berhasil disalurkan ke penerima."}), 200

    except Exception:
        if connection: connection.rollback()
        import logging
        logging.exception("Gagal menyalurkan donasi")
        return jsonify({"status": "error", "message": "Terjadi kesalahan sistem"}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()



@donasi_bp.patch('/api/donasi/<int:donasi_id>/status')
@admin_required  # <-- HANYA ADMIN yang bisa mengubah status
def update_status_donasi(donasi_id):
    """
    Admin mengonfirmasi bahwa barang sudah dikirim (disalurkan) 
    dan/atau sudah diterima (selesai) oleh penerima.
    Body: {"status": "disalurkan"} atau {"status": "selesai"}
    """
    body = request.get_json(silent=True) or {}
    new_status = body.get('status')
    
    if new_status not in ('disalurkan', 'selesai'):
        return jsonify({"status": "error", "message": "Status harus 'disalurkan' atau 'selesai'"}), 400

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM donasi WHERE donasi_id = %s FOR UPDATE", (donasi_id,))
        donasi = cursor.fetchone()
        
        if not donasi:
            return jsonify({"status": "error", "message": "Donasi tidak ditemukan"}), 404

        # Validasi alur transisi
        current_status = donasi['status_donasi']
        
        if new_status == 'disalurkan' and current_status != 'diproses':
            return jsonify({"status": "error", "message": f"Status saat ini '{current_status}', harus 'diproses' untuk diubah ke 'disalurkan'"}), 400
        elif new_status == 'selesai' and current_status != 'disalurkan':
            return jsonify({"status": "error", "message": f"Status saat ini '{current_status}', harus 'disalurkan' untuk diubah ke 'selesai'"}), 400

        # Update status di database
        cursor.execute("UPDATE donasi SET status_donasi = %s WHERE donasi_id = %s", (new_status, donasi_id))
        connection.commit()

        return jsonify({"status": "success", "message": f"Status donasi berhasil diperbarui menjadi '{new_status}'"}), 200

    except Exception:
        if connection: connection.rollback()
        import logging
        logging.exception("Gagal update status donasi")
        return jsonify({"status": "error", "message": "Terjadi kesalahan sistem"}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()
