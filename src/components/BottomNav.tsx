'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, CalendarDays, User, Ticket, Tag, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
    name: string;
    href: string;
    icon: any;
    active: boolean;
    protected?: boolean;
    isCTA?: boolean;
    external?: boolean;
}

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading } = useAuth(); // Assuming loading is available from useAuth

    // Hide on Admin pages & Desktop
    if (pathname.startsWith('/admin')) return null;

    const navItems: NavItem[] = [
        {
            name: 'Home',
            href: '/',
            icon: Home,
            active: pathname === '/',
        },
        // Pricing
        {
            name: 'Pricing',
            href: '/pricing',
            icon: Tag,
            active: pathname.startsWith('/pricing'),
        },
        // Main Booking CTA
        {
            name: 'Book',
            href: '/book',
            icon: CalendarDays,
            active: pathname.startsWith('/book'),
            isCTA: true,
        },
        {
            name: 'Bookings',
            href: '/my-bookings',
            icon: Ticket,
            active: pathname.startsWith('/my-bookings'),
            protected: true,
        },
        // Dynamic Profile / Login
        user ? {
            name: 'Profile',
            href: '/profile',
            icon: User,
            active: pathname.startsWith('/profile'),
            protected: true,
        } : {
            name: 'Login',
            href: '/login',
            icon: LogIn,
            active: pathname.startsWith('/login'),
            protected: false,
        }
    ];

    const handleNavigation = (e: React.MouseEvent, item: NavItem) => {
        if (item.protected && !user) {
            e.preventDefault();
            router.push('/login');
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D0D]/90 backdrop-blur-md border-t border-white/5 pb-safe pt-2 px-6 show-on-mobile md:hidden transition-transform duration-300 rounded-t-2xl will-change-transform backface-visibility-hidden">
            <nav className="flex justify-between items-center h-16 safe-area-bottom">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.active;

                    // If it's the CTA (Book), render it differently
                    if (item.isCTA) {
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="flex flex-col items-center justify-center -mt-8"
                            >
                                <div
                                    className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-black shadow-[0_0_20px_rgba(34,197,94,0.6)] border-[6px] border-[#0D0D0D] z-10 active:scale-95 transition-transform"
                                >
                                    <Icon size={28} strokeWidth={2.5} />
                                </div>
                                <span className="text-[10px] font-bold text-primary mt-1 tracking-wide">
                                    {item.name}
                                </span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            target={item.external ? "_blank" : undefined}
                            onClick={(e) => handleNavigation(e, item)}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 relative",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            {isActive && (
                                <span
                                    className="absolute -top-2 w-8 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all duration-300"
                                />
                            )}

                            <Icon
                                size={24}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={cn(
                                    "transition-all duration-300",
                                    isActive && "drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                )}
                            />
                            <span className={cn(
                                "text-[10px] font-medium transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
