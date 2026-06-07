import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

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

    const iconByType = {
        success: <CheckCircle className="w-5 h-5 shrink-0" />,
        error: <XCircle className="w-5 h-5 shrink-0" />,
        warning: <AlertTriangle className="w-5 h-5 shrink-0" />,
        info: <Info className="w-5 h-5 shrink-0" />,
    };

    return (
        <div className="fixed top-24 right-4 z-[10000] animate-fade-in-down">
            <div
                className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border min-w-[300px]",
                    type === 'success'
                        ? "bg-green-500/10 border-green-500/20 text-green-300"
                        : type === 'warning'
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-200"
                            : type === 'info'
                                ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-200"
                                : "bg-red-500/10 border-red-500/20 text-red-300"
                )}
            >
                {iconByType[type]}

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
