
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



# ---------------------------------------------------------------------------
# POST endpoint – forgot password (request reset token)
# ---------------------------------------------------------------------------
@auth_bp.post('/api/auth/forgot-password')
def forgot_password():
    """
    Menerima email, membuat JWT reset token (berlaku 15 menit).
    Karena belum ada SMTP, link reset akan dicetak di console & response.
    """
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip()
    
    if not email:
        return jsonify({"status": "error", "message": "Email wajib diisi"}), 400

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Cari user berdasarkan email
        cursor.execute("SELECT user_id, email FROM user WHERE email = %s", (email,))
        user = cursor.fetchone()

        # Demi keamanan (anti user-enumeration), kita SELALU kembalikan 200 OK,
        # tapi token hanya digenerate jika email benar-benar ada.
        if user:
            now = datetime.now(timezone.utc)
            payload = {
                "sub": str(user['user_id']),
                "email": user['email'],
                "purpose": "reset_password",
                "jti": str(uuid.uuid4()),
                "iat": now,
                "exp": now + timedelta(minutes=15)
            }
            secret = os.getenv("JWT_SECRET_KEY")
            reset_token = jwt.encode(payload, secret, algorithm="HS256")
            
            # Simulasi kirim email: Print ke console server
            print(f"\n==================================================")
            print(f"LINK RESET PASSWORD UNTUK {email}:")
            print(f"Token: {reset_token}")
            print(f"Gunakan token ini di endpoint /api/auth/reset-password")
            print(f"==================================================\n")
            
            return jsonify({
                "status": "success",
                "message": "Jika email terdaftar, instruksi reset telah dikirim.",
                "data": {
                    "reset_token": reset_token  # Dikembalikan di response karena mode Dev
                }
            }), 200
        
        # Jika email tidak ada, return generik
        return jsonify({
            "status": "success",
            "message": "Jika email terdaftar, instruksi reset telah dikirim."
        }), 200

    except Exception as e:
        import logging
        logging.exception("Gagal memproses forgot password")
        return jsonify({"status": "error", "message": "Terjadi kesalahan sistem"}), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


# ---------------------------------------------------------------------------
# POST endpoint – reset password (validate token and update password)
# ---------------------------------------------------------------------------
@auth_bp.post('/api/auth/reset-password')
def reset_password():
    """
    Menerima token reset dan password baru.
    Memvalidasi token JWT (purpose == 'reset_password', expiry, blacklist check).
    Mengupdate password di tabel user dan mem-blacklist token reset (one-time use).
    """
    data = request.get_json(silent=True) or {}
    token = data.get('token', '').strip()
    new_password = data.get('new_password', '').strip()

    if not token or not new_password:
        return jsonify({
            "status": "error",
            "message": "Token dan new_password wajib diisi"
        }), 400

    if len(new_password) < 8 or len(new_password) > 128:
        return jsonify({
            "status": "error",
            "message": "Password baru harus terdiri dari 8–128 karakter"
        }), 400

    secret = os.getenv("JWT_SECRET_KEY")
    if not secret:
        return jsonify({
            "status": "error",
            "message": "Konfigurasi autentikasi belum tersedia"
        }), 500

    # 1. Validasi token JWT
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return jsonify({
            "status": "error",
            "message": "Token reset password telah kedaluwarsa"
        }), 400
    except jwt.InvalidTokenError:
        return jsonify({
            "status": "error",
            "message": "Token reset password tidak valid"
        }), 400

    # 2. Validasi purpose token
    if payload.get("purpose") != "reset_password":
        return jsonify({
            "status": "error",
            "message": "Token tidak valid untuk reset password"
        }), 400

    jti = payload.get("jti")
    user_id = payload.get("sub")

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # 3. Cegah replay attack (cek apakah token sudah pernah dipakai)
        if jti:
            cursor.execute("SELECT jti FROM token_blacklist WHERE jti = %s", (jti,))
            if cursor.fetchone():
                return jsonify({
                    "status": "error",
                    "message": "Token reset password sudah pernah digunakan"
                }), 400

        # 4. Pastikan user ada di database
        cursor.execute("SELECT user_id, email FROM user WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({
                "status": "error",
                "message": "Akun tidak ditemukan"
            }), 404

        # 5. Update password dengan hash baru
        new_password_hash = generate_password_hash(new_password)
        cursor.execute("UPDATE user SET password = %s WHERE user_id = %s", (new_password_hash, user_id))

        # 6. Masukkan jti ke token_blacklist (one-time use)
        if jti and "exp" in payload:
            expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc).replace(tzinfo=None)
            cursor.execute(
                "INSERT IGNORE INTO token_blacklist (jti, expires_at) VALUES (%s, %s)",
                (jti, expires_at)
            )

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Password berhasil direset. Silakan login kembali dengan password baru."
        }), 200

    except Exception as e:
        if connection:
            connection.rollback()
        import logging
        logging.exception("Gagal mereset password")
        return jsonify({
            "status": "error",
            "message": "Terjadi kesalahan sistem saat mereset password"
        }), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
