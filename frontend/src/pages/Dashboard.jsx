import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Plus, History, FileText, Download, Trash2, Search } from 'lucide-react';
import Generator from '../components/Generator';
import Onboarding from '../components/Onboarding';

export default function Dashboard() {
    const { user } = useAuth();
    const [view, setView] = useState('history'); // history or new
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    useEffect(() => {
        if (user) {
            checkOnboarding();
        }
    }, [user]);

    const checkOnboarding = async () => {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists() || !docSnap.data().onboardingComplete) {
            setNeedsOnboarding(true);
        }
    };

    useEffect(() => {
        if (user && view === 'history') {
            fetchHistory();
        }
    }, [user, view]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "generations"),
                where("userId", "==", user.uid)
            );
            const querySnapshot = await getDocs(q);
            const docs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort client-side to avoid index requirement
            const sortedDocs = docs.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });

            setHistory(sortedDocs);
        } catch (err) {
            console.error("Error fetching history:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ animation: 'slideUp 0.5s ease-out' }}>
            {needsOnboarding && <Onboarding onComplete={() => setNeedsOnboarding(false)} />}

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem' }}>Researcher <span className="accent-text">Workspace</span></h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Centralized intelligence hub for geospatial analysis</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setView('history')}
                        className={view === 'history' ? 'btn-primary' : 'btn-secondary'}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <History size={18} /> Analysis History
                    </button>
                    <button
                        onClick={() => setView('new')}
                        className={view === 'new' ? 'btn-primary' : 'btn-secondary'}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={18} /> New Analysis
                    </button>
                </div>
            </header>

            <main>
                {view === 'new' ? (
                    <Generator onComplete={() => setView('history')} />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {loading ? (
                            <p>Loading archive...</p>
                        ) : history.length > 0 ? (
                            history.map(item => <HistoryCard key={item.id} data={item} />)
                        ) : (
                            <div className="glass-morphism" style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center' }}>
                                <Search size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                <h3>No analysis records found</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Start your first colorization process to populate your workspace.</p>
                                <button onClick={() => setView('new')} className="btn-primary" style={{ margin: '0 auto' }}>New Analysis</button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

function HistoryCard({ data }) {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-morphism"
            style={{ padding: '0.5rem' }}
        >
            <div style={{ position: 'relative', height: '180px', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1rem' }}>
                <img src={data.outputUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Result" />
                <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.8)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.65rem' }}>
                    {data.landType}
                </div>
            </div>

            <div style={{ padding: '0.5rem' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.fileName || "SAR Image"}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {data.createdAt?.toDate().toLocaleDateString() || "Recent Release"}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}><FileText size={14} /></button>
                    <button className="btn-secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}><Download size={14} /></button>
                    <button className="btn-secondary" style={{ flex: 0.3, padding: '0.4rem', color: '#ef4444' }}><Trash2 size={14} /></button>
                </div>
            </div>
        </motion.div>
    );
}
