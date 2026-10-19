
from flask import Blueprint, jsonify, request

from database import get_db_connection
from routes.auth_utils import admin_required


kategori_bp = Blueprint("kategori", __name__)


@kategori_bp.get("/api/kategori")
def get_kategori():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT kategori_id, nama_kategori
            FROM kategori
            ORDER BY kategori_id
        """)

        data = cursor.fetchall()

        return jsonify({
            "status": "success",
            "data": data
        }), 200

    except Exception:
        import logging
        logging.exception("Gagal mengambil data kategori")

        return jsonify({
            "status": "error",
            "message": "Gagal mengambil data kategori"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None and connection.is_connected():
            connection.close()


@kategori_bp.post("/api/kategori")
@admin_required
def tambah_kategori():
    connection = None
    cursor = None

    try:
        body = request.get_json(silent=True)

        if not isinstance(body, dict):
            return jsonify({
                "status": "error",
                "message": "Request harus berupa JSON"
            }), 400

        nama_kategori = body.get("nama_kategori")

        if not isinstance(nama_kategori, str) or not nama_kategori.strip():
            return jsonify({
                "status": "error",
                "message": "nama_kategori wajib diisi"
            }), 400

        nama_kategori = nama_kategori.strip()

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT kategori_id FROM kategori "
            "WHERE nama_kategori = %s",
            (nama_kategori,)
        )

        if cursor.fetchone():
            return jsonify({
                "status": "error",
                "message": "Kategori sudah tersedia"
            }), 409

        cursor.execute(
            "INSERT INTO kategori (nama_kategori) VALUES (%s)",
            (nama_kategori,)
        )

        kategori_id = cursor.lastrowid
        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Kategori berhasil ditambahkan",
            "data": {
                "kategori_id": kategori_id,
                "nama_kategori": nama_kategori
            }
        }), 201

    except Exception:
        if connection is not None:
            connection.rollback()

        import logging
        logging.exception("Gagal menambahkan kategori")

        return jsonify({
            "status": "error",
            "message": "Gagal menambahkan kategori"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None and connection.is_connected():
            connection.close()
