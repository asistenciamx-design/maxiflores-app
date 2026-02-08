'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Flower, Search, Plus, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/app/auth/actions';
import { useState, useRef, useEffect } from 'react';

const navItems = [
    { name: 'Pedidos', href: '/surtido' },
    { name: 'Inventario', href: '/compromiso' },
    { name: 'Desglose', href: '/desglose' },
    // { name: 'Integraciones', href: '/configuracion/shopify' }, // Hidden by request
];

export function Header() {
    const pathname = usePathname();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    const handleLogout = async () => {
        await logout();
    };

    const handleAvatarClick = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            router.push(`/desglose?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <header className="bg-white border-b border-[#f2f1f4] sticky top-0 z-50 dark:bg-background-dark dark:border-white/10">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4 md:gap-8">
                        {/* Mobile Menu Button */}
                        <button 
                            className="md:hidden p-2 -ml-2 text-slate-500 hover:text-primary transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>

                        <Link href="/surtido" className="flex items-center gap-3">
                            <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
                                <Flower className="size-6" />
                            </div>
                            <h2 className="text-[#151217] dark:text-white text-lg font-bold tracking-tight hidden sm:block">Maxiflores OMS</h2>
                            <h2 className="text-[#151217] dark:text-white text-lg font-bold tracking-tight sm:hidden">OMS</h2>
                        </Link>
                        <nav className="hidden md:flex items-center gap-6">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "text-sm font-medium transition-colors border-b-2 py-5",
                                        pathname.startsWith(item.href)
                                            ? "text-[#151217] dark:text-white border-primary"
                                            : "text-[#776685] dark:text-gray-400 border-transparent hover:text-primary"
                                    )}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="relative hidden sm:block">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#776685]">
                                <Search className="size-5" />
                            </div>
                            <input
                                className="bg-[#f2f1f4] dark:bg-white/5 border-none text-sm rounded-lg block w-64 pl-10 p-2.5 focus:ring-1 focus:ring-primary placeholder-[#776685] outline-none dark:text-white"
                                placeholder="Buscar pedido o variedad..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                        <button className="bg-primary hover:bg-primary-dark text-white rounded-lg px-3 py-2 sm:px-4 text-sm font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer">
                            <Plus className="size-5" />
                            <span className="hidden sm:inline">Nuevo Pedido</span>
                        </button>
                        
                        {/* User Avatar with Dropdown */}
                        <div className="relative group" ref={dropdownRef}>
                            <button
                                onClick={handleAvatarClick}
                                className="h-10 w-10 rounded-full bg-cover bg-center border border-[#e1dce4] dark:border-white/10 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer relative z-40"
                                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB77iS9MZGy1OzdKxC8bxYgqyH4gdSwCaJ54XJ_-5TqhIU3ElmYAxFRbHm-n2_dM3KIy3yXG1LPMJ-MaoHxNyKS2lywZN9T5Mc8RZE72VWsqRA92C7Gaa8SnErJs6w7vwmVhoGMVc_0i_Y4JJ9HnG652sGc9oQs9CuO0eqz3XoJ9pt3Jn9KyraAuNYmgfPqIy3zzE7B_Yh0ZHQGHjEU4wlQQvVuVJ_zS2vhTRO0ZWpuzKwb_RSVfrNeb-GNCgJHvCSCXwNaz4iUn90f')" }}
                                aria-label="Menú de usuario"
                                type="button"
                            />
                            
                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#e1dce4] dark:border-white/10 py-1 z-[100]">
                                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                                        <p className="text-xs font-semibold text-gray-500">Cuenta</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors font-medium"
                                    >
                                        <LogOut className="size-4" />
                                        Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-slate-100 bg-white dark:bg-background-dark dark:border-white/10 absolute w-full left-0 shadow-lg">
                    <nav className="flex flex-col p-4 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "text-sm font-medium px-4 py-3 rounded-lg transition-colors flex items-center gap-3",
                                    pathname.startsWith(item.href)
                                        ? "bg-primary/10 text-primary font-bold"
                                        : "text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5"
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
}
