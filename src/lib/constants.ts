export const ARENAS: Record<string, Array<{ id: string; name: string; type: string; image: string }>> = {
    "Football": [
        { id: "f-turf-a", name: "Arena A (Turf)", type: "7v7 Standard", image: "/gallery-futsal.png" },
        { id: "f-turf-b", name: "Arena B (Turf)", type: "5v5 Futsal", image: "/gallery-lounge.png" },
    ],
    "Cricket": [
        { id: "c-pitch-1", name: "Pitch 1", type: "Tape Ball Standard", image: "/gallery-cricket.png" },
        { id: "c-pitch-2", name: "Pitch 2", type: "Pro Pitch", image: "/gallery-cricket.png" },
    ],
    "Padel": [
        { id: "p-court-1", name: "Padel Court 1", type: "Glass Court", image: "/gallery-padel.png" },
        { id: "p-court-2", name: "Padel Court 2", type: "Glass Court", image: "/gallery-padel.png" },
    ],
    "default": [
        { id: "main-court", name: "Main Court", type: "Standard Court", image: "/hero-ball.png" }
    ]
};
