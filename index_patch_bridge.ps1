# ANG HR｜index.html 自動補上 native-google-bridge.js
# 使用方式：把這個檔案放在 GitHub 專案根目錄，跟 index.html 同一層，右鍵用 PowerShell 執行。

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$indexPath = Join-Path $root "index.html"
$bridgePath = Join-Path $root "native-google-bridge.js"

if (!(Test-Path $indexPath)) {
  Write-Host "❌ 找不到 index.html，請把本檔放在 GitHub 專案根目錄。" -ForegroundColor Red
  exit 1
}

if (!(Test-Path $bridgePath)) {
  Write-Host "❌ 找不到 native-google-bridge.js，請確認同一層有此檔案。" -ForegroundColor Red
  exit 1
}

$html = Get-Content $indexPath -Raw -Encoding UTF8
$scriptLine = '  <script src="./native-google-bridge.js?v=20260617_4"></script>'

# 移除舊版未帶版本號或舊版本號的 bridge 載入行，避免重複載入
$html = [regex]::Replace($html, '(?im)^\s*<script\s+src=["'']\.\/native-google-bridge\.js(?:\?v=[^"'']*)?["'']>\s*<\/script>\s*\r?\n?', '')

if ($html -notmatch '</body>') {
  Write-Host "❌ index.html 找不到 </body>，請檢查檔案是否完整。" -ForegroundColor Red
  exit 1
}

$html = $html -replace '</body>', ($scriptLine + "`r`n</body>")

$backupPath = Join-Path $root ("index.backup_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".html")
Copy-Item $indexPath $backupPath -Force
Set-Content -Path $indexPath -Value $html -Encoding UTF8

Write-Host "✅ 已完成 index.html 修正" -ForegroundColor Green
Write-Host "✅ 已補上：$scriptLine" -ForegroundColor Green
Write-Host "✅ 備份檔：$backupPath" -ForegroundColor Cyan
