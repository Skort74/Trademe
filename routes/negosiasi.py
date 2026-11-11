from decimal import Decimal, InvalidOperation
from flask import Blueprint, jsonify, request, g
from database import get_db_connection
from routes.auth_utils import token_required

negosiasi_bp = Blueprint("negosiasi", __name__)


def _get_user_id_from_g(current_user):
    sub = current_user.get("sub")
    try:
        return int(sub) if sub is not None else None
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# POST endpoint – Pembeli mengajukan tawaran harga (Negosiasi)
# ---------------------------------------------------------------------------
@negosiasi_bp.post('/api/negosiasi')
@token_required
def create_negosiasi():
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    body = request.get_json(silent=True) or {}
    barang_id = body.get('barang_id')
    harga_tawaran_raw = body.get('harga_tawaran')

    if not barang_id:
        return jsonify({"status": "error", "message": "barang_id wajib diisi"}), 400
    if harga_tawaran_raw is None:
        return jsonify({"status": "error", "message": "harga_tawaran wajib diisi"}), 400

    try:
        tawaran_dec = Decimal(str(harga_tawaran_raw))
        if tawaran_dec <= Decimal('0'):
            return jsonify({"status": "error", "message": "harga_tawaran harus lebih besar dari 0"}), 400
    except (InvalidOperation, TypeError, ValueError):
        return jsonify({"status": "error", "message": "Format harga_tawaran tidak valid"}), 400

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # 1. Cek keberadaan dan status barang
        cursor.execute("""
            SELECT barang_id, pemilik_id, nama_barang, harga, tipe_transaksi, status_barang
            FROM barang
            WHERE barang_id = %s
        """, (barang_id,))
        barang = cursor.fetchone()

        if not barang:
            return jsonify({"status": "error", "message": "Barang tidak ditemukan"}), 404

        # Cegah pembeli menawar barangnya sendiri
        if barang['pemilik_id'] == user_id:
            return jsonify({"status": "error", "message": "Anda tidak dapat menegosiasikan barang milik Anda sendiri"}), 403

        if barang['status_barang'] != 'tersedia':
            return jsonify({
                "status": "error",
                "message": f"Barang berstatus '{barang['status_barang']}', hanya barang 'tersedia' yang dapat dinegosiasi"
            }), 400

        if barang['tipe_transaksi'] not in ('jual', 'tukar'):
            return jsonify({
                "status": "error",
                "message": f"Negosiasi tidak berlaku untuk barang bertipe '{barang['tipe_transaksi']}'"
            }), 400

        # 2. Cek apakah ada penawaran yang masih pending dari pembeli ini untuk barang ini
        cursor.execute("""
            SELECT negosiasi_id FROM negosiasi
            WHERE barang_id = %s AND pembeli_id = %s AND status_negosiasi = 'pending'
            LIMIT 1
        """, (barang_id, user_id))
        if cursor.fetchone():
            return jsonify({
                "status": "error",
                "message": "Anda masih memiliki penawaran yang berstatus 'pending' untuk barang ini"
            }), 409

        harga_awal = barang['harga'] or Decimal('0')

        # 3. Simpan negosiasi
        cursor.execute("""
            INSERT INTO negosiasi (barang_id, penjual_id, pembeli_id, harga_awal, harga_tawaran, status_negosiasi)
            VALUES (%s, %s, %s, %s, %s, 'pending')
        """, (barang_id, barang['pemilik_id'], user_id, float(harga_awal), float(tawaran_dec)))

        connection.commit()

        # Ambil ID yang benar
        cursor.execute("SELECT LAST_INSERT_ID() AS new_id")
        row_id = cursor.fetchone()
        new_negosiasi_id = row_id['new_id'] if row_id and row_id.get('new_id') else cursor.lastrowid

        return jsonify({
            "status": "success",
            "message": "Tawaran harga berhasil diajukan ke penjual",
            "data": {
                "negosiasi_id": new_negosiasi_id,
                "barang_id": barang_id,
                "penjual_id": barang['pemilik_id'],
                "pembeli_id": user_id,
                "harga_awal": float(harga_awal),
                "harga_tawaran": float(tawaran_dec),
                "status_negosiasi": "pending"
            }
        }), 201

    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()


# ---------------------------------------------------------------------------
# GET endpoint – Daftar Negosiasi Diajukan oleh Pembeli
# ---------------------------------------------------------------------------
@negosiasi_bp.get('/api/negosiasi/pembeli')
@token_required
def get_negosiasi_pembeli():
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT n.negosiasi_id, n.barang_id, b.nama_barang, b.foto_barang, b.status_barang,
                   n.penjual_id, u_penjual.nama AS nama_penjual, u_penjual.foto_profil AS foto_penjual,
                   n.harga_awal, n.harga_tawaran, n.status_negosiasi
            FROM negosiasi n
            JOIN barang b ON n.barang_id = b.barang_id
            JOIN user u_penjual ON n.penjual_id = u_penjual.user_id
            WHERE n.pembeli_id = %s
            ORDER BY n.negosiasi_id DESC
        """, (user_id,))
        rows = cursor.fetchall()

        return jsonify({"status": "success", "data": rows}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()


# ---------------------------------------------------------------------------
# GET endpoint – Daftar Tawaran Masuk Diterima oleh Penjual
# ---------------------------------------------------------------------------
@negosiasi_bp.get('/api/negosiasi/penjual')
@token_required
def get_negosiasi_penjual():
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT n.negosiasi_id, n.barang_id, b.nama_barang, b.foto_barang, b.status_barang,
                   n.pembeli_id, u_pembeli.nama AS nama_pembeli, u_pembeli.foto_profil AS foto_pembeli,
                   n.harga_awal, n.harga_tawaran, n.status_negosiasi
            FROM negosiasi n
            JOIN barang b ON n.barang_id = b.barang_id
            JOIN user u_pembeli ON n.pembeli_id = u_pembeli.user_id
            WHERE n.penjual_id = %s
            ORDER BY n.negosiasi_id DESC
        """, (user_id,))
        rows = cursor.fetchall()

        return jsonify({"status": "success", "data": rows}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()


# ---------------------------------------------------------------------------
# GET endpoint – Detail Negosiasi Tertentu
# ---------------------------------------------------------------------------
@negosiasi_bp.get('/api/negosiasi/<int:negosiasi_id>')
@token_required
def get_negosiasi_detail(negosiasi_id):
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT n.negosiasi_id, n.barang_id, b.nama_barang, b.deskripsi, b.foto_barang, b.status_barang,
                   n.penjual_id, u_penjual.nama AS nama_penjual, u_penjual.no_hp AS no_hp_penjual,
                   n.pembeli_id, u_pembeli.nama AS nama_pembeli, u_pembeli.no_hp AS no_hp_pembeli,
                   n.harga_awal, n.harga_tawaran, n.status_negosiasi
            FROM negosiasi n
            JOIN barang b ON n.barang_id = b.barang_id
            JOIN user u_penjual ON n.penjual_id = u_penjual.user_id
            JOIN user u_pembeli ON n.pembeli_id = u_pembeli.user_id
            WHERE n.negosiasi_id = %s
        """, (negosiasi_id,))
        negosiasi = cursor.fetchone()

        if not negosiasi:
            return jsonify({"status": "error", "message": "Negosiasi tidak ditemukan"}), 404

        # Hanya pembeli atau penjual terkait yang boleh mengakses
        if user_id not in (negosiasi['penjual_id'], negosiasi['pembeli_id']):
            return jsonify({"status": "error", "message": "Akses ditolak: Anda tidak terlibat dalam negosiasi ini"}), 403

        return jsonify({"status": "success", "data": negosiasi}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()


# ---------------------------------------------------------------------------
# PATCH endpoint – Penjual Merespons Negosiasi ('diterima' / 'ditolak')
# ---------------------------------------------------------------------------
@negosiasi_bp.patch('/api/negosiasi/<int:negosiasi_id>/respon')
@token_required
def respond_negosiasi(negosiasi_id):
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    body = request.get_json(silent=True) or {}
    action = body.get('status') # 'diterima' atau 'ditolak'

    if action not in ('diterima', 'ditolak'):
        return jsonify({"status": "error", "message": "Parameter status harus 'diterima' atau 'ditolak'"}), 400

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM negosiasi WHERE negosiasi_id = %s FOR UPDATE", (negosiasi_id,))
        nego = cursor.fetchone()

        if not nego:
            return jsonify({"status": "error", "message": "Negosiasi tidak ditemukan"}), 404

        if nego['penjual_id'] != user_id:
            return jsonify({"status": "error", "message": "Akses ditolak: Hanya penjual yang berhak merespons tawaran ini"}), 403

        if nego['status_negosiasi'] != 'pending':
            return jsonify({
                "status": "error",
                "message": f"Negosiasi tidak dapat direspon karena sudah berstatus '{nego['status_negosiasi']}'"
            }), 400

        cursor.execute("""
            UPDATE negosiasi SET status_negosiasi = %s WHERE negosiasi_id = %s
        """, (action, negosiasi_id))

        connection.commit()

        msg = f"Tawaran berhasil {action}."
        if action == 'diterima':
            msg += f" Pembeli dapat melakukan transaksi dengan harga Rp {nego['harga_tawaran']:,.2f}."

        return jsonify({
            "status": "success",
            "message": msg,
            "data": {
                "negosiasi_id": negosiasi_id,
                "status_negosiasi": action,
                "harga_sepakat": float(nego['harga_tawaran']) if action == 'diterima' else None
            }
        }), 200

    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()


# ---------------------------------------------------------------------------
# PATCH endpoint – Pembeli Membatalkan Negosiasi
# ---------------------------------------------------------------------------
@negosiasi_bp.patch('/api/negosiasi/<int:negosiasi_id>/batal')
@token_required
def cancel_negosiasi(negosiasi_id):
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM negosiasi WHERE negosiasi_id = %s FOR UPDATE", (negosiasi_id,))
        nego = cursor.fetchone()

        if not nego:
            return jsonify({"status": "error", "message": "Negosiasi tidak ditemukan"}), 404

        if nego['pembeli_id'] != user_id:
            return jsonify({"status": "error", "message": "Akses ditolak: Anda bukan pengaju tawaran ini"}), 403

        if nego['status_negosiasi'] != 'pending':
            return jsonify({
                "status": "error",
                "message": f"Tawaran tidak dapat dibatalkan karena sudah berstatus '{nego['status_negosiasi']}'"
            }), 400

        cursor.execute("UPDATE negosiasi SET status_negosiasi = 'dibatalkan' WHERE negosiasi_id = %s", (negosiasi_id,))
        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Tawaran negosiasi berhasil dibatalkan"
        }), 200

    except Exception as e:
        if connection: connection.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()

