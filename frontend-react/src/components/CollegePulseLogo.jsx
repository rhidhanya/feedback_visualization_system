import React from 'react';
import { FiAperture } from 'react-icons/fi';
/**
 * CampusLensLogo — Horizontal version (icon + text).
 * Used in AdminLayout sidebar.
 */
export const CampusLensLogo = ({ iconSize = 34 }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <CampusLensIcon size={iconSize} />
        <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--clr-primary)', letterSpacing: '-0.02em' }}>
                CampusLens
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analytics Portal</div>
        </div>
    </div>
);

/**
 * CampusLensIcon — Square icon version.
 * Used in login pages and anywhere a compact brand mark is needed.
 * Design: A sleek lens/aperture icon.
 */
export const CampusLensIcon = ({ size = 34, color = "var(--clr-logo-bg)" }) => {
    return (
        <div style={{
            width: size,
            height: size,
            background: color,
            borderRadius: Math.round(size * 0.2),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0
        }}>
            <FiAperture size={Math.round(size * 0.6)} />
        </div>
    );
};

export const CollegePulseLogo = CampusLensLogo;
export const CollegePulseIcon = CampusLensIcon;

export default CampusLensLogo;
