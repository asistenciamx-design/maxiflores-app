#!/bin/bash
# Script de configuración automática de .env.local para Maxiflores App (Mac/Linux)
# Uso: ./setup-env.sh

echo "========================================"
echo "  Configuración de Maxiflores App"
echo "========================================"
echo ""

# Verificar si .env.local ya existe
if [ -f ".env.local" ]; then
    echo "⚠️  El archivo .env.local ya existe."
    read -p "¿Deseas sobrescribirlo? (s/n): " overwrite
    if [ "$overwrite" != "s" ] && [ "$overwrite" != "S" ]; then
        echo "❌ Operación cancelada."
        exit 0
    fi
fi

echo "📝 Por favor, ingresa las credenciales:"
echo ""

# Solicitar credenciales de Supabase
echo "--- Supabase Configuration ---"
read -p "NEXT_PUBLIC_SUPABASE_URL: " supabase_url
read -p "NEXT_PUBLIC_SUPABASE_ANON_KEY: " supabase_anon_key

echo ""
echo "--- Shopify Configuration ---"
read -p "SHOPIFY_SHOP_URL (ej: tu-tienda.myshopify.com): " shopify_shop_url
read -p "SHOPIFY_ACCESS_TOKEN: " shopify_access_token

echo ""
echo "--- Vercel (Opcional) ---"
read -p "VERCEL_OIDC_TOKEN (presiona Enter para omitir): " vercel_token

# Crear contenido del archivo .env.local
cat > .env.local << EOF
# Created by setup-env.sh
NEXT_PUBLIC_SUPABASE_ANON_KEY="$supabase_anon_key"
NEXT_PUBLIC_SUPABASE_URL="$supabase_url"
EOF

if [ -n "$vercel_token" ]; then
    cat >> .env.local << EOF
VERCEL_OIDC_TOKEN="$vercel_token"
EOF
fi

cat >> .env.local << EOF

# Shopify Configuration
SHOPIFY_SHOP_URL="$shopify_shop_url"
SHOPIFY_ACCESS_TOKEN="$shopify_access_token"
EOF

echo ""
echo "✅ Archivo .env.local creado exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "  1. Instalar dependencias: npm install"
echo "  2. Iniciar el servidor: npm run dev"
echo ""
echo "🔒 IMPORTANTE: Este archivo NO se subirá a GitHub (está en .gitignore)"
