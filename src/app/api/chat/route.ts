import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are Arena Assistant, a friendly and helpful AI chatbot embedded on an indoor sports arena booking website called Arena360 — Lahore's premier indoor sports facility.

Your responsibilities:
1. Booking Assistance – Guide users through booking a court or arena. Help them choose a sport, pick a time slot, understand the booking process, and complete their reservation. If real-time availability isn't accessible, direct them to the booking calendar on the website at /book.
2. FAQs – Answer questions about available sports (futsal, cricket nets, badminton, basketball, tennis, padel, volleyball, etc.), facilities (changing rooms, parking, cafeteria, equipment rental), pricing tiers, group/corporate bookings, and membership or loyalty plans.
3. Customer Support & Complaints – Handle booking modifications, cancellations, refund requests, and general feedback professionally and empathetically. Apologize for inconveniences, offer solutions, and escalate to a human agent when needed.

Key info about Arena360:
- Sports offered: Football/Futsal (7v7, 5v5), Cricket (Tape Ball, Pro Pitch), Padel (Glass Courts), Badminton, Volleyball
- Location: Lahore, Pakistan
- Booking is available 24/7 through the website
- Users can book as guests or create an account for booking history

Tone: Warm, concise, 2–4 sentences per reply. Always end with a helpful follow-up. Don't make up pricing or availability — direct users to the booking page (/book) or the pricing page (/pricing) or support team if unsure. Use emojis sparingly to keep it friendly.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback: return a helpful static response if no API key is configured
      return NextResponse.json({
        reply: getFallbackResponse(messages[messages.length - 1]?.content || ''),
      });
    }

    // Build Gemini API request
    const geminiMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const requestBody = JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 300,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    });

    // Try multiple models — each has separate free-tier quotas
    const models = [
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
    ];

    for (const model of models) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody,
            signal: controller.signal,
          }
        );

        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return NextResponse.json({ reply });
          }
        }

        // If rate-limited (429), try next model
        if (response.status === 429) {
          console.warn(`Model ${model} rate-limited, trying next...`);
          continue;
        }

        // Other errors — log and try next model
        const errorText = await response.text();
        console.error(`Gemini ${model} error (${response.status}):`, errorText);
      } catch (modelError) {
        console.error(`Gemini ${model} fetch error:`, modelError);
      }
    }

    // All models exhausted — use smart fallback
    console.warn('All Gemini models rate-limited, using fallback responses');
    return NextResponse.json({
      reply: getFallbackResponse(messages[messages.length - 1]?.content || ''),
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { reply: getFallbackResponse('') },
    );
  }
}

// ─────────────────────────────────────────────────────────
// COMPREHENSIVE RULE-BASED CHATBOT ENGINE
// Handles all arena-related questions without AI dependency
// ─────────────────────────────────────────────────────────

interface Rule {
  patterns: RegExp[];
  responses: string[];
  priority: number; // higher = matched first
}

const RULES: Rule[] = [
  // ── GREETINGS ──
  {
    priority: 100,
    patterns: [
      /^(hi|hello|hey|hola|sup|yo)\b/i,
      /^good\s?(morning|evening|afternoon|night)/i,
      /^(assalam|salam|aoa|slm)/i,
      /^(what'?s?\s*up|howdy|greetings)/i,
    ],
    responses: [
      "Hey there! 👋 Welcome to Arena360 — Lahore's premier indoor sports arena! I can help you with:\n\n🏟️ **Booking** a court\n⚽ **Sports** info\n💰 **Pricing** details\n🏢 **Facilities** info\n📞 **Support** help\n\nWhat would you like to know?",
      "Hi! 😊 Great to have you here at Arena360. Whether you want to book a game, ask about pricing, or learn about our facilities — I've got you covered. How can I help?",
      "Hello! 🏟️ Welcome to Arena360! I'm your Arena Assistant — ready to help with bookings, sports info, pricing, and more. Just ask away!",
    ],
  },

  // ── WHAT IS / ABOUT ARENA360 ──
  {
    priority: 95,
    patterns: [
      /what\s*(is|about)\s*arena\s*360/i,
      /tell\s*me\s*about\s*(arena|this|your|the)/i,
      /what\s*(do\s*you|does\s*(this|arena))\s*(do|offer)/i,
      /who\s*are\s*you/i,
      /what\s*is\s*this/i,
      /^arena\s*360$/i,
    ],
    responses: [
      "Arena360 is **Lahore's premier indoor sports facility**! 🏟️ We offer professionally maintained courts for **Football/Futsal**, **Cricket**, **Padel**, **Badminton**, and **Volleyball**. We're open 24/7 for online bookings, and our facility includes free parking, a cafeteria, changing rooms, and equipment rental. Want to know more about a specific sport or book a court?",
    ],
  },

  // ── BOOKING PROCESS (step-by-step) ──
  {
    priority: 90,
    patterns: [
      /how\s*(do\s*i|to|can\s*i)\s*book/i,
      /book(ing)?\s*(process|steps|how|guide)/i,
      /want\s*to\s*book/i,
      /make\s*a?\s*(booking|reservation)/i,
      /reserve\s*a?\s*(court|slot|field|pitch|arena)/i,
      /kaise\s*book/i,
      /booking\s*kara/i,
    ],
    responses: [
      "Booking at Arena360 is quick and easy! Here's how: 📋\n\n1️⃣ Go to the **Book a Slot** page\n2️⃣ Select your **sport** (Football, Cricket, Padel, etc.)\n3️⃣ Choose your preferred **court/arena**\n4️⃣ Pick a **date and time slot**\n5️⃣ Select your **duration**\n6️⃣ **Confirm** and you're all set!\n\nYou can book as a guest or sign in for booking history. Want to start booking now?",
    ],
  },

  // ── BOOKING GENERAL ──
  {
    priority: 85,
    patterns: [
      /book/i,
      /reserve/i,
      /slot/i,
      /appointment/i,
    ],
    responses: [
      "Ready to book? 🎯 Head to our **Book a Slot** page — select your sport, choose a date and time, and confirm! You can book as a guest or sign in to track your bookings. Bookings are available **24/7**. Would you like to know about available sports or pricing first?",
      "Booking is available **24/7** on our website! 📅 Visit the **Book a Slot** page to get started. You'll choose your sport, date, time, and duration — then confirm. It takes just a minute! Need help with anything specific?",
    ],
  },

  // ── GUEST BOOKING ──
  {
    priority: 88,
    patterns: [
      /guest/i,
      /without\s*(an?\s*)?(account|login|signing)/i,
      /no\s*(account|login)/i,
      /do\s*i\s*need\s*(an?\s*)?account/i,
      /sign\s*up\s*(required|necessary|needed)/i,
    ],
    responses: [
      "No account needed! 🎉 You can book as a **guest** — just provide your name and contact info at checkout. However, creating an account lets you track booking history and manage reservations easily. Either way, you're good to go!",
    ],
  },

  // ── FOOTBALL / FUTSAL ──
  {
    priority: 80,
    patterns: [
      /futsal/i,
      /football/i,
      /soccer/i,
      /turf/i,
      /5\s*v\s*5|5\s*a\s*side/i,
      /7\s*v\s*7|7\s*a\s*side/i,
    ],
    responses: [
      "We have two amazing football arenas! ⚽\n\n🏟️ **Arena A (Turf)** — 7v7 Standard play\n🏟️ **Arena B (Turf)** — 5v5 Futsal\n\nBoth have premium artificial turf surfaces with professional lighting. Perfect for casual games, team practice, or competitive matches! Check the **Book a Slot** page for availability, or visit **Pricing** for rates.",
      "Football/Futsal is one of our most popular sports! ⚽ We've got a **7v7 turf arena** for full games and a dedicated **5v5 futsal court** for fast-paced action. Both courts are indoor with floodlights. Want to book a session or check pricing?",
    ],
  },

  // ── CRICKET ──
  {
    priority: 80,
    patterns: [
      /cricket/i,
      /tape\s*ball/i,
      /batting|bowling/i,
      /pitch/i,
      /net(s|\s*practice)/i,
    ],
    responses: [
      "Cricket fans, we've got you covered! 🏏\n\n🏏 **Pitch 1** — Tape Ball Standard\n🏏 **Pitch 2** — Pro Pitch (for a professional experience)\n\nBoth pitches are indoor with proper lighting and boundaries. Whether it's a casual tape-ball session or serious practice, we've got the perfect setup! Book your session on the **Book a Slot** page.",
      "Arena360 has two dedicated cricket pitches! 🏏 **Pitch 1** for casual tape-ball games (great for groups!), and **Pitch 2** which is our Pro Pitch for a more professional experience. Head to the booking page to reserve your pitch!",
    ],
  },

  // ── PADEL ──
  {
    priority: 80,
    patterns: [
      /padel/i,
      /paddle\s*tennis/i,
      /glass\s*court/i,
    ],
    responses: [
      "Padel is one of our hottest sports! 🎾\n\n🎾 **Padel Court 1** — Professional Glass Court\n🎾 **Padel Court 2** — Professional Glass Court\n\nBoth are enclosed glass courts — perfect for beginners and pros alike. Padel is easy to pick up and a blast to play! Equipment rental is available if you need rackets. Ready to book?",
      "We have **two professional glass padel courts** — one of the best facilities in Lahore for this fast-growing sport! 🎾 Great for beginners and experienced players. We also offer **racket rental** if you don't have your own. Check the booking page for available slots!",
    ],
  },

  // ── BADMINTON ──
  {
    priority: 80,
    patterns: [
      /badminton/i,
      /shuttle/i,
      /racket|racquet/i,
    ],
    responses: [
      "Badminton is available at Arena360! 🏸 We have indoor courts with proper markings and nets — perfect for **singles or doubles** matches. The indoor environment means no wind interference for a true game. Equipment rental available too! Check the booking page for slots.",
    ],
  },

  // ── VOLLEYBALL ──
  {
    priority: 80,
    patterns: [
      /volleyball/i,
      /volley/i,
    ],
    responses: [
      "Volleyball courts are available at Arena360! 🏐 Our indoor setup is great for team games and practice sessions. Gather your squad and head to the **Book a Slot** page to reserve your court! Need to know about pricing?",
    ],
  },

  // ── OTHER SPORTS INQUIRY ──
  {
    priority: 75,
    patterns: [
      /basketball/i,
      /tennis(?!\s*padel)/i,
      /squash/i,
      /swimming|pool/i,
      /gym|workout|fitness/i,
      /table\s*tennis|ping\s*pong/i,
      /boxing|martial/i,
    ],
    responses: [
      "We currently specialize in **Football/Futsal, Cricket, Padel, Badminton, and Volleyball**. While we don't offer that specific sport yet, our lineup has something for everyone! 🏟️ Check the homepage for our full sports list, or contact our support team for any special requests. Can I help you with one of our available sports?",
    ],
  },

  // ── GENERAL SPORTS ──
  {
    priority: 70,
    patterns: [
      /what\s*sports/i,
      /sports?\s*(available|offer|have|list|do\s*you)/i,
      /which\s*sports/i,
      /what\s*can\s*i\s*play/i,
      /play\s*what/i,
      /kya\s*khel/i,
    ],
    responses: [
      "We offer an exciting lineup of indoor sports! ⚽🏏🎾🏸🏐\n\n⚽ **Football/Futsal** — 5v5 and 7v7 arenas\n🏏 **Cricket** — Tape Ball & Pro Pitch\n🎾 **Padel** — Professional glass courts\n🏸 **Badminton** — Indoor courts\n🏐 **Volleyball** — Indoor courts\n\nEach sport has dedicated, professionally maintained courts. Which one interests you?",
    ],
  },

  // ── TIMINGS ──
  {
    priority: 70,
    patterns: [
      /timing|timings/i,
      /open(ing)?\s*(hour|time)/i,
      /clos(e|ing)\s*(hour|time)/i,
      /what\s*time/i,
      /when\s*(are\s*you|do\s*you)\s*open/i,
      /hours?\s*of\s*operation/i,
      /kab\s*(khul|band)/i,
      /kitne\s*baje/i,
    ],
    responses: [
      "Arena360 operates **7 days a week** with flexible time slots from early morning to late night! ⏰ Available times vary by sport and day. Head to the **Book a Slot** page to see real-time availability for your preferred sport. Which sport are you interested in?",
      "We're open **every day of the week** with slots running throughout the day and evening! 🌙 Specific time slots depend on the sport — check the **Book a Slot** page for exact availability. Any particular sport in mind?",
    ],
  },

  // ── PRICING ──
  {
    priority: 70,
    patterns: [
      /price|pricing/i,
      /cost/i,
      /how\s*much/i,
      /fee|fees/i,
      /rate|rates/i,
      /charge|charges/i,
      /kitna|kitne|kitn(i)/i,
      /expensive|cheap|afford/i,
      /budget/i,
      /per\s*(hour|person|game|match|session)/i,
    ],
    responses: [
      "Our pricing varies by sport, time slot, and duration. 💰 Visit our **Pricing** page for the complete rate breakdown! Here's a quick overview:\n\n⚽ Football/Futsal — rates per hour\n🏏 Cricket — rates per session\n🎾 Padel — rates per court hour\n🏸 Badminton — rates per court hour\n\nWe also offer **group discounts** and **corporate packages**. Check the Pricing page for exact numbers!",
      "For detailed pricing on all sports, visit our **Pricing** page — it has transparent rates for every sport and time. 💰 We keep our rates competitive and also offer group and corporate deals. Would you like to know about a specific sport?",
    ],
  },

  // ── CANCELLATIONS & REFUNDS ──
  {
    priority: 70,
    patterns: [
      /cancel/i,
      /refund/i,
      /money\s*back/i,
    ],
    responses: [
      "For cancellations, head to **My Bookings** in your account to manage your reservation. 📋 Here's what you need to know:\n\n• Cancellation is available through your booking dashboard\n• Guest bookings — contact support with your booking reference\n• Refund policies depend on how far in advance you cancel\n\nFor specific refund questions, please reach out to our support team. They'll take care of you! Need anything else?",
    ],
  },

  // ── BOOKING MODIFICATIONS ──
  {
    priority: 70,
    patterns: [
      /change|modify|reschedul|update/i,
      /different\s*(time|date|slot|day)/i,
      /move\s*(my)?\s*booking/i,
    ],
    responses: [
      "Need to change your booking? No problem! 📝 If you have an account, go to **My Bookings** to reschedule or modify your reservation. For guest bookings, contact our support team with your booking reference number. We'll do our best to accommodate your new time! What else can I help with?",
    ],
  },

  // ── PAYMENT ──
  {
    priority: 70,
    patterns: [
      /pay(ment)?/i,
      /credit\s*card|debit\s*card/i,
      /cash/i,
      /jazzcash|easypaisa|bank/i,
      /online\s*pay/i,
      /stripe/i,
    ],
    responses: [
      "We offer multiple payment options for your convenience! 💳 Payment details are shown at checkout when you book. For specific payment method questions, our support team can guide you. Head to the **Book a Slot** page to see available options during checkout!",
    ],
  },

  // ── PARKING ──
  {
    priority: 75,
    patterns: [
      /park(ing)?/i,
      /car\s*(space|park)/i,
      /where\s*(to|can\s*i)\s*park/i,
      /gaari/i,
    ],
    responses: [
      "Yes! Arena360 offers **free parking** for all visitors! 🅿️ There's ample space for cars and bikes. Just drive in and park comfortably before your game. Need directions to find us?",
    ],
  },

  // ── CHANGING ROOMS / SHOWERS ──
  {
    priority: 75,
    patterns: [
      /chang(ing|e)\s*(room|cloth)/i,
      /locker/i,
      /shower/i,
      /washroom|bathroom|restroom|toilet/i,
      /fresh(en)?\s*up/i,
    ],
    responses: [
      "Yes, we have **clean changing rooms** with lockers and washroom facilities! 🚿 You can freshen up before and after your game. They're available for all players. Anything else you'd like to know about our facilities?",
    ],
  },

  // ── CAFETERIA / FOOD ──
  {
    priority: 75,
    patterns: [
      /cafe|cafeteria|canteen/i,
      /food|eat|snack|drink|beverage/i,
      /hungry|thirsty/i,
      /water|juice|chai|tea|coffee/i,
      /khana/i,
    ],
    responses: [
      "We have an on-site **cafeteria** serving snacks, beverages, and refreshments! ☕🍔 Perfect for fueling up before a game or relaxing afterwards with your team. Cold drinks, water, and light snacks are all available. Focus on your game and refuel after!",
    ],
  },

  // ── EQUIPMENT RENTAL ──
  {
    priority: 75,
    patterns: [
      /equip(ment)?/i,
      /rent(al)?/i,
      /borrow/i,
      /bring\s*(my\s*own|own)/i,
      /jersey|shoes|boots|cleats|shin\s*guard|ball|racket|racquet/i,
      /kit/i,
      /gear/i,
    ],
    responses: [
      "We offer **equipment rental** so you can play even if you come without gear! 🎾⚽ This includes balls, rackets (for padel/badminton), and other essentials. You're also welcome to **bring your own equipment** if you prefer. For specific gear availability, check at the reception when you arrive. Ready to book a slot?",
    ],
  },

  // ── FACILITIES GENERAL ──
  {
    priority: 65,
    patterns: [
      /facilit(y|ies)/i,
      /amenit(y|ies)/i,
      /what\s*(do\s*you|else)\s*(have|offer|provide)/i,
      /infrastructure/i,
    ],
    responses: [
      "Arena360 is packed with great facilities! 🏢\n\n🅿️ **Free Parking** — ample space\n🚿 **Changing Rooms** — clean with lockers\n☕ **Cafeteria** — snacks & drinks\n🎾 **Equipment Rental** — play without your own gear\n💡 **Professional Lighting** — courts lit for perfect play\n❄️ **Indoor/Climate-Controlled** — play rain or shine\n\nEverything you need for a great game! Which sport are you looking to play?",
    ],
  },

  // ── LOCATION ──
  {
    priority: 70,
    patterns: [
      /where/i,
      /location/i,
      /address/i,
      /direction/i,
      /map/i,
      /near(by)?/i,
      /kahan|kidhar/i,
      /how\s*to\s*(get|reach|find|come)/i,
    ],
    responses: [
      "Arena360 is located in **Lahore, Pakistan** 📍 — a premium indoor sports facility. Check the **Contact** section at the bottom of our homepage for the full address, Google Maps link, and directions. We have plenty of free parking when you arrive! See you there! 🏟️",
    ],
  },

  // ── MEMBERSHIP & LOYALTY ──
  {
    priority: 70,
    patterns: [
      /member(ship)?/i,
      /loyalty/i,
      /subscri(be|ption)/i,
      /monthly\s*(plan|pass|package)/i,
      /discount|deal|offer|promo/i,
    ],
    responses: [
      "We offer special deals and packages! 🤝 For membership plans, loyalty rewards, monthly packages, or promotional offers, please contact our support team — they'll set you up with the best deal for your needs. You can also check the **Pricing** page for current rates. Would you like help with anything else?",
    ],
  },

  // ── CORPORATE / GROUP / EVENTS ──
  {
    priority: 70,
    patterns: [
      /corporate/i,
      /company|office/i,
      /team\s*(building|event|outing)/i,
      /group\s*(booking|event|rate|discount)/i,
      /party|celebration|birthday/i,
      /event|tournament|competition/i,
      /bulk/i,
    ],
    responses: [
      "We love hosting groups and events! 🎉 Arena360 is perfect for:\n\n🏢 **Corporate team-building** activities\n🎂 **Birthday parties** & celebrations\n🏆 **Tournaments** & competitions\n👥 **Group bookings** with special rates\n\nFor group/corporate inquiries, please contact our support team for customized packages and pricing. How many people are you expecting?",
    ],
  },

  // ── CONTACT / SUPPORT ──
  {
    priority: 65,
    patterns: [
      /contact/i,
      /support/i,
      /phone|call/i,
      /email/i,
      /whatsapp/i,
      /reach|talk/i,
      /human|agent|person|staff/i,
      /complain|complaint|issue|problem/i,
      /feedback|suggestion/i,
      /rabta/i,
    ],
    responses: [
      "You can reach us through several channels! 📞\n\n📱 **WhatsApp** — tap the WhatsApp button on our homepage\n📧 **Email** — check the Contact section on our site\n📍 **Visit** — come to our facility in Lahore\n\nOur support team is happy to help with bookings, complaints, feedback, or any questions. Is there something specific I can help with first?",
    ],
  },

  // ── SAFETY / COVID / RULES ──
  {
    priority: 65,
    patterns: [
      /safe(ty)?/i,
      /covid|corona|hygiene|sanitiz/i,
      /rule|regulation|guideline/i,
      /policy|policies/i,
      /first\s*aid/i,
      /injur(y|ied)/i,
      /insurance/i,
    ],
    responses: [
      "Your safety is our top priority! 🛡️ Arena360 maintains clean, well-maintained courts and follows all health guidelines. We regularly sanitize our facilities and keep first-aid supplies on hand. For specific rules or safety policies, please check with our staff at the venue or contact support. Play safe and have fun!",
    ],
  },

  // ── KIDS / CHILDREN / AGE ──
  {
    priority: 65,
    patterns: [
      /kid|child|children|bachch/i,
      /age\s*(limit|restrict|require)/i,
      /family|families/i,
      /minor/i,
      /how\s*old/i,
    ],
    responses: [
      "Arena360 is family-friendly! 👨‍👩‍👧‍👦 Kids and children are welcome to play at our facility. For younger children, we recommend adult supervision during games. There's no strict age limit — everyone's welcome to enjoy our sports! Contact support for any specific questions about kids' sessions or family packages.",
    ],
  },

  // ── WEATHER / INDOOR ──
  {
    priority: 65,
    patterns: [
      /weather|rain|hot|cold|heat|winter|summer/i,
      /indoor|outdoor|roof|covered/i,
      /ac|air\s*condition/i,
      /climate/i,
    ],
    responses: [
      "The best part? Arena360 is **fully indoor**! 🏠 Rain or shine, summer heat or winter cold — our courts are climate-controlled so you can play comfortably year-round. No more cancellations due to weather! Ready to book your next game?",
    ],
  },

  // ── QUALITY / COURT CONDITION ──
  {
    priority: 60,
    patterns: [
      /quality|condition|maintain|standard/i,
      /turf|surface|floor|ground/i,
      /professional|pro\s*level/i,
      /how\s*(big|large|good|nice)/i,
      /size|dimension/i,
    ],
    responses: [
      "All our courts are **professionally maintained** to high standards! ✨ We use premium turf for football, professional glass enclosures for padel, and proper indoor court surfaces for badminton and volleyball. Our courts meet competitive-level standards. Come experience the quality yourself!",
    ],
  },

  // ── REVIEWS / RATINGS ──
  {
    priority: 60,
    patterns: [
      /review|rating|recommend|popular|best/i,
      /experience|feedback/i,
      /worth|good/i,
    ],
    responses: [
      "Arena360 is one of Lahore's most loved indoor sports venues! ⭐ Our players love the premium court quality, convenient location, and great facilities. Check out the testimonials on our homepage to see what others say! The best review is experiencing it yourself — want to book a session?",
    ],
  },

  // ── YES / AFFIRMATIVE ──
  {
    priority: 50,
    patterns: [
      /^(yes|yeah|yep|yup|sure|ok|okay|alright|haan|ji|absolutely|definitely)$/i,
      /^(yes|yeah|sure)\s*(please|pls)?$/i,
      /let'?s?\s*(do it|go|book)/i,
    ],
    responses: [
      "Great! 🎯 Here are some things I can help you with:\n\n📅 **Book a court** — visit our Book a Slot page\n💰 **Check pricing** — visit our Pricing page\n⚽ **Sports available** — Football, Cricket, Padel, Badminton, Volleyball\n📞 **Contact support** — use WhatsApp on our homepage\n\nWhat would you like to do?",
    ],
  },

  // ── NO / NEGATIVE ──
  {
    priority: 50,
    patterns: [
      /^(no|nah|nope|not?\s*really)$/i,
      /nothing|all\s*good|that'?s?\s*(it|all)|i'?m?\s*(good|fine|ok)/i,
    ],
    responses: [
      "No worries! 😊 If you ever need help with bookings, sports info, or anything else — I'm just a message away. Enjoy your visit to Arena360! 🏟️",
      "All good! Feel free to come back anytime you need help. Have a great day! 👋",
    ],
  },

  // ── THANKS ──
  {
    priority: 55,
    patterns: [
      /thank|thanks|thx|shukriya|shukria/i,
      /appreciate/i,
      /helpful/i,
    ],
    responses: [
      "You're very welcome! 😊 Happy to help. If you need anything else — booking help, sport info, or support — just ask anytime. Enjoy your game at Arena360! 🏟️",
      "Glad I could help! 🙌 Don't hesitate to come back if you have more questions. See you at Arena360!",
      "My pleasure! 😊 That's what I'm here for. Have a fantastic time playing!",
    ],
  },

  // ── BYE ──
  {
    priority: 55,
    patterns: [
      /bye|goodbye|see\s*you|later|cya|khuda\s*hafiz|allah\s*hafiz/i,
      /gotta\s*go|have\s*to\s*go/i,
    ],
    responses: [
      "See you at Arena360! 👋 Have a wonderful day, and don't forget to book your next game! 🏟️",
      "Take care! 👋 We hope to see you on the court soon. Happy playing! ⚽🏏🎾",
    ],
  },

  // ── FUNNY / RANDOM ──
  {
    priority: 40,
    patterns: [
      /joke|funny|haha|lol|😂|🤣/i,
      /bored/i,
    ],
    responses: [
      "Here's a sporty one for you: Why did the football player bring string to the game? So he could tie the score! 😄⚽ Now how about I help you book a real game at Arena360?",
      "The best cure for boredom? A game at Arena360! ⚽🏏🎾 Which sport sounds fun to you right now?",
    ],
  },

  // ── EMOJI-ONLY MESSAGES ──
  {
    priority: 45,
    patterns: [
      /^[\p{Emoji}\s]+$/u,
      /^[👋🏟️⚽🏏🎾🏸🏐💪👍❤️🔥✅]+$/,
    ],
    responses: [
      "Love the energy! 🔥 I'm here to help with anything Arena360-related. Want to book a court, check sports, or ask about pricing? Just type your question!",
    ],
  },

  // ── AVAILABILITY CHECK ──
  {
    priority: 70,
    patterns: [
      /availab(le|ility)/i,
      /free\s*(slot|court|time)/i,
      /any\s*(slot|court|opening)/i,
      /(today|tomorrow|tonight|weekend|friday|saturday|sunday|monday|tuesday|wednesday|thursday)/i,
    ],
    responses: [
      "For real-time availability, head to our **Book a Slot** page! 📅 Select your sport and date to see all available time slots instantly. Our availability updates live, so what you see is what's open. Want me to help with anything else?",
      "Availability changes throughout the day, so the best way to check is on our **Book a Slot** page! 📅 Just pick your sport and preferred date, and you'll see all open slots. Shall I help with something else?",
    ],
  },

  // ── DURATION ──
  {
    priority: 65,
    patterns: [
      /duration/i,
      /how\s*long/i,
      /hours?\s*(can\s*i|do\s*i|per)/i,
      /minimum|maximum/i,
    ],
    responses: [
      "Session durations are flexible! ⏱️ You can choose your preferred duration when booking — whether it's a quick 1-hour session or a longer game. The options are shown on the **Book a Slot** page when you select your sport and time. Any other questions?",
    ],
  },

  // ── SPECTATORS / WATCHING ──
  {
    priority: 60,
    patterns: [
      /watch|spectator|audience|viewer/i,
      /can\s*(i|we)\s*come\s*(and\s*)?watch/i,
      /cheer/i,
    ],
    responses: [
      "Spectators are welcome at Arena360! 👀🎉 Bring your friends and family to cheer you on. We have seating areas near the courts. No extra charge for spectators! Want to book a game for your team?",
    ],
  },

  // ── PHOTOGRAPHY / RECORDING ──
  {
    priority: 55,
    patterns: [
      /photo|video|record|camera|picture|selfie/i,
      /instagram|social\s*media|content/i,
    ],
    responses: [
      "You're welcome to take photos and videos of your games at Arena360! 📸 Our courts make a great backdrop. Tag us on social media — we love seeing our players in action! 🏟️ Feel free to share your Arena360 experience!",
    ],
  },

  // ── WIFI ──
  {
    priority: 55,
    patterns: [
      /wifi|wi-fi|internet|hotspot/i,
    ],
    responses: [
      "For WiFi availability, please check with our staff at the venue! 📶 They'll be happy to help you get connected. Anything else I can help with?",
    ],
  },

  // ── COACHING / TRAINING ──
  {
    priority: 60,
    patterns: [
      /coach|coaching|training|trainer|lesson|learn|beginner|teach/i,
      /class(es)?/i,
      /improve|practice/i,
    ],
    responses: [
      "For coaching and training sessions, we recommend contacting our support team to ask about available coaches and lesson packages! 🏋️ Our courts are also perfect for self-practice if you want to sharpen your skills. Whether you're a beginner or advanced player, Arena360 has the space for you. Need anything else?",
    ],
  },
];

// Pre-sort rules once at module init (not per-request)
const SORTED_RULES = [...RULES].sort((a, b) => b.priority - a.priority);

// ── MAIN FALLBACK FUNCTION ──
function getFallbackResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase().trim();

  if (!msg || msg.length < 2) {
    return "I'm your Arena360 Assistant! 😊 I can help you with **booking courts**, **sports info**, **pricing**, **facilities**, and **support**. Just type your question and I'll do my best to help!";
  }

  // Use pre-sorted rules
  for (const rule of SORTED_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(msg)) {
        return pick(rule.responses);
      }
    }
  }

  // ── INTELLIGENT CATCH-ALL ──
  // If nothing matched, give a helpful response that acknowledges the question
  // and guides the user to relevant topics
  return pick([
    `I appreciate your question! While I might not have the exact answer for "${userMessage.slice(0, 40)}${userMessage.length > 40 ? '...' : ''}", I can definitely help with:\n\n📅 **Booking** — how to reserve a court\n⚽ **Sports** — Football, Cricket, Padel, Badminton, Volleyball\n💰 **Pricing** — rates and packages\n🏢 **Facilities** — parking, cafeteria, equipment\n📞 **Support** — contact our team\n\nJust pick a topic or ask your question differently!`,
    "That's a great question! 🤔 For the most accurate answer, I'd suggest contacting our support team via **WhatsApp** (button on our homepage). In the meantime, I can help with **bookings**, **sports info**, **pricing**, or **facilities** — what interests you?",
    "I want to make sure you get the right info! 😊 For that specific question, our support team can help best. Meanwhile, feel free to ask me about **booking a court**, **available sports**, **pricing**, **facilities**, or **timings** — I've got all those covered!",
  ]);
}

// Helper: pick a random response from an array
function pick(responses: string[]): string {
  return responses[Math.floor(Math.random() * responses.length)];
}
