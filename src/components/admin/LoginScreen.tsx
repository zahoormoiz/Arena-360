'use client';

import { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LoginScreenProps {
    onLogin: (e: React.FormEvent, email: string, password: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white text-center mb-2">Admin Access</h1>
                <p className="text-gray-400 text-center mb-8">Please enter your credentials to continue</p>

                <form onSubmit={(e) => onLogin(e, email, password)} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Admin Email"
                            className="w-full pl-11 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-primary transition-all text-sm"
                            autoFocus
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full pl-11 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-primary transition-all text-sm tracking-widest"
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full h-12 bg-primary text-black font-bold text-lg hover:bg-white hover:scale-[1.02] transition-all"
                    >
                        Unlock Dashboard
                    </Button>
                </form>
            </div>
        </div>
    );
}
