; Script de Inno Setup para Lector de Manifiestos
; Requisitos: Haber generado previamente dist\LectorManifiestos\ con PyInstaller

[Setup]
AppName=Lector de Manifiestos
AppVersion=1.0.0
AppPublisher=Interno
DefaultDirName={pf}\LectorManifiestos
DefaultGroupName=Lector de Manifiestos
OutputDir=.
OutputBaseFilename=LectorManifiestos-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Files]
Source:"..\dist\LectorManifiestos\*"; DestDir:"{app}"; Flags: recursesubdirs
Source:"..\EXCEL\*"; DestDir:"{app}\_internal\EXCEL"; Flags: recursesubdirs
Source:"..\MANIFIESTOS\*"; DestDir:"{app}\_internal\MANIFIESTOS"; Flags: recursesubdirs

[Icons]
Name: "{group}\Lector de Manifiestos"; Filename: "{app}\LectorManifiestos.exe"
Name: "{commondesktop}\Lector de Manifiestos"; Filename: "{app}\LectorManifiestos.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Crear acceso directo en el escritorio"; GroupDescription: "Accesos directos:"; Flags: unchecked

[Run]
Filename:"{app}\LectorManifiestos.exe"; Description:"Iniciar Lector de Manifiestos"; Flags: nowait postinstall skipifsilent


