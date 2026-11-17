import os
import uuid
import logging

from PIL import Image, UnidentifiedImageError
from flask import (
    Blueprint, jsonify, request, g,
    current_app, send_from_directory
)
from werkzeug.utils import secure_filename
from database import get_db_connection
from routes.auth_utils import token_required

profile_bp = Blueprint("profile", __name__)
logger = logging.getLogger(__name__)


@profile_bp.get("/api/profile")
@token_required
def get_profile():
    account = g.current_user

    # Endpoint profil ini khusus akun pengguna biasa.
    if account.get("account_type") != "user":
        return jsonify({
            "status": "error",
            "message": "Endpoint ini khusus profil pengguna",
        }), 403

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT user_id AS id, nama, email, no_hp, alamat,
                   foto_profil, role, tanggal_daftar
            FROM `user`
            WHERE user_id = %s
            """,
            (int(account["sub"]),),
        )
        user = cursor.fetchone()

        if not user:
            return jsonify({
                "status": "error",
                "message": "Pengguna tidak ditemukan",
            }), 404

        return jsonify({
            "status": "success",
            "data": user,
        }), 200

    except Exception:
        logger.exception("Gagal mengambil profil")

        return jsonify({
            "status": "error",
            "message": "Gagal mengambil profil",
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()

@profile_bp.put("/api/profile")
@token_required
def update_profile():
    account = g.current_user

    if account.get("account_type") != "user":
        return jsonify({
            "status": "error",
            "message": "Endpoint ini khusus profil pengguna",
        }), 403

    body = request.get_json(silent=True)

    if not isinstance(body, dict):
        return jsonify({
            "status": "error",
            "message": "Request harus berupa JSON",
        }), 400

    allowed_fields = {"nama", "no_hp", "alamat"}
    if not body or not set(body.keys()).issubset(allowed_fields):
        return jsonify({
            "status": "error",
            "message": "Field tidak valid atau body kosong",
        }), 400

    updates = {}

    if "nama" in body:
        nama = body["nama"]
        if not isinstance(nama, str) or not nama.strip():
            return jsonify({
                "status": "error",
                "message": "Nama tidak boleh kosong",
            }), 400
        if len(nama.strip()) > 100:
            return jsonify({
                "status": "error",
                "message": "Nama maksimal 100 karakter",
            }), 400
        updates["nama"] = nama.strip()

    if "no_hp" in body:
        no_hp = body["no_hp"]
        if no_hp is not None and not isinstance(no_hp, str):
            return jsonify({
                "status": "error",
                "message": "Nomor HP harus berupa teks",
            }), 400
        if no_hp is not None and len(no_hp.strip()) > 20:
            return jsonify({
                "status": "error",
                "message": "Nomor HP maksimal 20 karakter",
            }), 400
        updates["no_hp"] = no_hp.strip() or None if no_hp else None

    if "alamat" in body:
        alamat = body["alamat"]
        if alamat is not None and not isinstance(alamat, str):
            return jsonify({
                "status": "error",
                "message": "Alamat harus berupa teks",
            }), 400
        updates["alamat"] = alamat.strip() or None if alamat else None

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        set_clause = ", ".join(
            f"`{field}` = %s" for field in updates
        )
        values = list(updates.values())
        values.append(int(account["sub"]))

        cursor.execute(
            f"UPDATE `user` SET {set_clause} WHERE user_id = %s",
            tuple(values),
        )

        if cursor.rowcount == 0:
            cursor.execute(
                "SELECT user_id FROM `user` WHERE user_id = %s",
                (int(account["sub"]),),
            )
            if not cursor.fetchone():
                return jsonify({
                    "status": "error",
                    "message": "Pengguna tidak ditemukan",
                }), 404

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Profil berhasil diperbarui",
        }), 200

    except Exception:
        if connection is not None:
            connection.rollback()

        logger.exception("Gagal memperbarui profil")

        return jsonify({
            "status": "error",
            "message": "Gagal memperbarui profil",
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()

@profile_bp.post("/api/profile/photo")
@token_required
def upload_profile_photo():
    account = g.current_user

    # Endpoint ini khusus akun pengguna
    if account.get("account_type") != "user":
        return jsonify({
            "status": "error",
            "message": "Endpoint ini khusus profil pengguna"
        }), 403

    # Pastikan file dikirim dengan key "foto"
    if "foto" not in request.files:
        return jsonify({
            "status": "error",
            "message": "File foto wajib disertakan dengan key 'foto'"
        }), 400

    file = request.files["foto"]

    if not file.filename:
        return jsonify({
            "status": "error",
            "message": "Belum ada file yang dipilih"
        }), 400

    # Periksa ekstensi file
    original_name = secure_filename(file.filename)
    extension = os.path.splitext(original_name)[1].lower()

    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}

    if extension not in allowed_extensions:
        return jsonify({
            "status": "error",
            "message": "Format foto harus JPG, JPEG, PNG, atau WEBP"
        }), 400

    upload_dir = os.path.join(
        current_app.root_path, "uploads", "profiles"
    )
    os.makedirs(upload_dir, exist_ok=True)

    # Nama acak mencegah bentrok nama dan menebak nama file
    file_id = uuid.uuid4().hex

    connection = None
    cursor = None
    saved_path = None

    try:
        # Periksa apakah file benar-benar gambar
        image = Image.open(file.stream)

        format_map = {
            "JPEG": ".jpg",
            "PNG": ".png",
            "WEBP": ".webp"
        }

        detected_extension = format_map.get(image.format)

        if detected_extension is None:
            return jsonify({
                "status": "error",
                "message": "Format gambar tidak didukung"
            }), 400

        image.verify()

        filename = file_id + detected_extension
        saved_path = os.path.join(upload_dir, filename)

        # Simpan file setelah validasi
        file.stream.seek(0)
        file.save(saved_path)

        # Baca lokasi foto lama dari database
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT foto_profil
            FROM user
            WHERE user_id = %s
            """,
            (account["sub"],)
        )

        user = cursor.fetchone()

        if not user:
            if saved_path and os.path.exists(saved_path):
                os.remove(saved_path)

            return jsonify({
                "status": "error",
                "message": "Pengguna tidak ditemukan"
            }), 404

        photo_url = f"/uploads/profiles/{filename}"

        cursor.execute(
            """
            UPDATE user
            SET foto_profil = %s
            WHERE user_id = %s
            """,
            (photo_url, account["sub"])
        )

        connection.commit()

        # Hapus foto lama jika berada di folder upload profil
        old_photo = user.get("foto_profil")

        if old_photo and old_photo.startswith("/uploads/profiles/"):
            old_filename = os.path.basename(old_photo)
            old_path = os.path.join(upload_dir, old_filename)

            if old_filename and os.path.isfile(old_path):
                try:
                    os.remove(old_path)
                except OSError:
                    current_app.logger.warning(
                        "Foto lama gagal dihapus: %s", old_path
                    )

        return jsonify({
            "status": "success",
            "message": "Foto profil berhasil diperbarui",
            "data": {
                "foto_profil": photo_url
            }
        }), 200

    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        if saved_path and os.path.exists(saved_path):
            os.remove(saved_path)

        return jsonify({
            "status": "error",
            "message": "File bukan gambar valid atau gambar tidak dapat diproses"
        }), 400

    except Exception:
        if connection is not None:
            connection.rollback()

        if saved_path and os.path.exists(saved_path):
            os.remove(saved_path)

        current_app.logger.exception("Upload foto profil gagal")

        return jsonify({
            "status": "error",
            "message": "Terjadi kesalahan saat mengunggah foto"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None and connection.is_connected():
            connection.close()


@profile_bp.get("/uploads/profiles/<path:filename>")
def serve_profile_photo(filename):
    safe_filename = secure_filename(filename)

    if safe_filename != filename or not safe_filename:
        return jsonify({
            "status": "error",
            "message": "Nama file tidak valid"
        }), 400

    upload_dir = os.path.join(
        current_app.root_path, "uploads", "profiles"
    )

    return send_from_directory(upload_dir, safe_filename)