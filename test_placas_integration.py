#!/usr/bin/env python3
"""
Script de prueba para verificar la integración de placas de manifiestos con carros
"""

import requests
import json
import sys

# Configuración
BASE_URL = "http://localhost:5000"

def test_endpoint(endpoint, method="GET", data=None):
    """Prueba un endpoint específico"""
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}")
        else:
            response = requests.post(f"{BASE_URL}{endpoint}", json=data)
        
        print(f"\n=== {method} {endpoint} ===")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Success: {result.get('success', False)}")
            if 'data' in result:
                print(f"Data count: {len(result['data']) if isinstance(result['data'], list) else 'N/A'}")
            if 'placas' in result:
                print(f"Placas count: {len(result['placas'])}")
                print(f"Placas: {result['placas'][:5]}...")  # Primeras 5 placas
            if 'placas_from_manifestos' in result:
                print(f"Placas from manifestos: {len(result['placas_from_manifestos'])}")
                for p in result['placas_from_manifestos'][:3]:  # Primeras 3
                    print(f"  - {p.get('placa')}: {p.get('manifiesto_info', {}).get('conductor', 'N/A')}")
        else:
            print(f"Error: {response.text}")
        
        return response.status_code == 200
        
    except Exception as e:
        print(f"Error testing {endpoint}: {e}")
        return False

def main():
    print("🧪 Probando integración de placas de manifiestos con carros")
    print(f"Base URL: {BASE_URL}")
    
    tests = [
        ("/api/manifiestos/placas", "GET"),
        ("/api/carros?include_owner=true&from_manifestos=true", "GET"),
    ]
    
    results = []
    for endpoint, method in tests:
        success = test_endpoint(endpoint, method)
        results.append((endpoint, success))
    
    print("\n" + "="*50)
    print("📊 RESUMEN DE PRUEBAS")
    for endpoint, success in results:
        status = "✅ OK" if success else "❌ ERROR"
        print(f"{status} - {endpoint}")
    
    # Probar batch creation si hay placas disponibles
    print("\n🔍 Probando creación batch...")
    try:
        # Obtener placas primero
        response = requests.get(f"{BASE_URL}/api/manifiestos/placas")
        if response.status_code == 200:
            placas = response.json().get('placas', [])
            if placas:
                print(f"Se encontraron {len(placas)} placas. Probando batch creation...")
                
                # Probar con la primera placa
                test_data = {
                    "placas": [
                        {
                            "placa": placas[0],
                            "soat_vencimiento": "2024-12-31",
                            "tecnomecanica_vencimiento": "2024-12-31",
                            "modelo": "Test desde script",
                            "ownerId": None
                        }
                    ]
                }
                
                success = test_endpoint("/api/carros/batch", "POST", test_data)
                if success:
                    print("✅ Batch creation funciona correctamente")
                else:
                    print("❌ Batch creation falló")
            else:
                print("ℹ️ No hay placas disponibles para probar batch creation")
    except Exception as e:
        print(f"❌ Error en prueba batch: {e}")

if __name__ == "__main__":
    main()
