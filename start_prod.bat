@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Dang tao moi truong ao...
  py -3 -m venv .venv || goto :error
)
echo Dang kiem tra thu vien...
".venv\Scripts\python.exe" -m pip install -r requirements.txt || goto :error
set APP_ENV=production
if not defined SECRET_KEY (
  echo Thieu SECRET_KEY. Hay dat mot chuoi ngau nhien dai truoc khi chay production.
  goto :error
)
echo Minh Finance dang chay tai http://127.0.0.1:5000
".venv\Scripts\python.exe" -m waitress --listen=127.0.0.1:5000 app:app
exit /b %errorlevel%
:error
echo Khoi dong that bai. Vui long kiem tra Python va ket noi mang.
pause
exit /b 1
