from flask import Blueprint, jsonify, request, g
from database import get_db_connection
from routes.auth_utils import token_required, admin_required

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

@barang_bp.put("/api/barang/<int:barang_id>")
@token_required
def edit_barang(barang_id):
    """Edit barang milik pengguna yang sedang login.
    Hanya field yang diizinkan yang dapat diubah.
    Validasi kepemilikan, status barang, dan data input.
    """
    # Parse request body
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({
            "status": "error",
            "message": "Request harus berupa JSON"
        }), 400

    # Daftar field yang boleh diubah
    allowed_fields = {
        "nama_barang",
        "deskripsi",
        "kondisi",
        "harga",
        "lokasi",
        "foto_barang",
        "tipe_transaksi",
        "kategori_id",
    }
    updates = {}
    for key in allowed_fields.intersection(body.keys()):
        updates[key] = body[key]

    if not updates:
        return jsonify({
            "status": "error",
            "message": "Tidak ada field yang dapat diperbarui atau field tidak valid"
        }), 400

    # Validasi masing‑masing field
    # nama_barang wajib non‑kosong bila diberikan
    if "nama_barang" in updates:
        nama = updates["nama_barang"]
        if not isinstance(nama, str) or not nama.strip():
            return jsonify({
                "status": "error",
                "message": "nama_barang wajib diisi dan berupa teks"
            }), 400
        updates["nama_barang"] = nama.strip()

    # kategori_id harus integer dan ada di tabel kategori
    if "kategori_id" in updates:
        try:
            cat_id = int(updates["kategori_id"])
        except (TypeError, ValueError):
            return jsonify({
                "status": "error",
                "message": "kategori_id harus berupa angka"
            }), 400
        if cat_id < 1:
            return jsonify({
                "status": "error",
                "message": "kategori_id tidak valid"
            }), 400
        updates["kategori_id"] = cat_id

    # tipe_transaksi harus salah satu enum yang ada
    if "tipe_transaksi" in updates:
        tipe = updates["tipe_transaksi"]
        valid_tipe = ["jual", "tukar", "donasi", "lelang"]
        if tipe not in valid_tipe:
            return jsonify({
                "status": "error",
                "message": "tipe_transaksi harus berupa jual, tukar, donasi, atau lelang"
            }), 400

    # harga bila diberikan harus angka positif & dalam batas
    if "harga" in updates:
        from decimal import Decimal, InvalidOperation
        try:
            harga_val = Decimal(str(updates["harga"]))
            if not harga_val.is_finite() or harga_val < 0 or harga_val > Decimal("9999999999999.99"):
                raise InvalidOperation
        except (InvalidOperation, ValueError):
            return jsonify({
                "status": "error",
                "message": "harga harus berupa angka yang valid dan tidak negatif"
            }), 400
        updates["harga"] = str(harga_val)

    # kondisi, lokasi, deskripsi, foto_barang hanya tipe string / nullable dengan panjang maksimum
    if "kondisi" in updates:
        kondisi = updates["kondisi"]
        if kondisi is not None and (not isinstance(kondisi, str) or len(kondisi) > 50):
            return jsonify({
                "status": "error",
                "message": "kondisi maksimal 50 karakter"
            }), 400
    if "lokasi" in updates:
        lokasi = updates["lokasi"]
        if lokasi is not None and (not isinstance(lokasi, str) or len(lokasi) > 255):
            return jsonify({
                "status": "error",
                "message": "lokasi maksimal 255 karakter"
            }), 400
    if "deskripsi" in updates:
        deskripsi = updates["deskripsi"]
        if deskripsi is not None and not isinstance(deskripsi, str):
            return jsonify({
                "status": "error",
                "message": "deskripsi harus berupa teks"
            }), 400
    if "foto_barang" in updates:
        foto = updates["foto_barang"]
        if foto is not None and (not isinstance(foto, str) or len(foto) > 255):
            return jsonify({
                "status": "error",
                "message": "foto_barang harus berupa teks maksimal 255 karakter"
            }), 400

    # Dapatkan user_id dari token payload
    current_user = g.current_user
    user_id = int(current_user.get("sub"))

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # 1. Pastikan barang ada dan milik user
        cursor.execute("SELECT pemilik_id, status_barang FROM barang WHERE barang_id = %s", (barang_id,))
        barang = cursor.fetchone()
        if not barang:
            return jsonify({"status": "error", "message": "Barang tidak ditemukan"}), 404
        if barang["pemilik_id"] != user_id:
            return jsonify({"status": "error", "message": "Akses ditolak: barang bukan milik Anda"}), 403

        # 2. Cegah edit bila status tidak dapat diubah
        if barang["status_barang"] in ("terjual", "didonasikan", "dilelang"):
            return jsonify({
                "status": "error",
                "message": f"Barang dengan status '{barang['status_barang']}' tidak dapat diedit"
            }), 403

        # 3. Cegah edit bila ada transaksi aktif yang belum selesai
        cursor.execute(
            "SELECT 1 FROM transaksi WHERE barang_id = %s AND status_transaksi NOT IN ('selesai', 'dibatalkan') LIMIT 1",
            (barang_id,)
        )
        if cursor.fetchone():
            return jsonify({
                "status": "error",
                "message": "Barang sedang terlibat transaksi aktif dan tidak dapat diedit"
            }), 403

        # 4. Jika kategori_id berubah, pastikan kategori ada
        if "kategori_id" in updates:
            cursor.execute("SELECT kategori_id FROM kategori WHERE kategori_id = %s", (updates["kategori_id"],))
            if cursor.fetchone() is None:
                return jsonify({"status": "error", "message": "Kategori tidak ditemukan"}), 404

        # 5. Buat query UPDATE dinamis
        set_clause = ", ".join([f"`{field}` = %s" for field in updates.keys()])
        values = list(updates.values())
        values.append(barang_id)
        cursor.execute(f"UPDATE barang SET {set_clause} WHERE barang_id = %s", tuple(values))
        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Barang berhasil diperbarui",
            "data": {
                "barang_id": barang_id,
                **updates,
            }
        }), 200

    except Exception:
        if connection is not None:
            connection.rollback()
        import logging
        logging.exception("Gagal mengedit barang")
        return jsonify({"status": "error", "message": "Gagal mengedit barang"}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()

# ---------------------------------------------------------------------------
# Admin verification endpoints (approve / reject barang)
# ---------------------------------------------------------------------------

@barang_bp.post('/api/admin/barang/<int:barang_id>/approve')
@admin_required
def approve_barang(barang_id):
    """Approve a barang pending verification.
    Changes:
        status_verifikasi -> 'disetujui'
        status_barang      -> 'tersedia'
    """
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        connection.start_transaction()
        cursor = connection.cursor(dictionary=True)

        # Fetch barang and ensure it is pending verification
        cursor.execute(
            "SELECT status_verifikasi FROM barang WHERE barang_id = %s FOR UPDATE",
            (barang_id,)
        )
        barang = cursor.fetchone()
        if not barang:
            connection.rollback()
            return jsonify({"status": "error", "message": "Barang tidak ditemukan"}), 404
        if barang["status_verifikasi"] != "pending":
            connection.rollback()
            return jsonify({"status": "error", "message": "Barang sudah diproses sebelumnya"}), 409

        # Update status
        cursor.execute(
            "UPDATE barang SET status_verifikasi = %s, status_barang = %s WHERE barang_id = %s",
            ("disetujui", "tersedia", barang_id)
        )
        connection.commit()
        return jsonify({"status": "success", "message": "Barang berhasil disetujui"}), 200
    except Exception:
        if connection:
            connection.rollback()
        import logging
        logging.exception("Gagal menyetujui barang")
        return jsonify({"status": "error", "message": "Gagal menyetujui barang"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

@barang_bp.post('/api/admin/barang/<int:barang_id>/reject')
@admin_required
def reject_barang(barang_id):
    """Reject a barang pending verification.
    Changes:
        status_verifikasi -> 'ditolak'
    """
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        connection.start_transaction()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT status_verifikasi FROM barang WHERE barang_id = %s FOR UPDATE",
            (barang_id,)
        )
        barang = cursor.fetchone()
        if not barang:
            connection.rollback()
            return jsonify({"status": "error", "message": "Barang tidak ditemukan"}), 404
        if barang["status_verifikasi"] != "pending":
            connection.rollback()
            return jsonify({"status": "error", "message": "Barang sudah diproses sebelumnya"}), 409

        cursor.execute(
            "UPDATE barang SET status_verifikasi = %s WHERE barang_id = %s",
            ("ditolak", barang_id)
        )
        connection.commit()
        return jsonify({"status": "success", "message": "Barang ditolak"}), 200
    except Exception:
        if connection:
            connection.rollback()
        import logging
        logging.exception("Gagal menolak barang")
        return jsonify({"status": "error", "message": "Gagal menolak barang"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
