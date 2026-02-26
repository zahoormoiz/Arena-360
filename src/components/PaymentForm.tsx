import React, { useState } from 'react';
import { CreditCard, Lock, Calendar, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import Toast from './ui/Toast';

interface PaymentFormProps {
    amount: number;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function PaymentForm({ amount, onSuccess, onCancel }: PaymentFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        cardNumber: '',
        expiry: '',
        cvc: '',
        name: ''
    });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'cardNumber') {
            // Only allow numbers and spaces
            const clean = value.replace(/[^0-9 ]/g, '');
            setFormData(prev => ({ ...prev, [name]: clean }));
        } else if (name === 'expiry') {
            const clean = value.replace(/[^0-9/]/g, '');
            setFormData(prev => ({ ...prev, [name]: clean }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Basic Validation
        if (formData.cardNumber.replace(/\s/g, '').length < 16) {
            setError('Invalid card number');
            setLoading(false);
            return;
        }
        if (formData.cvc.length < 3) {
            setError('Invalid CVC');
            setLoading(false);
            return;
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Success simulation
        setLoading(false);
        onSuccess();
    };

    return (
        <div className="w-full max-w-md mx-auto animate-fade-in-up">
            <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                Payment
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">
                                Secure transaction
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-accent" />
                        </div>
                    </div>

                    <div className="mb-8 p-4 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 flex flex-col items-center justify-center text-center">
                        <span className="text-sm text-gray-400 mb-1">Total to Pay</span>
                        <span className="text-3xl font-bold text-white">Rs {amount}</span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-accent transition-colors" />
                                <input
                                    type="text"
                                    name="cardNumber"
                                    value={formData.cardNumber}
                                    onChange={handleChange}
                                    maxLength={19}
                                    placeholder="Card Number"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-mono"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-accent transition-colors" />
                                    <input
                                        type="text"
                                        name="expiry"
                                        value={formData.expiry}
                                        onChange={handleChange}
                                        maxLength={5}
                                        placeholder="MM/YY"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-mono"
                                        required
                                    />
                                </div>
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-accent transition-colors" />
                                    <input
                                        type="password"
                                        name="cvc"
                                        value={formData.cvc}
                                        onChange={handleChange}
                                        maxLength={3}
                                        placeholder="CVC"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="relative group">
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Cardholder Name"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 py-4 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                disabled={loading}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Pay Now'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Payments heavily encrypted and secured</span>
                    </div>
                </div>
            </div>

            <Toast
                isVisible={!!error}
                message={error || ''}
                type="error"
                onClose={() => setError(null)}
            />
        </div>
    );
}
