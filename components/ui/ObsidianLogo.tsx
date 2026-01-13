import React from "react";

export const ObsidianLogo = ({ className }: { className?: string }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <g transform="rotate(-45 50 50)">
                {/* Handle (Purple) */}
                <path
                    d="M42 35 L42 95 L58 95 L58 35 Z"
                    fill="#7C3AED"
                />

                {/* Sledgehammer Head (Purple) */}
                <path
                    d="M20 15 L80 15 L85 20 L85 35 L80 40 L20 40 L15 35 L15 20 Z"
                    fill="#7C3AED"
                />

                {/* Black Lightning Crack - Zig Zag down the center */}
                <path
                    d="M50 15 L45 30 L55 45 L45 60 L52 75 L50 95"
                    stroke="black"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
        </svg>
    );
};
