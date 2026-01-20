"""
Script de prueba para diagnosticar problemas con la extracción de QR
"""
import os
import sys
from modules.qr_extractor import extraer_info_qr_manifiesto, PYZBAR_AVAILABLE

def test_qr_extraction(pdf_path):
    """
    Prueba la extracción de QR de un PDF específico
    """
    print("=" * 60)
    print("PRUEBA DE EXTRACCIÓN DE QR")
    print("=" * 60)
    
    # Verificar que pyzbar esté disponible
    if not PYZBAR_AVAILABLE:
        print("❌ ERROR: pyzbar no está instalado")
        print("   Instala con: pip install pyzbar")
        print("   En Windows también necesitas instalar ZBar:")
        print("   https://github.com/zdenop/tesseract/releases")
        return
    
    print("✓ pyzbar está disponible")
    
    # Verificar que el archivo existe
    if not os.path.exists(pdf_path):
        print(f"❌ ERROR: El archivo no existe: {pdf_path}")
        return
    
    print(f"✓ Archivo encontrado: {pdf_path}")
    print(f"  Tamaño: {os.path.getsize(pdf_path) / 1024:.2f} KB")
    
    # Intentar extraer QR
    print("\n" + "-" * 60)
    print("Extrayendo información del QR...")
    print("-" * 60)
    
    try:
        datos_qr = extraer_info_qr_manifiesto(pdf_path)
        
        print("\nRESULTADOS:")
        print("-" * 60)
        print(f"Placa: {datos_qr.get('placa', 'N/A')}")
        print(f"Número de Manifiesto: {datos_qr.get('numero_manifiesto', 'N/A')}")
        print(f"Fecha: {datos_qr.get('fecha', 'N/A')}")
        print(f"Hora: {datos_qr.get('hora', 'N/A')}")
        print(f"QR Raw: {datos_qr.get('qr_raw', 'N/A')}")
        
        if datos_qr.get('qr_raw'):
            print("\n✓ QR extraído exitosamente!")
        else:
            print("\n❌ No se pudo extraer el QR")
            print("\nPosibles causas:")
            print("  1. El PDF no contiene un código QR")
            print("  2. El QR está dañado o no es legible")
            print("  3. El QR está en un formato no soportado")
            print("  4. Problemas con la resolución o calidad del PDF")
            print("\nSugerencias:")
            print("  - Verifica que el PDF tenga un QR visible")
            print("  - Intenta abrir el PDF y verificar que el QR sea legible")
            print("  - Activa el modo debug: set DEBUG_QR=true")
        
    except Exception as e:
        print(f"\n❌ ERROR durante la extracción: {e}")
        import traceback
        traceback.print_exc()
    
    print("=" * 60)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python test_qr_extraction.py <ruta_al_pdf>")
        print("\nEjemplo:")
        print("  python test_qr_extraction.py 'MANIFIESTOS/carpeta/MANIFIESTO SZK561.pdf'")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    test_qr_extraction(pdf_path)

