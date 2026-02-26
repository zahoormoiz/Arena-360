import { isWeekend } from 'date-fns';
import dbConnect from './db';
import { Sport, PricingRule } from '@/models';
import { escapeRegex } from '@/lib/utils';

export const getSportPrice = async (sportNameOrId: string, dateStr: string): Promise<number> => {
    // Ensure DB connection
    await dbConnect();

    const date = new Date(dateStr);
    const isWknd = isWeekend(date);

    // Try to find by ID first, then Name
    let sport;
    if (sportNameOrId.match(/^[0-9a-fA-F]{24}$/)) {
        sport = await Sport.findById(sportNameOrId);
    } else {
        sport = await Sport.findOne({ name: { $regex: new RegExp(escapeRegex(sportNameOrId), 'i') } });
    }

    if (sport) {
        let finalPrice = sport.basePrice;

        // Check for active rules
        if (isWknd) {
            const weekendRule = await PricingRule.findOne({
                sportId: sport._id,
                type: 'weekend',
                isActive: true
            });

            if (weekendRule) {
                if (weekendRule.overridePrice) {
                    finalPrice = weekendRule.overridePrice;
                } else {
                    finalPrice = finalPrice * weekendRule.priceMultiplier;
                }
            }
        }

        return finalPrice;
    }

    // Fallback for legacy calls (should not happen with DB seeded)
    const name = sportNameOrId.toLowerCase();
    if (name.includes('cricket') || name.includes('football') || name.includes('futsal')) {
        return isWknd ? 3500 : 2700;
    }
    if (name.includes('padel')) {
        return isWknd ? 5000 : 3500;
    }

    return 2000;
};
