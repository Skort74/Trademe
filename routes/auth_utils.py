
from datetime import datetime, timezone
from functools import wraps
import os

import jwt
from flask import request, jsonify, g

from database import get_db_connection


def token_required(view_function):
    @wraps(view_function)
    def wrapped(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({
                "status": "error",
                "message": "Token Bearer wajib disertakan",
            }), 401

        token = parts[1]
        secret = os.getenv("JWT_SECRET_KEY")

        if not secret:
            return jsonify({
                "status": "error",
                "message": "Konfigurasi autentikasi belum tersedia",
            }), 500

        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"require": ["exp", "iat", "sub", "jti"]},
            )
        except jwt.ExpiredSignatureError:
            return jsonify({
                "status": "error",
                "message": "Token sudah kedaluwarsa",
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "status": "error",
                "message": "Token tidak valid",
            }), 401

        connection = None
        cursor = None

        try:
            connection = get_db_connection()
            cursor = connection.cursor()

            cursor.execute(
                "SELECT jti FROM token_blacklist WHERE jti = %s",
                (payload["jti"],),
            )

            if cursor.fetchone():
                return jsonify({
                    "status": "error",
                    "message": "Token sudah tidak berlaku",
                }), 401

        except Exception:
            # Jika pemeriksaan blacklist gagal, jangan izinkan akses.
            return jsonify({
                "status": "error",
                "message": "Autentikasi sementara tidak tersedia",
            }), 503

        finally:
            if cursor is not None:
                cursor.close()
            if connection is not None and connection.is_connected():
                connection.close()

        g.current_user = payload
        return view_function(*args, **kwargs)

    return wrapped


def admin_required(view_function):
    @wraps(view_function)
    @token_required
    def wrapped(*args, **kwargs):
        if g.current_user.get("role") != "admin":
            return jsonify({
                "status": "error",
                "message": "Akses hanya untuk admin",
            }), 403

        return view_function(*args, **kwargs)

    return wrapped
