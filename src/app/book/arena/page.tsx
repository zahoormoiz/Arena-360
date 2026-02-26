import dbConnect from '@/lib/db';
import { Sport } from '@/models';
import { ARENAS } from '@/lib/constants';
import ArenaSelector from '@/components/ArenaSelector';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Select Arena - Arena360',
    description: 'Choose your court or arena.',
};

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ArenaSelectionPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams;
    const sportName = resolvedParams?.sport as string;

    if (!sportName) {
        redirect('/book');
    }

    await dbConnect();
    // Case insensitive search for better UX
    const sport = await Sport.findOne({ name: { $regex: new RegExp(`^${sportName}$`, 'i') } });

    if (!sport) {
        return (
            <div className="min-h-screen pt-32 px-6 text-center">
                <h1 className="text-2xl font-bold text-red-500">Sport Not Found</h1>
                <p className="text-gray-400 mt-2">The sport "{sportName}" appears to be unavailable.</p>
            </div>
        );
    }

    // Get mock arenas
    const arenas = ARENAS[sport.name] || ARENAS['default'];

    // Serialize sport object (remove mongoose methods)
    const sportPlain = JSON.parse(JSON.stringify(sport));

    return (
        <div className="min-h-screen pt-24 pb-12 px-6">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 uppercase tracking-widest font-bold">
                        <span>Booking</span>
                        <span>/</span>
                        <span className="text-primary">{sport.name}</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">Select Arena</h1>
                    <p className="text-gray-400">Choose your preferred court or pitch.</p>
                </header>

                <ArenaSelector sport={sportPlain} arenas={arenas} />
            </div>
        </div>
    );
}
