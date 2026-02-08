'use client';

import Link from 'next/link';
import { LayoutGrid, ArrowLeftRight, Link as LinkIcon, ShoppingCart, Network, Save, Link2Off, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ShopifyIntegrationPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | '', text: string }>({ type: '', text: '' });
    
    // Form State
    const [shopUrl, setShopUrl] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [secretKey, setSecretKey] = useState('');

    const [toggles, setToggles] = useState({
        syncOrders: true,
        updateStock: true,
        syncCancels: false,
        notifyErrors: true,
    });

    const toggle = (key: keyof typeof toggles) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSync = async () => {
        setIsLoading(true);
        setStatusMessage({ type: '', text: '' });
        try {
            const res = await fetch('/api/shopify/sync', { method: 'POST' });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Error en sincronización');

            setStatusMessage({ type: 'success', text: data.message || 'Sincronización completada.' });
        } catch (error: any) {
            console.error(error);
            setStatusMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-[960px] mx-auto">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap gap-2 px-4 py-2 mb-4">
                <Link className="text-[#765492] dark:text-primary/70 text-base font-medium leading-normal hover:underline" href="#">Configuración</Link>
                <span className="text-[#765492] dark:text-primary/70 text-base font-medium leading-normal">/</span>
                <span className="text-[#150f1a] dark:text-white text-base font-medium leading-normal">Conexión con Shopify</span>
            </div>

            {/* Heading */}
            <div className="flex flex-wrap justify-between gap-3 p-4 mb-6">
                <div className="flex min-w-72 flex-col gap-3">
                    <p className="text-[#150f1a] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Integración con Shopify</p>
                    <p className="text-[#765492] dark:text-gray-400 text-base font-normal leading-normal">Configura la sincronización automática de productos, pedidos e inventario entre Shopify y Maxiflores.</p>
                </div>
            </div>

            {/* Status Panel */}
            <div className="p-4 mb-6">
                <div className="flex flex-1 flex-col items-start justify-between gap-4 rounded-xl border border-[#dcd2e5] dark:border-white/10 bg-white dark:bg-white/5 p-5 md:flex-row md:items-center shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-100 dark:bg-white/10 rounded-full">
                            <Link2Off className="text-gray-400 size-6" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-[#150f1a] dark:text-white text-base font-bold leading-tight">Estado de la Conexión</p>
                            <div className="flex items-center gap-2">
                                <div className={`size-2 rounded-full ${isLoading ? 'bg-yellow-400' : 'bg-gray-400'} animate-pulse`}></div>
                                <p className="text-[#765492] dark:text-gray-400 text-base font-normal leading-normal">
                                    {isLoading ? 'Guardando...' : 'No conectado'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-white border border-[#dcd2e5] text-[#150f1a] dark:bg-transparent dark:border-white/20 dark:text-white text-sm font-medium leading-normal hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                        <span className="truncate">Ver historial de logs</span>
                    </button>
                </div>
                
                {/* Status Message Feedback */}
                {statusMessage.text && (
                     <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                        <Activity className="size-5" />
                        <p className="text-sm font-medium">{statusMessage.text}</p>
                     </div>
                )}
            </div>

            {/* Configuration Form */}
            <div className="px-4 py-6 mb-8">
                <div className="flex flex-col gap-8 bg-white dark:bg-white/5 rounded-xl border border-[#dcd2e5] dark:border-white/10 p-6 md:p-8">
                    <div className="flex items-center justify-center gap-8 mb-4">
                        <div className="size-16 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                            <ShoppingCart className="text-primary size-8 font-bold" />
                        </div>
                        <ArrowLeftRight className="text-[#765492] dark:text-gray-400 size-8" />
                        <div className="size-16 flex items-center justify-center rounded-xl bg-primary text-white">
                            <LayoutGrid className="size-8" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[#150f1a] dark:text-white text-sm font-bold">URL de la Tienda Shopify</label>
                            <input 
                                value={shopUrl}
                                onChange={(e) => setShopUrl(e.target.value)}
                                className="w-full h-12 px-4 rounded-lg border border-[#dcd2e5] dark:border-white/10 dark:bg-background-dark dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-[#765492]/50" 
                                placeholder="ejemplo.myshopify.com" 
                                type="text" 
                            />
                            <p className="text-xs text-[#765492] dark:text-gray-400">Introduce el subdominio .myshopify.com de tu tienda.</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[#150f1a] dark:text-white text-sm font-bold">Access Token de la API</label>
                            <input 
                                value={accessToken}
                                onChange={(e) => setAccessToken(e.target.value)}
                                className="w-full h-12 px-4 rounded-lg border border-[#dcd2e5] dark:border-white/10 dark:bg-background-dark dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-[#765492]/50" 
                                placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx" 
                                type="password" 
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[#150f1a] dark:text-white text-sm font-bold">Clave Secreta</label>
                            <input 
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                className="w-full h-12 px-4 rounded-lg border border-[#dcd2e5] dark:border-white/10 dark:bg-background-dark dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-[#765492]/50" 
                                placeholder="••••••••••••••••" 
                                type="password" 
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-4">
                        <button 
                            onClick={handleSync}
                            disabled={isLoading}
                            className="flex-1 w-full h-12 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50">
                            <Network className="size-5" />
                            {isLoading ? 'Sincronizando...' : 'Probar Conexión y Descargar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Preferences Section */}
            <h2 className="text-[#150f1a] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Preferencias de Descarga</h2>
            <div className="px-4 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleCard
                        label="Sincronizar pedidos automáticamente"
                        desc="Descarga los pedidos nuevos en tiempo real."
                        checked={toggles.syncOrders}
                        onChange={() => toggle('syncOrders')}
                    />
                    <ToggleCard
                        label="Actualizar stock cada 15 min"
                        desc="Mantiene el inventario sincronizado frecuentemente."
                        checked={toggles.updateStock}
                        onChange={() => toggle('updateStock')}
                    />
                    <ToggleCard
                        label="Sincronizar Cancelaciones"
                        desc="Reflejar pedidos cancelados en el OMS."
                        checked={toggles.syncCancels}
                        onChange={() => toggle('syncCancels')}
                    />
                    <ToggleCard
                        label="Notificar errores de API"
                        desc="Enviar alertas si la conexión falla."
                        checked={toggles.notifyErrors}
                        onChange={() => toggle('notifyErrors')}
                    />
                </div>
            </div>
        </div>
    );
}

function ToggleCard({ label, desc, checked, onChange }: { label: string, desc: string, checked: boolean, onChange: () => void }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl border border-[#dcd2e5] dark:border-white/10 bg-white dark:bg-white/5">
            <div className="flex flex-col gap-1">
                <p className="text-[#150f1a] dark:text-white text-sm font-bold">{label}</p>
                <p className="text-xs text-[#765492] dark:text-gray-400">{desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
        </div>
    );
}
