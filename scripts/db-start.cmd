@echo off
chcp 65001 >nul
setlocal

REM ===== 可按需修改（也可用同名环境变量覆盖）=====
if "%PGHOME%"=="" set "PGHOME=C:\Users\Lenovo\tools\pg17"
if "%PGDATA_FITPLAN%"=="" set "PGDATA_FITPLAN=C:\Users\Lenovo\pgdata\fitplan"
if "%PGPORT_FITPLAN%"=="" set "PGPORT_FITPLAN=5433"

if not exist "%PGHOME%\bin\pg_ctl.exe" (
  echo [错误] 找不到 PostgreSQL 程序：%PGHOME%\bin\pg_ctl.exe
  exit /b 1
)

"%PGHOME%\bin\pg_isready.exe" -h 127.0.0.1 -p %PGPORT_FITPLAN% >nul 2>&1
if %errorlevel%==0 (
  echo [FitPlan] PostgreSQL 已在运行 -^> 127.0.0.1:%PGPORT_FITPLAN%
  exit /b 0
)

echo [FitPlan] 正在启动 PostgreSQL（端口 %PGPORT_FITPLAN%）...
"%PGHOME%\bin\pg_ctl.exe" -D "%PGDATA_FITPLAN%" -l "%PGDATA_FITPLAN%\server.log" -o "-p %PGPORT_FITPLAN% -c listen_addresses=127.0.0.1" start
"%PGHOME%\bin\pg_isready.exe" -h 127.0.0.1 -p %PGPORT_FITPLAN%
