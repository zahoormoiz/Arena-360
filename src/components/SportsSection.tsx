import SportCard from '@/components/SportCard';
import dbConnect from '@/lib/db';
import { Sport, PricingRule } from '@/models';

// Server Component (Async) with native Next.js caching
// Data is cached via ISR at the page level
export default async function SportsSection() {
    await dbConnect();
    const sports = await Sport.find({ isActive: true }).sort({ sortOrder: 1 }).lean();

    // Fetch all active weekend rules to map them
    const weekendRules = await PricingRule.find({ type: 'weekend', isActive: true }).lean();
    const ruleMap = new Map<string, any>();
    weekendRules.forEach((r: any) => {
        ruleMap.set(r.sportId.toString(), r);
    });

    // Pre-compute sports data
    const sportsData = sports.map((sport: any) => {
        const rule = ruleMap.get(sport._id.toString());
        let weekendPrice = undefined;

        if (rule) {
            weekendPrice = rule.overridePrice || sport.basePrice * rule.priceMultiplier;
        }

        return {
            id: sport._id.toString(),
            name: sport.name,
            image: sport.image,
            price: sport.basePrice,
            weekendPrice,
        };
    });

    return (
        <section className="relative py-12 md:py-32 w-full max-w-[1440px] mx-auto md:px-12 lg:px-24">
            {/* Subtle Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Section Header */}
            <div className="relative px-6 mb-12 md:mb-20 flex flex-col items-center text-center">
                <span className="text-primary font-bold tracking-widest text-xs uppercase mb-4">Our Facilities</span>
                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
                    Elite Sports Experience
                </h2>
                <p className="text-gray-400 max-w-xl text-base md:text-lg leading-relaxed">
                    From tournament-grade turf to professional lighting, we provide the ultimate environment for every game.
                </p>
            </div>

            {/* Cards Container */}
            <div className="relative">
                {/* Ambient Lines for Bottom Row (Desktop Only) - Manually positioned based on 3-2 layout */}
                <div className="hidden md:block absolute bottom-[220px] left-0 w-[15%] h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent blur-[1px] rounded-full" />
                <div className="hidden md:block absolute bottom-[220px] right-0 w-[15%] h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent blur-[1px] rounded-full" />

                <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 px-6 pb-12 md:flex-wrap md:justify-center md:gap-8 md:px-6 md:pb-0">
                    {sportsData.map((sport) => (
                        <div key={sport.id} className="relative snap-center shrink-0 w-[85vw] md:w-[calc(33.33%-1.4rem)]">
                            <SportCard
                                name={sport.name}
                                image={sport.image}
                                price={sport.price}
                                weekendPrice={sport.weekendPrice}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
