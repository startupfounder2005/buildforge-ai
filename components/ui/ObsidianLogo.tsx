import React from "react";
import Image from "next/image";

export const ObsidianLogo = ({ className }: { className?: string }) => {
    // Determine size and styling from className if possible, or defaulting
    // Since className usually contains width/height classes (like size-10, h-6 w-6), 
    // we wrap Image in a relative div to respect parent sizing, or just use width/height props if passed.
    // However, simplest way for 'className' propagation is using an img tag or Next Image with fill/contain if parent defines size.
    // Given usage in sidebar is "size-full" inside a "size-10" container.

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <Image
                src="/obsidian-logo.png"
                alt="Obsidian Logo"
                fill
                className="object-contain" // ensures aspect ratio is preserved
                priority
            />
        </div>
    );
};
