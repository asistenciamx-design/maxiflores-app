'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/surtido');
      }
    }
    checkUser();
  }, [router, supabase]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : error.message);
      setLoading(false);
      return;
    }

    router.push('/surtido');
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`
      }
    });
    if (error) setError(error.message);
  }

  return (
    <div className="flex min-h-screen w-full font-display">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-primary/80 via-transparent to-primary/20"></div>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDuMED0e8vOl5UzAT1AmCAY1gVhvCM-Su3TgeonX9B1XY5sPwFtwWknZBy8vTTzZ5uWoE3epJIG4h-4CleUMlpCVblP58pEFiAuvrAWKu-I--MUmGfplratLW89cQMf2R-jufh59Am93vEq_veXj3LrCvLYSbBec8G8PPy9IcTMMAu6yfj-k--27fkEJwi0m0zBN9kOfnWwCdRKBRwylv784jJi2s8dmdpAJOkqLz_lmyI6FxnqmUt0FKrBakyfU25iqqt80rHMhXAj')" }}
        >
        </div>
        <div className="relative z-20 flex flex-col justify-between p-16 h-full text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
              <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.1288 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z" fill="currentColor"></path>
                <path clipRule="evenodd" d="M10.4485 13.8519C10.4749 13.9271 10.6203 14.246 11.379 14.7361C12.298 15.3298 13.7492 15.9145 15.6717 16.3735C18.0007 16.9296 20.8712 17.2655 24 17.2655C27.1288 17.2655 29.9993 16.9296 32.3283 16.3735C34.2508 15.9145 35.702 15.3298 36.621 14.7361C37.3796 14.246 37.5251 13.9271 37.5515 13.8519C37.5287 13.7876 37.4333 13.5973 37.0635 13.2931C36.5266 12.8516 35.6288 12.3647 34.343 11.9175C31.79 11.0295 28.1333 10.4437 24 10.4437C19.8667 10.4437 16.2099 11.0295 13.657 11.9175C12.3712 12.3647 11.4734 12.8516 10.9365 13.2931C10.5667 13.5973 10.4713 13.7876 10.4485 13.8519ZM37.5563 18.7877C36.3176 19.3925 34.8502 19.8839 33.2571 20.2642C30.5836 20.9025 27.3973 21.2655 24 21.2655C20.6027 21.2655 17.4164 20.9025 14.7429 20.2642C13.1498 19.8839 11.6824 19.3925 10.4436 18.7877V34.1275C10.4515 34.1545 10.5427 34.4867 11.379 35.027C12.298 35.6207 13.7492 36.2054 15.6717 36.6644C18.0007 37.2205 20.8712 37.5564 24 37.5564C27.1288 37.5564 29.9993 37.2205 32.3283 36.6644C34.2508 36.2054 35.702 35.6207 36.621 35.027C37.4573 34.4867 37.5485 34.1546 37.5563 34.1275V18.7877ZM41.5563 13.8546V34.1455C41.5563 36.1078 40.158 37.5042 38.7915 38.3869C37.3498 39.3182 35.4192 40.0389 33.2571 40.5551C30.5836 41.1934 27.3973 41.5564 24 41.5564C20.6027 41.5564 17.4164 41.1934 14.7429 40.5551C12.5808 40.0389 10.6502 39.3182 9.20848 38.3869C7.84205 37.5042 6.44365 36.1078 6.44365 34.1455L6.44365 13.8546C6.44365 12.2684 7.37223 11.0454 8.39581 10.2036C9.43325 9.3505 10.8137 8.67141 12.343 8.13948C15.4203 7.06909 19.5418 6.44366 24 6.44366C28.4582 6.44366 32.5797 7.06909 35.657 8.13948C37.1863 8.67141 38.5667 9.3505 39.6042 10.2036C40.6278 11.0454 41.5563 12.2684 41.5563 13.8546Z" fill="white" fillRule="evenodd"></path>
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight">Maxiflores</span>
          </div>
          <div className="max-w-md">
            <h2 className="text-4xl font-extrabold mb-4 leading-tight">Optimizando la Cadena de Suministro Floral</h2>
            <p className="text-lg text-white/90">Soluciones integradas de OMS y WMS diseñadas para una logística y gestión de inventarios de precisión.</p>
          </div>
          <div className="flex gap-4 text-sm font-medium">
            <a className="hover:underline" href="#">Política de Privacidad</a>
            <a className="hover:underline" href="#">Términos de Servicio</a>
            <a className="hover:underline" href="#">Centro de Ayuda</a>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-background-light dark:bg-background-dark px-8 sm:px-12 md:px-24">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="p-2 bg-primary rounded-lg text-white">
              <svg className="size-6" fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.1288 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-primary dark:text-[#faf9fb]">Maxiflores</h1>
          </div>
          <div className="mb-10 text-left">
            <h2 className="text-3xl font-black text-[#150f1a] dark:text-[#faf9fb] tracking-tight mb-2">Hola de Nuevo</h2>
            <p className="text-[#765492] dark:text-gray-400 font-medium">Ingresa tus credenciales para acceder.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="flex flex-col">
              <label className="text-[#150f1a] dark:text-[#faf9fb] text-sm font-semibold mb-2">Correo Electrónico</label>
              <input name="email" className="w-full rounded-lg border border-[#dcd2e5] dark:border-gray-700 bg-white dark:bg-[#251b2e] h-14 px-4 text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white placeholder:text-[#765492]/50" placeholder="nombre@empresa.com" type="email" required />
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[#150f1a] dark:text-[#faf9fb] text-sm font-semibold">Contraseña</label>
                <a className="text-primary dark:text-primary/80 text-xs font-bold hover:underline" href="#">¿Problemas para entrar?</a>
              </div>
              <div className="relative">
                <input
                  name="password"
                  className="w-full rounded-lg border border-[#dcd2e5] dark:border-gray-700 bg-white dark:bg-[#251b2e] h-14 px-4 pr-12 text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white placeholder:text-[#765492]/50"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  required
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#765492] dark:text-gray-400 hover:text-primary transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input className="rounded border-gray-300 text-primary focus:ring-primary size-4" id="remember" type="checkbox" />
              <label className="text-sm font-medium text-[#150f1a] dark:text-gray-300 cursor-pointer" htmlFor="remember">Mantener sesión iniciada</label>
            </div>
            <button disabled={loading} className="w-full bg-primary hover:bg-[#581c87] text-white font-bold h-14 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed" type="submit">
              {loading && <Loader2 className="size-5 animate-spin" />}
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
              {!loading && <ArrowRight className="size-5" />}
            </button>
          </form>
          <div className="mt-8 flex items-center gap-4 py-4">
            <div className="h-px grow bg-[#dcd2e5] dark:bg-gray-800"></div>
            <span className="text-xs font-bold text-[#765492] uppercase tracking-widest">O</span>
            <div className="h-px grow bg-[#dcd2e5] dark:bg-gray-800"></div>
          </div>
          <div className="flex flex-col gap-4">
            <button onClick={handleGoogleLogin} className="flex items-center justify-center gap-3 border border-[#dcd2e5] dark:border-gray-700 rounded-lg h-14 bg-white dark:bg-[#251b2e] hover:bg-gray-50 dark:hover:bg-[#2d2138] transition-colors w-full cursor-pointer">
              {/* Using a placeholder SVG or standard Google G icon */}
              <svg className="size-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-base font-semibold dark:text-white">Iniciar sesión con Google</span>
            </button>
          </div>
          <p className="mt-10 text-center text-sm font-medium text-[#765492] dark:text-gray-400">
            ¿Aún no tienes una cuenta?
            <Link className="text-primary dark:text-primary/80 font-bold hover:underline ml-1" href="#">Crear cuenta</Link>
          </p>
        </div>
        <div className="mt-12 lg:hidden flex gap-6 text-xs font-medium text-[#765492] dark:text-gray-500">
          <a href="#">Privacidad</a>
          <a href="#">Términos</a>
          <a href="#">Ayuda</a>
        </div>
      </div>
    </div>
  );
}
