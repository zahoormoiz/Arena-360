import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
    message: string;
    type: ToastType;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type, isVisible, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-24 right-4 z-50 animate-fade-in-down">
            <div
                className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border min-w-[300px]",
                    type === 'success'
                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                )}
            >
                {type === 'success' ? (
                    <CheckCircle className="w-5 h-5 shrink-0" />
                ) : (
                    <XCircle className="w-5 h-5 shrink-0" />
                )}

                <p className="flex-1 text-sm font-medium">{message}</p>

                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
