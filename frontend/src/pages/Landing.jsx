import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Zap, Database, Cpu, ArrowRight, Share2, Globe } from 'lucide-react';

export default function Landing() {
    return (
        <div style={{ paddingBottom: '5rem' }}>
            {/* Hero Section */}
            <section style={{ textAlign: 'center', padding: '6rem 1rem' }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass)', padding: '0.5rem 1.5rem', borderRadius: '2rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                        <span style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '50%' }}></span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>v2.0 Science Edition Available</span>
                    </div>

                    <h1 style={{ fontSize: '4.5rem', marginBottom: '1.5rem', lineHeight: '1.1' }}>
                        Advanced SAR <span className="accent-text">Intelligence</span> <br />
                        for Planetary Analysis
                    </h1>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto 3rem', lineHeight: '1.6' }}>
                        Bridging the gap between Synthetic Aperture Radar and Optical reality using generative AI.
                        Designed for researchers, environmental scientists, and geospatial analysts.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/signup" className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                            Start Analysis <ArrowRight size={20} />
                        </Link>
                        <Link to="/about" className="btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                            How it Works
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', padding: '0 2rem' }}>
                <FeatureCard
                    icon={<Zap className="accent-text" />}
                    title="Real-time Emulation"
                    description="Convert complex SAR backscatter data into human-interpretable optical imagery in seconds."
                />
                <FeatureCard
                    icon={<Cpu className="accent-text" />}
                    title="Gemini AI Core"
                    description="Semantic analysis of land types, urban density, and terrain moisture using advanced vision models."
                />
                <FeatureCard
                    icon={<Database className="accent-text" />}
                    title="Project Archiving"
                    description="Automatically store all generated datasets, reports, and high-fidelity images in your cloud workspace."
                />
            </section>

            {/* Stats / Proof Section */}
            <section className="glass-morphism" style={{ margin: '6rem 2rem', padding: '4rem', textAlign: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
                    <StatItem value="98%" label="Structural Fidelity" />
                    <StatItem value="1.5s" label="Inference Speed" />
                    <StatItem value="Sentinel-2" label="Target Profile" />
                    <StatItem value="Cloud" label="Storage Ready" />
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="glass-morphism"
            style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
            <div style={{ background: 'var(--glass)', width: 'fit-content', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                {icon}
            </div>
            <h3 style={{ fontSize: '1.5rem' }}>{title}</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>{description}</p>
        </motion.div>
    );
}

function StatItem({ value, label }) {
    return (
        <div>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }} className="accent-text">{value}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
        </div>
    );
}
