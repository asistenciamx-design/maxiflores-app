'use client';

import { useState, useTransition, useEffect } from 'react';
import { Package, ShoppingCart, BarChart3, CheckSquare, ChevronDown, Check, ChevronUp, Calendar, Filter, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function SurtidoClient({ 
    initialItems, 
    initialDate,
    initialStartTime,
    initialEndTime
}: { 
    initialItems: any[], 
    initialDate: string,
    initialStartTime: string,
    initialEndTime: string
}) {
    const router = useRouter();
    // Use initialItems directly to reflect prop changes immediately
    const items = initialItems;

    const [date, setDate] = useState(initialDate);
    const [startTime, setStartTime] = useState(initialStartTime);
    const [endTime, setEndTime] = useState(initialEndTime);

    // Sync input states with props when they change (e.g. navigation, back button)
    useEffect(() => {
        setDate(initialDate);
        setStartTime(initialStartTime);
        setEndTime(initialEndTime);
    }, [initialDate, initialStartTime, initialEndTime]);

    const [isPending, startTransition] = useTransition();
    const [isSyncing, setIsSyncing] = useState(false);

    const handleApplyFilters = () => {
        startTransition(() => {
            const params = new URLSearchParams();
            if (date) params.set('date', date);
            if (startTime) params.set('startTime', startTime);
            if (endTime) params.set('endTime', endTime);
            router.push(`/surtido?${params.toString()}`);
        });
    };

    const handleManualSync = async () => {
        try {
            setIsSyncing(true);
            const res = await fetch('/api/shopify/sync', { method: 'POST' });
            const data = await res.json();
            
            if (data.success) {
                // Success feedback
                router.refresh();
            } else {
                alert('Error al sincronizar: ' + (data.error || 'Desconocido'));
            }
        } catch (error) {
            alert('Error de conexión');
        } finally {
            setIsSyncing(false);
        }
    };

    const setQuickDate = (offsetDays: number) => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        const newDate = d.toISOString().split('T')[0];
        setDate(newDate);
        
        // Auto-apply filters when using quick buttons (as requested "directo")
         startTransition(() => {
            const params = new URLSearchParams();
            if (newDate) params.set('date', newDate);
            if (startTime) params.set('startTime', startTime);
            if (endTime) params.set('endTime', endTime);
            router.push(`/surtido?${params.toString()}`);
        });
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-2 text-primary font-bold min-w-[100px]">
                    <Filter className="size-5" />
                    <span>Filtros</span>
                </div>
                
                <div className="flex-1 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative w-full md:w-auto flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Fecha de Entrega</label>
                        <div className="flex gap-2">
                             <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                                <button
                                    onClick={() => setQuickDate(0)}
                                    // Highlight if selected date is today
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                                        date === new Date().toISOString().split('T')[0] 
                                            ? "bg-white text-primary shadow-sm" 
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                                    )}
                                >
                                    Hoy
                                </button>
                                <button
                                    onClick={() => setQuickDate(1)}
                                     // Highlight if selected date is tomorrow
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                                        date === new Date(Date.now() + 86400000).toISOString().split('T')[0]
                                            ? "bg-white text-primary shadow-sm" 
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                                    )}
                                >
                                    Mañana
                                </button>
                             </div>
                            <input 
                                type="date" 
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="block w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-primary focus:border-primary outline-none" 
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Desde</label>
                            <input 
                                type="time" 
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="block w-full md:w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-primary focus:border-primary outline-none" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 block">Hasta</label>
                            <input 
                                type="time" 
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="block w-full md:w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-primary focus:border-primary outline-none" 
                            />
                        </div>
                    </div>

                    <div className="flex-1 md:text-right w-full flex justify-end gap-3 items-center">
                         {/* Manual Sync Button */}
                        <button
                            onClick={handleManualSync}
                            disabled={isSyncing}
                            className={cn(
                                "h-11 w-11 flex items-center justify-center rounded-full bg-green-500 text-white shadow-md hover:bg-green-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                                isSyncing && "animate-spin"
                            )}
                            title="Sincronizar Manualmente"
                        >
                            <RefreshCw className="size-5" />
                        </button>

                        <button 
                            onClick={handleApplyFilters}
                            disabled={isPending}
                            className={cn(
                                "w-full md:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold shadow-md transition-all active:scale-[0.98]",
                                isPending && "opacity-75 cursor-wait"
                            )}
                        >
                            {isPending ? 'Actualizando...' : 'Aplicar'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
            {items.map((item) => (
                <details key={item.id} className="group bg-white dark:bg-surface-dark rounded-xl border border-[#e1dce4] dark:border-white/10 shadow-sm overflow-hidden" open={true}>
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors select-none">
                        <div className="flex items-center gap-4 md:gap-6">
                            <div
                                className="h-16 w-16 rounded-lg bg-cover bg-center shrink-0 border border-gray-100 dark:border-white/10"
                                style={{ backgroundImage: `url('${item.image}')` }}
                            >
                            </div>
                            <div className="flex flex-col text-left">
                                <h3 className="text-lg font-bold text-[#151217] dark:text-white">{item.name}</h3>
                                <p className="text-[#776685] dark:text-gray-400 text-sm">SKU: {item.sku}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 md:gap-12">
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-semibold text-[#776685] dark:text-gray-400 uppercase tracking-wider">Total Paquetes</span>
                                <span className="text-2xl md:text-3xl font-black text-accent-purple">{item.totalPackages}</span>
                            </div>
                            <div className="text-[#776685] dark:text-gray-400 transition-transform duration-300 group-open:rotate-180">
                                <ChevronDown className="size-8" />
                            </div>
                        </div>
                    </summary>
                    <div className="border-t border-[#e1dce4] dark:border-white/10 bg-[#faf9fb] dark:bg-background-dark/50">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#e1dce4] dark:border-white/10">
                                        <th className="p-4 w-16 text-center">
                                            <div className="size-5 border-2 border-[#776685] rounded mx-auto"></div>
                                        </th>
                                        <th className="p-4 text-xs font-semibold text-[#776685] dark:text-gray-400 uppercase tracking-wider">Pedido #</th>
                                        <th className="p-4 text-xs font-semibold text-[#776685] dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                                        <th className="p-4 text-xs font-semibold text-[#776685] dark:text-gray-400 uppercase tracking-wider">Paquetes</th>
                                        <th className="p-4 text-xs font-semibold text-[#776685] dark:text-gray-400 uppercase tracking-wider text-center">Total</th>
                                        <th className="p-4 text-xs font-semibold text-[#776685] dark:text-gray-400 uppercase tracking-wider text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e1dce4] dark:divide-white/10 bg-white dark:bg-surface-dark">
                                    {item.orders.map((order: any, oIdx: number) => (
                                        <tr key={oIdx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/row">
                                            <td className="p-4 text-center">
                                                <input className="h-6 w-6 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer transition-all" type="checkbox" />
                                            </td>
                                            <td className="p-4 font-medium text-[#151217] dark:text-white">{order.id}</td>
                                            <td className="p-4 text-[#151217] dark:text-white">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{order.client}</span>
                                                        {order.vip && (
                                                            <span className="bg-accent-purple text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-none uppercase">VIP</span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-[#776685] dark:text-gray-400">{order.location}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 min-w-[80px]">
                                                    {order.qty}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="inline-flex items-center gap-2">
                                                    <span className={cn("font-bold", order.totalOrders > 50 ? "text-accent-purple" : "text-[#151217] dark:text-white")}>{order.totalOrders}</span>
                                                    <span className="text-xs text-[#776685] dark:text-gray-400">pedidos</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="text-[#776685] dark:text-gray-400 hover:text-primary dark:hover:text-primary-300 font-medium text-sm cursor-pointer">Ver Detalles</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </details>
            ))}
            {/* Informative Footer */}
            <div className="mt-8 mb-20 p-6 rounded-xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 text-center">
                <p className="text-sm text-slate-500 dark:text-gray-400">
                    Mostrando resultados para el <strong>{new Date(date + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </p>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
                    Horario de creación: {startTime} - {endTime}
                </p>
            </div>
        </div>
    </div>
    );
}
