#!/usr/bin/env pwsh
# Script RÁPIDO de configuración - Copia tus credenciales directamente aquí
# Uso: .\setup-env-quick.ps1

Write-Host "🚀 Configuración rápida de .env.local..." -ForegroundColor Cyan

# ============================================
# 🔧 EDITA ESTAS VARIABLES CON TUS CREDENCIALES
# ============================================
$SUPABASE_URL = "https://siapybshudatlhzixsih.supabase.co"
$SUPABASE_ANON_KEY = "TU_SUPABASE_ANON_KEY_AQUI"
$SHOPIFY_SHOP_URL = "1dmass-ij.myshopify.com"
$SHOPIFY_ACCESS_TOKEN = "TU_SHOPIFY_ACCESS_TOKEN_AQUI"
$VERCEL_TOKEN = ""  # Opcional, déjalo vacío si no lo necesitas

# ============================================
# NO EDITES DEBAJO DE ESTA LÍNEA
# ============================================

# Verificar si ya existe
if (Test-Path ".env.local") {
    Write-Host "⚠️  .env.local ya existe. Sobrescribiendo..." -ForegroundColor Yellow
}

# Validar que las credenciales no estén vacías
if ($SUPABASE_ANON_KEY -eq "TU_SUPABASE_ANON_KEY_AQUI" -or $SHOPIFY_ACCESS_TOKEN -eq "TU_SHOPIFY_ACCESS_TOKEN_AQUI") {
    Write-Host "❌ ERROR: Debes editar el script y agregar tus credenciales reales." -ForegroundColor Red
    Write-Host "   Abre setup-env-quick.ps1 y reemplaza los valores de ejemplo." -ForegroundColor Yellow
    exit 1
}

# Crear contenido
$envContent = @"
# Created by setup-env-quick.ps1
NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
"@

if ($VERCEL_TOKEN) {
    $envContent += @"

VERCEL_OIDC_TOKEN="$VERCEL_TOKEN"
"@
}

$envContent += @"


# Shopify Configuration
SHOPIFY_SHOP_URL="$SHOPIFY_SHOP_URL"
SHOPIFY_ACCESS_TOKEN="$SHOPIFY_ACCESS_TOKEN"
"@

# Guardar
try {
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8 -NoNewline
    Write-Host "✅ .env.local configurado exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Ahora puedes ejecutar:" -ForegroundColor Cyan
    Write-Host "   npm install" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor White
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
