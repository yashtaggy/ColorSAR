import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Zap, Download, FileText, Loader2, Maximize2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebase/config';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const API_BASE = "/api";

export default function Generator({ onComplete }) {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isEnhanced, setIsEnhanced] = useState(true);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState("");

    // Sliders
    const [saturation, setSaturation] = useState(1.4);
    const [contrast, setContrast] = useState(1.0);
    const [sharpness, setSharpness] = useState(1.0);

    const fileInputRef = useRef();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setResult(null);
            setError(null);
        }
    };

    const saveToCloud = async (outputBlob, analysisData) => {
        if (!user) {
            console.warn("Save skipped: No authenticated user.");
            return;
        }

        setStatus("Archiving to research database...");
        try {
            const timestamp = Date.now();
            // 1. Upload Output Image to Firebase Storage
            const storagePath = `outputs/${user.uid}/${timestamp}.png`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, outputBlob);
            const outputUrl = await getDownloadURL(storageRef);

            // 2. Save Metadata to Firestore
            const generationData = {
                userId: user.uid,
                outputUrl,
                landType: analysisData?.land_type || "Mixed",
                description: analysisData?.description || "",
                insights: analysisData?.insights || [],
                fileName: file?.name || "unnamed_sar_capture",
                parameters: { saturation, contrast, sharpness, isEnhanced },
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "generations"), generationData);

            // 3. Update User Profile last active
            await setDoc(doc(db, "users", user.uid), {
                lastAnalysisAt: serverTimestamp(),
                email: user.email
            }, { merge: true });

            setStatus("Cloud Hub Synced.");
        } catch (err) {
            console.error("CRITICAL CLOUD ERROR:", err);
            setStatus("Local Archive Only (Sync Error)");
        }
    };

    const downloadReport = async () => {
        if (!result || !file) return;

        setStatus("Generating Research PDF...");
        try {
            const token = await user.getIdToken();
            const formData = new FormData();
            formData.append('input_file', file);

            // Convert Base64 output back to blob
            const response = await fetch(result.image);
            const blob = await response.blob();
            formData.append('output_file', blob, 'output.png');

            formData.append('description', result.analysis.description);
            formData.append('land_type', result.analysis.land_type);
            formData.append('insights', JSON.stringify(result.analysis.insights));

            const reportRes = await axios.post(`${API_BASE}/generate-report`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([reportRes.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'SAR_Expert_Report.pdf');
            document.body.appendChild(link);
            link.click();
            setStatus("Report ready.");
        } catch (err) {
            console.error(err);
            setStatus("Failed to generate report.");
        }
    };

    const processImage = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        setStatus("Analyzing SAR structure...");

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = await user.getIdToken();
            setStatus(isEnhanced ? "Running AI Emulation..." : "Base Colorization...");
            const response = await axios.post(
                `${API_BASE}/process?enhanced=${isEnhanced}&saturation=${saturation}&contrast=${contrast}&sharpness=${sharpness}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setResult(response.data);

            // Auto-save to cloud if user is logged in
            if (user) {
                const res = await fetch(response.data.image);
                const blob = await res.blob();
                await saveToCloud(blob, response.data.analysis);
            }

            setStatus("Analysis successful.");
        } catch (err) {
            setError(err.response?.data?.detail || "Engine timeout. Please check your API limits.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
            {/* Sidebar Controls */}
            <aside className="glass-morphism" style={{ padding: '2rem', height: 'fit-content' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={20} className="accent-text" /> Engine Settings
                </h3>

                <div
                    onClick={() => fileInputRef.current.click()}
                    style={{
                        border: '2px dashed var(--border)', borderRadius: '1rem', padding: '1.5rem',
                        textAlign: 'center', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.02)',
                        marginBottom: '2rem'
                    }}
                >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                    {previewUrl ? (
                        <img src={previewUrl} style={{ width: '100%', borderRadius: '0.5rem' }} alt="Preview" />
                    ) : (
                        <div style={{ color: 'var(--text-secondary)' }}>
                            <Upload size={32} style={{ marginBottom: '0.5rem' }} />
                            <p style={{ fontSize: '0.8rem' }}>Drop SAR Data</p>
                        </div>
                    )}
                </div>

                <div style={{ padding: '1rem', background: 'var(--glass)', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem' }}>AI Enhanced Mode</span>
                    <div
                        onClick={() => setIsEnhanced(!isEnhanced)}
                        style={{ width: '44px', height: '24px', backgroundColor: isEnhanced ? 'var(--accent)' : 'var(--border)', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}
                    >
                        <motion.div animate={{ x: isEnhanced ? 22 : 2 }} style={{ width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px' }} />
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                        <span>Vibrancy</span>
                        <span className="accent-text">{saturation.toFixed(1)}x</span>
                    </div>
                    <input type="range" min="0.5" max="2.5" step="0.1" value={saturation} onChange={(e) => setSaturation(parseFloat(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                        <span>Optical Contrast</span>
                        <span className="accent-text">{contrast.toFixed(1)}x</span>
                    </div>
                    <input type="range" min="0.5" max="2.0" step="0.1" value={contrast} onChange={(e) => setContrast(parseFloat(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                        <span>Edge Sharpness</span>
                        <span className="accent-text">{sharpness.toFixed(1)}x</span>
                    </div>
                    <input type="range" min="0.5" max="2.0" step="0.1" value={sharpness} onChange={(e) => setSharpness(parseFloat(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
                </div>

                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={processImage} disabled={loading || !file}>
                    {loading ? <Loader2 className="animate-spin" /> : "Run Pipeline"}
                </button>

                {result && (
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <a href={result.image} download="colorsar_output.png" className="btn-secondary" style={{ textDecoration: 'none', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Download size={18} /> Download Image
                        </a>
                        <button onClick={downloadReport} className="btn-secondary" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--accent)' }}>
                            <FileText size={18} className="accent-text" /> Export Research PDF
                        </button>
                    </div>
                )}
            </aside>

            {/* Viewport Area */}
            <section>
                {!result ? (
                    <div className="glass-morphism" style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        Configure engine and start analysis to view results
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-morphism" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><img src={previewUrl} style={{ width: '100%', borderRadius: '0.5rem' }} alt="Original" /></div>
                                <div><img src={result.image} style={{ width: '100%', borderRadius: '0.5rem' }} alt="Result" /></div>
                            </div>
                        </div>

                        {result.analysis && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-morphism" style={{ padding: '2rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <Maximize2 size={20} className="accent-text" /> AI Synthesis
                                </h3>
                                <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>{result.analysis.description}</p>
                                <div style={{ background: 'var(--glass)', padding: '1.5rem', borderRadius: '1rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'uppercase' }}>Insights</h4>
                                    <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.2rem' }}>
                                        {result.analysis.insights.map((i, idx) => <li key={idx} style={{ marginBottom: '0.5rem' }}>{i}</li>)}
                                    </ul>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </section>

            {status && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: 'var(--bg-dark)', border: '1px solid var(--accent)', padding: '0.75rem 1.5rem', borderRadius: '2rem', fontSize: '0.85rem' }}>
                    {status}
                </div>
            )}
        </div>
    );
}
