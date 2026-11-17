# backend/routes/negosiasi.py
"""Negotiation (price offer) endpoints for TradeMe Backend.

Feature set:
1. POST   /api/negosiasi                     – submit a price offer (only for barang tipe_transaksi='jual')
2. POST   /api/negosiasi/<int:id>/counter   – counter‑offer after a previous offer was rejected
3. GET    /api/negosiasi/barang/<int:id>    – view negotiation history for a barang (owner or participants only)
4. POST   /api/negosiasi/<int:id>/respond   – owner accepts or declines a pending offer

All endpoints require a valid JWT (via ``token_required``) and use parameterised
queries (no f‑strings).  Errors are returned as JSON with appropriate HTTP status.
"""

from flask import Blueprint, jsonify, request, g
from routes.auth_utils import token_required
from database import get_db_connection
from mysql.connector import errors as db_errors

negosiasi_bp = Blueprint("negosiasi", __name__)


def _current_user_id():
    """Extract user id (sub claim) from the Flask ``g`` context."""
    payload = g.get("current_user", {})
    try:
        return int(payload.get("sub"))
    except Exception:
        return None

# ---------------------------------------------------------------------------
# 1. POST /api/negosiasi – submit a price offer
# ---------------------------------------------------------------------------
@negosiasi_bp.post("/api/negosiasi")
@token_required
def create_negosiasi():
    body = request.get_json(silent=True) or {}
    barang_id = body.get("barang_id")
    harga_tawaran = body.get("harga_tawaran")

    if not isinstance(barang_id, int) or not (isinstance(harga_tawaran, (int, float, str))):
        return jsonify({"status": "error", "message": "barang_id (int) dan harga_tawaran (number) wajib"}), 400

    try:
        harga_tawaran = float(harga_tawaran)
        if harga_tawaran <= 0:
            raise ValueError
    except ValueError:
        return jsonify({"status": "error", "message": "harga_tawaran harus > 0"}), 400

    user_id = _current_user_id()
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        # Verify barang exists and is sellable
        cur.execute(
            "SELECT barang_id, pemilik_id, tipe_transaksi, status_barang, harga FROM barang WHERE barang_id = %s FOR UPDATE",
            (barang_id,)
        )
        barang = cur.fetchone()
        if not barang:
            return jsonify({"status": "error", "message": "Barang tidak ditemukan"}), 404
        if barang["tipe_transaksi"] != "jual":
            return jsonify({"status": "error", "message": "Negosiasi hanya untuk barang tipe 'jual'"}), 400
        if barang["status_barang"] != "tersedia":
            return jsonify({"status": "error", "message": "Barang tidak tersedia untuk negosiasi"}), 400
        if barang["pemilik_id"] == user_id:
            return jsonify({"status": "error", "message": "Pemilik barang tidak dapat menawar dirinya sendiri"}), 403

        # Check existing pending offer from this user for same barang
        cur.execute(
            "SELECT negosiasi_id FROM negosiasi WHERE barang_id = %s AND pengirim_id = %s AND status = 'pending' LIMIT 1",
            (barang_id, user_id)
        )
        if cur.fetchone():
            return jsonify({"status": "error", "message": "Anda sudah memiliki tawaran pending untuk barang ini"}), 400

        # Insert new negotiation record
        cur.execute(
            "INSERT INTO negosiasi (barang_id, pengirim_id, penerima_id, harga_tawaran, status) VALUES (%s, %s, %s, %s, 'pending')",
            (barang_id, user_id, barang["pemilik_id"], harga_tawaran)
        )
        conn.commit()
        return jsonify({"status": "success", "message": "Negosiasi berhasil diajukan", "data": {"negosiasi_id": cur.lastrowid}}), 201
    except db_errors.IntegrityError as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": "Integrity error: {}".format(str(e))}), 500
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn and conn.is_connected():
            conn.close()

# ---------------------------------------------------------------------------
# 2. POST /api/negosiasi/<negosiasi_id>/counter – submit a counter‑offer after rejection
# ---------------------------------------------------------------------------
@negosiasi_bp.post("/api/negosiasi/<int:negosiasi_id>/counter")
@token_required
def counter_negosiasi(negosiasi_id):
    body = request.get_json(silent=True) or {}
    harga_baru = body.get("harga_tawaran")
    if harga_baru is None:
        return jsonify({"status": "error", "message": "harga_tawaran wajib"}), 400
    try:
        harga_baru = float(harga_baru)
        if harga_baru <= 0:
            raise ValueError
    except ValueError:
        return jsonify({"status": "error", "message": "harga_tawaran harus > 0"}), 400

    user_id = _current_user_id()
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        # Load original negotiation
        cur.execute(
            "SELECT * FROM negosiasi WHERE negosiasi_id = %s",
            (negosiasi_id,)
        )
        original = cur.fetchone()
        if not original:
            return jsonify({"status": "error", "message": "Negosiasi tidak ditemukan"}), 404
        if original["status"] != "ditolak":
            return jsonify({"status": "error", "message": "Counter‑offer hanya dapat dibuat setelah penawaran ditolak"}), 400
        if original["pengirim_id"] != user_id:
            return jsonify({"status": "error", "message": "Hanya pengirim asli yang dapat melakukan counter"}), 403

        # Verify minimal 70% of original barang price
        cur.execute("SELECT harga FROM barang WHERE barang_id = %s", (original["barang_id"],))
        barang = cur.fetchone()
        if not barang:
            return jsonify({"status": "error", "message": "Barang tidak ditemukan"}), 404
        minimal = 0.7 * float(barang["harga"] or 0)
        if harga_baru < minimal:
            return jsonify({"status": "error", "message": f"Harga tawar baru harus >= 70% dari harga barang ({minimal:.2f})"}), 400

        # Insert counter‑offer
        cur.execute(
            """
            INSERT INTO negosiasi (barang_id, pengirim_id, penerima_id, harga_tawaran, status, negosiasi_induk_id)
            VALUES (%s, %s, %s, %s, 'pending', %s)
            """,
            (
                original["barang_id"],
                original["pengirim_id"],
                original["penerima_id"],
                harga_baru,
                original["negosiasi_id"],
            ),
        )
        conn.commit()
        return jsonify({"status": "success", "message": "Counter‑offer berhasil diajukan", "data": {"negosiasi_id": cur.lastrowid}}), 201
    except db_errors.IntegrityError as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": f"Integrity error: {e}"}), 500
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn and conn.is_connected():
            conn.close()

# ---------------------------------------------------------------------------
# 3. GET /api/negosiasi/barang/<barang_id> – riwayat negosiasi
# ---------------------------------------------------------------------------
@negosiasi_bp.get("/api/negosiasi/barang/<int:barang_id>")
@token_required
def list_negosiasi_barang(barang_id):
    user_id = _current_user_id()
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)
        # Check if user is owner of barang
        cur.execute("SELECT pemilik_id FROM barang WHERE barang_id = %s", (barang_id,))
        barang = cur.fetchone()
        if not barang:
            return jsonify({"status": "error", "message": "Barang tidak ditemukan"}), 404
        is_owner = barang["pemilik_id"] == user_id

        # Check if user participated in any negotiation for this barang
        cur.execute(
            "SELECT 1 FROM negosiasi WHERE barang_id = %s AND (pengirim_id = %s OR penerima_id = %s) LIMIT 1",
            (barang_id, user_id, user_id),
        )
        participated = bool(cur.fetchone())

        if not (is_owner or participated):
            return jsonify({"status": "error", "message": "Akses ditolak"}), 403

        cur.execute(
            """
            SELECT n.negosiasi_id, u.nama AS nama_pengirim, n.harga_tawaran, n.status,
                   n.created_at, n.negosiasi_induk_id
            FROM negosiasi n
            JOIN `user` u ON n.pengirim_id = u.user_id
            WHERE n.barang_id = %s
            ORDER BY n.created_at DESC
            """,
            (barang_id,)
        )
        rows = cur.fetchall()
        return jsonify({"status": "success", "data": rows}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn and conn.is_connected():
            conn.close()

# ---------------------------------------------------------------------------
# 4. POST /api/negosiasi/<negosiasi_id>/respond – accept / reject offer
# ---------------------------------------------------------------------------
@negosiasi_bp.post("/api/negosiasi/<int:negosiasi_id>/respond")
@token_required
def respond_negosiasi(negosiasi_id):
    body = request.get_json(silent=True) or {}
    aksi = body.get("aksi")
    if aksi not in ("terima", "tolak"):
        return jsonify({"status": "error", "message": "Aksi harus 'terima' atau 'tolak'"}), 400

    user_id = _current_user_id()
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        conn.start_transaction()
        cur = conn.cursor(dictionary=True)
        # Load negotiation
        cur.execute("SELECT * FROM negosiasi WHERE negosiasi_id = %s FOR UPDATE", (negosiasi_id,))
        neg = cur.fetchone()
        if not neg:
            conn.rollback()
            return jsonify({"status": "error", "message": "Negosiasi tidak ditemukan"}), 404
        if neg["status"] != "pending":
            conn.rollback()
            return jsonify({"status": "error", "message": "Hanya negosiasi dengan status pending yang dapat di‑respond"}), 400
        if neg["penerima_id"] != user_id:
            conn.rollback()
            return jsonify({"status": "error", "message": "Hanya pemilik barang (penerima) yang dapat merespon"}), 403

        if aksi == "tolak":
            cur.execute("UPDATE negosiasi SET status = 'ditolak' WHERE negosiasi_id = %s", (negosiasi_id,))
            conn.commit()
            return jsonify({"status": "success", "message": "Negosiasi ditolak"}), 200

        # aksi == 'terima'
        # 1) update negosiasi status
        cur.execute("UPDATE negosiasi SET status = 'diterima' WHERE negosiasi_id = %s", (negosiasi_id,))
        # 2) update barang status – using existing enum value 'terjual' as placeholder for proses
        cur.execute(
            "UPDATE barang SET status_barang = 'terjual' WHERE barang_id = %s",
            (neg["barang_id"],)
        )
        # 3) create transaction record (price stored via pembayaran as per existing flow)
        cur.execute(
            """
            INSERT INTO transaksi (barang_id, penjual_id, pembeli_id, metode_pembayaran, status_transaksi)
            VALUES (%s, %s, %s, 'Transfer', 'menunggu_pembayaran')
            """,
            (neg["barang_id"], neg["penerima_id"], neg["pengirim_id"])
        )
        transaksi_id = cur.lastrowid
        # 4) store offered price in pembayaran table
        cur.execute(
            "INSERT INTO pembayaran (transaksi_id, jumlah, metode_pembayaran, status_verifikasi) VALUES (%s, %s, 'Transfer', 'menunggu')",
            (transaksi_id, neg["harga_tawaran"])
        )
        conn.commit()
        return jsonify({"status": "success", "message": "Negosiasi diterima, transaksi dibuat"}), 200
    except db_errors.IntegrityError as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": f"Integrity error: {e}"}), 500
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn and conn.is_connected():
            conn.close()

# End of negosiasi routes
