from routes.kategori import kategori_bp
from flask import Flask, jsonify
from flask_cors import CORS

from database import get_db_connection

app = Flask(__name__)
CORS(app)
app.register_blueprint(kategori_bp, url_prefix="/api/kategori")

@app.get("/")
def home():
    return jsonify({
        "message": "TradeMe Backend API berjalan"
    })


@app.get("/api/health")
def health_check():
    connection = None

    try:
        connection = get_db_connection()

        cursor = connection.cursor()
        cursor.execute("SELECT DATABASE()")
        database_name = cursor.fetchone()[0]
        cursor.close()

        return jsonify({
            "status": "success",
            "database": database_name,
            "message": "Koneksi database berhasil"
        })

    except Exception:
        app.logger.exception("Pemeriksaan database gagal")

        return jsonify({
            "status": "error",
            "message": "Koneksi database gagal"
        }), 500

    finally:
        if connection is not None and connection.is_connected():
            connection.close()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
from flask import Flask, jsonify
from flask_cors import CORS

from database import get_db_connection

app = Flask(__name__)
CORS(app)


@app.get("/")
def home():
    return jsonify({
        "message": "TradeMe Backend API berjalan"
    })


@app.get("/api/health")
def health_check():
    connection = None

    try:
        connection = get_db_connection()

        cursor = connection.cursor()
        cursor.execute("SELECT DATABASE()")
        database_name = cursor.fetchone()[0]
        cursor.close()

        return jsonify({
            "status": "success",
            "database": database_name,
            "message": "Koneksi database berhasil"
        })

    except Exception:
        app.logger.exception("Pemeriksaan database gagal")

        return jsonify({
            "status": "error",
            "message": "Koneksi database gagal"
        }), 500

    finally:
        if connection is not None and connection.is_connected():
            connection.close()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
