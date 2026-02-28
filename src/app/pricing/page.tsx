import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata = {
    title: "Pricing | Arena360",
    description: "View our competitive pricing for sports facilities in Lahore.",
};

export default function PricingPage() {
    return (
        <main className="min-h-screen pt-28 pb-16">
            <div className="max-w-5xl mx-auto px-6">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                        Our <span className="text-primary">Pricing</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Check out our latest rates for Indoor Cricket, Futsal, and Padel Tennis. Book your slot today and experience the best sports facility in Lahore.
                    </p>
                </div>

                <div className="mt-8 flex justify-center">
                    <div className="w-full max-w-3xl rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(34,197,94,0.1)]">
                        <img
                            src="/price_llist.jpg"
                            alt="Arena 360 Pricing List"
                            className="w-full h-auto object-contain bg-white"
                        />
                    </div>
                </div>

                {/* Important Information Section */}
                <div className="mt-16 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="bg-[#111] border border-white/5 rounded-2xl p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Booking Policy</h3>
                        </div>
                        <ul className="space-y-3 text-gray-400 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>A minimum <strong className="text-white">20% advance payment</strong> is required to confirm online bookings.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>The remaining balance must be paid directly at the venue before your session begins.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>Bookings are non-refundable within 24 hours of the reserved slot.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>Please arrive at least 10 minutes prior to your booked time.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-[#111] border border-white/5 rounded-2xl p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Facility & Gear</h3>
                        </div>
                        <ul className="space-y-3 text-gray-400 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>Padel rackets and balls are available for rent at the front desk.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>Cricket bats and balls are provided complimentary with the indoor pitch.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>Futsal bibs and standard match balls are provided upon request.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>Clean, non-marking indoor sports shoes are mandatory on all playing surfaces.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <Link href="/book">
                        <Button className="h-14 px-8 text-lg font-bold bg-primary text-black hover:bg-white transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_40px_rgba(34,197,94,0.5)]">
                            Book Your Slot Now
                        </Button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
