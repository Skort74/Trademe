
import os

import mysql.connector
from dotenv import load_dotenv

load_dotenv()


def get_db_connection():
    # Retrieve required DB configuration from environment variables.
    # No fallback credentials are allowed; the application will raise a clear error
    # if any mandatory variable is missing.
    db_host = os.getenv("DB_HOST")
    db_port = os.getenv("DB_PORT")
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_name = os.getenv("DB_NAME")

    missing = []
    if not db_host:
        missing.append('DB_HOST')
    if not db_port:
        missing.append('DB_PORT')
    if not db_user:
        missing.append('DB_USER')
    if not db_password:
        missing.append('DB_PASSWORD')
    if not db_name:
        missing.append('DB_NAME')
    if missing:
        raise RuntimeError(f"Missing required DB environment variables: {', '.join(missing)}")

    return mysql.connector.connect(
        host=db_host,
        port=int(db_port),
        user=db_user,
        password=db_password,
        database=db_name,
    )
