from flask import Blueprint, jsonify
from database import get_db_connection

config_bp = Blueprint("config", __name__)

@config_bp.get("/api/config/pembayaran")
def get_payment_config():
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT nama_bank, no_rekening, atas_nama, qris_image_url FROM config_pembayaran ORDER BY id ASC LIMIT 1"
        )
        row = cursor.fetchone()
        if not row:
            return jsonify({"status": "error", "message": "Konfigurasi pembayaran belum diset"}), 404
        return jsonify({"status": "success", "data": row}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection and connection.is_connected(): connection.close()
