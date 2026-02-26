"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { User, LogOut, Calendar, ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Header() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const isHome = pathname === '/';
    const showLogo = !isHome || scrolled;

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
            ? "bg-black/50 backdrop-blur-md border-b border-white/5 shadow-lg py-0"
            : "bg-transparent border-transparent py-4"
            }`}>
            <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className={`relative h-12 w-32 flex items-center transition-opacity duration-300 ${showLogo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <img
                        src="/logo-new.png"
                        alt="Arena360"
                        className="h-full w-full object-contain object-left"
                    />
                </Link>

                {/* Desktop Center Navigation */}
                <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
                    <Link href="/" className={`text-sm font-semibold transition-colors ${scrolled ? "text-gray-300 hover:text-white" : "text-white/80 hover:text-white drop-shadow-md"}`}>Home</Link>
                    <Link href="/book" className={`text-sm font-semibold transition-colors ${scrolled ? "text-gray-300 hover:text-white" : "text-white/80 hover:text-white drop-shadow-md"}`}>Book a Slot</Link>
                    <Link href="/pricing" className={`text-sm font-semibold transition-colors ${scrolled ? "text-gray-300 hover:text-white" : "text-white/80 hover:text-white drop-shadow-md"}`}>Pricing</Link>
                    <Link href="/admin" className={`text-sm font-semibold transition-colors ${scrolled ? "text-gray-300 hover:text-white" : "text-white/80 hover:text-white drop-shadow-md"}`}>Admin</Link>
                </nav>

                {/* Desktop Auth */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-2 text-sm font-medium text-white hover:text-primary transition-colors focus:outline-none"
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${scrolled ? "bg-white/10 border-white/10" : "bg-black/30 border-white/20 backdrop-blur-sm"
                                    }`}>
                                    <User className="w-4 h-4" />
                                </div>
                                <span className={scrolled ? "" : "drop-shadow-md"}>{user.name.split(' ')[0]}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-fade-in-down">
                                    <div className="p-3 border-b border-white/5">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Signed in as</p>
                                        <p className="text-sm text-white truncate font-medium">{user.email}</p>
                                    </div>
                                    <Link
                                        href="/my-bookings"
                                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <Calendar className="w-4 h-4" />
                                        My Bookings
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
                                className={`text-sm font-bold transition-colors ${scrolled ? "text-gray-300 hover:text-white" : "text-white/80 hover:text-white drop-shadow-md"
                                    }`}>
                                Log In
                            </Link>
                            <Link href="/register">
                                <Button className={`h-9 px-6 text-sm font-bold transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] ${scrolled
                                    ? "bg-white text-black hover:bg-gray-200"
                                    : "bg-primary text-black hover:bg-white border-2 border-transparent hover:border-primary"
                                    }`}>
                                    Sign Up
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-white p-2"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-black border-b border-white/10 p-4 shadow-2xl animate-fade-in">
                    {user ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{user.name}</p>
                                    <p className="text-xs text-gray-400">{user.email}</p>
                                </div>
                            </div>
                            <Link
                                href="/my-bookings"
                                className="flex items-center gap-3 p-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Calendar className="w-5 h-5" />
                                My Bookings
                            </Link>
                            <button
                                onClick={() => {
                                    logout();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl"
                            >
                                <LogOut className="w-5 h-5" />
                                Log Out
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4 pb-4 mb-2 border-b border-white/10">
                                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-white text-center p-3 bg-white/5 rounded-xl hover:bg-white/10">Home</Link>
                                <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-white text-center p-3 bg-white/5 rounded-xl hover:bg-white/10">Pricing</Link>
                                <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-white text-center p-3 bg-white/5 rounded-xl hover:bg-white/10 col-span-2">Admin Portal</Link>
                            </div>
                            <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`} onClick={() => setIsMobileMenuOpen(false)}>
                                <Button className="w-full h-11 bg-white/5 border border-white/10 text-white">Log In</Button>
                            </Link>
                            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button className="w-full h-11 bg-primary text-black font-bold">Sign Up</Button>
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}
