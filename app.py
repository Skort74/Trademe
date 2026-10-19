
from flask import Flask, jsonify
from flask_cors import CORS
from routes.kategori import kategori_bp
from database import get_db_connection
from routes.auth import auth_bp
from routes.profile import profile_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(kategori_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(profile_bp)

app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # Maksimal 5 MB

@app.get("/")
def home():
    return jsonify({
        "message": "TradeMe Backend API berjalan"
    })


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
    app.run(debug=True, port=5001)


