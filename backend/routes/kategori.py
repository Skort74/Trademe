
from flask import Blueprint, jsonify, request

from database import get_db_connection

kategori_bp = Blueprint("kategori", __name__)


@kategori_bp.get("/")
def get_kategori():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT kategori_id, nama_kategori FROM kategori ORDER BY kategori_id"
        )
        data = cursor.fetchall()

        return jsonify(data), 200

    except Exception:
        kategori_bp.logger.exception("Gagal mengambil kategori")
        return jsonify({"message": "Gagal mengambil data kategori"}), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@kategori_bp.post("/")
def create_kategori():
    data = request.get_json(silent=True) or {}
    nama_kategori = data.get("nama_kategori")

    if not isinstance(nama_kategori, str) or not nama_kategori.strip():
        return jsonify({
            "message": "nama_kategori wajib diisi"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "INSERT INTO kategori (nama_kategori) VALUES (%s)",
            (nama_kategori.strip(),)
        )
        connection.commit()

        kategori_id = cursor.lastrowid

        return jsonify({
            "message": "Kategori berhasil ditambahkan",
            "kategori_id": kategori_id,
            "nama_kategori": nama_kategori.strip()
        }), 201

    except Exception:
        kategori_bp.logger.exception("Gagal menambahkan kategori")

        if connection and connection.is_connected():
            connection.rollback()

        return jsonify({
            "message": "Gagal menambahkan kategori"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

