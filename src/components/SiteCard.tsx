'use client';

import { ExternalLink } from 'lucide-react';
import { Site } from '@prisma/client';
import { useRef, MouseEvent, useState } from 'react';

export default function SiteCard({ site }: { site: Site }) {
    const cardRef = useRef<HTMLAnchorElement>(null);
    const [glarePosition, setGlarePosition] = useState({ x: 0, y: 0, opacity: 0 });

    const iconUrl = site.icon || `https://www.google.com/s2/favicons?domain=${site.url}&sz=64`;

    // 3D Tilt Effect Logic
    const handleMouseMove = (e: MouseEvent<HTMLAnchorElement>) => {
        if (!cardRef.current) return;

        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Lift-up effect: the area under the mouse comes forward
        const rotateX = ((y - centerY) / centerY) * 15;
        const rotateY = ((x - centerX) / centerX) * -15;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;

        // Update Glare Position
        setGlarePosition({
            x: (x / rect.width) * 100,
            y: (y / rect.height) * 100,
            opacity: 1
        });
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        cardRef.current.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        setGlarePosition(prev => ({ ...prev, opacity: 0 }));
    };

    const handleClick = async () => {
        try {
            await fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: site.id }),
            });
        } catch (error) {
            console.error('Failed to track visit:', error);
        }
    };

    return (
        <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            ref={cardRef}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            className="card-glow group relative flex items-center gap-3 p-4 rounded-xl transition-all duration-150 ease-out"
            style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-sm)',
                transformStyle: 'preserve-3d',
                willChange: 'transform, box-shadow'
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hover)';
            }}
            onMouseLeave={(e) => {
                handleMouseLeave();
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
            }}
        >
            {/* Dynamic Glare Overlay */}
            <div
                className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
                style={{
                    background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 50%)`,
                    opacity: glarePosition.opacity * 0.3,
                    mixBlendMode: 'overlay',
                    zIndex: 20
                }}
            />

            {/* Icon Area */}
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300"
                style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    transform: 'translateZ(15px)'
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={iconUrl}
                    alt={site.title}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.opacity = '0.5';
                    }}
                />
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0" style={{ transform: 'translateZ(8px)' }}>
                <div className="flex items-center gap-1.5">
                    <h3
                        className="font-semibold text-sm truncate transition-colors duration-200"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        {site.title}
                    </h3>
                    <ExternalLink
                        className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-0.5 group-hover:translate-y-0"
                        style={{ color: 'var(--color-accent)' }}
                    />
                </div>

                <p
                    className="text-xs truncate mt-0.5 transition-colors"
                    style={{ color: 'var(--color-text-tertiary)' }}
                >
                    {site.description || new URL(site.url).hostname.replace('www.', '')}
                </p>
            </div>
        </a>
    );
}
