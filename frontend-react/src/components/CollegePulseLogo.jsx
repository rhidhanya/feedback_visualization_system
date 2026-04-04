import React from 'react';
import { FiAperture } from 'react-icons/fi';

/**
 * CampusLensLogo — Horizontal version (icon + text)
 * Used in AdminLayout sidebar
 */
export const CampusLensLogo = ({ iconSize = 34, hideText = false, dark = false }) => {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
            }}
        >
            <CampusLensIcon size={iconSize} />

            {!hideText && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                        style={{
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            color: dark ? '#FFFFFF' : '#0F172A',
                            letterSpacing: '-0.02em',
                            lineHeight: 1
                        }}
                    >
                        CampusLens
                    </div>

                    <div
                        style={{
                            fontSize: '0.7rem',
                            color: 'var(--clr-primary, #1E4DB7)', // Blue accent
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            marginTop: '3px'
                        }}
                    >
                        Analytics Portal
                    </div>
                </div>
            )}
        </div>
    );
};


/**
 * CampusLensIcon — Square icon version
 * Used in login pages and compact brand spots
 */
export const CampusLensIcon = ({ size = 34, color = "var(--clr-primary)" }) => {
    return (
        <div
            style={{
                width: size,
                height: size,
                background: color,
                borderRadius: Math.round(size * 0.25),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
        >
            <FiAperture size={Math.round(size * 0.6)} />
        </div>
    );
};


/* Aliases (if older code uses these names) */
export const CollegePulseLogo = CampusLensLogo;
export const CollegePulseIcon = CampusLensIcon;

export default CampusLensLogo;