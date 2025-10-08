// src/components/icons/AIRobotIcon.tsx
import React from 'react';

interface AIRobotIconProps {
    size?: number;
    className?: string;
}

export const AIRobotIcon: React.FC<AIRobotIconProps> = ({
                                                            size = 32,
                                                            className = ''
                                                        }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                {/* Green body gradient */}
                <linearGradient id={`greenBodyGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6ee7b7" stopOpacity="1" />
                    <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="1" />
                </linearGradient>

                {/* Screen gradient */}
                <linearGradient id={`screenGradient-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1f2937" stopOpacity="1" />
                    <stop offset="100%" stopColor="#111827" stopOpacity="1" />
                </linearGradient>

                {/* Cyan eye glow gradient */}
                <linearGradient id={`cyanEyeGlow-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#67e8f9" stopOpacity="1" />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="1" />
                </linearGradient>

                {/* Glow filter for eyes */}
                <filter id={`glow-${size}`}>
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>

            {/* Shadow */}
            <ellipse cx="24" cy="42" rx="12" ry="1.8" fill="#000" opacity="0.15"/>

            {/* Body - Square with rounded corners */}
            <rect x="12" y="16" width="24" height="20" rx="5" fill={`url(#greenBodyGradient-${size})`}/>

            {/* Body highlight */}
            <rect x="14" y="18" width="7" height="6" rx="1.5" fill="#d1fae5" opacity="0.4"/>

            {/* Screen/Face area */}
            <rect x="15" y="22" width="18" height="12" rx="3" fill={`url(#screenGradient-${size})`}/>

            {/* Screen highlight */}
            <rect x="16" y="23" width="8" height="5" rx="1.5" fill="#374151" opacity="0.5"/>

            {/* Left Eye */}
            <rect
                x="19"
                y="26"
                width="2.5"
                height="6"
                rx="1.2"
                fill={`url(#cyanEyeGlow-${size})`}
                filter={`url(#glow-${size})`}
            />

            {/* Right Eye */}
            <rect
                x="26.5"
                y="26"
                width="2.5"
                height="6"
                rx="1.2"
                fill={`url(#cyanEyeGlow-${size})`}
                filter={`url(#glow-${size})`}
            />

            {/* Arms */}
            <rect x="7" y="22" width="3" height="8" rx="1.5" fill="#059669"/>
            <rect x="38" y="22" width="3" height="8" rx="1.5" fill="#059669"/>

            {/* Antenna */}
            <line x1="24" y1="16" x2="24" y2="11" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="24" cy="11" r="2" fill="#fbbf24"/>
        </svg>
    );
};