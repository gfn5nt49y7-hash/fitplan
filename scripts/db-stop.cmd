@echo off
chcp 65001 >nul
setlocal

if "%PGHOME%"=="" set "PGHOME=C:\Users\Lenovo\tools\pg17"
if "%PGDATA_FITPLAN%"=="" set "PGDATA_FITPLAN=C:\Users\Lenovo\pgdata\fitplan"

echo [FitPlan] 正在停止 PostgreSQL...
"%PGHOME%\bin\pg_ctl.exe" -D "%PGDATA_FITPLAN%" stop -m fast
