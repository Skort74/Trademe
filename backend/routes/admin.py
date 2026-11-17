from flask import Blueprint, jsonify, g
from database import get_db_connection
from routes.auth_utils import admin_required

admin_bp = Blueprint("admin", __name__)

# ---------------------------------------------------------------------------
# GET /api/admin/dashboard (Statistik Ringkas)
# ---------------------------------------------------------------------------
@admin_bp.get('/api/admin/dashboard')
@admin_required
def get_dashboard_stats():
    """Mengembalikan ringkasan statistik untuk Dashboard Admin."""
    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Hitung total user
        cursor.execute("SELECT COUNT(*) AS total FROM user WHERE role = 'pengguna'")
        total_users = cursor.fetchone()['total']

        # Hitung total barang
        cursor.execute("SELECT COUNT(*) AS total FROM barang")
        total_barang = cursor.fetchone()['total']

        # Hitung barang yang menunggu verifikasi (pending)
        cursor.execute("SELECT COUNT(*) AS total FROM barang WHERE status_verifikasi = 'pending'")
        pending_barang = cursor.fetchone()['total']

        # Hitung transaksi yang menunggu verifikasi pembayaran
        cursor.execute("SELECT COUNT(*) AS total FROM transaksi WHERE status_transaksi = 'menunggu_verifikasi'")
        pending_transaksi = cursor.fetchone()['total']

        # Hitung pengajuan donasi yang pending
        cursor.execute("SELECT COUNT(*) AS total FROM pengajuan_donasi WHERE status_verifikasi = 'pending'")
        pending_donasi = cursor.fetchone()['total']

        return jsonify({
            "status": "success",
            "data": {
                "total_users": total_users,
                "total_barang": total_barang,
                "pending_barang": pending_barang,
                "pending_transaksi": pending_transaksi,
                "pending_donasi": pending_donasi
            }
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()

# ---------------------------------------------------------------------------
# GET /api/admin/users (List Semua User)
# ---------------------------------------------------------------------------
@admin_bp.get('/api/admin/users')
@admin_required
def get_all_users():
    """Mengembalikan daftar semua user terdaftar."""
    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT user_id, nama, email, no_hp, alamat, role, tanggal_daftar 
            FROM user 
            ORDER BY tanggal_daftar DESC
        """)
        return jsonify({"status": "success", "data": cursor.fetchall()}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()

# ---------------------------------------------------------------------------
# GET /api/admin/barang/pending (List Barang yang Belum Diverifikasi)
# ---------------------------------------------------------------------------
@admin_bp.get('/api/admin/barang/pending')
@admin_required
def get_pending_barang():
    """Mengembalikan daftar barang yang menunggu verifikasi admin."""
    connection = None; cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT b.*, u.nama AS nama_pemilik, k.nama_kategori
            FROM barang b
            JOIN user u ON b.pemilik_id = u.user_id
            JOIN kategori k ON b.kategori_id = k.kategori_id
            WHERE b.status_verifikasi = 'pending'
            ORDER BY b.created_at DESC
        """)
        return jsonify({"status": "success", "data": cursor.fetchall()}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()

