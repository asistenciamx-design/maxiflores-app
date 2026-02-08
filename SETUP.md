# 🚀 Guía de Configuración Rápida - Maxiflores App

Esta guía te ayudará a configurar el proyecto en cualquier PC (casa, oficina, laptop).

## 📋 Primera Vez en Cada PC

### Opción 1: Script Interactivo (Recomendado)

```powershell
# 1. Clonar el repositorio
git clone https://github.com/asistenciamx-design/maxiflores-app.git
cd maxiflores-app

# 2. Ejecutar el script de configuración
.\setup-env.ps1

# 3. Instalar dependencias
npm install

# 4. Iniciar el servidor
npm run dev
```

El script te pedirá tus credenciales y creará automáticamente el archivo `.env.local`.

---

### Opción 2: Script Rápido (Pre-configurado)

**Configuración inicial (solo una vez):**

1. Abre `setup-env-quick.ps1` en un editor
2. Reemplaza los valores de ejemplo con tus credenciales reales:
   ```powershell
   $SUPABASE_ANON_KEY = "tu_key_real_aqui"
   $SHOPIFY_ACCESS_TOKEN = "tu_token_real_aqui"
   ```
3. Guarda el archivo

**En cada PC nueva:**

```powershell
git clone https://github.com/asistenciamx-design/maxiflores-app.git
cd maxiflores-app
.\setup-env-quick.ps1
npm install
npm run dev
```

---

### Opción 3: Manual

Copia el archivo `.env.local` desde otra PC o créalo manualmente:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://siapybshudatlhzixsih.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu_key_aqui"

# Shopify Configuration
SHOPIFY_SHOP_URL="1dmass-ij.myshopify.com"
SHOPIFY_ACCESS_TOKEN="tu_token_aqui"
```

---

## 🔄 Flujo de Trabajo Diario

### Al llegar a trabajar:
```powershell
cd maxiflores-app
git pull origin main
npm run dev
```

### Al terminar de trabajar:
```powershell
git add .
git commit -m "descripción de tus cambios"
git push origin main
```

---

## 🔐 Gestión de Credenciales

### Recomendación: Guarda tus credenciales en un lugar seguro

**Opción A: Gestor de Contraseñas**
- Guarda el contenido de `.env.local` en **1Password**, **Bitwarden** o similar
- Copia y pega cuando configures una PC nueva

**Opción B: Archivo en la Nube**
- Guarda `.env.local` en **Google Drive** (carpeta privada)
- Descarga cuando lo necesites

**Opción C: Script Pre-configurado**
- Edita `setup-env-quick.ps1` con tus credenciales
- Guarda el script en un lugar seguro (NO en GitHub)
- Copia el script a cada PC nueva

---

## ⚠️ Importante

- ✅ `.env.local` **NUNCA** se sube a GitHub (está en `.gitignore`)
- ✅ Puedes trabajar directamente en `main` si trabajas solo
- ✅ Siempre haz `git pull` antes de trabajar
- ✅ Siempre haz `git push` al terminar

---

## 🆘 Solución de Problemas

### Error: "Cannot find module"
```powershell
npm install
```

### Error: "Missing environment variables"
```powershell
# Verifica que .env.local existe
ls .env.local

# Si no existe, ejecuta:
.\setup-env.ps1
```

### Error al ejecutar scripts PowerShell
```powershell
# Permitir ejecución de scripts (solo una vez por PC)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📞 Contacto

Si tienes problemas, revisa el archivo `.env.example` para ver qué variables necesitas.
