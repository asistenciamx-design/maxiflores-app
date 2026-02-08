#!/bin/bash
# Script RÁPIDO de configuración - Copia tus credenciales directamente aquí (Mac/Linux)
# Uso: ./setup-env-quick.sh

echo "🚀 Configuración rápida de .env.local..."

# ============================================
# 🔧 EDITA ESTAS VARIABLES CON TUS CREDENCIALES
# ============================================
SUPABASE_URL="https://siapybshudatlhzixsih.supabase.co"
SUPABASE_ANON_KEY="TU_SUPABASE_ANON_KEY_AQUI"
SHOPIFY_SHOP_URL="1dmass-ij.myshopify.com"
SHOPIFY_ACCESS_TOKEN="TU_SHOPIFY_ACCESS_TOKEN_AQUI"
VERCEL_TOKEN=""  # Opcional, déjalo vacío si no lo necesitas

# ============================================
# NO EDITES DEBAJO DE ESTA LÍNEA
# ============================================

# Verificar si ya existe
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local ya existe. Sobrescribiendo..."
fi

# Validar que las credenciales no estén vacías
if [ "$SUPABASE_ANON_KEY" = "TU_SUPABASE_ANON_KEY_AQUI" ] || [ "$SHOPIFY_ACCESS_TOKEN" = "TU_SHOPIFY_ACCESS_TOKEN_AQUI" ]; then
    echo "❌ ERROR: Debes editar el script y agregar tus credenciales reales."
    echo "   Abre setup-env-quick.sh y reemplaza los valores de ejemplo."
    exit 1
fi

# Crear contenido
cat > .env.local << EOF
# Created by setup-env-quick.sh
NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
EOF

if [ -n "$VERCEL_TOKEN" ]; then
    cat >> .env.local << EOF
VERCEL_OIDC_TOKEN="$VERCEL_TOKEN"
EOF
fi

cat >> .env.local << EOF

# Shopify Configuration
SHOPIFY_SHOP_URL="$SHOPIFY_SHOP_URL"
SHOPIFY_ACCESS_TOKEN="$SHOPIFY_ACCESS_TOKEN"
EOF

echo "✅ .env.local configurado exitosamente!"
echo ""
echo "📋 Ahora puedes ejecutar:"
echo "   npm install"
echo "   npm run dev"
