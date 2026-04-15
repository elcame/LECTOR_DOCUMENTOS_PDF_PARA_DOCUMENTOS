"""
Módulos de base de datos Firebase
"""
try:
    from .firebase_repository import FirebaseRepository
    from .users_repository import UsersRepository
    from .usuarios_repository import UsuariosRepository
    from .roles_repository import RolesRepository
    from .qr_data_repository import QRDataRepository
    from .gastos_repository import GastosRepository
    from .pagos_repository import PagosRepository
    from .pdfs_repository import PDFsRepository
    from .manifiestos_repository import ManifiestosRepository
    from .carros_repository import CarrosRepository, PropietariosRepository
    from .gps_repository import GPSDevicesRepository, GPSLocationsRepository
    
    __all__ = [
        'FirebaseRepository',
        'UsersRepository',
        'UsuariosRepository',
        'RolesRepository',
        'QRDataRepository',
        'GastosRepository',
        'PagosRepository',
        'PDFsRepository',
        'ManifiestosRepository',
        'CarrosRepository',
        'PropietariosRepository',
        'GPSDevicesRepository',
        'GPSLocationsRepository',
    ]
except ImportError as e:
    # Si Firebase no está disponible, definir clases vacías
    print(f"Advertencia: No se pudieron importar repositorios Firebase: {e}")
    __all__ = []
