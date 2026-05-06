import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { User, Mail, Save, Edit3, Building } from 'lucide-react';

const AVATARS = [
    { id: 1, color: '#6366f1' },
    { id: 2, color: '#10b981' },
    { id: 3, color: '#f59e0b' },
    { id: 4, color: '#ef4444' },
    { id: 5, color: '#8b5cf6' },
    { id: 6, color: '#06b6d4' }
];

export default function Profile() {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState({
        displayName: user?.displayName || '',
        domain: '',
        position: '',
        organization: '',
        bio: '',
        avatarId: 1
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setProfileData({ ...docSnap.data(), displayName: docSnap.data().displayName || user.displayName });
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await setDoc(doc(db, "users", user.uid), {
                ...profileData,
                updatedAt: new Date()
            }, { merge: true });
            setStatus('Profile synced.');
            setTimeout(() => setStatus(''), 3000);
        } catch (err) {
            console.error(err);
            setStatus('Error updating records.');
        } finally {
            setLoading(false);
        }
    };

    const currentAvatar = AVATARS.find(a => a.id === profileData.avatarId) || AVATARS[0];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="animate-slide-up">
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Researcher <span className="accent-text">Identity</span></h1>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
                {/* Left Side: Avatar Panel */}
                <div className="glass-morphism" style={{ padding: '2rem', textAlign: 'center', height: 'fit-content' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: currentAvatar.color, margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid var(--border)' }}>
                        <User size={64} color="white" />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        {AVATARS.map(av => (
                            <div
                                key={av.id}
                                onClick={() => setProfileData({ ...profileData, avatarId: av.id })}
                                style={{ width: '28px', height: '28px', borderRadius: '50%', background: av.color, cursor: 'pointer', border: profileData.avatarId === av.id ? '2px solid white' : '2px solid transparent', transition: '0.2s' }}
                            />
                        ))}
                    </div>

                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{profileData.displayName}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{profileData.position || 'Researcher Access'}</p>

                    <div style={{ textAlign: 'left', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                            <Building size={16} className="accent-text" /> {profileData.organization || 'Independent Analyst'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                            <Mail size={16} className="accent-text" /> {user?.email}
                        </div>
                    </div>
                </div>

                {/* Right Side: Data Entry */}
                <div className="glass-morphism" style={{ padding: '2.5rem' }}>
                    <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Professional Credentials
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Full Name</label>
                            <input className="input-field" value={profileData.displayName} onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Scientific Domain</label>
                            <input className="input-field" placeholder="e.g. Cryospheric Science" value={profileData.domain} onChange={(e) => setProfileData({ ...profileData, domain: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Research Position</label>
                            <input className="input-field" placeholder="e.g. Post-doc Researcher" value={profileData.position} onChange={(e) => setProfileData({ ...profileData, position: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Affiliated Organization</label>
                            <input className="input-field" placeholder="e.g. ESA / NASA / University" value={profileData.organization} onChange={(e) => setProfileData({ ...profileData, organization: e.target.value })} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Technical Bio</label>
                        <textarea
                            className="input-field"
                            style={{ minHeight: '120px', resize: 'none' }}
                            value={profileData.bio}
                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                            placeholder="Briefly describe your objectives with SAR data colorization..."
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--success)' }}>{status}</p>
                        <button onClick={handleSave} className="btn-primary" disabled={loading}>
                            <Save size={18} /> {loading ? 'Saving...' : 'Sync Profile'}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
