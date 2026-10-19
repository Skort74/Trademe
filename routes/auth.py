
import os
import logging
from datetime import datetime, timedelta, timezone
import uuid
import jwt
from flask import Blueprint, jsonify, request
from flask import g
from routes.auth_utils import token_required
from werkzeug.security import (
    check_password_hash,
    generate_password_hash,
)

from database import get_db_connection


auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger(__name__)



def create_access_token(account_id, email, role, account_type):
    secret = os.getenv("JWT_SECRET_KEY")

    if not secret:
        raise RuntimeError("JWT_SECRET_KEY belum dikonfigurasi")

    try:
        minutes = int(os.getenv("JWT_ACCESS_TOKEN_MINUTES", "15"))
    except ValueError as exc:
        raise RuntimeError(
            "JWT_ACCESS_TOKEN_MINUTES harus berupa angka"
        ) from exc

    if minutes < 1:
        raise RuntimeError(
            "JWT_ACCESS_TOKEN_MINUTES minimal 1"
        )

    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(account_id),
        "email": email,
        "role": role,
        "account_type": account_type,
        "iat": now,
        "exp": now + timedelta(minutes=minutes),
        "jti": str(uuid.uuid4()),
    }

    return jwt.encode(payload, secret, algorithm="HS256")


@auth_bp.post("/api/auth/register")
def register():
    body = request.get_json(silent=True)

    if not isinstance(body, dict):
        return jsonify({
            "status": "error",
            "message": "Request harus berupa JSON",
        }), 400

    nama = body.get("nama")
    email = body.get("email")
    password = body.get("password")
    no_hp = body.get("no_hp")
    alamat = body.get("alamat")

    if not all(
        isinstance(value, str) and value.strip()
        for value in (nama, email, password)
    ):
        return jsonify({
            "status": "error",
            "message": "Nama, email, dan password wajib diisi",
        }), 400

    nama = nama.strip()
    email = email.strip().lower()

    if len(nama) > 100:
        return jsonify({
            "status": "error",
            "message": "Nama maksimal 100 karakter",
        }), 400

    if len(email) > 100 or "@" not in email:
        return jsonify({
            "status": "error",
            "message": "Format email tidak valid",
        }), 400

    if len(password) < 8 or len(password) > 128:
        return jsonify({
            "status": "error",
            "message": "Password harus terdiri dari 8–128 karakter",
        }), 400

    if no_hp is not None:
        if not isinstance(no_hp, str) or len(no_hp.strip()) > 20:
            return jsonify({
                "status": "error",
                "message": "Nomor HP tidak valid",
            }), 400
        no_hp = no_hp.strip() or None

    if alamat is not None:
        if not isinstance(alamat, str):
            return jsonify({
                "status": "error",
                "message": "Alamat harus berupa teks",
            }), 400
        alamat = alamat.strip() or None

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Email tidak boleh bertabrakan dengan akun admin.
        cursor.execute(
            "SELECT user_id FROM `user` WHERE email = %s",
            (email,),
        )
        if cursor.fetchone():
            return jsonify({
                "status": "error",
                "message": "Email sudah terdaftar",
            }), 409

        cursor.execute(
            "SELECT admin_id FROM `admin` WHERE email = %s",
            (email,),
        )
        if cursor.fetchone():
            return jsonify({
                "status": "error",
                "message": "Email sudah terdaftar",
            }), 409

        password_hash = generate_password_hash(password)

        cursor.execute(
            """
            INSERT INTO `user`
                (nama, email, password, no_hp, alamat, role)
            VALUES (%s, %s, %s, %s, %s, 'pengguna')
            """,
            (nama, email, password_hash, no_hp, alamat),
        )

        user_id = cursor.lastrowid
        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Registrasi berhasil",
            "data": {
                "user_id": user_id,
                "nama": nama,
                "email": email,
                "no_hp": no_hp,
                "alamat": alamat,
                "role": "pengguna",
            },
        }), 201

    except Exception:
        if connection is not None:
            connection.rollback()

        logger.exception("Registrasi gagal")

        return jsonify({
            "status": "error",
            "message": "Terjadi kesalahan saat registrasi",
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()


@auth_bp.post("/api/auth/login")
def login():
    body = request.get_json(silent=True)

    if not isinstance(body, dict):
        return jsonify({
            "status": "error",
            "message": "Request harus berupa JSON",
        }), 400

    email = body.get("email")
    password = body.get("password")

    if not all(
        isinstance(value, str) and value.strip()
        for value in (email, password)
    ):
        return jsonify({
            "status": "error",
            "message": "Email dan password wajib diisi",
        }), 400

    email = email.strip().lower()

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT user_id AS account_id, nama AS nama_akun,
                   email, password, role
            FROM `user`
            WHERE email = %s
            """,
            (email,),
        )
        account = cursor.fetchone()
        account_type = "user"

        # Jika bukan pengguna, periksa tabel admin.
        if account is None:
            cursor.execute(
                """
                SELECT admin_id AS account_id,
                       nama_admin AS nama_akun,
                       email, password
                FROM `admin`
                WHERE email = %s
                """,
                (email,),
            )
            account = cursor.fetchone()
            account_type = "admin"

        if account is None:
            return jsonify({
                "status": "error",
                "message": "Email atau password salah",
            }), 401

        try:
            password_valid = check_password_hash(
                account["password"],
                password,
            )
        except (ValueError, TypeError):
            password_valid = False

        if not password_valid:
            return jsonify({
                "status": "error",
                "message": "Email atau password salah",
            }), 401

        role = (
            account["role"]
            if account_type == "user"
            else "admin"
        )

        token = create_access_token(
            account["account_id"],
            account["email"],
            role,
            account_type,
        )

        return jsonify({
            "status": "success",
            "message": "Login berhasil",
            "access_token": token,
            "token_type": "Bearer",
            "expires_in": int(
                os.getenv("JWT_ACCESS_TOKEN_MINUTES", "15")
            ) * 60,
            "data": {
                "id": account["account_id"],
                "nama": account["nama_akun"],
                "email": account["email"],
                "role": role,
            },
        }), 200

    except Exception:
        logger.exception("Login gagal")

        return jsonify({
            "status": "error",
            "message": "Terjadi kesalahan saat login",
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()
    
@auth_bp.get("/api/auth/me")
@token_required
def get_current_user():
    payload = g.current_user
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        if payload.get("account_type") == "admin":
            cursor.execute(
                """
                SELECT admin_id AS id, nama_admin AS nama, email
                FROM `admin`
                WHERE admin_id = %s
                """,
                (int(payload["sub"]),),
            )
            account = cursor.fetchone()
            role = "admin"
        else:
            cursor.execute(
                """
                SELECT user_id AS id, nama, email, no_hp, alamat,
                       foto_profil, role
                FROM `user`
                WHERE user_id = %s
                """,
                (int(payload["sub"]),),
            )
            account = cursor.fetchone()
            role = account["role"] if account else None

        if not account:
            return jsonify({
                "status": "error",
                "message": "Akun tidak ditemukan",
            }), 401

        account["role"] = role

        return jsonify({
            "status": "success",
            "data": account,
        }), 200

    except Exception:
        logger.exception("Pemeriksaan akun gagal")
        return jsonify({
            "status": "error",
            "message": "Gagal mengambil data akun",
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()


@auth_bp.post("/api/auth/logout")
@token_required
def logout():
    payload = g.current_user
    connection = None
    cursor = None

    try:
        expires_at = datetime.fromtimestamp(
            payload["exp"], tz=timezone.utc
        ).replace(tzinfo=None)

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT IGNORE INTO token_blacklist (jti, expires_at)
            VALUES (%s, %s)
            """,
            (payload["jti"], expires_at),
        )
        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Logout berhasil",
        }), 200

    except Exception:
        if connection is not None:
            connection.rollback()

        logger.exception("Logout gagal")
        return jsonify({
            "status": "error",
            "message": "Logout gagal",
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()

