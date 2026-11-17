from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation
from flask import Blueprint, jsonify, request, g
from database import get_db_connection
from routes.auth_utils import token_required

lelang_bp = Blueprint("lelang", __name__)

def _get_user_id_from_g(current_user):
    sub = current_user.get("sub")
    try:
        return int(sub) if sub is not None else None
    except (TypeError, ValueError):
        return None

def _parse_datetime(dt_str):
    if not dt_str:
        return None
    dt_str = str(dt_str).strip().replace("T", " ")
    if dt_str.endswith("Z"):
        dt_str = dt_str[:-1]
    formats = ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"]
    for fmt in formats:
        try:
            return datetime.strptime(dt_str.split(".")[0], fmt)
        except ValueError:
            continue
    return None

def _sync_lelang_status(cursor):
    # 1. Pending -> Berlangsung
    cursor.execute("""
        UPDATE lelang SET status_lelang = 'berlangsung'
        WHERE status_lelang = 'pending' AND NOW() >= waktu_mulai
    """)

    # 2. Berlangsung -> Selesai
    cursor.execute("""
        SELECT lelang_id, barang_id, pemenang_id, penjual_id
        FROM lelang
        WHERE status_lelang = 'berlangsung' AND NOW() >= waktu_selesai
    """)
    expired = cursor.fetchall()
    
    for row in expired:
        cursor.execute("""
            SELECT p.user_id, p.jumlah_penawaran
            FROM penawaran_lelang p
            WHERE p.lelang_id = %s
            ORDER BY p.jumlah_penawaran DESC, p.penawaran_id ASC LIMIT 1
        """, (row["lelang_id"],))
        highest_bid = cursor.fetchone()

        pemenang_id = highest_bid["user_id"] if highest_bid else None
        harga_final = highest_bid["jumlah_penawaran"] if highest_bid else None

        cursor.execute("""
            UPDATE lelang SET status_lelang = 'selesai', pemenang_id = %s, harga_tertinggi = %s
            WHERE lelang_id = %s
        """, (pemenang_id, harga_final, row["lelang_id"]))

        if pemenang_id:
            # Cek anti-duplikat transaksi
            cursor.execute("SELECT transaksi_id FROM transaksi WHERE barang_id = %s", (row["barang_id"],))
            if not cursor.fetchone():
                # Buat Transaksi
                cursor.execute("""
                    INSERT INTO transaksi (barang_id, penjual_id, pembeli_id, metode_pembayaran, status_transaksi)
                    VALUES (%s, %s, %s, 'Transfer', 'menunggu_pembayaran')
                """, (row["barang_id"], row["penjual_id"], pemenang_id))
                transaksi_id = cursor.lastrowid
                
                # Simpan Harga ke Pembayaran
                cursor.execute("""
                    INSERT INTO pembayaran (transaksi_id, jumlah, metode_pembayaran, status_verifikasi)
                    VALUES (%s, %s, 'Transfer', 'menunggu')
                """, (transaksi_id, float(harga_final)))

            cursor.execute("UPDATE barang SET status_barang = 'terjual' WHERE barang_id = %s", (row["barang_id"],))
        else:
            cursor.execute("UPDATE barang SET status_barang = 'tersedia' WHERE barang_id = %s", (row["barang_id"],))


# =========================================================================== #
# CHUNK 1: INISIASI & LISTING
# =========================================================================== #
@lelang_bp.post("/api/lelang")
@token_required
def create_lelang():
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    body = request.get_json(silent=True) or {}
    barang_id = body.get("barang_id")
    harga_awal = body.get("harga_awal")
    waktu_mulai_raw = body.get("waktu_mulai")
    durasi_jam = body.get("durasi_jam")
    waktu_selesai_raw = body.get("waktu_selesai") if not durasi_jam else None

    if not barang_id or harga_awal is None or not waktu_mulai_raw:
        return jsonify({"status": "error", "message": "barang_id, harga_awal, dan waktu_mulai wajib diisi"}), 400

    try:
        harga_decimal = Decimal(str(harga_awal))
        if harga_decimal <= Decimal("0"):
            raise ValueError
    except (InvalidOperation, TypeError, ValueError):
        return jsonify({"status": "error", "message": "Format harga_awal tidak valid"}), 400

    dt_mulai = _parse_datetime(waktu_mulai_raw)
    if not dt_mulai:
        return jsonify({"status": "error", "message": "Format waktu_mulai tidak valid"}), 400

    if durasi_jam:
        try:
            dt_selesai = dt_mulai + timedelta(hours=int(durasi_jam))
        except ValueError:
            return jsonify({"status": "error", "message": "durasi_jam harus angka"}), 400
    else:
        if not waktu_selesai_raw:
            return jsonify({"status": "error", "message": "waktu_selesai atau durasi_jam wajib diisi"}), 400
        dt_selesai = _parse_datetime(waktu_selesai_raw)
        if not dt_selesai:
            return jsonify({"status": "error", "message": "Format waktu_selesai tidak valid"}), 400

    if dt_selesai <= dt_mulai:
        return jsonify({"status": "error", "message": "waktu_selesai harus lebih besar dari waktu_mulai"}), 400

    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT barang_id, pemilik_id, status_barang, tipe_transaksi, harga
            FROM barang WHERE barang_id = %s FOR UPDATE
        """, (barang_id,))
        barang = cursor.fetchone()
        if not barang:
            return jsonify({"status": "error", "message": "Barang tidak ditemukan"}), 404

        if float(barang["harga"]) <= 5_000_000:
            return jsonify({"status": "error", "message": "Barang harus memiliki harga di atas Rp 5.000.000"}), 400

        if barang["pemilik_id"] != user_id:
            return jsonify({"status": "error", "message": "Akses ditolak: Anda bukan pemilik barang"}), 403
        if barang["tipe_transaksi"] != "lelang":
            return jsonify({"status": "error", "message": "Barang ini tidak didaftarkan untuk lelang"}), 400
        if barang["status_barang"] != "tersedia":
            return jsonify({"status": "error", "message": f"Barang berstatus '{barang['status_barang']}', hanya 'tersedia' yang bisa dilelang"}), 400

        cursor.execute("SELECT lelang_id FROM lelang WHERE barang_id = %s AND status_lelang IN ('pending','berlangsung') LIMIT 1", (barang_id,))
        if cursor.fetchone():
            return jsonify({"status": "error", "message": "Barang ini sudah berada dalam lelang aktif"}), 409

        initial_status = "berlangsung" if dt_mulai <= datetime.now() < dt_selesai else "pending"

        cursor.execute("""
            INSERT INTO lelang (barang_id, penjual_id, harga_awal, harga_tertinggi, waktu_mulai, waktu_selesai, status_lelang)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (barang_id, user_id, float(harga_decimal), float(harga_decimal), dt_mulai, dt_selesai, initial_status))
        
        lelang_id = cursor.lastrowid
        cursor.execute("UPDATE barang SET status_barang = 'dilelang' WHERE barang_id = %s", (barang_id,))
        connection.commit()

        return jsonify({"status": "success", "message": "Lelang berhasil dibuat", "data": {"lelang_id": lelang_id, "status": initial_status}}), 201
    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()

@lelang_bp.get("/api/lelang")
def get_lelang_list():
    status_filter = request.args.get("status", "berlangsung").lower()
    kategori_id = request.args.get("kategori_id", type=int)
    search = request.args.get("search", "").strip()

    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        _sync_lelang_status(cursor)
        connection.commit()

        query = """
            SELECT l.*, b.nama_barang, b.foto_barang, k.nama_kategori, u.nama AS nama_penjual
            FROM lelang l
            JOIN barang b ON l.barang_id = b.barang_id
            LEFT JOIN kategori k ON b.kategori_id = k.kategori_id
            JOIN user u ON l.penjual_id = u.user_id
            WHERE 1=1
        """
        params = []
        if status_filter != "semua" and status_filter in ("pending", "berlangsung", "selesai", "dibatalkan"):
            query += " AND l.status_lelang = %s"
            params.append(status_filter)
        
        if kategori_id:
            query += " AND b.kategori_id = %s"
            params.append(kategori_id)
        if search:
            query += " AND (b.nama_barang LIKE %s OR b.deskripsi LIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])

        query += " ORDER BY l.lelang_id DESC"
        cursor.execute(query, tuple(params))
        
        rows = cursor.fetchall()
        for r in rows:
            if isinstance(r.get("waktu_mulai"), datetime):
                r["waktu_mulai"] = r["waktu_mulai"].strftime("%Y-%m-%d %H:%M:%S")
            if isinstance(r.get("waktu_selesai"), datetime):
                r["waktu_selesai"] = r["waktu_selesai"].strftime("%Y-%m-%d %H:%M:%S")

        return jsonify({"status": "success", "data": rows}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()

@lelang_bp.get("/api/lelang/<int:lelang_id>")
def get_lelang_detail(lelang_id):
    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        _sync_lelang_status(cursor)
        connection.commit()

        cursor.execute("""
            SELECT l.*, b.nama_barang, b.foto_barang, u.nama AS nama_penjual
            FROM lelang l
            JOIN barang b ON l.barang_id = b.barang_id
            JOIN user u ON l.penjual_id = u.user_id
            WHERE l.lelang_id = %s
        """, (lelang_id,))
        lelang = cursor.fetchone()
        if not lelang:
            return jsonify({"status": "error", "message": "Lelang tidak ditemukan"}), 404

        cursor.execute("""
            SELECT p.*, u.nama AS nama_penawar
            FROM penawaran_lelang p
            JOIN user u ON p.user_id = u.user_id
            WHERE p.lelang_id = %s
            ORDER BY p.jumlah_penawaran DESC LIMIT 10
        """, (lelang_id,))
        bids = cursor.fetchall()

        for b in bids:
            if isinstance(b.get("waktu_penawaran"), datetime):
                b["waktu_penawaran"] = b["waktu_penawaran"].strftime("%Y-%m-%d %H:%M:%S")
        
        if isinstance(lelang.get("waktu_mulai"), datetime):
            lelang["waktu_mulai"] = lelang["waktu_mulai"].strftime("%Y-%m-%d %H:%M:%S")
        if isinstance(lelang.get("waktu_selesai"), datetime):
            lelang["waktu_selesai"] = lelang["waktu_selesai"].strftime("%Y-%m-%d %H:%M:%S")

        lelang["riwayat_penawaran"] = bids
        return jsonify({"status": "success", "data": lelang}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()

@lelang_bp.get("/api/lelang/penjual")
@token_required
def get_lelang_penjual():
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        _sync_lelang_status(cursor)
        connection.commit()

        cursor.execute("""
            SELECT l.*, b.nama_barang FROM lelang l JOIN barang b ON l.barang_id = b.barang_id
            WHERE l.penjual_id = %s ORDER BY l.lelang_id DESC
        """, (user_id,))
        rows = cursor.fetchall()

        for r in rows:
            if isinstance(r.get("waktu_mulai"), datetime):
                r["waktu_mulai"] = r["waktu_mulai"].strftime("%Y-%m-%d %H:%M:%S")
            if isinstance(r.get("waktu_selesai"), datetime):
                r["waktu_selesai"] = r["waktu_selesai"].strftime("%Y-%m-%d %H:%M:%S")

        return jsonify({"status": "success", "data": rows}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()

# =========================================================================== #
# CHUNK 2: BIDDING
# =========================================================================== #
@lelang_bp.post("/api/lelang/<int:lelang_id>/bid")
@token_required
def place_bid(lelang_id):
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    body = request.get_json(silent=True) or {}
    jumlah_raw = body.get("jumlah_penawaran")
    if jumlah_raw is None:
        return jsonify({"status": "error", "message": "jumlah_penawaran wajib diisi"}), 400

    try:
        bid_decimal = Decimal(str(jumlah_raw))
        if bid_decimal <= Decimal("0"):
            raise ValueError
    except (InvalidOperation, TypeError, ValueError):
        return jsonify({"status": "error", "message": "Format jumlah_penawaran tidak valid"}), 400

    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM lelang WHERE lelang_id = %s FOR UPDATE", (lelang_id,))
        lelang = cursor.fetchone()
        if not lelang:
            return jsonify({"status": "error", "message": "Lelang tidak ditemukan"}), 404

        now = datetime.now()
        if now >= lelang["waktu_selesai"]:
            cursor.execute("UPDATE lelang SET status_lelang = 'selesai' WHERE lelang_id = %s", (lelang_id,))
            connection.commit()
            return jsonify({"status": "error", "message": "Waktu lelang telah berakhir"}), 400

        if now < lelang["waktu_mulai"] or lelang["status_lelang"] == "pending":
            return jsonify({"status": "error", "message": "Lelang belum dimulai"}), 400
        if lelang["status_lelang"] != "berlangsung":
            return jsonify({"status": "error", "message": f"Lelang berstatus {lelang['status_lelang']}"}), 400
        if lelang["penjual_id"] == user_id:
            return jsonify({"status": "error", "message": "Tidak bisa menawar lelang sendiri"}), 403

        cursor.execute("SELECT COUNT(*) AS total_bid FROM penawaran_lelang WHERE lelang_id = %s", (lelang_id,))
        total_bid = cursor.fetchone()["total_bid"]

        harga_awal_dec = Decimal(str(lelang["harga_awal"]))
        if total_bid == 0:
            if bid_decimal < harga_awal_dec:
                return jsonify({"status": "error", "message": f"Tawaran minimal Rp {harga_awal_dec}"}), 400
        else:
            harga_tertinggi_dec = Decimal(str(lelang["harga_tertinggi"])) if lelang["harga_tertinggi"] else harga_awal_dec
            if bid_decimal <= harga_tertinggi_dec:
                return jsonify({"status": "error", "message": f"Tawaran harus > Rp {harga_tertinggi_dec}"}), 400

        cursor.execute("""
            INSERT INTO penawaran_lelang (lelang_id, user_id, jumlah_penawaran, waktu_penawaran)
            VALUES (%s, %s, %s, NOW())
        """, (lelang_id, user_id, float(bid_decimal)))
        
        cursor.execute("UPDATE lelang SET harga_tertinggi = %s, pemenang_id = %s WHERE lelang_id = %s", (float(bid_decimal), user_id, lelang_id))
        connection.commit()

        return jsonify({"status": "success", "message": "Penawaran berhasil diajukan", "data": {"jumlah_penawaran": float(bid_decimal)}}), 201
    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()

@lelang_bp.get("/api/lelang/<int:lelang_id>/bids")
def get_lelang_bids(lelang_id):
    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT lelang_id FROM lelang WHERE lelang_id = %s", (lelang_id,))
        if not cursor.fetchone():
            return jsonify({"status": "error", "message": "Lelang tidak ditemukan"}), 404

        cursor.execute("""
            SELECT p.*, u.nama AS nama_penawar FROM penawaran_lelang p
            JOIN user u ON p.user_id = u.user_id
            WHERE p.lelang_id = %s ORDER BY p.jumlah_penawaran DESC
        """, (lelang_id,))
        rows = cursor.fetchall()
        for r in rows:
            if isinstance(r.get("waktu_penawaran"), datetime):
                r["waktu_penawaran"] = r["waktu_penawaran"].strftime("%Y-%m-%d %H:%M:%S")

        return jsonify({"status": "success", "data": rows}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()

@lelang_bp.get("/api/lelang/saya/bids")
@token_required
def get_my_bids():
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT p.*, l.status_lelang, l.waktu_selesai, l.pemenang_id, (l.pemenang_id = %s) AS is_winning,
                   b.barang_id, b.nama_barang, b.foto_barang
            FROM penawaran_lelang p
            JOIN lelang l ON p.lelang_id = l.lelang_id
            JOIN barang b ON l.barang_id = b.barang_id
            WHERE p.user_id = %s ORDER BY p.penawaran_id DESC
        """, (user_id, user_id))
        rows = cursor.fetchall()
        for r in rows:
            if isinstance(r.get("waktu_penawaran"), datetime):
                r["waktu_penawaran"] = r["waktu_penawaran"].strftime("%Y-%m-%d %H:%M:%S")
            if isinstance(r.get("waktu_selesai"), datetime):
                r["waktu_selesai"] = r["waktu_selesai"].strftime("%Y-%m-%d %H:%M:%S")
        return jsonify({"status": "success", "data": rows}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()

# =========================================================================== #
# CHUNK 3: PENUTUPAN & PEMENANG
# =========================================================================== #
@lelang_bp.post("/api/lelang/<int:lelang_id>/close")
@token_required
def close_lelang(lelang_id):
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    is_admin = g.current_user.get("role") == "admin"

    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM lelang WHERE lelang_id = %s FOR UPDATE", (lelang_id,))
        lelang = cursor.fetchone()
        if not lelang:
            return jsonify({"status": "error", "message": "Lelang tidak ditemukan"}), 404
        if not is_admin and lelang["penjual_id"] != user_id:
            return jsonify({"status": "error", "message": "Akses ditolak"}), 403
        if lelang["status_lelang"] in ("selesai", "dibatalkan"):
            return jsonify({"status": "error", "message": f"Lelang sudah ditutup ({lelang['status_lelang']})"}), 400

        cursor.execute("""
            SELECT p.user_id, p.jumlah_penawaran, u.nama AS nama_pemenang
            FROM penawaran_lelang p JOIN user u ON p.user_id = u.user_id
            WHERE p.lelang_id = %s ORDER BY p.jumlah_penawaran DESC, p.penawaran_id ASC LIMIT 1
        """, (lelang_id,))
        highest_bid = cursor.fetchone()

        if highest_bid:
            pemenang_id = highest_bid["user_id"]
            harga_final = highest_bid["jumlah_penawaran"]

            cursor.execute("""
                UPDATE lelang SET status_lelang = 'selesai', pemenang_id = %s, harga_tertinggi = %s
                WHERE lelang_id = %s
            """, (pemenang_id, harga_final, lelang_id))

            cursor.execute("SELECT transaksi_id FROM transaksi WHERE barang_id = %s", (lelang["barang_id"],))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO transaksi (barang_id, penjual_id, pembeli_id, metode_pembayaran, status_transaksi)
                    VALUES (%s, %s, %s, 'Transfer', 'menunggu_pembayaran')
                """, (lelang["barang_id"], lelang["penjual_id"], pemenang_id))
                transaksi_id = cursor.lastrowid

                cursor.execute("""
                    INSERT INTO pembayaran (transaksi_id, jumlah, metode_pembayaran, status_verifikasi)
                    VALUES (%s, %s, 'Transfer', 'menunggu')
                """, (transaksi_id, float(harga_final)))

            cursor.execute("UPDATE barang SET status_barang = 'terjual' WHERE barang_id = %s", (lelang["barang_id"],))
            msg = f"Lelang selesai. Pemenang: {highest_bid['nama_pemenang']} (Rp {harga_final:,.2f})"
            res_data = {"pemenang_id": pemenang_id, "harga_akhir": float(harga_final)}
        else:
            cursor.execute("UPDATE lelang SET status_lelang = 'selesai', pemenang_id = NULL WHERE lelang_id = %s", (lelang_id,))
            cursor.execute("UPDATE barang SET status_barang = 'tersedia' WHERE barang_id = %s", (lelang["barang_id"],))
            msg = "Lelang ditutup tanpa pemenang. Barang dikembalikan ke 'tersedia'."
            res_data = {"pemenang_id": None}

        connection.commit()
        return jsonify({"status": "success", "message": msg, "data": res_data}), 200
    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()

@lelang_bp.post("/api/lelang/<int:lelang_id>/batal")
@token_required
def cancel_lelang(lelang_id):
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    is_admin = g.current_user.get("role") == "admin"

    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM lelang WHERE lelang_id = %s FOR UPDATE", (lelang_id,))
        lelang = cursor.fetchone()
        if not lelang:
            return jsonify({"status": "error", "message": "Lelang tidak ditemukan"}), 404
        if not is_admin and lelang["penjual_id"] != user_id:
            return jsonify({"status": "error", "message": "Akses ditolak"}), 403
        if lelang["status_lelang"] in ("selesai", "dibatalkan"):
            return jsonify({"status": "error", "message": "Lelang sudah tidak aktif"}), 400

        if not is_admin:
            cursor.execute("SELECT COUNT(*) AS total_bid FROM penawaran_lelang WHERE lelang_id = %s", (lelang_id,))
            if cursor.fetchone()["total_bid"] > 0:
                return jsonify({"status": "error", "message": "Tidak bisa batal jika sudah ada penawaran"}), 400

        cursor.execute("UPDATE lelang SET status_lelang = 'dibatalkan' WHERE lelang_id = %s", (lelang_id,))
        cursor.execute("UPDATE barang SET status_barang = 'tersedia' WHERE barang_id = %s", (lelang["barang_id"],))
        connection.commit()

        return jsonify({"status": "success", "message": "Lelang dibatalkan. Barang kembali 'tersedia'."}), 200
    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()

# =========================================================================== #
# CHUNK 4: BELI SEKARANG & LELANG DIMENANGKAN
# =========================================================================== #
@lelang_bp.post("/api/lelang/<int:lelang_id>/beli_sekarang")
@token_required
def beli_sekarang(lelang_id):
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM lelang WHERE lelang_id = %s FOR UPDATE", (lelang_id,))
        lelang = cursor.fetchone()
        if not lelang:
            return jsonify({"status": "error", "message": "Lelang tidak ditemukan"}), 404
        if lelang["status_lelang"] != "berlangsung":
            return jsonify({"status": "error", "message": "Lelang sudah tidak aktif"}), 400

        cursor.execute("SELECT * FROM barang WHERE barang_id = %s", (lelang["barang_id"],))
        barang = cursor.fetchone()
        if not barang:
            return jsonify({"status": "error", "message": "Barang tidak ditemukan"}), 404
        if barang["pemilik_id"] == user_id:
            return jsonify({"status": "error", "message": "Tidak bisa membeli barang sendiri"}), 403

        cursor.execute("SELECT transaksi_id FROM transaksi WHERE barang_id = %s", (barang["barang_id"],))
        if cursor.fetchone():
            return jsonify({"status": "error", "message": "Barang sudah dalam transaksi lain"}), 409

        cursor.execute("UPDATE lelang SET status_lelang = 'selesai', pemenang_id = %s, harga_tertinggi = %s WHERE lelang_id = %s", (user_id, barang["harga"], lelang_id))
        cursor.execute("UPDATE barang SET status_barang = 'terjual' WHERE barang_id = %s", (barang["barang_id"],))

        cursor.execute("""
            INSERT INTO transaksi (barang_id, penjual_id, pembeli_id, metode_pembayaran, status_transaksi)
            VALUES (%s, %s, %s, 'Transfer', 'menunggu_pembayaran')
        """, (barang["barang_id"], barang["pemilik_id"], user_id))
        transaksi_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO pembayaran (transaksi_id, jumlah, metode_pembayaran, status_verifikasi)
            VALUES (%s, %s, 'Transfer', 'menunggu')
        """, (transaksi_id, float(barang["harga"])))

        connection.commit()
        return jsonify({"status": "success", "message": "Beli langsung berhasil", "data": {"transaksi_id": transaksi_id, "total_harga": float(barang["harga"])}}), 200
    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()

@lelang_bp.get("/api/lelang/menang")
@token_required
def get_my_won_auctions():
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        _sync_lelang_status(cursor)
        connection.commit()

        cursor.execute("""
            SELECT l.*, b.nama_barang, b.foto_barang, u.nama AS nama_penjual
            FROM lelang l
            JOIN barang b ON l.barang_id = b.barang_id
            JOIN user u ON l.penjual_id = u.user_id
            WHERE l.pemenang_id = %s AND l.status_lelang = 'selesai'
            ORDER BY l.waktu_selesai DESC
        """, (user_id,))
        rows = cursor.fetchall()
        for r in rows:
            if isinstance(r.get("waktu_selesai"), datetime):
                r["waktu_selesai"] = r["waktu_selesai"].strftime("%Y-%m-%d %H:%M:%S")

        return jsonify({"status": "success", "data": rows}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()