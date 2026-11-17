SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec_1',
            "route": '/apispec_1.json',
            "rule_filter": lambda rule: True,  # all in
            "model_filter": lambda tag: True,  # all in
        }
    ],
    "static_url_path": "/flasgger_static",
    # "static_folder": "static",  # must be set by user
    "swagger_ui": True,
    "specs_route": "/apidocs/"
}

SWAGGER_TEMPLATE = {
    "info": {
        "title": "TradeMe API Documentation",
        "description": "Dokumentasi REST API untuk aplikasi marketplace TradeMe (Jual, Beli, Tukar, Donasi, Lelang).",
        "version": "1.0.0",
        "contact": {
            "name": "Developer TradeMe"
        }
    },
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "Ketik: Bearer <JWT_TOKEN>"
        }
    }
}

