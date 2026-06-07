@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ANG HR SCHEDULE CYCLE FIX

if not exist employee.html (
  echo ❌ 找不到 employee.html
  echo 請把這三個檔案放到 GitHub repo 裡 employee.html 同一層：
  echo employee.html
  echo ang_schedule_cycle_fix.js
  echo patch_employee_schedule_fix.py
  pause
  exit /b 1
)

if not exist ang_schedule_cycle_fix.js (
  echo ❌ 找不到 ang_schedule_cycle_fix.js
  pause
  exit /b 1
)

python --version >nul 2>nul
if errorlevel 1 (
  py --version >nul 2>nul
  if errorlevel 1 (
    echo ❌ 找不到 Python，請安裝 Python 或手動在 employee.html 的 ^</body^> 前加入：
    echo ^<script src="./ang_schedule_cycle_fix.js?v=20260607-cycle-fix"^>^</script^>
    pause
    exit /b 1
  )
  py patch_employee_schedule_fix.py
) else (
  python patch_employee_schedule_fix.py
)

if errorlevel 1 (
  echo ❌ 修正失敗
  pause
  exit /b 1
)

echo.
echo ✅ 完成！現在請 git add / commit / push
echo.
pause
