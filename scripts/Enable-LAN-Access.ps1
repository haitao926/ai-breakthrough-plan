# AI万花筒局域网访问配置脚本
$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Resolve-Path (Join-Path $BaseDir "..")
$LegacyDir = Join-Path $RootDir "apps\legacy"
Set-Location $LegacyDir

# 需要以管理员权限运�?
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AI万花�?- 局域网访问配置" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "错误：需要管理员权限�? -ForegroundColor Red
    Write-Host "请右键点击此文件，选择'以管理员身份运行'" -ForegroundColor Yellow
    Read-Host "按回车键退�?
    exit 1
}

# 停止现有服务
Write-Host "正在停止现有服务�?.." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# 配置防火�?Write-Host "正在配置防火墙规�?.." -ForegroundColor Yellow
Remove-NetFirewallRule -DisplayName "HAI Tech Lab Server" -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "HAI Tech Lab Server" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow | Out-Null

Write-Host "[✓] 防火墙规则已添加" -ForegroundColor Green

# 启动服务�?Write-Host ""
Write-Host "正在启动服务�?.." -ForegroundColor Yellow
Write-Host ""

# 获取IP地址
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*"} | Select-Object IPAddress

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "服务器已启动�? -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "访问地址�? -ForegroundColor White
Write-Host "- 本机访问: http://localhost:8080" -ForegroundColor White

foreach ($ip in $ipAddresses) {
    Write-Host ("- 局域网访问: http://" + $ip.IPAddress + ":8080") -ForegroundColor White
}

Write-Host ""
Write-Host "提示：局域网内的其他设备可以通过上述IP地址访问" -ForegroundColor Gray
Write-Host ""

# 启动Node.js服务�?Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow -Wait
