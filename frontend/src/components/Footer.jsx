import React from 'react';

export default function Footer() {
    return (
        <footer style={{ marginTop: 'auto', padding: '4rem 2rem 2rem', borderTop: '1px solid var(--border)', background: 'var(--glass)' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Color<span className="accent-text">SAR</span></h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Open-access SAR colorization pipeline for global research.</p>
                </div>

                <div style={{ display: 'flex', gap: '3rem' }}>
                    <FooterLink title="Security" links={['Encryption', 'Terms', 'Privacy']} />
                    <FooterLink title="Resources" links={['Documentation', 'API Guide', 'Datasets']} />
                    <FooterLink title="Community" links={['GitHub', 'Scientific Papers', 'Discord']} />
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '4rem', opacity: 0.4, fontSize: '0.75rem' }}>
                &copy; 2026 ColorSAR Intelligence Team • Locally Deployed Production Instance
            </div>
        </footer>
    );
}

function FooterLink({ title, links }) {
    return (
        <div>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>{title}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {links.map(l => <a key={l} href="#" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>{l}</a>)}
            </div>
        </div>
    );
}
