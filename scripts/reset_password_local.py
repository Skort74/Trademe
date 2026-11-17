import os
import sys
import logging
from getpass import getpass

# -------------------------------------------------------------------------
# Safety: run only in development environment
# -------------------------------------------------------------------------
# The project uses a .env file. We consider it "production" when the env
# variable FLASK_ENV is set to "production" (case‑insensitive).
if os.getenv('FLASK_ENV', 'development').lower() == 'production':
    print('Error: This script is intended for development only and must not be run in production.')
    sys.exit(1)

# -------------------------------------------------------------------------
# Make backend modules importable when the script is executed from the repo root
# -------------------------------------------------------------------------
backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_root not in sys.path:
    sys.path.append(backend_root)

# Import after adjusting sys.path
try:
    from database import get_db_connection
    from werkzeug.security import generate_password_hash
except Exception as e:
    print('Failed to import required modules. Ensure the virtual environment is activated and you run the script from the backend directory.')
    sys.exit(1)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -------------------------------------------------------------------------
# Interactive prompts
# -------------------------------------------------------------------------
def prompt_email() -> str:
    email = input('Masukkan email akun yang akan di‑reset passwordnya: ').strip().lower()
    if not email:
        print('Email tidak boleh kosong.')
        sys.exit(1)
    return email

def prompt_new_password() -> str:
    pwd = getpass('Password baru (8‑128 karakter): ')
    pwd_confirm = getpass('Konfirmasi password baru: ')
    if pwd != pwd_confirm:
        print('Password dan konfirmasi tidak cocok.')
        sys.exit(1)
    if not (8 <= len(pwd) <= 128):
        print('Password harus memiliki panjang antara 8 hingga 128 karakter.')
        sys.exit(1)
    return pwd

# -------------------------------------------------------------------------
# DB update helpers (parameterised, commit/rollback, clean close)
# -------------------------------------------------------------------------
def update_user_password(conn, user_id: int, new_hash: str) -> None:
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE `user` SET password = %s WHERE user_id = %s",
            (new_hash, user_id)
        )
        if cursor.rowcount == 0:
            raise Exception('Tidak ada baris yang terpengaruh.')
        conn.commit()
        logger.info('Password pengguna (user_id=%s) berhasil di‑update.', user_id)
    finally:
        cursor.close()

def update_admin_password(conn, admin_id: int, new_hash: str) -> None:
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE `admin` SET password = %s WHERE admin_id = %s",
            (new_hash, admin_id)
        )
        if cursor.rowcount == 0:
            raise Exception('Tidak ada baris yang terpengaruh.')
        conn.commit()
        logger.info('Password admin (admin_id=%s) berhasil di‑update.', admin_id)
    finally:
        cursor.close()

# -------------------------------------------------------------------------
# Main workflow
# -------------------------------------------------------------------------
def main():
    email = prompt_email()
    new_password = prompt_new_password()
    new_hash = generate_password_hash(new_password)

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Search in user table first
        cursor.execute(
            "SELECT user_id FROM `user` WHERE email = %s",
            (email,)
        )
        row = cursor.fetchone()
        if row:
            update_user_password(conn, row['user_id'], new_hash)
            print('Password berhasil di‑reset untuk pengguna.')
            return

        # If not found, search in admin table
        cursor.execute(
            "SELECT admin_id FROM `admin` WHERE email = %s",
            (email,)
        )
        row = cursor.fetchone()
        if row:
            update_admin_password(conn, row['admin_id'], new_hash)
            print('Password berhasil di‑reset untuk admin.')
            return

        # Not found in either table
        print(f'Email "{email}" tidak ditemukan di tabel user maupun admin.')
    except Exception:
        if conn:
            conn.rollback()
        logger.exception('Gagal mereset password.')
        print('Terjadi kesalahan saat mereset password. Lihat log untuk detail.')
    finally:
        if conn and conn.is_connected():
            conn.close()

if __name__ == '__main__':
    main()
