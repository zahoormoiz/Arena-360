import SlotSelector from '@/components/SlotSelector';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Select Time - Arena360',
    description: 'Choose a time slot for your game.',
};

export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/db';
import { Sport } from '@/models';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SlotPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams;
    const sportName = resolvedParams?.sport as string;

    await dbConnect();
    let initialSport = null;

    if (sportName) {
        // Try to find by name (case insensitive) or ID
        if (sportName.match(/^[0-9a-fA-F]{24}$/)) {
            initialSport = await Sport.findById(sportName);
        } else {
            initialSport = await Sport.findOne({ name: { $regex: new RegExp(`^${sportName}$`, 'i') } });
        }
    }

    // Serialize
    if (initialSport) {
        initialSport = JSON.parse(JSON.stringify(initialSport));
    }

    return (
        <div className="min-h-screen pt-20 sm:pt-28 pb-20 px-3 sm:px-6 relative">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none opacity-40" />

            <div className="max-w-4xl mx-auto relative z-10">
                <header className="mb-6 sm:mb-12 animate-fade-up">
                    {/* Modern Breadcrumb */}
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-gray-500 mb-4 sm:mb-6 uppercase tracking-widest">
                        <span className="hover:text-white transition-colors cursor-pointer">Booking</span>
                        <span className="opacity-30">/</span>
                        <span className="text-primary font-bold bg-primary/10 px-1.5 sm:px-2 py-0.5 rounded-md border border-primary/20 text-[10px] sm:text-sm">Time Selection</span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl md:text-6xl font-heading font-bold text-white mb-2 sm:mb-4 tracking-tight">
                        Pick a <span className="text-primary">Date & Time</span>
                    </h1>
                    <p className="text-sm sm:text-lg text-gray-400">Select an available slot to proceed to booking.</p>
                </header>

                <SlotSelector initialSport={initialSport} />
            </div>
        </div>
    );
}
