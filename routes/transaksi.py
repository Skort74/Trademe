from flask import Blueprint, jsonify, request, g
from database import get_db_connection
from routes.auth_utils import token_required

transaksi_bp = Blueprint('transaksi', __name__)

# ---------------------------------------------------------------------------
# Helper: list of allowed payment methods (matches enum in database)
# ---------------------------------------------------------------------------
ALLOWED_METODE = {"COD", "Transfer"}


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
    buyer_id = int(current_user.get('sub'))

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
    buyer_id = int(g.current_user.get('sub'))
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
    seller_id = int(g.current_user.get('sub'))
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
    user_id = int(g.current_user.get('sub'))
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
