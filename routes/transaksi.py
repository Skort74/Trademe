import os
from io import BytesIO
from uuid import uuid4
from flask import Blueprint, jsonify, request, g, current_app, send_from_directory
from werkzeug.utils import secure_filename
from PIL import Image
from database import get_db_connection
from routes.auth_utils import token_required, admin_required

transaksi_bp = Blueprint('transaksi', __name__)

# ---------------------------------------------------------------------------
# Helper: list of allowed payment methods (matches enum in database)
# ---------------------------------------------------------------------------
ALLOWED_METODE = {"COD", "Transfer"}


def _get_user_id_from_g(current_user):
    """Ekstraksi defensif user_id dari JWT payload."""
    if not isinstance(current_user, dict):
        return None
    sub = current_user.get("sub")
    try:
        return int(sub) if sub is not None else None
    except (TypeError, ValueError):
        return None


def _get_transaksi_for_user(transaksi_id, user_id, cursor, required_role=None):
    """
    Fetch transaksi dan validasi kepemilikan.
    required_role: 'pembeli', 'penjual', atau None (keduanya boleh).
    Returns (transaksi_dict, None) atau (None, (jsonify, status)).
    """
    cursor.execute("""
        SELECT t.*, b.nama_barang, b.harga 
        FROM transaksi t
        JOIN barang b ON t.barang_id = b.barang_id
        WHERE t.transaksi_id = %s
    """, (transaksi_id,))
    trans = cursor.fetchone()
    
    if not trans:
        return None, (jsonify({"status": "error", "message": "Transaksi tidak ditemukan"}), 404)
        
    is_pembeli = trans["pembeli_id"] == user_id
    is_penjual = trans["penjual_id"] == user_id
    
    if required_role == "pembeli" and not is_pembeli:
        return None, (jsonify({"status": "error", "message": "Akses ditolak: Anda bukan pembeli"}), 403)
    elif required_role == "penjual" and not is_penjual:
        return None, (jsonify({"status": "error", "message": "Akses ditolak: Anda bukan penjual"}), 403)
    elif required_role is None and not (is_pembeli or is_penjual):
        return None, (jsonify({"status": "error", "message": "Akses ditolak: Anda bukan pihak terkait transaksi"}), 403)
        
    return trans, None


@transaksi_bp.post('/api/transaksi')
@token_required
def create_transaksi():
    """Create a new purchase transaction.

    Body JSON must contain:
        {
            "barang_id": <int>,
            "metode_pembayaran": "COD" | "Transfer"
        }
    The buyer is taken from the JWT (g.current_user["sub"]).
    The endpoint validates:
        * barang exists, is of type 'jual', status 'tersedia', admin‑approved.
        * buyer is not the owner.
        * payment method is allowed.
        * no other active transaction exists for the barang.
    Uses a DB transaction with ``SELECT ... FOR UPDATE`` to prevent race
    conditions that could create duplicate active transactions.
    """
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"status": "error", "message": "Request harus berupa JSON"}), 400

    barang_id = body.get('barang_id')
    metode = body.get('metode_pembayaran')

    # Basic payload validation
    try:
        barang_id = int(barang_id)
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "barang_id harus berupa angka"}), 400

    if metode not in ALLOWED_METODE:
        return jsonify({"status": "error", "message": f"metode_pembayaran harus salah satu: {', '.join(ALLOWED_METODE)}"}), 400

    # Identify buyer from token payload
    current_user = g.current_user
    buyer_id = _get_user_id_from_g(current_user)
    if buyer_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        # Ensure we are in a transaction (autocommit disabled)
        connection.start_transaction()
        cursor = connection.cursor(dictionary=True)

        # -------------------------------------------------------------------
        # 1. Lock the barang row and validate its state
        # -------------------------------------------------------------------
        cursor.execute(
            "SELECT pemilik_id, tipe_transaksi, status_barang, status_verifikasi "
            "FROM barang WHERE barang_id = %s FOR UPDATE",
            (barang_id,)
        )
        barang = cursor.fetchone()
        if not barang:
            connection.rollback()
            return jsonify({"status": "error", "message": "Barang tidak ditemukan"}), 404

        if barang['tipe_transaksi'] != 'jual':
            connection.rollback()
            return jsonify({"status": "error", "message": "Barang bukan tipe jual"}), 400

        if barang['status_barang'] != 'tersedia':
            connection.rollback()
            return jsonify({"status": "error", "message": "Barang tidak tersedia untuk dibeli"}), 400

        if barang['status_verifikasi'] != 'disetujui':
            connection.rollback()
            return jsonify({"status": "error", "message": "Barang belum disetujui admin"}), 400

        if int(barang['pemilik_id']) == buyer_id:
            connection.rollback()
            return jsonify({"status": "error", "message": "Pembeli tidak dapat membeli barang miliknya sendiri"}), 403

        # -------------------------------------------------------------------
        # 2. Ensure no active transaction exists for this barang
        # -------------------------------------------------------------------
        cursor.execute(
            "SELECT transaksi_id FROM transaksi "
            "WHERE barang_id = %s AND status_transaksi NOT IN ('selesai', 'dibatalkan') "
            "FOR UPDATE",
            (barang_id,)
        )
        if cursor.fetchone():
            connection.rollback()
            return jsonify({"status": "error", "message": "Barang sudah memiliki transaksi aktif"}), 403

        # -------------------------------------------------------------------
        # 3. Insert the new transaction
        # -------------------------------------------------------------------
        # The enum's default status is 'menunggu_pembayaran', we set it explicitly
        cursor.execute(
            "INSERT INTO transaksi (barang_id, penjual_id, pembeli_id, metode_pembayaran, status_transaksi) "
            "VALUES (%s, %s, %s, %s, %s)",
            (barang_id, barang['pemilik_id'], buyer_id, metode, 'menunggu_pembayaran')
        )
        transaksi_id = cursor.lastrowid
        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Transaksi berhasil dibuat",
            "data": {
                "transaksi_id": transaksi_id,
                "barang_id": barang_id,
                "penjual_id": barang['pemilik_id'],
                "pembeli_id": buyer_id,
                "metode_pembayaran": metode,
                "status_transaksi": "menunggu_pembayaran"
            }
        }), 201

    except Exception:
        if connection is not None:
            connection.rollback()
        import logging
        logging.exception("Gagal membuat transaksi")
        return jsonify({"status": "error", "message": "Gagal membuat transaksi"}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()


@transaksi_bp.get('/api/transaksi/pembeli')
@token_required
def list_transaksi_pembeli():
    """Return all transactions where the logged‑in user is the buyer."""
    buyer_id = _get_user_id_from_g(g.current_user)
    if buyer_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM transaksi WHERE pembeli_id = %s ORDER BY tanggal_transaksi DESC",
            (buyer_id,)
        )
        rows = cursor.fetchall()
        return jsonify({"status": "success", "data": rows}), 200
    except Exception:
        import logging
        logging.exception("Gagal menampilkan transaksi pembeli")
        return jsonify({"status": "error", "message": "Gagal menampilkan transaksi"}), 500
    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()


@transaksi_bp.get('/api/transaksi/penjual')
@token_required
def list_transaksi_penjual():
    """Return all transactions where the logged‑in user is the seller (owner of the barang)."""
    seller_id = _get_user_id_from_g(g.current_user)
    if seller_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM transaksi WHERE penjual_id = %s ORDER BY tanggal_transaksi DESC",
            (seller_id,)
        )
        rows = cursor.fetchall()
        return jsonify({"status": "success", "data": rows}), 200
    except Exception:
        import logging
        logging.exception("Gagal menampilkan transaksi penjual")
        return jsonify({"status": "error", "message": "Gagal menampilkan transaksi"}), 500
    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()


@transaksi_bp.get('/api/transaksi/<int:transaksi_id>')
@token_required
def get_detail_transaksi(transaksi_id):
    """Detail view – only accessible by the buyer or seller involved in the transaction."""
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM transaksi WHERE transaksi_id = %s",
            (transaksi_id,)
        )
        trans = cursor.fetchone()
        if not trans:
            return jsonify({"status": "error", "message": "Transaksi tidak ditemukan"}), 404
        if user_id not in (trans['penjual_id'], trans['pembeli_id']):
            return jsonify({"status": "error", "message": "Akses ditolak: bukan pihak terkait transaksi"}), 403
        return jsonify({"status": "success", "data": trans}), 200
    except Exception:
        import logging
        logging.exception("Gagal mengambil detail transaksi")
        return jsonify({"status": "error", "message": "Gagal mengambil detail transaksi"}), 500
    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()


# ---------------------------------------------------------------------------
# POST endpoint – upload bukti pembayaran
# ---------------------------------------------------------------------------
@transaksi_bp.post('/api/transaksi/<int:transaksi_id>/bukti-bayar')
@token_required
def upload_bukti_bayar(transaksi_id):
    """
    Upload bukti transfer untuk transaksi oleh pembeli.
    - Validasi pembeli terkait transaksi.
    - Validasi metode Transfer & status_transaksi == 'menunggu_pembayaran'.
    - Validasi file (maks 5 MiB & Pillow verify).
    - Simpan file ke uploads/pembayaran/.
    - Update/insert tabel pembayaran (status_verifikasi='menunggu').
    - Update transaksi.status_transaksi -> 'menunggu_verifikasi'.
    """
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    # Validasi file ada di request
    file = request.files.get("photo") or request.files.get("bukti") or request.files.get("bukti_bayar") or request.files.get("bukti_pembayaran")
    if not file or not file.filename:
        return jsonify({"status": "error", "message": "Tidak ada file bukti pembayaran yang di-upload"}), 400

    # Validasi ukuran file (5 MiB)
    MAX = 5 * 1024 * 1024
    if request.content_length and request.content_length > MAX + 1024:
        return jsonify({"status": "error", "message": "Ukuran file melebihi 5 MiB"}), 413

    data = file.read()
    if len(data) > MAX:
        return jsonify({"status": "error", "message": "Ukuran file melebihi 5 MiB"}), 413

    # Validasi gambar dengan Pillow
    try:
        Image.open(BytesIO(data)).verify()
    except Exception:
        return jsonify({"status": "error", "message": "File bukan gambar valid"}), 400

    # Simpan file secara aman
    upload_dir = os.path.abspath(os.path.join(current_app.root_path, "uploads", "pembayaran"))
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(secure_filename(file.filename))[1].lower()
    if not ext:
        ext = ".jpg"
    filename = f"{uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, filename)
    with open(file_path, "wb") as f:
        f.write(data)

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        connection.start_transaction()
        cursor = connection.cursor(dictionary=True)

        # Validasi transaksi dan kepemilikan pembeli (lock row)
        cursor.execute("""
            SELECT t.*, b.harga
            FROM transaksi t
            JOIN barang b ON t.barang_id = b.barang_id
            WHERE t.transaksi_id = %s
            FOR UPDATE
        """, (transaksi_id,))
        trans = cursor.fetchone()

        if not trans:
            connection.rollback()
            if os.path.isfile(file_path):
                os.remove(file_path)
            return jsonify({"status": "error", "message": "Transaksi tidak ditemukan"}), 404

        if trans["pembeli_id"] != user_id:
            connection.rollback()
            if os.path.isfile(file_path):
                os.remove(file_path)
            return jsonify({"status": "error", "message": "Akses ditolak: Anda bukan pembeli"}), 403

        if trans["metode_pembayaran"] != "Transfer":
            connection.rollback()
            if os.path.isfile(file_path):
                os.remove(file_path)
            return jsonify({"status": "error", "message": "Upload bukti bayar hanya untuk metode Transfer"}), 400

        if trans["status_transaksi"] != "menunggu_pembayaran":
            connection.rollback()
            if os.path.isfile(file_path):
                os.remove(file_path)
            return jsonify({
                "status": "error",
                "message": f"Transaksi dengan status '{trans['status_transaksi']}' tidak dapat mengupload bukti pembayaran"
            }), 400

        rel_path = f"/uploads/pembayaran/{filename}"

        # Cek apakah record pembayaran sudah ada
        cursor.execute("SELECT pembayaran_id, bukti_pembayaran FROM pembayaran WHERE transaksi_id = %s", (transaksi_id,))
        pembayaran = cursor.fetchone()

        if pembayaran:
            old_foto = pembayaran.get("bukti_pembayaran")
            if old_foto:
                old_name = os.path.basename(old_foto)
                old_path = os.path.abspath(os.path.join(upload_dir, old_name))
                upload_root_real = os.path.realpath(upload_dir)
                if os.path.realpath(old_path).startswith(upload_root_real + os.sep) and os.path.isfile(old_path):
                    os.remove(old_path)

            cursor.execute("""
                UPDATE pembayaran
                SET bukti_pembayaran = %s, status_verifikasi = 'menunggu', tanggal_pembayaran = NOW()
                WHERE pembayaran_id = %s
            """, (rel_path, pembayaran["pembayaran_id"]))
        else:
            cursor.execute("""
                INSERT INTO pembayaran (transaksi_id, jumlah, metode_pembayaran, bukti_pembayaran, status_verifikasi, tanggal_pembayaran)
                VALUES (%s, %s, %s, %s, 'menunggu', NOW())
            """, (transaksi_id, trans["harga"], trans["metode_pembayaran"], rel_path))

        # Update status transaksi menjadi menunggu_verifikasi
        cursor.execute("""
            UPDATE transaksi
            SET status_transaksi = 'menunggu_verifikasi'
            WHERE transaksi_id = %s
        """, (transaksi_id,))

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Bukti pembayaran berhasil di-upload",
            "data": {
                "transaksi_id": transaksi_id,
                "status_transaksi": "menunggu_verifikasi",
                "bukti_pembayaran": rel_path,
                "photo_url": rel_path
            }
        }), 200

    except Exception:
        if connection:
            connection.rollback()
        if os.path.isfile(file_path):
            os.remove(file_path)
        import logging
        logging.exception("Gagal mengupload bukti pembayaran")
        return jsonify({"status": "error", "message": "Gagal mengupload bukti pembayaran"}), 500
    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()


# ---------------------------------------------------------------------------
# Static file serving – akses bukti pembayaran via URL
# ---------------------------------------------------------------------------
@transaksi_bp.get("/uploads/pembayaran/<path:filename>")
def serve_pembayaran_photo(filename):
    """Serve file bukti pembayaran dari folder uploads/pembayaran/."""
    return send_from_directory(
        os.path.join(current_app.root_path, "uploads", "pembayaran"),
        filename
    )


# ---------------------------------------------------------------------------
# POST endpoint – verifikasi bukti pembayaran oleh admin
# ---------------------------------------------------------------------------
@transaksi_bp.post('/api/admin/transaksi/<int:transaksi_id>/verify')
@admin_required
def verify_pembayaran(transaksi_id):
    """
    Admin memverifikasi atau menolak bukti pembayaran.
    Body: {"status": "terima"} atau {"status": "tolak"}
    """
    body = request.get_json(silent=True) or {}
    action = body.get('status')  # 'terima' atau 'tolak'
    
    if action not in ('terima', 'tolak'):
        return jsonify({"status": "error", "message": "Parameter 'status' harus 'terima' atau 'tolak'"}), 400

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Cek transaksi dan statusnya
        cursor.execute("SELECT * FROM transaksi WHERE transaksi_id = %s FOR UPDATE", (transaksi_id,))
        trans = cursor.fetchone()
        
        if not trans:
            return jsonify({"status": "error", "message": "Transaksi tidak ditemukan"}), 404
            
        if trans['status_transaksi'] != 'menunggu_verifikasi':
            return jsonify({"status": "error", "message": f"Transaksi berstatus '{trans['status_transaksi']}', bukan menunggu_verifikasi"}), 400

        # Cek apakah data pembayaran ada
        cursor.execute("SELECT * FROM pembayaran WHERE transaksi_id = %s", (transaksi_id,))
        pembayaran = cursor.fetchone()
        if not pembayaran:
            return jsonify({"status": "error", "message": "Data pembayaran tidak ditemukan"}), 404

        if action == 'terima':
            # Update pembayaran & transaksi
            cursor.execute("UPDATE pembayaran SET status_verifikasi = 'terverifikasi' WHERE transaksi_id = %s", (transaksi_id,))
            cursor.execute("UPDATE transaksi SET status_transaksi = 'diproses' WHERE transaksi_id = %s", (transaksi_id,))
            msg = "Pembayaran diverifikasi. Transaksi sedang diproses."
        else:
            # Update pembayaran & transaksi (kembalikan ke menunggu_pembayaran)
            cursor.execute("UPDATE pembayaran SET status_verifikasi = 'ditolak' WHERE transaksi_id = %s", (transaksi_id,))
            cursor.execute("UPDATE transaksi SET status_transaksi = 'menunggu_pembayaran' WHERE transaksi_id = %s", (transaksi_id,))
            msg = "Pembayaran ditolak. Pembeli harus mengunggah ulang bukti."

        connection.commit()
        return jsonify({"status": "success", "message": msg}), 200

    except Exception as e:
        if connection:
            connection.rollback()
        import logging
        logging.exception("Gagal verifikasi pembayaran")
        return jsonify({"status": "error", "message": "Gagal memproses verifikasi"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


# ---------------------------------------------------------------------------
# PATCH endpoint – ubah status transaksi (selesai / dibatalkan)
# ---------------------------------------------------------------------------
@transaksi_bp.patch('/api/transaksi/<int:transaksi_id>/status')
@token_required
def update_status_transaksi(transaksi_id):
    """
    Ubah status transaksi.
    - Pembeli: bisa set 'selesai' (saat status 'diproses') atau 'dibatalkan' (saat 'menunggu_pembayaran').
    - Penjual: bisa set 'dibatalkan' (saat 'menunggu_pembayaran').
    - Auto-update: jika 'selesai' -> barang 'terjual'. Jika 'dibatalkan' -> barang 'tersedia'.
    """
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    body = request.get_json(silent=True) or {}
    new_status = body.get('status')
    if new_status not in ('selesai', 'dibatalkan'):
        return jsonify({"status": "error", "message": "Status harus 'selesai' atau 'dibatalkan'"}), 400

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Ambil data transaksi dan lock
        cursor.execute("SELECT * FROM transaksi WHERE transaksi_id = %s FOR UPDATE", (transaksi_id,))
        trans = cursor.fetchone()
        if not trans:
            return jsonify({"status": "error", "message": "Transaksi tidak ditemukan"}), 404

        is_pembeli = trans['pembeli_id'] == user_id
        is_penjual = trans['penjual_id'] == user_id

        if not (is_pembeli or is_penjual):
            return jsonify({"status": "error", "message": "Akses ditolak: bukan pihak terkait"}), 403

        current_status = trans['status_transaksi']

        # Validasi aturan transisi
        if new_status == 'selesai':
            if not is_pembeli:
                return jsonify({"status": "error", "message": "Hanya pembeli yang dapat menyelesaikan transaksi"}), 403
            if current_status != 'diproses':
                return jsonify({"status": "error", "message": f"Transaksi berstatus '{current_status}', harus 'diproses' untuk diselesaikan"}), 400

            # Update transaksi
            cursor.execute("UPDATE transaksi SET status_transaksi = 'selesai' WHERE transaksi_id = %s", (transaksi_id,))
            # Auto-update barang jadi terjual
            cursor.execute("UPDATE barang SET status_barang = 'terjual' WHERE barang_id = %s", (trans['barang_id'],))
            msg = "Transaksi selesai. Barang telah terjual."

        elif new_status == 'dibatalkan':
            if current_status != 'menunggu_pembayaran':
                return jsonify({"status": "error", "message": f"Transaksi berstatus '{current_status}', hanya bisa dibatalkan saat 'menunggu_pembayaran'"}), 400

            # Update transaksi
            cursor.execute("UPDATE transaksi SET status_transaksi = 'dibatalkan' WHERE transaksi_id = %s", (transaksi_id,))
            # Auto-update barang jadi tersedia kembali
            cursor.execute("UPDATE barang SET status_barang = 'tersedia' WHERE barang_id = %s", (trans['barang_id'],))
            msg = "Transaksi dibatalkan. Barang tersedia kembali."

        connection.commit()
        return jsonify({"status": "success", "message": msg, "data": {"transaksi_id": transaksi_id, "status_transaksi": new_status}}), 200

    except Exception as e:
        if connection:
            connection.rollback()
        import logging
        logging.exception("Gagal update status transaksi")
        return jsonify({"status": "error", "message": "Gagal memproses update status"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
