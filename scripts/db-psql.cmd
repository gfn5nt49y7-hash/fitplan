@echo off
chcp 65001 >nul
setlocal

if "%PGHOME%"=="" set "PGHOME=C:\Users\Lenovo\tools\pg17"
if "%PGPORT_FITPLAN%"=="" set "PGPORT_FITPLAN=5433"
set "PGPASSWORD=fitplan_dev_2026"

REM 直接进入 fitplan 数据库，可追加任意 psql 参数，例如：
REM   scripts\db-psql.cmd -c "select * from users;"
"%PGHOME%\bin\psql.exe" -h 127.0.0.1 -p %PGPORT_FITPLAN% -U fitplan -d fitplan %*
