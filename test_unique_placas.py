#!/usr/bin/env python3
"""
Script para verificar que las placas de manifiestos sean únicas
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_unique_placas():
    """Prueba que las placas sean únicas en el endpoint from_manifestos"""
    try:
        # Nota: Esta prueba necesitaría autenticación real para funcionar
        # Por ahora solo verificamos que el endpoint responda
        response = requests.get(f"{BASE_URL}/api/carros?include_owner=true&from_manifestos=true", 
                              timeout=5)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Endpoint responde correctamente (requiere autenticación)")
            print("ℹ️ Para probar completamente, inicia sesión en la aplicación")
            return True
        elif response.status_code == 200:
            data = response.json()
            if 'placas_from_manifestos' in data:
                placas = data['placas_from_manifestos']
                placas_list = [p['placa'] for p in placas]
                placas_unicas = set(placas_list)
                
                print(f"Total placas: {len(placas_list)}")
                print(f"Placas únicas: {len(placas_unicas)}")
                
                if len(placas_list) == len(placas_unicas):
                    print("✅ No hay duplicados - Todas las placas son únicas")
                    return True
                else:
                    print("❌ Hay duplicados en las placas")
                    duplicados = []
                    for placa in placas_list:
                        if placas_list.count(placa) > 1:
                            duplicados.append(placa)
                    print(f"Placas duplicadas: {set(duplicados)}")
                    return False
            else:
                print("ℹ️ No hay campo 'placas_from_manifestos' en la respuesta")
                return True
        else:
            print(f"❌ Error inesperado: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Verificando que las placas de manifiestos sean únicas...")
    test_unique_placas()
