"use client";

import React from 'react';

type LogoVariant = 'light' | 'dark' | 'blue';

interface LogoProps {
    className?: string;
    variant?: LogoVariant;
}

export const InquisiaLogo: React.FC<LogoProps> = ({ className = "w-8 h-8", variant = 'blue' }) => {
    const src = variant === 'light' ? '/inquisia-light.svg' : variant === 'dark' ? '/inquisia-dark.svg' : '/inquisia-blue.svg';
    return <img src={src} alt="Inquisia Logo" className={className} />;
};

export const ElaraLogo: React.FC<LogoProps> = ({ className = "w-6 h-6", variant = 'blue' }) => {
    const src = variant === 'light' ? '/elara-light.svg' : variant === 'dark' ? '/elara-dark.svg' : '/elara-blue.svg';
    return <img src={src} alt="Elara Logo" className={className} />;
};
