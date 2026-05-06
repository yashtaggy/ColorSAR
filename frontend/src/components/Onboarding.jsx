import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { User, Briefcase, Globe, Building, Edit3, ChevronRight } from 'lucide-react';

const AVATARS = [
    { id: 1, color: '#6366f1' },
    { id: 2, color: '#10b981' },
    { id: 3, color: '#f59e0b' },
    { id: 4, color: '#ef4444' },
    { id: 5, color: '#8b5cf6' },
    { id: 6, color: '#06b6d4' }
];

export default function Onboarding({ onComplete }) {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        domain: '',
        position: '',
        organization: '',
        bio: '',
        avatarId: 1
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await setDoc(doc(db, "users", user.uid), {
                ...formData,
                onboardingComplete: true,
                updatedAt: serverTimestamp()
            }, { merge: true });
            onComplete();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-dark)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-morphism" style={{ width: '100%', maxWidth: '600px', padding: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Researcher <span className="accent-text">Verification</span></h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Complete your profile to unlock full workspace capabilities</p>
                </div>

                <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: step === 1 ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>1. Identity</button>
                    <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: step === 2 ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>2. Role</button>
                    <button onClick={() => setStep(3)} style={{ background: 'none', border: 'none', color: step === 3 ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>3. Professional Summary</button>
                </div>

                <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Select Research Avatar</label>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                    {AVATARS.map(av => (
                                        <div
                                            key={av.id}
                                            onClick={() => setFormData({ ...formData, avatarId: av.id })}
                                            style={{
                                                width: '50px', height: '50px', borderRadius: '50%', background: av.color,
                                                cursor: 'pointer', border: formData.avatarId === av.id ? '3px solid white' : 'none',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            <User size={24} color="white" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
                                <input className="input-field" style={{ paddingLeft: '3rem' }} placeholder="Full Name" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <Globe size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
                                <input className="input-field" style={{ paddingLeft: '3rem' }} placeholder="Research Domain (e.g. Urban Geospatial)" value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Briefcase size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
                                <input className="input-field" style={{ paddingLeft: '3rem' }} placeholder="Position" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Building size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
                                <input className="input-field" style={{ paddingLeft: '3rem' }} placeholder="Organization" value={formData.organization} onChange={(e) => setFormData({ ...formData, organization: e.target.value })} />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <Edit3 size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-secondary)' }} />
                                <textarea
                                    className="input-field"
                                    style={{ paddingLeft: '3rem', minHeight: '120px' }}
                                    placeholder="Brief Research Bio"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                        {step > 1 ? (
                            <button className="btn-secondary" onClick={() => setStep(step - 1)}>Back</button>
                        ) : <div />}

                        {step < 3 ? (
                            <button className="btn-primary" onClick={() => setStep(step + 1)}>Continue <ChevronRight size={18} /></button>
                        ) : (
                            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Initializing...' : 'Enter Workspace'}
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
