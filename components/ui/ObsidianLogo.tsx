import React from "react";

export const ObsidianLogo = ({ className }: { className?: string }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Group rotated 45 degrees around center, scaled down to fit longer handle */}
            <g transform="rotate(45 50 50) scale(0.85 0.85) translate(10 10)">
                {/* Handle (Purple) - Significantly longer */}
                <rect x="42" y="35" width="16" height="85" rx="2" fill="#7C3AED" />

                {/* Head (Purple) */}
                <rect x="15" y="15" width="70" height="30" rx="4" fill="#7C3AED" />

                {/* Black Lightning Crack - Extended down the handle */}
                <path
                    d="M50 15 L46 25 L54 35 L46 45 L52 55 L48 70 L51 90"
                    stroke="black"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
        </svg>
    );
};
