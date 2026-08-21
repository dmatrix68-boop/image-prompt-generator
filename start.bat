@echo off
rem The Prompt Engine - lokaler Start unter Windows.
rem Wechselt in den Ordner DIESER Datei (%~dp0) und startet serve.py dort.
rem Damit landet der Server garantiert im richtigen Ordner, auch wenn die Datei
rem aus einem anderen Verzeichnis heraus aufgerufen wird.

setlocal
cd /d "%~dp0"

set "PY="
where py >nul 2>nul && set "PY=py"
if not defined PY (
  where python >nul 2>nul && set "PY=python"
)

if not defined PY (
  echo.
  echo FEHLER: Python wurde nicht gefunden.
  echo.
  echo Bitte von https://www.python.org/downloads/ installieren und bei der
  echo Installation "Add python.exe to PATH" ankreuzen. Danach diese Datei
  echo erneut starten.
  echo.
  pause
  exit /b 1
)

"%PY%" serve.py
if errorlevel 1 pause
