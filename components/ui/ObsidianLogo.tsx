import React from "react";

export const ObsidianLogo = ({ className }: { className?: string }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Sledgehammer Head (Purple) */}
            <path
                d="M20 20 L80 20 L85 25 L85 55 L80 60 L20 60 L15 55 L15 25 Z"
                fill="#7C3AED"
                stroke="#7C3AED"
                strokeWidth="2"
                strokeLinejoin="round"
            />

            {/* Handle (Purple) */}
            <path
                d="M45 60 L45 95 L55 95 L55 60 Z"
                fill="#7C3AED"
            />

            {/* Black Lightning Crack - Zig Zag down the center */}
            <path
                d="M50 20 L45 35 L55 45 L48 60 L52 75 L50 90"
                stroke="black"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Subtle Highlight/Glow on edge (Optional, keeping simple for now) */}
        </svg>
    );
};
