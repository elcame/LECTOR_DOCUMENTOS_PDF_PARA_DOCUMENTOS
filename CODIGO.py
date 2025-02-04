import fitz 
import os
import re
import pandas as pd
import tkinter as tk
from tkinter import filedialog, ttk
from PIL import Image, ImageTk

def determinar_remolque(placa):
    return "Remolque"

def agregar_datos_lista_link(lista_de_datos, fecha, conductor, placa,REMOLQUE ,jornada, referencia, kof, origen, destino, jornadaretorno=None):
    if len(kof) < 2:
        valor = 250000
        datos_link = {
            'FECHA': fecha[0] if fecha else ' ',
            'CONDUCTOR': conductor[0] if conductor else ' ',
            'PLACA': placa[0] if placa else ' ',
            'REMOLQUE': REMOLQUE if REMOLQUE else ' ',
            'ORIGEN': origen,
            'DESTINO': destino,
            'JORNADA LABORAL': jornada,
            'ID': referencia[0] if referencia else ' ',
            'NOTA DE OPERACIÓN': kof[0] if kof else ' '
        }
        lista_de_datos.append(datos_link)
    else:
        valor = 280000
        datos_ida = {
            'FECHA': fecha[0] if fecha else ' ',
            'CONDUCTOR': conductor[0] if conductor else ' ',
            'PLACA': placa[0] if placa else ' ',
            'REMOLQUE': REMOLQUE if REMOLQUE else ' ',
            'ORIGEN': origen,
            'DESTINO': destino,
            'JORNADA LABORAL': jornada,
            'ID': referencia[0] if referencia else ' ',
            'NOTA DE OPERACIÓN': kof[0] if kof else ' '
        }
        lista_de_datos.append(datos_ida)

        if jornadaretorno is not None:
            datos_retorno = {
                'FECHA': fecha[0] if fecha else ' ',
                'CONDUCTOR': conductor[0] if conductor else ' ',
                'PLACA': placa[0] if placa else ' ',
                'REMOLQUE': REMOLQUE if REMOLQUE else ' ',
                'ORIGEN': destino,
                'DESTINO': origen,
                'JORNADA LABORAL': jornadaretorno,
                'ID': kof[1] if referencia else ' ',
                'NOTA DE OPERACIÓN': kof[1] if len(kof) > 1 else ' '
            }
            lista_de_datos.append(datos_retorno)
def agregar_datos_EXCEL(lista_de_datos, PLACA, CONDUCTOR, ORIGEN, DESTINO, FECHAVIAJE, MES, ID, KOF, REMESA, EMPRESA):
    # Determinar el valor del flete basado en la longitud de KOF
    if DESTINO =="Cartagena":
      valor=1700000
    else:
      if len(KOF) < 2:
        valor = 250000
      else:
        valor = 280000


    # Crear el diccionario con los datos
    datos_excel = {
        'PLACA': PLACA[0] if PLACA else ' ',
        'CONDUCTOR': CONDUCTOR[0] if CONDUCTOR else ' ',
        'ORIGEN': ORIGEN,
        'DESTINO': DESTINO,
        'FECHA': FECHAVIAJE[0] if FECHAVIAJE else ' ',
        'MES': MES,
        'ID': ID[0] if ID else ' ',
        'KOF 1': KOF[0] if KOF else ' ',
        'REMESA': REMESA[0],
        'EMPRESA': EMPRESA,
        'VALOR_FLETE': valor
    }

    # Agregar el diccionario a la lista de datos
    lista_de_datos.append(datos_excel)


def pdf_to_text(ruta_pdf):
    if not os.path.exists(ruta_pdf):
        raise FileNotFoundError(f"No such file: '{ruta_pdf}'")
    doc = fitz.open(ruta_pdf)
    text = ""
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text += page.get_text()
    return text

def extraer_datos(texto_extraido):
    # Expresiones regulares para extraer la información
    palabraclave1 = r'\s*Fecha\s*: (.*)Hora'
    palabraclave2 = r' Hora\s*: (.*)'
    palabraclave3 = r'LOAD ID #(.*)'
    palabraclave4 = r'\s*CONDUCTOR\s*: (.*)'
    palabraclave5 = r'\s*PLACA\s*:\s*([A-Za-z0-9]+)'
    palabraclave6 = r'\s*6(?!01747000|01252548\d)\d{8}'
    palabraclave7 = r'\s*REMESA No\.\s*(KBQ[0-9]+)'
    palabraclave8 = r'P?[E-e]xp\.\s*(.*?)\s*\('

    # Buscar la información en el texto
    fecha = re.findall(palabraclave1, texto_extraido)
    fecha[0]= fecha[0].replace('.', '/')
    hora = re.findall(palabraclave2, texto_extraido)
    referencia = re.findall(palabraclave3, texto_extraido)
    conductor = re.findall(palabraclave4, texto_extraido)
    placa = re.findall(palabraclave5, texto_extraido)
    KOF = re.findall(palabraclave6, texto_extraido)
    destino = re.findall(palabraclave8, texto_extraido)
    print(destino)

    kof = [num for num in KOF]
    KBQ = re.findall(palabraclave7, texto_extraido)
    KBQ = [num for num in KBQ]

    remolque = determinar_remolque(placa[0]if placa else ' ')

    jornada = float(hora[0].split(':')[0])
    jornada = int(jornada)
    jornada = 'NOCTURNA' if jornada < 6 or jornada > 18 else 'DIURNA'

    origen = 'BARRANQUILLA'
    destino_final = destino[0] if destino else ' '
    lista_de_datos = []  # Inicializar la lista
    lista_de_EXCEL = []  # Inicializar la lista EXCEL
    jornadaretorno = None
    if len(hora) > 1:
        jornadaretorno = int(hora[1].split(':')[0])
        jornadaretorno = 'NOCTURNA' if jornadaretorno < 6 or jornadaretorno > 18 else 'DIURNA'
#llamar a la funcion para crear la lista para el excel con el formato del link de envio
    agregar_datos_lista_link(lista_de_datos, fecha, conductor, placa,remolque, jornada, referencia, kof, origen, destino_final, jornadaretorno)
#llamar a la funcion para crear la lista para el excel con el formato ACR
    agregar_datos_EXCEL(lista_de_EXCEL, placa, conductor, origen, destino_final, fecha, 'ENERO', referencia, kof, KBQ, 'CAMELO ARENAS GUILLERMO ANDRES  ')
    return lista_de_datos,lista_de_EXCEL
def extraer_datos2(texto_extraido):
    palabraclave1 = r'\s*Fecha\s*: (.*)Hora'
    palabraclave2 = r' Hora\s*: (.*)'
    palabraclave3 = r'LOAD ID #(.*)'
    palabraclave4 = r'\s*CONDUCTOR\s*: (.*)'
    palabraclave5 = r'\s*PLACA\s*:\s*([A-Za-z0-9]+)'
    palabraclave6 = r'6(?!01747000|01252548\d)\d{8}'
    palabraclave7 = r'\s*REMESA No\.\s*(KBQ[0-9]+)'
    palabraclave8 = r'P?Exp\.\s*(.*?)\s*\('

    fecha = re.findall(palabraclave1, texto_extraido)
    if fecha:
        fecha[0] = fecha[0].replace('.', '/')
    hora = re.findall(palabraclave2, texto_extraido)
    referencia = re.findall(palabraclave3, texto_extraido)
    conductor = re.findall(palabraclave4, texto_extraido)
    placa = re.findall(palabraclave5, texto_extraido)
    KOF = re.findall(palabraclave6, texto_extraido)
    destino = re.findall(palabraclave8, texto_extraido)
    print(destino)

    kof = [num for num in KOF]
    KBQ = re.findall(palabraclave7, texto_extraido)
    KBQ = [num for num in KBQ]

    remolque = determinar_remolque(placa[0] if placa else ' ')

    jornada = float(hora[0].split(':')[0]) if hora else 0
    jornada = int(jornada)
    jornada = 'NOCTURNA' if jornada < 6 or jornada > 18 else 'DIURNA'

    origen = 'BARRANQUILLA'
    destino_final = destino[0] if destino else ' '
    lista_de_datos = []  # Inicializar la lista
    lista_de_EXCEL = []  # Inicializar la lista EXCEL
    jornadaretorno = None
    if len(hora) > 1:
        jornadaretorno = int(hora[1].split(':')[0])
        jornadaretorno = 'NOCTURNA' if jornadaretorno < 6 or jornadaretorno > 18 else 'DIURNA'
    
    return fecha, hora, referencia, conductor, placa, kof, KBQ, destino


def procesar_pdfs_en_carpeta(carpeta, archivo_excel, archivo_excel2):
    # Inicializar una lista para almacenar todos los datos de todos los PDFs
    todos_los_datos_LINK = []
    todos_los_datos_EXCEL = []
    # Inicializar un conjunto para almacenar todas las combinaciones únicas de PLACA y ID
    combinaciones_unicas = set()
    # Recorrer todos los archivos PDF en la carpeta
    for archivo in os.listdir(carpeta):
        if archivo.endswith(".pdf"):
            ruta_pdf = os.path.join(carpeta, archivo)
            print(f"Procesando archivo: {ruta_pdf}")

            # Extraer el texto del PDF
            texto_extraido = pdf_to_text(ruta_pdf)

            if texto_extraido:
                # Extraer los datos del texto
                datos_pdf = extraer_datos(texto_extraido)
                lista_datos_link = datos_pdf[0]
                lista_datos_excel = datos_pdf[1]
                if lista_datos_link and lista_datos_excel:
                    # Renombrar los PDFs
                    placa = lista_datos_link[0]['PLACA'].replace(" ", "")
                    referencia = lista_datos_link[0]['ID'].replace(" ", "")
                    combinacion = (placa, referencia)
                    if combinacion not in combinaciones_unicas:
                        combinaciones_unicas.add(combinacion)
                        nuevo_nombre = f"global {placa} ID {referencia}.pdf"
                        nuevo_ruta_pdf = os.path.join(carpeta, nuevo_nombre)
                        os.rename(ruta_pdf, nuevo_ruta_pdf)
                        print(f"Archivo renombrado a: {nuevo_ruta_pdf}")

                        # Agregar los datos del PDF a la lista de todos los datos
                        todos_los_datos_LINK.extend(lista_datos_link)
                        todos_los_datos_EXCEL.extend(lista_datos_excel)
                    else:
                        print(f"Duplicado encontrado: {ruta_pdf} no será renombrado ni agregado.")
                else:
                    print(f"No se encontraron datos en el archivo: {ruta_pdf}")
            else:
                print(f"No se pudo extraer datos del archivo: {ruta_pdf}")
    # Convertir la lista de todos los datos en un DataFrame de pandas
    df_nuevos_datos2 = pd.DataFrame(todos_los_datos_EXCEL)
    df_nuevos_datos = pd.DataFrame(todos_los_datos_LINK)

    # Verificar si el archivo Excel ya existe
    try:
        # Leer el archivo Excel existente
        df_existente = pd.read_excel(archivo_excel)
        df_existente2 = pd.read_excel(archivo_excel2)
        # Concatenar los datos nuevos con los existentes
        df_final = pd.concat([df_existente, df_nuevos_datos], ignore_index=True)
        df_final2 = pd.concat([df_existente2, df_nuevos_datos2], ignore_index=True)
        print(f"Datos existentes leídos y concatenados. Total de filas ahora: {len(df_final)}")
        print(f"Datos existentes leídos y concatenados. Total de filas ahora: {len(df_final2)}")

    except FileNotFoundError:
        # Si el archivo no existe, simplemente usamos los nuevos datos
        df_final = df_nuevos_datos
        print("No se encontró un archivo Excel previo. Creando uno nuevo.")
        df_final2 = df_nuevos_datos2
        print("No se encontró un archivo Excel previo. Creando uno nuevo.")
    # Guardar el DataFrame final (con los datos anteriores y nuevos) en un archivo Excel
    df_final.to_excel(archivo_excel, index=False)
    print(f"Datos guardados en '{archivo_excel}'.")
    df_final2.to_excel(archivo_excel2, index=False)
    print(f"Datos guardados en '{archivo_excel2}'.")

def seleccionar_carpeta():
    carpeta = filedialog.askdirectory()
    if carpeta:
        mostrar_pdfs(carpeta)
        procesar_pdfs_en_carpeta(carpeta, "datos_link.xlsx", "datos_excel.xlsx")

def mostrar_pdfs(carpeta):
    for widget in frame_pdf.winfo_children():
        widget.destroy()

    archivos_pdf = [os.path.join(carpeta, archivo) for archivo in os.listdir(carpeta) if archivo.endswith(".pdf")]
    if archivos_pdf:
        num_archivos = len(archivos_pdf)
        cols = 5  # Número de columnas en la cuadrícula
        rows = (num_archivos // cols) + (num_archivos % cols > 0)

        for i, archivo_pdf in enumerate(archivos_pdf):
            doc = fitz.open(archivo_pdf)
            page = doc.load_page(0)  # Cargar solo la primera página
            pix = page.get_pixmap()
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            img = img.resize((200, 250), Image.Resampling.LANCZOS)  # Redimensionar la imagen
            img_tk = ImageTk.PhotoImage(img)
            label = tk.Label(frame_pdf, image=img_tk)
            label.image = img_tk  # Mantener una referencia para evitar la recolección de basura
            label.grid(row=i // cols, column=i % cols, padx=5, pady=5)
            label.bind("<Button-1>", lambda e, pdf_path=archivo_pdf: mostrar_pdf_ampliado(pdf_path, carpeta))

def mostrar_pdf_ampliado(pdf_path, carpeta):
    for widget in frame_pdf.winfo_children():
        widget.destroy()

    # Crear un canvas con scrollbar
    canvas = tk.Canvas(frame_pdf)
    scrollbar = tk.Scrollbar(frame_pdf, orient="vertical", command=canvas.yview)
    scrollable_frame = ttk.Frame(canvas)

    scrollable_frame.bind(
        "<Configure>",
        lambda e: canvas.configure(
            scrollregion=canvas.bbox("all")
        )
    )

    canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
    canvas.configure(yscrollcommand=scrollbar.set)

    canvas.pack(side="left", fill="both", expand=True)
    scrollbar.pack(side="right", fill="y")

    # Frame para los datos y el botón "Volver"
    datos_frame = tk.Frame(frame_pdf)
    datos_frame.pack(side="right", fill="y", padx=10, pady=10)

    # Botón para volver a la vista de miniaturas
    btn_volver = tk.Button(datos_frame, text="Volver", command=lambda: mostrar_pdfs(carpeta))
    btn_volver.pack(pady=10)
    btn_volver.lift()  # Traer el botón al frente

    # Extraer texto y datos del PDF
    texto_extraido = pdf_to_text(pdf_path)
    fecha, hora, referencia, conductor, placa, kof, KBQ, nombre = extraer_datos2(texto_extraido)

    

    # Mostrar los datos extraídos
    tk.Label(datos_frame, text=f"Fecha: {fecha}").pack(anchor="w")
    tk.Label(datos_frame, text=f"Hora: {hora}").pack(anchor="w")
    tk.Label(datos_frame, text=f"ID: {referencia[0]}").pack(anchor="w")
    tk.Label(datos_frame, text=f"Conductor: {conductor[0]}").pack(anchor="w")
    tk.Label(datos_frame, text=f"Placa: {placa[0]}").pack(anchor="w")
    tk.Label(datos_frame, text=f"KOF: {kof}").pack(anchor="w")
    tk.Label(datos_frame, text=f"KBQ: {KBQ[0]}").pack(anchor="w")
    tk.Label(datos_frame, text=f"Nombre: {nombre[0]}").pack(anchor="w")

    # Mostrar todas las páginas del PDF
    doc = fitz.open(pdf_path)
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pix = page.get_pixmap()
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        img = img.resize((800, 1000), Image.Resampling.LANCZOS)  # Redimensionar la imagen para ampliarla
        img_tk = ImageTk.PhotoImage(img)
        label = tk.Label(scrollable_frame, image=img_tk)
        label.image = img_tk  # Mantener una referencia para evitar la recolección de basura
        label.pack(expand=True, pady=10)
        label.bind("<Button-1>", lambda e: mostrar_pdfs(carpeta))

root = tk.Tk()
root.title("Procesador de PDFs")

# Configurar la ventana para que inicie en pantalla completa
root.state('zoomed')

btn_seleccionar_carpeta = tk.Button(root, text="Seleccionar Carpeta", command=seleccionar_carpeta)
btn_seleccionar_carpeta.pack(pady=20)

frame_pdf = ttk.Frame(root)
frame_pdf.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

root.mainloop()