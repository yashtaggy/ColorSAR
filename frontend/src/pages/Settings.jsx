import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { Sun, Moon, Bell, Shield, LogOut, ChevronRight } from 'lucide-react';

export default function Settings() {
    const { logout } = useAuth();
    const { darkMode, toggleTheme } = useTheme();

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="animate-slide-up">
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2.5rem' }}>System <span className="accent-text">Settings</span></h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
                {/* Interface Settings */}
                <SettingSection title="Interface Preferences">
                    <SettingToggle
                        icon={darkMode ? <Moon size={20} /> : <Sun size={20} />}
                        title="Dark Mode"
                        description="Switch between the professional dark laboratory interface and standard light mode."
                        active={darkMode}
                        onToggle={toggleTheme}
                    />
                </SettingSection>

                {/* Account Settings */}
                <SettingSection title="Privacy & Security">
                    <SettingItem
                        icon={<Shield size={20} />}
                        title="Secure Archiving"
                        description="Enable automatic cloud synchronization for all generated imagery."
                        status="Enabled"
                    />
                    <SettingItem
                        icon={<Bell size={20} />}
                        title="Real-time Alerts"
                        description="Get notified when batch processing jobs or large datasets are completed."
                        status="Disabled"
                    />
                </SettingSection>

                {/* Danger Zone */}
                <div style={{ marginTop: '2rem' }}>
                    <button
                        onClick={() => logout()}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                    >
                        <LogOut size={18} /> Terminate Session (Logout)
                    </button>
                    <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Version 2.0.4-research | Deployment: Local Cluster
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

function SettingSection({ title, children }) {
    return (
        <div className="glass-morphism" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                {title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {children}
            </div>
        </div>
    );
}

function SettingToggle({ icon, title, description, active, onToggle }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ background: 'var(--glass)', padding: '0.75rem', borderRadius: '0.75rem', color: 'var(--accent)' }}>{icon}</div>
                <div>
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>{description}</p>
                </div>
            </div>
            <div
                onClick={onToggle}
                style={{ width: '50px', height: '26px', backgroundColor: active ? 'var(--accent)' : 'var(--border)', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}
            >
                <motion.div animate={{ x: active ? 26 : 2 }} style={{ width: '22px', height: '22px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px' }} />
            </div>
        </div>
    );
}

function SettingItem({ icon, title, description, status }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ background: 'var(--glass)', padding: '0.75rem', borderRadius: '0.75rem', color: 'var(--accent)' }}>{icon}</div>
                <div>
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>{description}</p>
                </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: status === 'Enabled' ? 'var(--success)' : 'var(--text-secondary)', background: 'var(--glass)', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
                {status}
            </span>
        </div>
    );
}
