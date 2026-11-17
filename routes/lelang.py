from datetime import datetime
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
    """
    Parse string datetime fleksibel (ISO 8601 atau 'YYYY-MM-DD HH:MM:SS').
    """
    if not dt_str:
        return None
    dt_str = str(dt_str).strip().replace("T", " ")
    if dt_str.endswith("Z"):
        dt_str = dt_str[:-1]
    
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(dt_str.split(".")[0], fmt)
        except ValueError:
            continue
    return None


def _sync_lelang_status(cursor):
    """
    Helper untuk sinkronisasi status lelang berbasis waktu:
    - pending -> berlangsung (jika NOW >= waktu_mulai dan NOW < waktu_selesai)
    - berlangsung/pending -> selesai (jika NOW >= waktu_selesai)
    """
    try:
        # Update pending -> berlangsung
        cursor.execute("""
            UPDATE lelang
            SET status_lelang = 'berlangsung'
            WHERE status_lelang = 'pending'
              AND NOW() >= waktu_mulai
              AND NOW() < waktu_selesai
        """)

        # Ambil lelang yang baru saja habis waktu tapi masih berlangsung
        cursor.execute("""
            SELECT l.lelang_id, l.barang_id,
                   (SELECT user_id FROM penawaran_lelang 
                    WHERE lelang_id = l.lelang_id 
                    ORDER BY jumlah_penawaran DESC, penawaran_id ASC LIMIT 1) AS pemenang_id
            FROM lelang l
            WHERE l.status_lelang IN ('pending', 'berlangsung')
              AND NOW() >= l.waktu_selesai
        """)
        expired = cursor.fetchall()

        for item in expired:
            pemenang = item.get("pemenang_id")
            cursor.execute("""
                UPDATE lelang
                SET status_lelang = 'selesai',
                    pemenang_id = %s
                WHERE lelang_id = %s
            """, (pemenang, item["lelang_id"]))

            # Jika ada pemenang tandai terjual, jika tidak kembalikan ke tersedia
            if pemenang:
                cursor.execute("""
                    UPDATE barang SET status_barang = 'terjual' WHERE barang_id = %s
                """, (item["barang_id"],))
            else:
                cursor.execute("""
                    UPDATE barang SET status_barang = 'tersedia' WHERE barang_id = %s
                """, (item["barang_id"],))

    except Exception:
        pass


# ===========================================================================
# CHUNK 1: INISIASI & LISTING LELANG
# ===========================================================================

@lelang_bp.post('/api/lelang')
@token_required
def create_lelang():
    """
    Penjual membuka / mendaftarkan barang lelang.
    Body: {"barang_id": 1, "harga_awal": 500000, "waktu_mulai": "...", "waktu_selesai": "..."}
    """
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    body = request.get_json(silent=True) or {}
    barang_id = body.get('barang_id')
    harga_awal = body.get('harga_awal')
    waktu_mulai_raw = body.get('waktu_mulai')
    waktu_selesai_raw = body.get('waktu_selesai')

    if not barang_id:
        return jsonify({"status": "error", "message": "barang_id wajib diisi"}), 400
    if harga_awal is None:
        return jsonify({"status": "error", "message": "harga_awal wajib diisi"}), 400
    if not waktu_mulai_raw or not waktu_selesai_raw:
        return jsonify({"status": "error", "message": "waktu_mulai dan waktu_selesai wajib diisi"}), 400

    try:
        harga_decimal = Decimal(str(harga_awal))
        if harga_decimal <= Decimal('0'):
            return jsonify({"status": "error", "message": "harga_awal harus lebih besar dari 0"}), 400
    except (InvalidOperation, TypeError, ValueError):
        return jsonify({"status": "error", "message": "Format harga_awal tidak valid"}), 400

    dt_mulai = _parse_datetime(waktu_mulai_raw)
    dt_selesai = _parse_datetime(waktu_selesai_raw)

    if not dt_mulai or not dt_selesai:
        return jsonify({
            "status": "error",
            "message": "Format waktu tidak valid. Gunakan format 'YYYY-MM-DD HH:MM:SS'"
        }), 400

    if dt_selesai <= dt_mulai:
        return jsonify({"status": "error", "message": "waktu_selesai harus lebih besar dari waktu_mulai"}), 400

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT barang_id, pemilik_id, status_barang, status_verifikasi, tipe_transaksi
            FROM barang
            WHERE barang_id = %s FOR UPDATE
        """, (barang_id,))
        barang = cursor.fetchone()

        if not barang:
            return jsonify({"status": "error", "message": "Barang tidak ditemukan"}), 404
        if barang['pemilik_id'] != user_id:
            return jsonify({"status": "error", "message": "Akses ditolak: Anda bukan pemilik barang ini"}), 403
        if barang['tipe_transaksi'] != 'lelang':
            return jsonify({"status": "error", "message": "Barang ini tidak didaftarkan untuk tipe transaksi 'lelang'"}), 400
        if barang['status_barang'] != 'tersedia':
            return jsonify({
                "status": "error", 
                "message": f"Barang berstatus '{barang['status_barang']}', hanya barang 'tersedia' yang dapat dilelang"
            }), 400

        cursor.execute("""
            SELECT lelang_id FROM lelang
            WHERE barang_id = %s AND status_lelang IN ('pending', 'berlangsung')
            LIMIT 1
        """, (barang_id,))
        if cursor.fetchone():
            return jsonify({"status": "error", "message": "Barang ini sudah berada dalam lelang yang aktif"}), 409

        now = datetime.now()
        initial_status = 'berlangsung' if dt_mulai <= now < dt_selesai else 'pending'

        cursor.execute("""
            INSERT INTO lelang (barang_id, penjual_id, harga_awal, harga_tertinggi, waktu_mulai, waktu_selesai, status_lelang)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (barang_id, user_id, float(harga_decimal), float(harga_decimal), dt_mulai, dt_selesai, initial_status))
        
        lelang_id = cursor.lastrowid
        cursor.execute("UPDATE barang SET status_barang = 'dilelang' WHERE barang_id = %s", (barang_id,))
        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Barang lelang berhasil didaftarkan",
            "data": {
                "lelang_id": lelang_id,
                "barang_id": barang_id,
                "harga_awal": float(harga_decimal),
                "waktu_mulai": dt_mulai.strftime("%Y-%m-%d %H:%M:%S"),
                "waktu_selesai": dt_selesai.strftime("%Y-%m-%d %H:%M:%S"),
                "status_lelang": initial_status
            }
        }), 201

    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()


@lelang_bp.get('/api/lelang')
def get_lelang_list():
    """Katalog lelang publik dengan filter status, kategori, dan pencarian."""
    status_filter = request.args.get('status', 'berlangsung').lower()
    kategori_id = request.args.get('kategori_id', type=int)
    search = request.args.get('search', '').strip()

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        _sync_lelang_status(cursor)
        connection.commit()

        query = """
            SELECT l.lelang_id, l.barang_id, b.nama_barang, b.deskripsi, b.foto_barang, b.kondisi, b.lokasi,
                   b.kategori_id, k.nama_kategori,
                   l.penjual_id, u_penjual.nama AS nama_penjual,
                   l.harga_awal, l.harga_tertinggi, l.waktu_mulai, l.waktu_selesai, l.status_lelang,
                   l.pemenang_id, u_pemenang.nama AS nama_pemenang,
                   (SELECT COUNT(*) FROM penawaran_lelang WHERE lelang_id = l.lelang_id) AS total_bid
            FROM lelang l
            JOIN barang b ON l.barang_id = b.barang_id
            JOIN user u_penjual ON l.penjual_id = u_penjual.user_id
            LEFT JOIN kategori k ON b.kategori_id = k.kategori_id
            LEFT JOIN user u_pemenang ON l.pemenang_id = u_pemenang.user_id
            WHERE 1=1
        """
        params = []

        if status_filter != 'semua':
            if status_filter in ('pending', 'berlangsung', 'selesai', 'dibatalkan'):
                query += " AND l.status_lelang = %s"
                params.append(status_filter)
            else:
                query += " AND l.status_lelang = 'berlangsung'"

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


@lelang_bp.get('/api/lelang/<int:lelang_id>')
def get_lelang_detail(lelang_id):
    """Detail lengkap lelang beserta 10 tawaran tertinggi."""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        _sync_lelang_status(cursor)
        connection.commit()

        cursor.execute("""
            SELECT l.lelang_id, l.barang_id, b.nama_barang, b.deskripsi, b.foto_barang, b.kondisi, b.lokasi,
                   b.kategori_id, k.nama_kategori,
                   l.penjual_id, u_penjual.nama AS nama_penjual, u_penjual.foto_profil AS foto_penjual,
                   l.harga_awal, l.harga_tertinggi, l.waktu_mulai, l.waktu_selesai, l.status_lelang,
                   l.pemenang_id, u_pemenang.nama AS nama_pemenang
            FROM lelang l
            JOIN barang b ON l.barang_id = b.barang_id
            JOIN user u_penjual ON l.penjual_id = u_penjual.user_id
            LEFT JOIN kategori k ON b.kategori_id = k.kategori_id
            LEFT JOIN user u_pemenang ON l.pemenang_id = u_pemenang.user_id
            WHERE l.lelang_id = %s
        """, (lelang_id,))
        lelang = cursor.fetchone()

        if not lelang:
            return jsonify({"status": "error", "message": "Lelang tidak ditemukan"}), 404

        cursor.execute("""
            SELECT p.penawaran_id, p.user_id, u.nama AS nama_penawar, p.jumlah_penawaran, p.waktu_penawaran
            FROM penawaran_lelang p
            JOIN user u ON p.user_id = u.user_id
            WHERE p.lelang_id = %s
            ORDER BY p.jumlah_penawaran DESC, p.penawaran_id DESC
            LIMIT 10
        """, (lelang_id,))
        bids = cursor.fetchall()

        if isinstance(lelang.get("waktu_mulai"), datetime):
            lelang["waktu_mulai"] = lelang["waktu_mulai"].strftime("%Y-%m-%d %H:%M:%S")
        if isinstance(lelang.get("waktu_selesai"), datetime):
            lelang["waktu_selesai"] = lelang["waktu_selesai"].strftime("%Y-%m-%d %H:%M:%S")

        for b in bids:
            if isinstance(b.get("waktu_penawaran"), datetime):
                b["waktu_penawaran"] = b["waktu_penawaran"].strftime("%Y-%m-%d %H:%M:%S")

        lelang["riwayat_penawaran"] = bids
        return jsonify({"status": "success", "data": lelang}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()


@lelang_bp.get('/api/lelang/penjual')
@token_required
def get_lelang_penjual():
    """Menampilkan riwayat lelang milik penjual yang login."""
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        _sync_lelang_status(cursor)
        connection.commit()

        cursor.execute("""
            SELECT l.lelang_id, l.barang_id, b.nama_barang, b.foto_barang,
                   l.harga_awal, l.harga_tertinggi, l.waktu_mulai, l.waktu_selesai, l.status_lelang,
                   l.pemenang_id, u_pemenang.nama AS nama_pemenang,
                   (SELECT COUNT(*) FROM penawaran_lelang WHERE lelang_id = l.lelang_id) AS total_bid
            FROM lelang l
            JOIN barang b ON l.barang_id = b.barang_id
            LEFT JOIN user u_pemenang ON l.pemenang_id = u_pemenang.user_id
            WHERE l.penjual_id = %s
            ORDER BY l.lelang_id DESC
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


# ===========================================================================
# CHUNK 2: SISTEM BIDDING / PENAWARAN LELANG
# ===========================================================================

@lelang_bp.post('/api/lelang/<int:lelang_id>/bid')
@token_required
def place_bid(lelang_id):
    """
    Peserta mengajukan tawaran pada barang lelang.
    - Anti-self-bidding
    - Concurrency-safe via SELECT FOR UPDATE
    - Validasi tawaran harus lebih tinggi dari penawaran tertinggi saat ini
    """
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    body = request.get_json(silent=True) or {}
    jumlah_raw = body.get('jumlah_penawaran')

    if jumlah_raw is None:
        return jsonify({"status": "error", "message": "jumlah_penawaran wajib diisi"}), 400

    try:
        bid_decimal = Decimal(str(jumlah_raw))
        if bid_decimal <= Decimal('0'):
            return jsonify({"status": "error", "message": "jumlah_penawaran harus lebih besar dari 0"}), 400
    except (InvalidOperation, TypeError, ValueError):
        return jsonify({"status": "error", "message": "Format jumlah_penawaran tidak valid"}), 400

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM lelang WHERE lelang_id = %s FOR UPDATE", (lelang_id,))
        lelang = cursor.fetchone()

        if not lelang:
            return jsonify({"status": "error", "message": "Lelang tidak ditemukan"}), 404

        now = datetime.now()
        if now >= lelang['waktu_selesai']:
            cursor.execute("UPDATE lelang SET status_lelang = 'selesai' WHERE lelang_id = %s", (lelang_id,))
            connection.commit()
            return jsonify({"status": "error", "message": "Waktu lelang telah berakhir"}), 400

        if now < lelang['waktu_mulai'] or lelang['status_lelang'] == 'pending':
            return jsonify({"status": "error", "message": "Lelang belum dimulai"}), 400

        if lelang['status_lelang'] != 'berlangsung':
            return jsonify({"status": "error", "message": f"Lelang tidak dapat ditawar (status: '{lelang['status_lelang']}')"}), 400

        if lelang['penjual_id'] == user_id:
            return jsonify({"status": "error", "message": "Anda tidak dapat mengajukan penawaran pada lelang milik sendiri"}), 403

        cursor.execute("SELECT COUNT(*) AS total_bid FROM penawaran_lelang WHERE lelang_id = %s", (lelang_id,))
        total_bid = cursor.fetchone()['total_bid']

        harga_awal_dec = Decimal(str(lelang['harga_awal']))
        if total_bid == 0:
            if bid_decimal < harga_awal_dec:
                return jsonify({
                    "status": "error",
                    "message": f"Penawaran pertama minimal harus sama dengan harga awal (Rp {harga_awal_dec:,.2f})"
                }), 400
        else:
            harga_tertinggi_dec = Decimal(str(lelang['harga_tertinggi'])) if lelang['harga_tertinggi'] is not None else harga_awal_dec
            if bid_decimal <= harga_tertinggi_dec:
                return jsonify({
                    "status": "error",
                    "message": f"Penawaran harus lebih tinggi dari penawaran saat ini (Rp {harga_tertinggi_dec:,.2f})"
                }), 400

        cursor.execute("""
            INSERT INTO penawaran_lelang (lelang_id, user_id, jumlah_penawaran, waktu_penawaran)
            VALUES (%s, %s, %s, NOW())
        """, (lelang_id, user_id, float(bid_decimal)))
        penawaran_id = cursor.lastrowid

        cursor.execute("""
            UPDATE lelang 
            SET harga_tertinggi = %s, pemenang_id = %s
            WHERE lelang_id = %s
        """, (float(bid_decimal), user_id, lelang_id))

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Penawaran berhasil diajukan",
            "data": {
                "penawaran_id": penawaran_id,
                "lelang_id": lelang_id,
                "user_id": user_id,
                "jumlah_penawaran": float(bid_decimal),
                "total_bid": total_bid + 1
            }
        }), 201

    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()


@lelang_bp.get('/api/lelang/<int:lelang_id>/bids')
def get_lelang_bids(lelang_id):
    """Menampilkan riwayat seluruh penawaran pada lelang tertentu."""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT lelang_id FROM lelang WHERE lelang_id = %s", (lelang_id,))
        if not cursor.fetchone():
            return jsonify({"status": "error", "message": "Lelang tidak ditemukan"}), 404

        cursor.execute("""
            SELECT p.penawaran_id, p.lelang_id, p.user_id, u.nama AS nama_penawar, u.foto_profil,
                   p.jumlah_penawaran, p.waktu_penawaran
            FROM penawaran_lelang p
            JOIN user u ON p.user_id = u.user_id
            WHERE p.lelang_id = %s
            ORDER BY p.jumlah_penawaran DESC, p.penawaran_id DESC
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


@lelang_bp.get('/api/lelang/saya/bids')
@token_required
def get_my_bids():
    """Menampilkan riwayat penawaran yang diajukan oleh pengguna login."""
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT p.penawaran_id, p.lelang_id, p.jumlah_penawaran, p.waktu_penawaran,
                   l.harga_awal, l.harga_tertinggi, l.status_lelang, l.waktu_selesai,
                   l.pemenang_id, (l.pemenang_id = %s) AS is_winning,
                   b.barang_id, b.nama_barang, b.foto_barang
            FROM penawaran_lelang p
            JOIN lelang l ON p.lelang_id = l.lelang_id
            JOIN barang b ON l.barang_id = b.barang_id
            WHERE p.user_id = %s
            ORDER BY p.penawaran_id DESC
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


# ===========================================================================
# CHUNK 3: PENUTUPAN, PEMBATALAN, & PEMENANG LELANG
# ===========================================================================

@lelang_bp.post('/api/lelang/<int:lelang_id>/close')
@token_required
def close_lelang(lelang_id):
    """
    Menutup lelang secara manual oleh Penjual atau Admin.
    - Menetapkan penawar tertinggi sebagai pemenang (pemenang_id).
    - Jika ada pemenang -> status barang menjadi 'terjual'.
    - Jika tidak ada penawaran -> status barang kembali menjadi 'tersedia'.
    """
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    is_admin = g.current_user.get("role") == "admin"

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM lelang WHERE lelang_id = %s FOR UPDATE", (lelang_id,))
        lelang = cursor.fetchone()

        if not lelang:
            return jsonify({"status": "error", "message": "Lelang tidak ditemukan"}), 404

        if not is_admin and lelang['penjual_id'] != user_id:
            return jsonify({"status": "error", "message": "Akses ditolak: Anda bukan pemilik lelang ini"}), 403

        if lelang['status_lelang'] in ('selesai', 'dibatalkan'):
            return jsonify({
                "status": "error",
                "message": f"Lelang sudah ditutup sebelumnya dengan status '{lelang['status_lelang']}'"
            }), 400

        cursor.execute("""
            SELECT p.user_id, p.jumlah_penawaran, u.nama AS nama_pemenang
            FROM penawaran_lelang p
            JOIN user u ON p.user_id = u.user_id
            WHERE p.lelang_id = %s
            ORDER BY p.jumlah_penawaran DESC, p.penawaran_id ASC
            LIMIT 1
        """, (lelang_id,))
        highest_bid = cursor.fetchone()

        if highest_bid:
            pemenang_id = highest_bid['user_id']
            harga_final = highest_bid['jumlah_penawaran']
            nama_pemenang = highest_bid['nama_pemenang']

            cursor.execute("""
                UPDATE lelang
                SET status_lelang = 'selesai',
                    pemenang_id = %s,
                    harga_tertinggi = %s
                WHERE lelang_id = %s
            """, (pemenang_id, harga_final, lelang_id))

            cursor.execute("UPDATE barang SET status_barang = 'terjual' WHERE barang_id = %s", (lelang['barang_id'],))
            msg = f"Lelang berhasil diselesaikan. Pemenang: {nama_pemenang} (Rp {harga_final:,.2f})"
            res_data = {
                "lelang_id": lelang_id,
                "status_lelang": "selesai",
                "pemenang_id": pemenang_id,
                "nama_pemenang": nama_pemenang,
                "harga_akhir": float(harga_final)
            }
        else:
            cursor.execute("""
                UPDATE lelang
                SET status_lelang = 'selesai',
                    pemenang_id = NULL
                WHERE lelang_id = %s
            """, (lelang_id,))

            cursor.execute("UPDATE barang SET status_barang = 'tersedia' WHERE barang_id = %s", (lelang['barang_id'],))
            msg = "Lelang ditutup tanpa ada penawaran. Barang dikembalikan ke status 'tersedia'."
            res_data = {
                "lelang_id": lelang_id,
                "status_lelang": "selesai",
                "pemenang_id": None,
                "harga_akhir": float(lelang['harga_awal'])
            }

        connection.commit()
        return jsonify({"status": "success", "message": msg, "data": res_data}), 200

    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()


@lelang_bp.post('/api/lelang/<int:lelang_id>/batal')
@token_required
def cancel_lelang(lelang_id):
    """
    Membatalkan lelang.
    - Hanya Penjual atau Admin yang berhak membatalkan.
    - Penjual dilarang membatalkan jika sudah ada penawar (kecuali oleh Admin).
    - Status barang otomatis dikembalikan ke 'tersedia'.
    """
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    is_admin = g.current_user.get("role") == "admin"

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM lelang WHERE lelang_id = %s FOR UPDATE", (lelang_id,))
        lelang = cursor.fetchone()

        if not lelang:
            return jsonify({"status": "error", "message": "Lelang tidak ditemukan"}), 404

        if not is_admin and lelang['penjual_id'] != user_id:
            return jsonify({"status": "error", "message": "Akses ditolak: Anda bukan pemilik lelang ini"}), 403

        if lelang['status_lelang'] in ('selesai', 'dibatalkan'):
            return jsonify({
                "status": "error",
                "message": f"Lelang tidak dapat dibatalkan karena sudah berstatus '{lelang['status_lelang']}'"
            }), 400

        if not is_admin:
            cursor.execute("SELECT COUNT(*) AS total_bid FROM penawaran_lelang WHERE lelang_id = %s", (lelang_id,))
            if cursor.fetchone()['total_bid'] > 0:
                return jsonify({
                    "status": "error",
                    "message": "Lelang tidak dapat dibatalkan oleh penjual karena sudah memiliki penawaran dari peserta"
                }), 400

        cursor.execute("UPDATE lelang SET status_lelang = 'dibatalkan' WHERE lelang_id = %s", (lelang_id,))
        cursor.execute("UPDATE barang SET status_barang = 'tersedia' WHERE barang_id = %s", (lelang['barang_id'],))

        connection.commit()
        return jsonify({
            "status": "success",
            "message": "Lelang berhasil dibatalkan. Status barang kembali 'tersedia'."
        }), 200

    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()


@lelang_bp.get('/api/lelang/menang')
@token_required
def get_my_won_auctions():
    """Menampilkan daftar seluruh lelang yang berhasil dimenangkan oleh pengguna login."""
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        _sync_lelang_status(cursor)
        connection.commit()

        cursor.execute("""
            SELECT l.lelang_id, l.barang_id, b.nama_barang, b.deskripsi, b.foto_barang, b.lokasi,
                   l.harga_tertinggi AS harga_kemenangan, l.waktu_selesai,
                   l.penjual_id, u_penjual.nama AS nama_penjual, u_penjual.no_hp AS no_hp_penjual,
                   u_penjual.email AS email_penjual
            FROM lelang l
            JOIN barang b ON l.barang_id = b.barang_id
            JOIN user u_penjual ON l.penjual_id = u_penjual.user_id
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
