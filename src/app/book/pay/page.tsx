import PaymentOptions from '@/components/PaymentOptions';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Payment - Arena360',
    description: 'Complete your payment.',
};

export default function PaymentPage() {
    return (
        <div className="min-h-screen pt-20 sm:pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                <header className="mb-6 sm:mb-10">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 uppercase tracking-widest font-bold">
                        <span>Booking</span>
                        <span>/</span>
                        <span>Time</span>
                        <span>/</span>
                        <span>Details</span>
                        <span>/</span>
                        <span className="text-primary">Payment</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2">Checkout</h1>
                    <p className="text-sm sm:text-base text-gray-400">Secure payment via your preferred method.</p>
                </header>

                <PaymentOptions />
            </div>
        </div>
    );
}
