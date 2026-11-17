import json
from app import app

def generate_swagger():
    # Mengambil semua route dari Flask
    routes = []
    for rule in app.url_map.iter_rules():
        if rule.endpoint == 'static':
            continue
            
        methods = list(rule.methods - {'HEAD', 'OPTIONS'})
        for method in methods:
            # Format path (mengganti <int:id> menjadi {id})
            path = str(rule.rule).replace('<int:', '{').replace('<path:', '{').replace('>', '}')
            path = path.replace('{', '{').replace('}', '}')
            
            if path not in [r['path'] for r in routes]:
                routes.append({
                    "path": path,
                    "method": method.lower(),
                    "endpoint": rule.endpoint
                })

    # Template Swagger dasar
    swagger_dict = {
        "openapi": "3.0.0",
        "info": {
            "title": "TradeMe API",
            "description": "Dokumentasi API TradeMe",
            "version": "1.0.0"
        },
        "paths": {}
    }

    # Masukkan semua route ke dalam paths
    for r in routes:
        path = r['path']
        method = r['method']
        
        if path not in swagger_dict["paths"]:
            swagger_dict["paths"][path] = {}
            
        swagger_dict["paths"][path][method] = {
            "summary": f"Endpoint {method.upper()} {path}",
            "tags": [r['endpoint'].split('.')[1] if '.' in r['endpoint'] else 'default'],
            "responses": {
                "200": {"description": "Berhasil"}
            }
        }

    # Simpan ke file swagger.json
    with open('swagger.json', 'w') as f:
        json.dump(swagger_dict, f, indent=4)
    
    print(f"Berhasil generate {len(routes)} endpoint ke swagger.json!")

if __name__ == "__main__":
    generate_swagger()