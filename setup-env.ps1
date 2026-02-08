#!/usr/bin/env pwsh
# Script de configuración automática de .env.local para Maxiflores App
# Uso: .\setup-env.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuración de Maxiflores App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si .env.local ya existe
if (Test-Path ".env.local") {
    Write-Host "⚠️  El archivo .env.local ya existe." -ForegroundColor Yellow
    $overwrite = Read-Host "¿Deseas sobrescribirlo? (s/n)"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "❌ Operación cancelada." -ForegroundColor Red
        exit 0
    }
}

Write-Host "📝 Por favor, ingresa las credenciales:" -ForegroundColor Green
Write-Host ""

# Solicitar credenciales de Supabase
Write-Host "--- Supabase Configuration ---" -ForegroundColor Magenta
$supabaseUrl = Read-Host "NEXT_PUBLIC_SUPABASE_URL"
$supabaseAnonKey = Read-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY"

Write-Host ""
Write-Host "--- Shopify Configuration ---" -ForegroundColor Magenta
$shopifyShopUrl = Read-Host "SHOPIFY_SHOP_URL (ej: tu-tienda.myshopify.com)"
$shopifyAccessToken = Read-Host "SHOPIFY_ACCESS_TOKEN"

Write-Host ""
Write-Host "--- Vercel (Opcional) ---" -ForegroundColor Magenta
$vercelToken = Read-Host "VERCEL_OIDC_TOKEN (presiona Enter para omitir)"

# Crear contenido del archivo .env.local
$envContent = @"
# Created by setup-env.ps1
NEXT_PUBLIC_SUPABASE_ANON_KEY="$supabaseAnonKey"
NEXT_PUBLIC_SUPABASE_URL="$supabaseUrl"
"@

if ($vercelToken) {
    $envContent += @"

VERCEL_OIDC_TOKEN="$vercelToken"
"@
}

$envContent += @"


# Shopify Configuration
SHOPIFY_SHOP_URL="$shopifyShopUrl"
SHOPIFY_ACCESS_TOKEN="$shopifyAccessToken"
"@

# Guardar el archivo
try {
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8 -NoNewline
    Write-Host ""
    Write-Host "✅ Archivo .env.local creado exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "  1. Instalar dependencias: npm install" -ForegroundColor White
    Write-Host "  2. Iniciar el servidor: npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "🔒 IMPORTANTE: Este archivo NO se subirá a GitHub (está en .gitignore)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Error al crear el archivo: $_" -ForegroundColor Red
    exit 1
}
