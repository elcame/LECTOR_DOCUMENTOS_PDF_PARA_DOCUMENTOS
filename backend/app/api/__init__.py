"""
Módulo de APIs
"""
# Importar blueprints para que Flask los registre
from app.api import auth, manifiestos, usuarios, operaciones, gastos

__all__ = ['auth', 'manifiestos', 'usuarios', 'operaciones', 'gastos']
