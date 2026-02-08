'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, Calendar, Download, CheckCircle, Search, ChevronRight, MoreHorizontal, ShoppingCart, TrendingUp, ClipboardCheck, BarChart2, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { updateCommitment } from './actions';

export default function CompromisoClient({ initialRows, initialDate }: { initialRows: any[], initialDate: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [date, setDate] = useState(initialDate);
    const [startTime, setStartTime] = useState('00:00'); // Default Start: 12:00 AM
    const [endTime, setEndTime] = useState('23:59');     // Default End: 11:59 PM
    const [searchTerm, setSearchTerm] = useState('');
    const [isPending, startTransition] = useTransition();

    // Local state for rows to enable real-time updates without server roundtrip for every keystroke
    const [rows, setRows] = useState(initialRows);

    // Update local rows when initialRows changes (e.g. date change)
    useMemo(() => {
        setRows(initialRows);
    }, [initialRows]);

    const handleUpdateRowQty = (rowId: string, newQty: number) => {
        setRows(prev => prev.map(r => {
            // Use strict ID comparison
            if (r.id === rowId) {
                return { ...r, qty: newQty };
            }
            return r;
        }));
    };

    // Extract categories dynamically from the actual data (Faceted Search)
    const categories = useMemo(() => {
        const unique = new Set(initialRows.map(r => r.category).filter(Boolean));
        return Array.from(unique).sort();
    }, [initialRows]);

    const [selectedCategories, setSelectedCategories] = useState<string[]>([]); 
    
    // Initialize selected categories when available
    useMemo(() => {
        if (selectedCategories.length === 0 && categories.length > 0) {
             setSelectedCategories(categories);
        }
    }, [categories]);

    // Handle Category Filter Toggle
    const toggleCategory = (cat: string) => {
        if (selectedCategories.includes(cat)) {
            setSelectedCategories(selectedCategories.filter(c => c !== cat));
        } else {
            setSelectedCategories([...selectedCategories, cat]);
        }
    };

    // Apply Filters logic (Date + Time)
    const handleApplyFilters = () => {
        const params = new URLSearchParams(searchParams);
        if (date) params.set('date', date);
        else params.delete('date');

        if (startTime) params.set('startTime', startTime);
        else params.delete('startTime');

        if (endTime) params.set('endTime', endTime);
        else params.delete('endTime');

        router.push(`/compromiso?${params.toString()}`);
    };

    const setQuickDate = (offsetDays: number) => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        const newDate = d.toISOString().split('T')[0];
        setDate(newDate);
        
        // Auto-apply filters when using date buttons
        startTransition(() => {
            const params = new URLSearchParams(searchParams);
            params.set('date', newDate);
            if (startTime) params.set('startTime', startTime);
            if (endTime) params.set('endTime', endTime);
            router.push(`/compromiso?${params.toString()}`);
        });
    };

    // Calculate Stats based on local rows (real-time)
    // We filter by client-side Category selection
    const visibleRows = useMemo(() => {
        return rows.filter(row => 
            row.product.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (selectedCategories.length === 0 || selectedCategories.includes(row.category))
        );
    }, [rows, searchTerm, selectedCategories]);

    const stats = useMemo(() => {
        const totalDemand = visibleRows.reduce((acc, row) => acc + (row.demand || 0), 0);
        const totalCaptured = visibleRows.reduce((acc, row) => acc + (row.qty || 0), 0);
        const totalOrders = visibleRows.length; 
        
        const compliance = totalDemand > 0 ? (totalCaptured / totalDemand) * 100 : 0;
        
        // Progress Alert Calculation
        const filledItems = visibleRows.filter(r => r.qty > 0).length;
        const totalItems = visibleRows.length;
        const pendingItems = totalItems - filledItems;

        return {
            totalOrders,
            totalDemand,
            totalCaptured,
            compliance: compliance.toFixed(1),
            filledItems,
            totalItems,
            pendingItems
        };
    }, [visibleRows]);

    return (
        <>
            {/* Sidebar Filters - Forced Light Mode */}
            <aside className="w-full lg:w-72 flex-shrink-0">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
                    <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Filter className="text-primary size-5" />
                            Filtros
                        </h3>
                        <button 
                            onClick={() => { setDate(''); setStartTime('00:00'); setEndTime('23:59'); setSearchTerm(''); setSelectedCategories(categories); }}
                            className="text-xs font-medium text-slate-500 hover:text-primary transition-colors">
                            Limpiar
                        </button>
                    </div>
                    <div className="p-5 space-y-6">
                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                            <label className="block text-xs font-bold text-accent uppercase tracking-wide mb-2 flex items-center gap-1">
                                <Calendar className="size-4" />
                                Dia de Entrega
                            </label>
                            <div className="flex gap-2 mb-2">
                                <button
                                    onClick={() => setQuickDate(0)}
                                    className={cn(
                                        "flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all border",
                                        date === new Date().toISOString().split('T')[0] 
                                            ? "bg-white text-accent border-orange-200 shadow-sm" 
                                            : "bg-orange-100/50 text-slate-500 border-transparent hover:bg-orange-100"
                                    )}
                                >
                                    Hoy
                                </button>
                                <button
                                    onClick={() => setQuickDate(1)}
                                    className={cn(
                                        "flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all border",
                                        date === new Date(Date.now() + 86400000).toISOString().split('T')[0]
                                            ? "bg-white text-accent border-orange-200 shadow-sm" 
                                            : "bg-orange-100/50 text-slate-500 border-transparent hover:bg-orange-100"
                                    )}
                                >
                                    Mañana
                                </button>
                            </div>

                            <div className="relative mb-3">
                                <input 
                                    className="block w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm font-medium focus:ring-accent focus:border-accent text-slate-900 shadow-sm outline-none" 
                                    type="date" 
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Horario</label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <span className="text-[10px] text-slate-400 mb-1 block">Desde</span>
                                    <input 
                                        type="time" 
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="block w-full px-2 py-1.5 bg-white border border-orange-200/50 rounded text-xs text-slate-900 outline-none focus:border-accent" 
                                    />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[10px] text-slate-400 mb-1 block">Hasta</span>
                                    <input 
                                        type="time" 
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="block w-full px-2 py-1.5 bg-white border border-orange-200/50 rounded text-xs text-slate-900 outline-none focus:border-accent" 
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Colecciones</label>
                            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                                {categories.map(cat => (
                                    <label key={cat} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-slate-300 text-primary focus:ring-primary size-4" 
                                            checked={selectedCategories.includes(cat)}
                                            onChange={() => toggleCategory(cat)}
                                        />
                                        <span className="text-sm text-slate-700">{cat}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button 
                            onClick={handleApplyFilters}
                            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                            <Check className="size-4" />
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content - Forced Light Mode */}
            <div className="flex-1 w-full min-w-0">
                {/* Progress Alert */}
                <div className={cn(
                    "mb-6 p-4 rounded-xl border flex items-center justify-between gap-4 transition-colors",
                    stats.pendingItems > 0 
                        ? "bg-orange-50 border-orange-200 text-orange-900" 
                        : "bg-green-50 border-green-200 text-green-900"
                )}>
                    <div className="flex items-center gap-3">
                        {stats.pendingItems > 0 ? (
                            <div className="bg-orange-100 p-2 rounded-full">
                                <Loader2 className="size-5 text-orange-600 animate-spin-slow" />
                            </div>
                        ) : (
                            <div className="bg-green-100 p-2 rounded-full">
                                <CheckCircle className="size-5 text-green-600" />
                            </div>
                        )}
                        <div>
                            <h4 className="font-bold text-sm">
                                {stats.pendingItems > 0 ? 'Faltan datos por capturar' : '¡Excelente! Captura completa'}
                            </h4>
                            <p className="text-xs opacity-80">
                                {stats.pendingItems > 0 
                                    ? `Haz completado ${stats.filledItems} de ${stats.totalItems} variedades. Te faltan ${stats.pendingItems}.` 
                                    : `Has registrado cantidades para todas las ${stats.totalItems} variedades.`}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black">{stats.filledItems}/{stats.totalItems}</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Operativo
                            </span>
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                <Calendar className="size-4" />
                                {new Date(date).toLocaleDateString()}
                            </span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">Flores del Invernadero</h1>
                        <p className="text-slate-600 mt-1 max-w-2xl">Vista de flores a surtir por el invernadero.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Buttons removed by request */}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Variedades</span>
                            <ShoppingCart className="text-primary size-5" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 font-mono">{stats.totalOrders}</span>
                            <span className="text-xs text-slate-400 font-medium">Items</span>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Requerido</span>
                            <BarChart2 className="text-accent size-5" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 font-mono">{stats.totalDemand.toLocaleString()}</span>
                            <span className="text-xs text-slate-400 font-medium">Paquetes</span>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enviado</span>
                            <ClipboardCheck className="text-secondary size-5" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 font-mono">{stats.totalCaptured.toLocaleString()}</span>
                            <span className="text-xs text-slate-400 font-medium">Paquetes</span>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-success">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cumplimiento</span>
                            <TrendingUp className="text-success size-5" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 font-mono">{stats.compliance}%</span>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[60px]">
                                <div className="h-full bg-success" style={{ width: `${stats.compliance}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-900">Detalle por Variedad</h3>
                        <div className="flex gap-2 relative">
                             <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 pr-3 py-1 bg-white border border-slate-200 rounded text-sm text-slate-700 outline-none focus:border-primary" 
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="w-10 pl-6 py-4"></th>
                                    <th className="py-4 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Variedad</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Demanda</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Cantidad</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Variación</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Registro</th>
                                    <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Cumplimiento</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {visibleRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500">
                                            No hay registros para esta fecha y filtros.
                                        </td>
                                    </tr>
                                ) : (
                                    visibleRows.map((row, idx) => (
                                        <Row 
                                        key={row.id} 
                                        row={row} 
                                        date={date}
                                        onUpdateQty={handleUpdateRowQty} 
                                    />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                        <span className="text-sm text-slate-500">Mostrando {visibleRows.length} registros</span>
                    </div>
                </div>
            </div>
        </>
    );
}

function Row({ row, date, onUpdateQty }: { row: any, date: string, onUpdateQty: (id: string, qty: number) => void }) {
    const [expanded, setExpanded] = useState(false);
    // Remove local state in favor of prop-driven state for immediate UI updates
    // const [qty, setQty] = useState(row.qty); 
    const [isPending, startTransition] = useTransition();

    const handleQtyChange = (val: string) => {
        const num = val === '' ? 0 : parseInt(val);
        if (isNaN(num)) return;
        
        // Immediate UI update via parent state using unique ID
        onUpdateQty(row.id, num);
    };

    const handleBlur = () => {
        startTransition(async () => {
            try {
                // Save to server
                // Save to server (Upsert logic)
                // We need date from parent context? Not passed to Row directly.
                // Assuming `row` contains date or we pass it. 
                // Ah, date is state in parent. We need to pass it to Row.
                // Wait, client.tsx doesn't pass 'date' to Row. 
                // Let's pass it from parent.
                await updateCommitment(row.commitmentId, row.id, date, row.qty);
            } catch (e) {
                console.error("Update failed", e);
            }
        });
    };

    return (
        <>
            <tr
                className={cn(
                    "hover:bg-[#faf9fb] transition-colors cursor-pointer group",
                    expanded && "bg-[#faf9fb]"
                )}
            >
                <td className="pl-6 py-4">
                     {/* Expand button removed by request */}
                </td>
                <td className="py-4 px-2">
                    <div className="flex items-center gap-4">
                        <div className="size-16 rounded-lg bg-gray-100 relative overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                             {row.image ? (
                                <Image src={row.image} alt={row.product} fill className="object-cover" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <ShoppingCart className="size-8" />
                                </div>
                             )}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 text-sm">{row.product}</p>
                            <p className="text-[10px] text-slate-500 font-mono">ID: #{row.id?.substring(0,6)}</p>
                        </div>
                    </div>
                </td>
                <td className="py-4 px-6 text-right">
                    <span className="text-lg font-mono font-medium text-slate-700">{row.demand}</span>
                </td>
                <td className="py-4 px-6 text-center">
                    <div className="relative flex items-center justify-center">
                        <input 
                            type="number"
                            value={row.qty || ''} 
                            placeholder=""
                            onChange={(e) => handleQtyChange(e.target.value)}
                            onBlur={handleBlur}
                            disabled={isPending}
                            className={cn(
                                "w-20 text-center font-mono font-bold text-slate-900 bg-purple-50 hover:bg-purple-100 focus:bg-white border border-transparent hover:border-purple-200 focus:border-primary rounded px-2 py-1 outline-none transition-all placeholder:text-transparent",
                                isPending && "opacity-50"
                            )}
                        />
                         {isPending && <Loader2 className="absolute -right-2 size-3 animate-spin text-primary" />}
                    </div>
                </td>
                <td className="py-4 px-6 text-right tabular-nums">
                    <span className={cn(
                        "text-xs font-bold px-1.5 py-0.5 rounded",
                        (row.qty - row.demand) < 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    )}>
                        {(row.qty - row.demand) > 0 ? '+' : ''}{row.qty - row.demand}
                    </span>
                </td>
                <td className="py-4 px-6">
                    <div className="flex items-center gap-2 group/user">
                        <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden text-primary text-xs font-bold">
                           {row.capturedBy?.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-700">{row.capturedBy}</p>
                            <p className="text-[10px] text-slate-400">Ahora</p>
                        </div>
                    </div>
                </td>
                <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-[60px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-accent" style={{ width: `${row.demand > 0 ? Math.min((row.qty / row.demand) * 100, 100) : 0}%` }}></div>
                        </div>
                        <span className="text-xs font-mono font-medium text-slate-600">
                            {row.demand > 0 ? Math.round((row.qty / row.demand) * 100) : 0}%
                        </span>
                    </div>
                </td>
            </tr>
            {expanded && (
                <tr className="bg-slate-50/50">
                    <td className="p-0" colSpan={7}>
                         <div className="px-6 py-4 pl-16 space-y-4 border-b border-slate-100">
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detalles (Mock)</p>
                             {row.details?.map((d: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span>{d.size}</span>
                                    <span>{d.qty}</span>
                                </div>
                             ))}
                         </div>
                    </td>
                </tr>
            )}
        </>
    );
}
