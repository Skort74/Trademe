from flask import Blueprint, jsonify, request, g
from database import get_db_connection
from routes.auth_utils import token_required

barang_bp = Blueprint("barang", __name__)


@barang_bp.get("/api/barang")
def get_barang():
    connection = None
    cursor = None

    try:
        # Validasi pagination
        try:
            page = int(request.args.get("page", 1))
            limit = int(request.args.get("limit", 10))
        except (TypeError, ValueError):
            return jsonify({
                "status": "error",
                "message": "page dan limit harus berupa angka"
            }), 400

        if page < 1 or limit < 1 or limit > 100:
            return jsonify({
                "status": "error",
                "message": "page minimal 1 dan limit harus antara 1-100"
            }), 400

        offset = (page - 1) * limit

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Mengambil total barang
        cursor.execute("""
            SELECT COUNT(*) AS total
            FROM barang
        """)
        total = cursor.fetchone()["total"]

        # Mengambil daftar barang beserta kategori dan pemilik
        cursor.execute("""
            SELECT
                b.barang_id,
                b.pemilik_id,
                u.nama AS nama_pemilik,
                b.kategori_id,
                k.nama_kategori,
                b.nama_barang,
                b.deskripsi,
                b.kondisi,
                b.harga,
                b.lokasi,
                b.foto_barang,
                b.tipe_transaksi,
                b.status_barang,
                b.status_verifikasi
            FROM barang b
            JOIN kategori k
                ON b.kategori_id = k.kategori_id
            JOIN user u
                ON b.pemilik_id = u.user_id
            ORDER BY b.barang_id DESC
            LIMIT %s OFFSET %s
        """, (limit, offset))

        data = cursor.fetchall()
        total_pages = (total + limit - 1) // limit

        return jsonify({
            "status": "success",
            "data": data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_data": total,
                "total_pages": total_pages
            }
        }), 200

    except Exception:
        import logging
        logging.exception("Gagal mengambil daftar barang")

        return jsonify({
            "status": "error",
            "message": "Gagal mengambil daftar barang"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None and connection.is_connected():
            connection.close()

@barang_bp.get("/api/barang/<int:barang_id>")
def get_detail_barang(barang_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                b.barang_id,
                b.pemilik_id,
                u.nama AS nama_pemilik,
                b.kategori_id,
                k.nama_kategori,
                b.nama_barang,
                b.deskripsi,
                b.kondisi,
                b.harga,
                b.lokasi,
                b.foto_barang,
                b.tipe_transaksi,
                b.status_barang,
                b.status_verifikasi
            FROM barang b
            JOIN kategori k
                ON b.kategori_id = k.kategori_id
            JOIN user u
                ON b.pemilik_id = u.user_id
            WHERE b.barang_id = %s
        """, (barang_id,))

        data = cursor.fetchone()

        if not data:
            return jsonify({
                "status": "error",
                "message": "Barang tidak ditemukan"
            }), 404

        return jsonify({
            "status": "success",
            "data": data
        }), 200

    except Exception:
        import logging
        logging.exception("Gagal mengambil detail barang")

        return jsonify({
            "status": "error",
            "message": "Gagal mengambil detail barang"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None and connection.is_connected():
            connection.close()

@barang_bp.post("/api/barang")
@token_required
def tambah_barang():
    connection = None
    cursor = None

    try:
        body = request.get_json(silent=True)

        if not isinstance(body, dict):
            return jsonify({
                "status": "error",
                "message": "Request harus berupa JSON"
            }), 400

        # Ambil ID pemilik dari pengguna yang sudah terautentikasi
        current_user = g.current_user
        pemilik_id = current_user.get("user_id") or current_user.get("sub")

        if pemilik_id is None:
            return jsonify({
                "status": "error",
                "message": "ID pengguna tidak ditemukan pada token"
            }), 401

        # Validasi input wajib
        nama_barang = body.get("nama_barang")
        kategori_id = body.get("kategori_id")
        tipe_transaksi = body.get("tipe_transaksi")

        if not isinstance(nama_barang, str) or not nama_barang.strip():
            return jsonify({
                "status": "error",
                "message": "nama_barang wajib diisi"
            }), 400

        try:
            kategori_id = int(kategori_id)
        except (TypeError, ValueError):
            return jsonify({
                "status": "error",
                "message": "kategori_id harus berupa angka"
            }), 400

        if kategori_id < 1:
            return jsonify({
                "status": "error",
                "message": "kategori_id tidak valid"
            }), 400

        tipe_valid = ["jual", "tukar", "donasi", "lelang"]

        if tipe_transaksi not in tipe_valid:
            return jsonify({
                "status": "error",
                "message": (
                    "tipe_transaksi harus berupa jual, tukar, "
                    "donasi, atau lelang"
                )
            }), 400

        # Validasi harga jika diisi
        harga = body.get("harga")

        if harga is not None:
            from decimal import Decimal, InvalidOperation

            try:
                harga = Decimal(str(harga))
                if not harga.is_finite() or harga < 0 or harga > Decimal("9999999999999.99"):
                    raise InvalidOperation
            except (InvalidOperation, ValueError):
                return jsonify({
                    "status": "error",
                    "message": "harga harus berupa angka yang valid dan tidak negatif"
                }), 400

        # Validasi panjang dan tipe input opsional
        kondisi = body.get("kondisi")
        lokasi = body.get("lokasi")
        deskripsi = body.get("deskripsi")
        foto_barang = body.get("foto_barang")

        if kondisi is not None and (
            not isinstance(kondisi, str) or len(kondisi) > 50
        ):
            return jsonify({
                "status": "error",
                "message": "kondisi maksimal 50 karakter"
            }), 400

        if lokasi is not None and (
            not isinstance(lokasi, str) or len(lokasi) > 255
        ):
            return jsonify({
                "status": "error",
                "message": "lokasi maksimal 255 karakter"
            }), 400

        if deskripsi is not None and not isinstance(deskripsi, str):
            return jsonify({
                "status": "error",
                "message": "deskripsi harus berupa teks"
            }), 400

        if foto_barang is not None and (
            not isinstance(foto_barang, str) or len(foto_barang) > 255
        ):
            return jsonify({
                "status": "error",
                "message": "foto_barang harus berupa teks maksimal 255 karakter"
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Pastikan kategori tersedia
        cursor.execute(
            "SELECT kategori_id FROM kategori WHERE kategori_id = %s",
            (kategori_id,)
        )

        if cursor.fetchone() is None:
            return jsonify({
                "status": "error",
                "message": "Kategori tidak ditemukan"
            }), 404

        # Barang baru menunggu verifikasi Admin
        cursor.execute("""
            INSERT INTO barang (
                pemilik_id,
                kategori_id,
                nama_barang,
                deskripsi,
                kondisi,
                harga,
                lokasi,
                foto_barang,
                tipe_transaksi,
                status_barang,
                status_verifikasi
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            pemilik_id,
            kategori_id,
            nama_barang.strip(),
            deskripsi,
            kondisi,
            harga,
            lokasi,
            foto_barang,
            tipe_transaksi,
            "pending",
            "pending"
        ))

        barang_id = cursor.lastrowid
        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Barang berhasil diajukan dan menunggu verifikasi Admin",
            "data": {
                "barang_id": barang_id,
                "pemilik_id": pemilik_id,
                "kategori_id": kategori_id,
                "nama_barang": nama_barang.strip(),
                "deskripsi": deskripsi,
                "kondisi": kondisi,
                "harga": str(harga) if harga is not None else None,
                "lokasi": lokasi,
                "foto_barang": foto_barang,
                "tipe_transaksi": tipe_transaksi,
                "status_barang": "pending",
                "status_verifikasi": "pending"
            }
        }), 201

    except Exception:
        if connection is not None:
            connection.rollback()

        import logging
        logging.exception("Gagal menambahkan barang")

        return jsonify({
            "status": "error",
            "message": "Gagal menambahkan barang"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None and connection.is_connected():
            connection.close()
