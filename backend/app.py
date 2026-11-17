import os
import json
from flask import Flask, jsonify
from flask_cors import CORS
from flasgger import Swagger 
from database import get_db_connection
from routes.kategori import kategori_bp
from routes.auth import auth_bp
from routes.profile import profile_bp
from routes.transaksi import transaksi_bp
from routes.barang import barang_bp
from routes.donasi import donasi_bp
from routes.lelang import lelang_bp
from routes.negosiasi import negosiasi_bp
from routes.admin import admin_bp
from routes.config import config_bp

app = Flask(__name__)
CORS(app)

# Konfigurasi Swagger UI
try:
    swagger_path = os.path.join(os.path.dirname(__file__), 'swagger.json')
    with open(swagger_path, 'r') as f:
        swagger_spec = json.load(f)
    app.config["SWAGGER"] = {"title": "TradeMe API", "uiversion": 3}
    Swagger(app, template=swagger_spec)
except FileNotFoundError:
    print("Peringatan: swagger.json tidak ditemukan.")

# Registrasi Blueprint
app.register_blueprint(kategori_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(barang_bp)
app.register_blueprint(transaksi_bp)
app.register_blueprint(donasi_bp)
app.register_blueprint(lelang_bp)
app.register_blueprint(negosiasi_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(config_bp)

app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

@app.get("/")
def home():
    return jsonify({"message": "TradeMe Backend API berjalan"})

@app.get("/api/health")
def health_check():
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT DATABASE()")
        database_name = cursor.fetchone()[0]
        return jsonify({
            "status": "success",
            "database": database_name,
            "message": "Koneksi database berhasil"
        }), 200
    except Exception:
        app.logger.exception("Pemeriksaan database gagal")
        return jsonify({
            "status": "error",
            "message": "Koneksi database gagal"
        }), 500
    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=5001)
