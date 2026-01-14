import React from "react";

export const ObsidianLogo = ({ className }: { className?: string }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <g id="hammer-shape">
                    {/* Handle - Vertical before rotation */}
                    <rect x="42" y="35" width="16" height="85" rx="2" />
                    {/* Head - Horizontal block before rotation */}
                    <rect x="15" y="15" width="70" height="30" rx="4" />
                </g>
                <clipPath id="hammer-clip">
                    <use href="#hammer-shape" />
                </clipPath>
            </defs>

            {/* Group rotated 45 degrees around center */}
            <g transform="rotate(45 50 50) scale(0.85 0.85) translate(10 10)">
                {/* Main Hammer Shape being rendered (Purple) */}
                <use href="#hammer-shape" fill="#7C3AED" />

                {/* Black Lightning Crack - Clipped to stay inside */}
                <g clipPath="url(#hammer-clip)">
                    <path
                        d="M50 10 L46 25 L54 35 L46 45 L52 55 L48 70 L51 90"
                        stroke="black"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </g>
            </g>
        </svg>
    );
};
