'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Calendar, ListChecks,
    Trophy, Users, Settings, LogOut,
    Menu, X, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import LoginScreen from '../../components/admin/LoginScreen';
import { ToastProvider } from '../../components/admin/AdminToast';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // Init check
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Simple check: try to fetch a protected API
            // Or just check for existence of cookie via a special /api/auth/me endpoint?
            // For now, consistent with previous flow, rely on the Login Screen first.
            // If we have a cookie, we assume valid until 401.
            // But we need a way to know if we are logged in on first load.
            // Let's assume if there's no auth, we show login.
            // We can add a simple /api/auth/check endpoint later.
            // For this step, let's keep the manual login flow but persist it better.

            // Temporary: Check localStorage for "quick resume" coupled with cookie presence?
            // A real "me" endpoint is best.
            // Let's fallback to Login Screen by default on refresh for security unless we implement /me.
            // But user asked for "No manual refresh needed" - persistence is key.
            const res = await fetch('/api/admin/me');
            if (res.ok) setIsAuthenticated(true);
        } catch (e) {
            // Ignore
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent, email: string, password: string) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                setIsAuthenticated(true);
            } else {
                const data = await res.json();
                alert(data.error || 'Invalid credentials');
            }
        } catch (error) {
            alert('Login error');
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setIsAuthenticated(false);
        router.push('/admin');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        // Create a wrapper for LoginScreen to pass the handler
        return <LoginWrapper onLogin={handleLogin} />;
    }

    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
        { label: 'Bookings', icon: ListChecks, href: '/admin/bookings' },
        { label: 'Calendar', icon: Calendar, href: '/admin/calendar' },
        { label: 'Sports', icon: Trophy, href: '/admin/sports' },
        { label: 'Customers', icon: Users, href: '/admin/customers' },
        { label: 'Settings', icon: Settings, href: '/admin/settings' },
    ];

    return (
        <ToastProvider>
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col md:flex-row">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-white">
                            <span className="text-primary">Arena</span>360
                        </h1>
                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">Admin</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Overlay */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}
                {/* Sidebar */}
                <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-black/95 backdrop-blur-xl border-r border-white/10 
                transition-transform duration-300 ease-in-out md:translate-x-0 md:relative md:flex flex-col
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                    <div className="p-6 border-b border-white/10">
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-primary">Arena</span>360
                            <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400">Admin</span>
                        </h1>
                    </div>

                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                                    ${isActive
                                            ? 'bg-primary text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 w-full transition-colors"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                        <div className="text-xs text-gray-600 px-4 mt-2">
                            v2.0.0 Enterprise
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8">
                    {children}
                </main>
            </div>
        </ToastProvider>
    );
}

// Wrapper for admin login
function LoginWrapper({ onLogin }: any) {
    return <LoginScreen onLogin={onLogin} />;
}
