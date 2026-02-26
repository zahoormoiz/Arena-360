'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
    showToast: () => { },
});

export const useToast = () => useContext(ToastContext);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = ++nextId;
        setToasts((prev) => [...prev, { id, type, message }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    }, []);

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const icons: Record<ToastType, ReactNode> = {
        success: <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />,
        error: <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />,
    };

    const borderColors: Record<ToastType, string> = {
        success: 'border-green-500/30',
        error: 'border-red-500/30',
        warning: 'border-yellow-500/30',
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast container — fixed bottom-right */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-xl 
                            bg-[#111] border ${borderColors[toast.type]}
                            shadow-2xl shadow-black/50 backdrop-blur-xl
                            animate-[slideIn_0.3s_ease-out]
                            max-w-sm`}
                    >
                        {icons[toast.type]}
                        <span className="text-sm text-white font-medium flex-1">{toast.message}</span>
                        <button
                            onClick={() => dismiss(toast.id)}
                            className="text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <style jsx global>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
}
