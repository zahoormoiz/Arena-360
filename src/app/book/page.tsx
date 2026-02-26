import dbConnect from '@/lib/db';
import { Sport, PricingRule } from '@/models';
import SportCard from '@/components/SportCard';

export const metadata = {
    title: 'Select Sport - Arena360',
    description: 'Choose your sport to book a slot.',
};

export const dynamic = 'force-dynamic';

export default async function SportsSelectionPage() {
    await dbConnect();

    // Fetch sports and rules in parallel
    const [sports, weekendRules] = await Promise.all([
        Sport.find({ isActive: true }).sort({ sortOrder: 1 }),
        PricingRule.find({ type: 'weekend', isActive: true })
    ]);
    const ruleMap = new Map();
    weekendRules.forEach(r => {
        ruleMap.set(r.sportId.toString(), r);
    });

    return (
        <div className="min-h-screen pt-20 sm:pt-32 pb-20 px-3 sm:px-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-20 pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-8 sm:mb-16 text-center animate-fade-up">
                    <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4 sm:mb-6">
                        Start Your Journey
                    </span>
                    <h1 className="text-2xl sm:text-5xl md:text-7xl font-heading font-bold text-white mb-3 sm:mb-6 uppercase tracking-tighter leading-[0.9]">
                        Select Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Sport</span>
                    </h1>
                    <p className="text-sm sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Premium facilities designed for peak performance. Choose your arena below.
                    </p>
                </header>

                <div className="relative">
                    {/* Ambient Lines for Bottom Row */}
                    <div className="hidden md:block absolute bottom-[250px] left-0 w-[15%] h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent blur-[1px] rounded-full" />
                    <div className="hidden md:block absolute bottom-[250px] right-0 w-[15%] h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent blur-[1px] rounded-full" />

                    <div className="flex flex-wrap justify-center gap-8">
                        {sports.map((sport: any) => {
                            const rule = ruleMap.get(sport._id.toString());
                            let weekendPrice = undefined;

                            if (rule) {
                                if (rule.overridePrice) weekendPrice = rule.overridePrice;
                                else weekendPrice = sport.basePrice * rule.priceMultiplier;
                            }

                            return (
                                <div key={sport._id} className="w-full md:w-[calc(33.33%-1.4rem)]">
                                    <SportCard
                                        name={sport.name}
                                        image={sport.image}
                                        price={sport.basePrice}
                                        weekendPrice={weekendPrice}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
