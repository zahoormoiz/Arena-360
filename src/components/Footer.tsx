import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-[#111] text-gray-400 py-10 md:py-12 border-t border-white/5 relative z-20">
            <div className="container mx-auto px-6 md:max-w-7xl">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">

                    {/* Brand & Socials */}
                    <div className="col-span-2">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">
                            Arena<span className="text-primary">360</span>
                        </h2>
                        <p className="text-sm mb-5 max-w-xs leading-relaxed">
                            Lahore&apos;s premier indoor sports facility for Cricket, Futsal, and Padel.
                        </p>
                        <div className="flex gap-3">
                            <Link href="#" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            </Link>
                            <Link href="#" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                            </Link>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4">Sports</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/book" className="hover:text-primary transition-colors">Indoor Cricket</Link></li>
                            <li><Link href="/book" className="hover:text-primary transition-colors">Futsal</Link></li>
                            <li><Link href="/book" className="hover:text-primary transition-colors">Padel Tennis</Link></li>
                            <li><Link href="/book" className="hover:text-primary transition-colors">Badminton</Link></li>
                            <li><Link href="/book" className="hover:text-primary transition-colors">Volleyball</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4">Explore</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                            <li><Link href="/book" className="hover:text-primary transition-colors">Book a Slot</Link></li>
                            <li><Link href="/my-bookings" className="hover:text-primary transition-colors">My Bookings</Link></li>
                            <li><Link href="/admin" className="hover:text-primary transition-colors">Admin Portal</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Copyright — centered bottom row */}
                <div className="mt-8 md:mt-10 pt-6 border-t border-white/5 text-center">
                    <p className="text-xs text-gray-600">
                        © {new Date().getFullYear()} Arena 360. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
