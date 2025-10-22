# -*- mode: python ; coding: utf-8 -*-

import sys
from PyInstaller.utils.hooks import collect_submodules

block_cipher = None

# Nombre del ejecutable
app_name = 'LectorManifiestos'

# Datos estáticos a incluir (usar ; en Windows)
datas = [
    ('templates', 'templates'),
    ('static', 'static'),
    ('modules', 'modules'),
]

# Paquetes ocultos (si fuera necesario)
hiddenimports = collect_submodules('modules') + [
    'pandas',
    'numpy',
    'pandas._libs',
    'pandas._libs.interval',
    'pandas.compat',
    'pandas.compat.numpy',
    'pandas.util',
    'pandas.util._decorators'
]

a = Analysis(
    ['app.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name=app_name,
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    icon=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name=app_name,
)
