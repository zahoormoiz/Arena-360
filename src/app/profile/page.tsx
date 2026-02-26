'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { User, LogOut, Ticket, MessageCircle, ChevronRight, Mail, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function ProfilePage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <div className="min-h-screen bg-black" />;
    }

    return (
        <div className="min-h-screen bg-black pt-24 pb-32 px-6 safe-area-bottom">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-xl mx-auto space-y-8"
            >
                {/* Header Section */}
                <div className="text-center space-y-2">
                    <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto flex items-center justify-center border-2 border-primary/20 mb-4 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                        <User className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        Welcome back, <span className="text-primary">{user.name.split(' ')[0]}</span>!
                    </h1>
                    <p className="text-gray-400 text-sm">Member since 2024</p>
                </div>

                {/* User Info Card */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-5 space-y-4">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Account Details</h2>

                    <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-gray-400">
                            <Mail size={18} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">Email Address</p>
                            <p className="text-white font-medium truncate">{user.email}</p>
                        </div>
                    </div>

                    {user.phone && (
                        <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-gray-400">
                                <Phone size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500">Phone Number</p>
                                <p className="text-white font-medium">{user.phone}</p>
                            </div>
                        </div>
                    )}

                    {/* Role Badge (if admin) */}
                    {user.role === 'admin' && (
                        <div className="flex items-center gap-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                                <ShieldCheck size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-amber-500/80">Account Type</p>
                                <p className="text-amber-500 font-bold">Administrator</p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push('/admin')}
                                className="h-8 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                            >
                                Dashboard
                            </Button>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Quick Actions</h2>

                    <button
                        onClick={() => router.push('/my-bookings')}
                        className="w-full flex items-center justify-between p-4 bg-[#111] border border-white/10 rounded-2xl hover:bg-white/5 hover:border-white/20 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Ticket size={20} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-white">My Bookings</h3>
                                <p className="text-xs text-gray-400">View upcoming & past sessions</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
                    </button>

                    <button
                        onClick={() => window.open('https://wa.me/923235192477?text=Hi%20Arena360%20Help', '_blank')}
                        className="w-full flex items-center justify-between p-4 bg-[#111] border border-white/10 rounded-2xl hover:bg-white/5 hover:border-white/20 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] group-hover:scale-110 transition-transform">
                                <MessageCircle size={20} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-white">Help & Support</h3>
                                <p className="text-xs text-gray-400">Contact us via WhatsApp</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Logout Button */}
                <Button
                    variant="outline"
                    fullWidth
                    size="lg"
                    onClick={logout}
                    className="mt-8 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400 h-14 rounded-2xl"
                >
                    <LogOut className="mr-2 w-5 h-5" />
                    Log Out
                </Button>

                <p className="text-center text-xs text-gray-700 pt-8">
                    Arena360 v1.0.0
                </p>
            </motion.div>
        </div>
    );
}
