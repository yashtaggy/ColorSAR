import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap, Search, Eye, Cpu, Database } from 'lucide-react';

export default function About() {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="animate-slide-up">
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>How <span className="accent-text">ColorSAR</span> Works</h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto', fontSize: '1.2rem' }}>
                    Synthetic Aperture Radar (SAR) provides a high-resolution view of the earth's surface,
                    but its grayscale output is difficult for human interpretation. Our pipeline bridges this gap.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
                <StepCard
                    number="01"
                    icon={<Layers size={24} />}
                    title="SAR Preprocessing"
                    text="Raw radar backscatter is normalized and converted into luminance channels while preserving structural fidelity."
                />
                <StepCard
                    number="02"
                    icon={<Cpu size={24} />}
                    title="GAN Synthesis"
                    text="A Generative Adversarial Network (GAN) predicts chrominance based on texture patterns learned from thousands of optical pairs."
                />
                <StepCard
                    number="03"
                    icon={<Zap size={24} />}
                    title="Semantic Refinement"
                    text="Google Gemini Vision analyzes the scene context to intelligently map predicted colors to real-world optical profiles."
                />
            </div>

            <div className="glass-morphism" style={{ padding: '3rem' }}>
                <h3 style={{ fontSize: '2rem', marginBottom: '2rem' }}>The <span className="accent-text">AI Stack</span></h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                    <div>
                        <ListItem title="Ensemble Architecture" description="Combining a ResNet-based encoder with a DnCNN denoiser to remove speckle noise while retaining high-frequency details." />
                        <ListItem title="Sentinel-2 Calibration" description="Our semantic enhancement layer is calibrated to the spectral profiles of Sentinel-2 satellite constellations." />
                    </div>
                    <div>
                        <ListItem title="Gemini Vision Core" description="Context-aware color correction that understands the difference between urban concrete, water bodies, and vegetation." />
                        <ListItem title="Production Pipeline" description="Asynchronous processing with multi-threaded post-processing ensure scientific-grade results in under 2 seconds." />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function StepCard({ number, icon, title, text }) {
    return (
        <div className="glass-morphism" style={{ padding: '2.5rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1.5rem', fontSize: '3rem', fontWeight: 900, opacity: 0.05, fontFamily: 'Outfit' }}>
                {number}
            </div>
            <div style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>{icon}</div>
            <h4 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{title}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>{text}</p>
        </div>
    );
}

function ListItem({ title, description }) {
    return (
        <div style={{ marginBottom: '2rem' }}>
            <h5 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={16} className="accent-text" /> {title}
            </h5>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{description}</p>
        </div>
    );
}
