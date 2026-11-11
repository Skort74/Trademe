from flask import Blueprint, jsonify, request, g, current_app, send_from_directory
from database import get_db_connection
from routes.auth_utils import token_required, admin_required
import os
from uuid import uuid4            # use uuid4 directly (B1 helper)
from werkzeug.utils import secure_filename
from PIL import Image

barang_bp = Blueprint("barang", __name__)

# ------------------------------------------------------------------------
# Helper utilities – ownership extraction & safe barang lookup.
# All routes that need to verify the owner must use these helpers.
# ------------------------------------------------------------------------

def _get_user_id_from_g(current_user):
    """Defensive extraction of JWT ``sub`` claim."""
    sub = current_user.get("sub")
    try:
        return int(sub) if sub is not None else None
    except (TypeError, ValueError):
        return None

def _get_barang_for_owner(barang_id: int, user_id: int, cursor):
    """Fetch a barang row and verify ownership."""
    cursor.execute("SELECT * FROM barang WHERE barang_id = %s", (barang_id,))
    barang = cursor.fetchone()
    if not barang:
        return None, (jsonify({"status":"error","message":"Barang tidak ditemukan"}), 404)
    if barang["pemilik_id"] != user_id:
        return None, (jsonify({"status":"error","message":"Bukan pemilik barang"}), 403)
    return barang, None

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

        # --------------------------------------------------------------------
        #  Build dynamic filters (B1‑C2)
        # --------------------------------------------------------------------
        filters = []
        params = []

        # General search (nama_barang + deskripsi) – C1
        q = request.args.get("q")
        if q:
            filters.append("(b.nama_barang LIKE %s OR b.deskripsi LIKE %s)")
            like_q = f"%{q}%"
            params.extend([like_q, like_q])

        # Column‑specific filters
        mapping = {
            "kategori_id": "b.kategori_id",
            "kondisi": "b.kondisi",
            "tipe_transaksi": "b.tipe_transaksi",
            "status_barang": "b.status_barang",
            "status_verifikasi": "b.status_verifikasi",
            "pemilik_id": "b.pemilik_id",
            "lokasi": "b.lokasi"
        }
        for arg, col in mapping.items():
            val = request.args.get(arg)
            if val:
                if arg in ("kategori_id", "pemilik_id"):
                    try:
                        val_int = int(val)
                        filters.append(f"{col} = %s")
                        params.append(val_int)
                    except ValueError:
                        return jsonify({
                            "status": "error",
                            "message": f"{arg} harus berupa angka"
                        }), 400
                else:
                    filters.append(f"{col} = %s")
                    params.append(val)

        # Harga range – C2
        harga_min = request.args.get("harga_min")
        harga_max = request.args.get("harga_max")
        if harga_min:
            try:
                min_val = float(harga_min)
                filters.append("b.harga >= %s")
                params.append(min_val)
            except ValueError:
                return jsonify({
                    "status": "error",
                    "message": "harga_min harus berupa angka"
                }), 400
        if harga_max:
            try:
                max_val = float(harga_max)
                filters.append("b.harga <= %s")
                params.append(max_val)
            except ValueError:
                return jsonify({
                    "status": "error",
                    "message": "harga_max harus berupa angka"
                }), 400

        where_clause = ""
        if filters:
            where_clause = "WHERE " + " AND ".join(filters)

        # --------------------------------------------------------------------
        #  Sorting (whitelist) – C3
        # --------------------------------------------------------------------
        sort_opt = request.args.get("sort")
        sort_map = {
            "harga_asc": "b.harga ASC",
            "harga_desc": "b.harga DESC",
            "created_at_asc": "b.barang_id ASC",
            "created_at_desc": "b.barang_id DESC"
        }
        order_by = sort_map.get(sort_opt, "b.barang_id DESC")

        # --------------------------------------------------------------------
        #  Total count with same WHERE clause (fix for COUNT)
        # --------------------------------------------------------------------
        cursor.execute(f"""
            SELECT COUNT(*) AS total
            FROM barang b
            {where_clause}
        """, tuple(params))
        total = cursor.fetchone()["total"]

        # --------------------------------------------------------------------
        #  Data query with pagination, sorting and same WHERE clause
        # --------------------------------------------------------------------
        cursor.execute(f"""
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
            JOIN kategori k ON b.kategori_id = k.kategori_id
            JOIN user u ON b.pemilik_id = u.user_id
            {where_clause}
            ORDER BY {order_by}
            LIMIT %s OFFSET %s
        """, tuple(params + [limit, offset]))

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

        # 1. Pastikan barang ada dan milik user – gunakan helper
        barang, err = _get_barang_for_owner(barang_id, user_id, cursor)
        if err:
            return err

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
# DELETE endpoint – hard delete with FK‑conflict handling and photo cleanup
# ------------------------------------------------------------------------
@barang_bp.delete("/api/barang/<int:barang_id>")
@token_required
def delete_barang(barang_id):
    """
    Hard‑delete a barang owned by the requesting user.
    - Returns 409 if the barang is referenced in donasi, lelang,
      negosiasi, or transaksi tables.
    - After successful DB delete, any stored foto_barang file is removed
      using a safe path‑traversal guard (B5).
    """
    current_user = g.current_user
    user_id = _get_user_id_from_g(current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Verify ownership using the helper (B7)
        barang, err = _get_barang_for_owner(barang_id, user_id, cursor)
        if err:
            return err

        # ---- FK conflict check (A2) ---------------------------------
        fk_tables = ["donasi", "lelang", "negosiasi", "transaksi"]
        for tbl in fk_tables:
            cursor.execute(
                f"SELECT 1 FROM {tbl} WHERE barang_id = %s LIMIT 1", (barang_id,)
            )
            if cursor.fetchone():
                return jsonify({
                    "status": "error",
                    "message": "Barang tidak dapat dihapus karena memiliki data terkait"
                }), 409

        # ---- Perform hard delete (A1) --------------------------------
        cursor.execute("DELETE FROM barang WHERE barang_id = %s", (barang_id,))
        connection.commit()

        # ---- Photo cleanup (B5) --------------------------------------
        foto_path = barang.get("foto_barang")
        if foto_path:
            upload_root = os.path.abspath(
                os.path.join(current_app.root_path, "uploads", "barang")
            )
            # Strip any leading path components and guard against traversal
            filename_only = os.path.basename(foto_path)
            target_path = os.path.abspath(os.path.join(upload_root, filename_only))
            upload_root_real = os.path.realpath(upload_root)
            if os.path.realpath(target_path).startswith(upload_root_real + os.sep) and os.path.isfile(target_path):
                os.remove(target_path)

        return jsonify({
            "status": "success",
            "message": "Barang berhasil dihapus"
        }), 200

    except Exception:
        if connection:
            connection.rollback()
        import logging
        logging.exception("Gagal menghapus barang")
        return jsonify({
            "status": "error",
            "message": "Gagal menghapus barang"
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
# ---------------------------------------------------------------------------
# POST endpoint – upload atau ganti foto barang
# ---------------------------------------------------------------------------
@barang_bp.post("/api/barang/<int:barang_id>/photo")
@token_required
def upload_barang_photo(barang_id):
    """
    Upload a new photo for a barang owned by the requesting user.
    - Enforces max size 5 MiB (B2).
    - Validates image using Pillow via BytesIO (B3).
    - Stores full relative path "/uploads/barang/<filename>" in DB (B4).
    - On DB error, removes newly saved file.
    """
    current_user = g.current_user
    user_id = _get_user_id_from_g(current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    # ---- 1. Validate multipart file presence ----
    if "photo" not in request.files:
        return jsonify({"status": "error", "message": "Tidak ada file foto yang di‑upload"}), 400
    file = request.files["photo"]

    # ---- 2. Size checks (B2) ----
    MAX = 5 * 1024 * 1024
    if request.content_length and request.content_length > MAX + 1024:
        return jsonify({"status": "error", "message": "Ukuran file melebihi 5 MiB"}), 413
    data = file.read()
    if len(data) > MAX:
        return jsonify({"status": "error", "message": "Ukuran file melebihi 5 MiB"}), 413

    # ---- 3. Pillow verify (B3) ----
    from io import BytesIO
    try:
        Image.open(BytesIO(data)).verify()
    except Exception:
        return jsonify({"status": "error", "message": "File bukan gambar valid"}), 400

    # ---- 4. Save file ----
    upload_dir = os.path.abspath(os.path.join(current_app.root_path, "uploads", "barang"))
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(secure_filename(file.filename))[1].lower()
    filename = f"{uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, filename)
    with open(file_path, "wb") as f:
        f.write(data)

    # ---- 5. DB update ----
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Verify ownership
        barang, err = _get_barang_for_owner(barang_id, user_id, cursor)
        if err:
            if os.path.isfile(file_path):
                os.remove(file_path)
            return err

        # Remove old photo if exists (B5)
        old_foto = barang.get("foto_barang")
        if old_foto:
            filename_only = os.path.basename(old_foto)
            old_path = os.path.abspath(os.path.join(upload_dir, filename_only))
            upload_root_real = os.path.realpath(upload_dir)
            if os.path.realpath(old_path).startswith(upload_root_real + os.sep) and os.path.isfile(old_path):
                os.remove(old_path)

        rel_path = f"/uploads/barang/{filename}"
        cursor.execute(
            "UPDATE barang SET foto_barang = %s WHERE barang_id = %s",
            (rel_path, barang_id)
        )
        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Foto barang berhasil di‑upload",
            "data": {
                "foto_barang": rel_path,
                "photo_url": rel_path
            }
        }), 200

    except Exception:
        if connection:
            connection.rollback()
        import logging
        logging.exception("Gagal mengupload foto barang")
        if os.path.isfile(file_path):
            os.remove(file_path)
        return jsonify({"status": "error", "message": "Gagal mengupload foto barang"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
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

# ------------------------------------------------------------------------
# PATCH endpoint – update status_barang with transition rules
# ------------------------------------------------------------------------
@barang_bp.patch("/api/barang/<int:barang_id>/status")
@token_required
def update_barang_status(barang_id):
    """
    Update status_barang dengan aturan transisi:
    - Owner: hanya pending <-> tersedia
    - Admin: semua transisi
    - Final state (terjual/didonasikan/dilelang) tidak bisa diubah owner
    """
    user_id = _get_user_id_from_g(g.current_user)
    if user_id is None:
        return jsonify({"status": "error", "message": "Token tidak valid"}), 401

    is_admin = g.current_user.get("role") == "admin"

    body = request.get_json(silent=True)
    if not isinstance(body, dict) or "status_barang" not in body:
        return jsonify({
            "status": "error",
            "message": "Request harus berisi field 'status_barang'"
        }), 400

    new_status = body["status_barang"]
    allowed = {"pending", "tersedia", "terjual", "didonasikan", "dilelang"}
    if new_status not in allowed:
        return jsonify({
            "status": "error",
            "message": f"status_barang tidak valid. Nilai yang diizinkan: {sorted(allowed)}"
        }), 400

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Ambil data barang
        cursor.execute(
            "SELECT pemilik_id, status_barang FROM barang WHERE barang_id = %s",
            (barang_id,)
        )
        barang = cursor.fetchone()
        if not barang:
            return jsonify({"status": "error", "message": "Barang tidak ditemukan"}), 404

        # Auth check
        if not is_admin and barang["pemilik_id"] != user_id:
            return jsonify({"status": "error", "message": "Bukan pemilik barang"}), 403

        current = barang["status_barang"]

        # Transition rules
        if is_admin:
            # Admin: semua transisi diizinkan
            pass
        else:
            # Owner: hanya pending <-> tersedia
            if current not in {"pending", "tersedia"}:
                return jsonify({
                    "status": "error",
                    "message": f"Status '{current}' tidak dapat diubah oleh pemilik"
                }), 403
            if new_status not in {"pending", "tersedia"}:
                return jsonify({
                    "status": "error",
                    "message": f"Status '{new_status}' hanya dapat diatur melalui modul terkait (transaksi/lelang/donasi)"
                }), 403

        # Update
        cursor.execute(
            "UPDATE barang SET status_barang = %s WHERE barang_id = %s",
            (new_status, barang_id)
        )
        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Status barang berhasil diperbarui",
            "data": {
                "barang_id": barang_id,
                "status_barang": new_status
            }
        }), 200

    except Exception:
        if connection:
            connection.rollback()
        import logging
        logging.exception("Gagal update status barang")
        return jsonify({
            "status": "error",
            "message": "Gagal update status barang"
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

# ------------------------------------------------------------------------
# Static file serving – akses foto barang via URL
# ------------------------------------------------------------------------
@barang_bp.get("/uploads/barang/<path:filename>")
def serve_barang_photo(filename):
    """Serve file foto barang dari folder uploads/barang/."""
    return send_from_directory(
        os.path.join(current_app.root_path, "uploads", "barang"),
        filename
    )
