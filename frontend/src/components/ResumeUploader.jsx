import { useState } from 'react';
import { parsePdfText, parseResumeWithGroq } from '../../utils/resumeParser';

const C = {
    bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
    accent: '#7C3AED', accentLight: 'rgba(124,58,237,0.15)',
    teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
    cyan: '#06B6D4', warning: '#F59E0B', danger: '#EF4444',
    text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const Styles = () => (
    <style dangerouslySetInnerHTML={{
        __html: `
    @keyframes resumeFade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    .resume-card { animation: resumeFade 0.3s ease-out both; }
    .resume-drop { border: 2px dashed ${C.border}; cursor: pointer; transition: all 0.2s; }
    .resume-drop:hover { border-color: ${C.accent}; background-color: ${C.surfaceHover}; }
    .resume-drop.over { border-color: ${C.accent}; background-color: ${C.accentLight}; }
    .resume-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid ${C.muted}; border-top-color: ${C.accent}; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `}} />
);

export default function ResumeUploader({ onParsed, onError }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');

    const handleParse = async (file) => {
        if (!file.type.includes('pdf')) {
            const err = 'Please upload a PDF file';
            setError(err);
            onError?.(err);
            return;
        }

        setIsParsing(true);
        setError('');
        setFileName(file.name);

        try {
            const pdfText = await parsePdfText(file);
            const parsed = await parseResumeWithGroq(pdfText);
            onParsed?.(parsed);
        } catch (err) {
            const errMsg = err.message || 'Failed to parse resume';
            setError(errMsg);
            onError?.(errMsg);
        } finally {
            setIsParsing(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleParse(file);
    };

    const handleFileInput = (e) => {
        const file = e.target.files?.[0];
        if (file) handleParse(file);
    };

    return (
        <div style={{ fontFamily: 'Poppins, sans-serif' }}>
            <Styles />

            {/* Upload Zone */}
            <label
                className="resume-card resume-drop"
                onDrop={handleDrop}
                onDragOver={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                style={{
                    display: 'block',
                    padding: '32px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    background: C.surface,
                    opacity: isParsing ? 0.6 : 1,
                    transition: 'all 0.2s',
                    cursor: isParsing ? 'default' : 'pointer',
                    pointerEvents: isParsing ? 'none' : 'auto',
                    ...(isDragging && { borderColor: C.accent, backgroundColor: C.accentLight }),
                }}
            >
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInput}
                    disabled={isParsing}
                    style={{ display: 'none' }}
                />
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
                {isParsing ? (
                    <>
                        <div className="resume-spinner" style={{ margin: '0 auto 12px' }} />
                        <div style={{ fontSize: '14px', color: C.text, fontWeight: '500' }}>
                            Parsing {fileName}...
                        </div>
                        <div style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>
                            Extracting text and analyzing with AI
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: '14px', color: C.text, fontWeight: '600', marginBottom: '4px' }}>
                            Upload Resume PDF
                        </div>
                        <div style={{ fontSize: '12px', color: C.muted }}>
                            Drag and drop or click to select
                        </div>
                    </>
                )}
            </label>

            {/* Error Message */}
            {error && (
                <div
                    className="resume-card"
                    style={{
                        marginTop: '16px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: `${C.danger}15`,
                        border: `1px solid ${C.danger}`,
                        color: C.danger,
                        fontSize: '12px',
                        fontWeight: '500',
                    }}
                >
                    ❌ {error}
                </div>
            )}

            {/* File Selected Indicator */}
            {fileName && !isParsing && !error && (
                <div
                    className="resume-card"
                    style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: `${C.teal}15`,
                        border: `1px solid ${C.teal}`,
                        color: C.teal,
                        fontSize: '11px',
                        fontWeight: '500',
                    }}
                >
                    ✓ {fileName} parsed successfully
                </div>
            )}
        </div>
    );
}
