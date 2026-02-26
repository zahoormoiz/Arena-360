export default function BackgroundPattern() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='160' height='160' viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2322c55e' stroke-width='1.2' stroke-opacity='0.15' stroke-linecap='round' stroke-linejoin='round'%3E%3C!-- Football --%3E%3Ccircle cx='30' cy='30' r='10' /%3E%3Cpath d='M30 22 l4 3 l-1.5 6 h-5 l-1.5 -6 z' /%3E%3C!-- Cricket --%3E%3Cpath d='M120 110 l12 -12 l-5 -5 l-12 12 l-8 20 l5 5 z M105 130 l-4 4' /%3E%3Ccircle cx='135' cy='125' r='3.5' /%3E%3C!-- Badminton --%3E%3Cellipse cx='110' cy='40' rx='9' ry='12' transform='rotate(-45 110 40)' /%3E%3Cline x1='103' y1='47' x2='96' y2='54' /%3E%3C!-- Shuttlecock --%3E%3Cpath d='M40 120 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M36 120 l-4 -12 M44 120 l4 -12' /%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '160px 160px',
                }}
            />
            {/* Darken the bottom slightly to fade out ensuring text readability at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
        </div>
    );
}
