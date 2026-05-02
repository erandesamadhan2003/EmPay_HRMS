
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const C = {
    bg: "#0A0A0F",
    surface: "#13131A",
    surfaceHover: "#1A1A24",
    accent: "#14B8A6",
    accentGlow: "rgba(20,184,166,0.25)",
    cyan: "#06B6D4",
    text: "#F0FDFA",
    muted: "#8B8A9B",
    border: "#2E2E3E",
};

const GlobalStyles = () => (
    <style dangerouslySetInnerHTML={{
        __html: `
      @keyframes float1 {
        0%,100% { transform: translateY(0px) rotate(-2deg); }
        50% { transform: translateY(-14px) rotate(2deg); }
      }
      @keyframes float2 {
        0%,100% { transform: translateY(0px) rotate(1deg); }
        50% { transform: translateY(-10px) rotate(-1deg); }
      }
      @keyframes float3 {
        0%,100% { transform: translateY(0px) rotate(-1deg); }
        50% { transform: translateY(-16px) rotate(3deg); }
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes scanLine {
        0% { top: 0%; opacity: 1; }
        85% { opacity: 1; }
        100% { top: 100%; opacity: 0; }
      }
      @keyframes scanReset {
        0%,100% { top: 0%; opacity: 0; }
      }
      @keyframes pulse {
        0%,100% { box-shadow: 0 0 0 0 rgba(20,184,166,0.4); }
        50% { box-shadow: 0 0 0 12px rgba(20,184,166,0); }
      }
      @keyframes bounce {
        0%,100% { transform: translateY(0); }
        50% { transform: translateY(8px); }
      }
      @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      @keyframes lockAppear {
        0%,80% { opacity: 0; transform: scale(0.5); }
        90% { opacity: 1; transform: scale(1.1); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes connectorGrow {
        from { width: 0; }
        to { width: 100%; }
      }
      @keyframes rotateSlow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes glowPulse {
        0%,100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
      }
      .section-anim { opacity: 0; transform: translateY(30px); transition: opacity 0.7s ease-out, transform 0.7s ease-out; }
      .section-anim.visible { opacity: 1; transform: translateY(0); }
      .feature-card { transition: transform 0.25s ease-out, box-shadow 0.25s ease-out, border-color 0.25s ease-out; }
      .feature-card:hover { transform: translateY(-6px); border-color: ${C.accent} !important; box-shadow: 0 8px 32px ${C.accentGlow} !important; }
      .role-card-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform 0.6s ease; }
      .role-card:hover .role-card-inner { transform: rotateY(180deg); }
      .role-card-front, .role-card-back { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 14px; padding: 24px; }
      .role-card-back { transform: rotateY(180deg); }
      .nav-link { position: relative; color: ${C.muted}; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; cursor: pointer; }
      .nav-link::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 2px; background: ${C.accent}; transition: width 0.25s ease-out; }
      .nav-link:hover { color: ${C.text}; }
      .nav-link:hover::after { width: 100%; }
      .cta-glow:hover { box-shadow: 0 0 24px ${C.accentGlow}, 0 0 48px rgba(20,184,166,0.15); transform: translateY(-2px); }
      .cta-glow { transition: box-shadow 0.25s ease-out, transform 0.25s ease-out; }
      .ghost-btn { transition: background 0.25s ease-out, color 0.25s ease-out, transform 0.25s ease-out; }
      .ghost-btn:hover { background: rgba(20,184,166,0.15) !important; transform: translateY(-2px); }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { background: ${C.bg}; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: ${C.bg}; }
      ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
      @media (max-width: 767px) {
        .hero-grid { flex-direction: column-reverse !important; }
        .hero-float-panel { display: none !important; }
        .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .features-grid { grid-template-columns: 1fr !important; }
        .roles-grid { grid-template-columns: 1fr !important; }
        .face-section { flex-direction: column !important; }
        .steps-row { flex-direction: column !important; align-items: center !important; }
        .step-connector { display: none !important; }
        .footer-cols { flex-direction: column !important; gap: 32px !important; }
        .nav-links-desktop { display: none !important; }
        .hamburger { display: flex !important; }
      }
      @media (min-width: 768px) and (max-width: 1023px) {
        .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .roles-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .face-section { flex-direction: column !important; }
      }
      @media (min-width: 768px) {
        .hamburger { display: none !important; }
        .hero-float-panel { display: flex !important; }
      }
    `
    }} />
);

function useIntersection(ref, threshold = 0.15) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { el.classList.add("visible"); obs.disconnect(); }
        }, { threshold });
        obs.observe(el);
        return () => obs.disconnect();
    }, [ref, threshold]);
}

function CountUp({ target, suffix = "" }) {
    const [val, setVal] = useState(0);
    const ref = useRef();
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) {
                obs.disconnect();
                let start = 0;
                const step = Math.ceil(target / 40);
                const timer = setInterval(() => {
                    start = Math.min(start + step, target);
                    setVal(start);
                    if (start >= target) clearInterval(timer);
                }, 30);
            }
        }, { threshold: 0.5 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [target]);
    return <span ref={ref}>{val}{suffix}</span>;
}

const FloatingCard = ({ style, animClass, icon, title, sub, accentColor }) => (
    <div style={{
        position: "absolute",
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "14px 18px",
        minWidth: 200,
        backdropFilter: "blur(12px)",
        boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
        ...style
    }} className={animClass}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: accentColor, flexShrink: 0, boxShadow: `0 0 8px ${accentColor}` }} />
            <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{title}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>
            </div>
        </div>
    </div>
);

const FeatureIcon = ({ type }) => {
    const s = { width: 40, height: 40, marginBottom: 16 };
    if (type === "attendance") return (
        <div style={{ ...s, position: "relative" }}>
            <div style={{ width: 40, height: 40, border: `2px solid ${C.accent}`, borderRadius: 8, position: "absolute" }} />
            <div style={{ width: 20, height: 2, background: C.accent, position: "absolute", top: 18, left: 8 }} />
            <div style={{ width: 8, height: 8, background: C.cyan, borderRadius: "50%", position: "absolute", top: 6, left: 14 }} />
        </div>
    );
    if (type === "leave") return (
        <div style={{ ...s, position: "relative" }}>
            <div style={{ width: 36, height: 36, border: `2px solid ${C.cyan}`, borderRadius: "50%", position: "absolute", top: 2, left: 2 }} />
            <div style={{ width: 2, height: 16, background: C.cyan, position: "absolute", top: 12, left: 19 }} />
            <div style={{ width: 8, height: 2, background: C.cyan, position: "absolute", top: 20, left: 19 }} />
        </div>
    );
    if (type === "payroll") return (
        <div style={{ ...s, position: "relative" }}>
            <div style={{ width: 38, height: 30, border: `2px solid ${C.accent}`, borderRadius: 6, position: "absolute", top: 5 }} />
            <div style={{ width: 14, height: 2, background: C.cyan, position: "absolute", top: 14, left: 12 }} />
            <div style={{ width: 10, height: 2, background: C.accent, position: "absolute", top: 20, left: 12 }} />
        </div>
    );
    if (type === "roles") return (
        <div style={{ ...s, position: "relative" }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${C.accent}`, borderRadius: "50%", position: "absolute", top: 0, left: 12 }} />
            <div style={{ width: 12, height: 12, border: `2px solid ${C.cyan}`, borderRadius: "50%", position: "absolute", top: 16, left: 2 }} />
            <div style={{ width: 12, height: 12, border: `2px solid ${C.muted}`, borderRadius: "50%", position: "absolute", top: 16, left: 24 }} />
        </div>
    );
    if (type === "analytics") return (
        <div style={{ ...s, position: "relative" }}>
            {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ width: 6, height: 8 + i * 8, background: i % 2 === 0 ? C.accent : C.cyan, position: "absolute", bottom: 0, left: 4 + i * 9, borderRadius: "3px 3px 0 0" }} />
            ))}
        </div>
    );
    if (type === "ai") return (
        <div style={{ ...s, position: "relative" }}>
            <div style={{ width: 40, height: 40, border: `2px solid ${C.accent}`, borderRadius: 10, position: "absolute", transform: "rotate(45deg)", top: 0, left: 0 }} />
            <div style={{ width: 8, height: 8, background: C.cyan, borderRadius: "50%", position: "absolute", top: 16, left: 16 }} />
        </div>
    );
    return null;
};

export default function LandingPage() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const statsRef = useRef(); const featRef = useRef(); const howRef = useRef();
    const rolesRef = useRef(); const faceRef = useRef(); const ctaRef = useRef();

    useIntersection(statsRef); useIntersection(featRef); useIntersection(howRef);
    useIntersection(rolesRef); useIntersection(faceRef); useIntersection(ctaRef);

    useEffect(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700;800&display=swap";
        document.head.appendChild(link);
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const base = { fontFamily: "Poppins, sans-serif", color: C.text };

    const navLinks = ["Features", "How It Works", "Roles", "Security"];

    const features = [
        { type: "attendance", title: "Attendance Tracking", desc: "Real-time face-verified check-ins with GPS geofencing and liveness detection for tamper-proof records." },
        { type: "leave", title: "Leave Management", desc: "Multi-tier approval workflows, leave balance tracking, and calendar sync across your entire organization." },
        { type: "payroll", title: "Payroll Engine", desc: "Automated payslip generation with tax computation, deductions, and direct bank transfer integrations." },
        { type: "roles", title: "Role-Based Access", desc: "Granular permissions for Admin, HR Officer, Payroll Officer, and Employee — with full audit trails." },
        { type: "analytics", title: "Analytics Dashboard", desc: "Workforce insights, attendance heatmaps, and payroll summaries to drive data-backed HR decisions." },
        { type: "ai", title: "AI HR Assistant", desc: "Conversational AI that answers policy questions, drafts offer letters, and flags compliance risks." },
    ];

    const steps = [
        { n: "01", title: "HR Creates Employee", desc: "Admin onboards staff with role assignment, department, and biometric enrollment in under 2 minutes." },
        { n: "02", title: "Employee Marks Attendance", desc: "Face scan + GPS check-in captured and logged instantly. No proxies. No buddy punching." },
        { n: "03", title: "Payroll Auto-Calculates", desc: "At month-end, EmPay computes salaries, deductions, and generates payslips without manual input." },
    ];

    const roles = [
        { name: "Admin", can: ["Full system access", "Manage all users", "View all reports"], cannot: ["Process payroll directly", "Override audit logs"], accent: C.accent },
        { name: "HR Officer", can: ["Manage employees", "Approve leave requests", "View attendance logs"], cannot: ["Edit salary records", "Access billing"], accent: C.cyan },
        { name: "Payroll Officer", can: ["Process payroll runs", "Generate payslips", "Manage deductions"], cannot: ["Modify employee roles", "Delete records"], accent: "#F59E0B" },
        { name: "Employee", can: ["Mark attendance", "Apply for leave", "View own payslip"], cannot: ["Access others' data", "Modify records"], accent: "#10B981" },
    ];

    return (
        <div style={{ ...base, background: C.bg, minHeight: "100vh", overflowX: "hidden" }}>
            <GlobalStyles />

            {/* NAVBAR */}
            <nav style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
                background: scrolled ? "rgba(10,10,15,0.92)" : "transparent",
                backdropFilter: "blur(16px)",
                borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
                transition: "all 0.3s ease",
                padding: "0 5%",
                height: 64,
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div style={{ fontSize: 22, fontWeight: 700, background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    EmPay
                </div>
                <div className="nav-links-desktop" style={{ display: "flex", gap: 32 }}>
                    {navLinks.map(l => <span key={l} className="nav-link">{l}</span>)}
                </div>
                <button className="cta-glow" onClick={() => navigate("/login")} style={{ display: "flex", background: C.accent, color: C.text, border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                    Get Started
                </button>
                <button className="hamburger" onClick={() => setMenuOpen(o => !o)} style={{ display: "none", flexDirection: "column", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: 22, height: 2, background: C.text, borderRadius: 2, transition: "all 0.2s" }} />)}
                </button>
            </nav>

            {/* Mobile Menu */}
            {menuOpen && (
                <div style={{ position: "fixed", top: 64, left: 0, right: 0, background: C.surface, borderBottom: `1px solid ${C.border}`, zIndex: 999, padding: "20px 5%" }}>
                    {navLinks.map(l => <div key={l} style={{ padding: "12px 0", color: C.muted, fontSize: 15, fontWeight: 500, borderBottom: `1px solid ${C.border}` }}>{l}</div>)}
                    <button onClick={() => navigate("/login")} style={{ marginTop: 16, width: "100%", background: C.accent, color: C.text, border: "none", borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>Get Started</button>
                </div>
            )}

            {/* HERO */}
            <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "100px 5% 60px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, background: `radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)`, pointerEvents: "none", borderRadius: "50%", animation: "glowPulse 4s ease-in-out infinite" }} />

                <div className="hero-grid" style={{ display: "flex", alignItems: "center", gap: 60, position: "relative", zIndex: 1 }}>
                    {/* Left: Floating cards */}
                    <div className="hero-float-panel" style={{ flex: 1, position: "relative", height: 420, minWidth: 300 }}>
                        <FloatingCard
                            animClass="" style={{ animation: "float1 3.5s ease-in-out infinite", top: 30, left: 20 }}
                            accentColor="#10B981" title="Attendance Marked" sub="Priya S. — 09:02 AM · Face Verified" />
                        <FloatingCard
                            animClass="" style={{ animation: "float2 3s ease-in-out infinite 0.8s", top: 160, left: 60 }}
                            accentColor={C.cyan} title="Payslip Generated" sub="March 2025 · INR 84,000 · Auto" />
                        <FloatingCard
                            animClass="" style={{ animation: "float3 4s ease-in-out infinite 1.5s", top: 290, left: 10 }}
                            accentColor={C.accent} title="Leave Approved" sub="Rahul M. · 3 days · Annual Leave" />
                        {/* Decorative orb */}
                        <div style={{ position: "absolute", top: 120, right: 20, width: 160, height: 160, border: `1px dashed ${C.border}`, borderRadius: "50%", animation: "rotateSlow 20s linear infinite", opacity: 0.5 }} />
                        <div style={{ position: "absolute", top: 150, right: 50, width: 100, height: 100, border: `1px dashed rgba(20,184,166,0.3)`, borderRadius: "50%", animation: "rotateSlow 14s linear infinite reverse" }} />
                    </div>

                    {/* Right: Copy */}
                    <div style={{ flex: 1, animation: "fadeUp 0.8s ease-out both" }}>
                        <div style={{ display: "inline-block", background: `rgba(20,184,166,0.12)`, border: `1px solid rgba(20,184,166,0.3)`, borderRadius: 20, padding: "5px 14px", fontSize: 12, color: C.accent, fontWeight: 600, marginBottom: 20, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                            Human Resource Management
                        </div>
                        <h1 style={{ fontSize: "clamp(44px, 6vw, 72px)", fontWeight: 800, lineHeight: 1.08, marginBottom: 24 }}>
                            <span style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Smart HR.</span>
                            <br />
                            <span style={{ color: C.text }}>Simplified.</span>
                        </h1>
                        <p style={{ fontSize: 16, color: C.muted, fontWeight: 300, lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
                            One platform for attendance, payroll, and leave — with biometric security baked in from day one.
                        </p>
                        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                            <button className="cta-glow" onClick={() => navigate("/login")} style={{ background: C.accent, color: C.text, border: "none", borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                                Get Started
                            </button>
                            <button className="ghost-btn" style={{ background: "transparent", color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                                See How It Works
                            </button>
                        </div>
                    </div>
                </div>

                <p style={{ textAlign: "center", color: C.muted, fontSize: 15, fontWeight: 300, marginTop: 60, maxWidth: 640, margin: "60px auto 0", lineHeight: 1.7 }}>
                    EmPay brings attendance, payroll, and leave management into one seamless platform — built for teams that move fast.
                </p>

                <div style={{ textAlign: "center", marginTop: 40, animation: "bounce 1.8s ease-in-out infinite" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </section>

            {/* STATS BAR */}
            <div ref={statsRef} className="section-anim" style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "48px 5%" }}>
                <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, maxWidth: 900, margin: "0 auto" }}>
                    {[
                        { val: 4, suffix: "", label: "User Roles" },
                        { val: 3, suffix: "", label: "Core Modules" },
                        { val: 100, suffix: "%", label: "Auto Payslips" },
                        { val: 99, suffix: "%", label: "Face Verified Auth" },
                    ].map(s => (
                        <div key={s.label} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 42, fontWeight: 700, color: C.accent, lineHeight: 1 }}>
                                <CountUp target={s.val} suffix={s.suffix} />
                            </div>
                            <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginTop: 8 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FEATURES */}
            <section style={{ padding: "100px 5%" }}>
                <div ref={featRef} className="section-anim" style={{ maxWidth: 1100, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: 64 }}>
                        <h2 style={{ fontSize: "clamp(30px,4vw,48px)", fontWeight: 700, marginBottom: 12 }}>
                            Everything your HR team needs.
                        </h2>
                        <p style={{ color: C.muted, fontWeight: 300, fontSize: 16 }}>Six integrated modules. One intelligent platform.</p>
                    </div>
                    <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
                        {features.map((f, i) => (
                            <div key={f.type} className="feature-card" style={{
                                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px 24px",
                                animationDelay: `${i * 0.1}s`,
                            }}>
                                <FeatureIcon type={f.type} />
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, marginTop: 8 }}>{f.title}</h3>
                                <p style={{ fontSize: 14, color: C.muted, fontWeight: 300, lineHeight: 1.65 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section style={{ padding: "80px 5%", background: C.surface }}>
                <div ref={howRef} className="section-anim" style={{ maxWidth: 1000, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: 64 }}>
                        <h2 style={{ fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 700, marginBottom: 12 }}>How It Works</h2>
                        <p style={{ color: C.muted, fontWeight: 300, fontSize: 15 }}>Three simple steps to a fully automated HR workflow.</p>
                    </div>
                    <div className="steps-row" style={{ display: "flex", alignItems: "flex-start", gap: 0, position: "relative" }}>
                        {steps.map((step, i) => (
                            <div key={step.n} style={{ display: "flex", alignItems: "flex-start", flex: 1, gap: 0 }}>
                                <div style={{ flex: 1, textAlign: "center", padding: "0 20px" }}>
                                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: `rgba(20,184,166,0.15)`, border: `2px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "pulse 2.5s ease-in-out infinite", animationDelay: `${i * 0.6}s` }}>
                                        <span style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>{step.n}</span>
                                    </div>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>{step.title}</h3>
                                    <p style={{ fontSize: 13, color: C.muted, fontWeight: 300, lineHeight: 1.65 }}>{step.desc}</p>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className="step-connector" style={{ flexShrink: 0, marginTop: 24, width: 60, display: "flex", alignItems: "center" }}>
                                        <div style={{ flex: 1, height: 2, borderTop: `2px dashed ${C.border}` }} />
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill={C.accent} style={{ flexShrink: 0 }}>
                                            <polygon points="0,0 10,5 0,10" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ROLES */}
            <section style={{ padding: "100px 5%" }}>
                <div ref={rolesRef} className="section-anim" style={{ maxWidth: 1100, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: 60 }}>
                        <h2 style={{ fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 700, marginBottom: 12 }}>Built for Every Role</h2>
                        <p style={{ color: C.muted, fontWeight: 300, fontSize: 15 }}>Hover a card to see what each role can and cannot do.</p>
                    </div>
                    <div className="roles-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
                        {roles.map(role => (
                            <div key={role.name} className="role-card" style={{ height: 260, perspective: 1000, cursor: "pointer" }}>
                                <div className="role-card-inner">
                                    {/* Front */}
                                    <div className="role-card-front" style={{ background: C.surface, border: `1px solid ${role.name === "Admin" ? C.accent : C.border}` }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: role.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>{role.name}</div>
                                        <div style={{ fontSize: 11, fontWeight: 500, color: C.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Can Do</div>
                                        {role.can.map(c => (
                                            <div key={c} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                                                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", flexShrink: 0, marginTop: 5 }} />
                                                <span style={{ fontSize: 12, fontWeight: 300, color: C.text, lineHeight: 1.4 }}>{c}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Back */}
                                    <div className="role-card-back" style={{ background: C.surfaceHover, border: `1px solid ${C.border}` }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: role.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>{role.name}</div>
                                        <div style={{ fontSize: 11, fontWeight: 500, color: C.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cannot Do</div>
                                        {role.cannot.map(c => (
                                            <div key={c} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                                                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#EF4444", flexShrink: 0, marginTop: 5 }} />
                                                <span style={{ fontSize: 12, fontWeight: 300, color: "#EF4444", lineHeight: 1.4 }}>{c}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FACE AUTH HIGHLIGHT */}
            <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "100px 5%" }}>
                <div ref={faceRef} className="section-anim face-section" style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", gap: 80 }}>
                    {/* Left */}
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 700, lineHeight: 1.2, marginBottom: 24 }}>
                            Attendance that<br />
                            <span style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>can't be faked.</span>
                        </h2>
                        <p style={{ color: C.muted, fontWeight: 300, fontSize: 15, lineHeight: 1.7, marginBottom: 32, maxWidth: 380 }}>
                            Our multi-layer biometric system ensures every check-in is genuine, location-verified, and tamper-proof.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {[
                                { label: "Face Match", color: C.accent, desc: "Deep neural face recognition with 99.7% accuracy" },
                                { label: "Liveness Check", color: C.cyan, desc: "Detects spoofing from photos, videos, or masks" },
                                { label: "GPS Geofence", color: "#10B981", desc: "Radius-based office zone enforcement" },
                            ].map(pill => (
                                <div key={pill.label} style={{ display: "flex", alignItems: "center", gap: 14, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px" }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: pill.color, boxShadow: `0 0 10px ${pill.color}`, flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{pill.label}</div>
                                        <div style={{ fontSize: 12, color: C.muted, fontWeight: 300 }}>{pill.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Face scan animation */}
                    <div style={{ flex: "0 0 280px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                        <div style={{ position: "relative", width: 220, height: 220 }}>
                            {/* Outer ring */}
                            <div style={{ position: "absolute", inset: 0, border: `2px solid ${C.border}`, borderRadius: "50%" }} />
                            {/* Rotating accent ring */}
                            <div style={{ position: "absolute", inset: 8, border: `2px dashed rgba(20,184,166,0.4)`, borderRadius: "50%", animation: "rotateSlow 8s linear infinite" }} />
                            {/* Face oval */}
                            <div style={{ position: "absolute", top: 30, left: 50, width: 120, height: 150, border: `2px solid ${C.accent}`, borderRadius: "60px 60px 50px 50px", overflow: "hidden" }}>
                                {/* Scan line */}
                                <div style={{
                                    position: "absolute", left: 0, right: 0, height: 2,
                                    background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`,
                                    animation: "scanLine 2.5s linear infinite",
                                    boxShadow: `0 0 12px ${C.cyan}`,
                                }} />
                                {/* Face dots */}
                                <div style={{ position: "absolute", top: 40, left: 30, width: 20, height: 24, border: `1.5px solid rgba(6,182,212,0.5)`, borderRadius: "50%" }} />
                                <div style={{ position: "absolute", top: 40, right: 30, width: 20, height: 24, border: `1.5px solid rgba(6,182,212,0.5)`, borderRadius: "50%" }} />
                                <div style={{ position: "absolute", top: 80, left: 40, width: 40, height: 20, borderBottom: `1.5px solid rgba(6,182,212,0.5)`, borderRadius: "0 0 20px 20px" }} />
                            </div>
                            {/* Lock icon */}
                            <div style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", animation: "lockAppear 2.5s ease-out infinite" }}>
                                <div style={{ width: 32, height: 32, background: "rgba(16,185,129,0.15)", border: "2px solid #10B981", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                                        <rect x="1" y="6" width="12" height="9" rx="2" stroke="#10B981" strokeWidth="1.5" />
                                        <path d="M4 6V4a3 3 0 0 1 6 0v2" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>
                            {/* Corner accents */}
                            {[
                                { top: 10, left: 10, bt: "2px solid transparent", bl: `2px solid ${C.accent}`, bb: "none", br: "none" },
                                { top: 10, right: 10, bt: "2px solid transparent", br: `2px solid ${C.accent}`, bb: "none", bl: "none" },
                                { bottom: 10, left: 10, bb: "2px solid transparent", bl: `2px solid ${C.accent}`, bt: "none", br: "none" },
                                { bottom: 10, right: 10, bb: "2px solid transparent", br: `2px solid ${C.accent}`, bt: "none", bl: "none" },
                            ].map((corner, i) => (
                                <div key={i} style={{ position: "absolute", width: 20, height: 20, ...corner }} />
                            ))}
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            Scanning...
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA BANNER */}
            <section style={{ padding: "120px 5%", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div ref={ctaRef} className="section-anim">
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 500, height: 500, background: `radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 65%)`, pointerEvents: "none", filter: "blur(20px)", animation: "glowPulse 3.5s ease-in-out infinite" }} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <h2 style={{ fontSize: "clamp(32px,5vw,58px)", fontWeight: 700, lineHeight: 1.15, marginBottom: 20 }}>
                            Ready to modernize<br />
                            <span style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>your HR operations?</span>
                        </h2>
                        <p style={{ color: C.muted, fontWeight: 300, fontSize: 16, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
                            Join forward-thinking teams already using EmPay to automate attendance, payroll, and leave management.
                        </p>
                        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                            <button className="cta-glow" onClick={() => navigate("/login")} style={{ background: C.accent, color: C.text, border: "none", borderRadius: 10, padding: "16px 36px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                                Start for Free
                            </button>
                            <button className="ghost-btn" style={{ background: "transparent", color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 36px", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                                Schedule a Demo
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "60px 5% 32px" }}>
                <div className="footer-cols" style={{ display: "flex", gap: 60, marginBottom: 48, flexWrap: "wrap" }}>
                    <div style={{ flex: "0 0 220px" }}>
                        <div style={{ fontSize: 22, fontWeight: 700, background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>EmPay</div>
                        <p style={{ fontSize: 13, color: C.muted, fontWeight: 300, lineHeight: 1.7 }}>Smart HR management for teams that move fast. Attendance, payroll, and leave — unified.</p>
                    </div>
                    {[
                        { heading: "Product", links: ["Features", "How It Works", "Pricing", "Changelog"] },
                        { heading: "Company", links: ["About", "Blog", "Careers", "Contact"] },
                        { heading: "Legal", links: ["Privacy Policy", "Terms of Service", "Security"] },
                    ].map(col => (
                        <div key={col.heading} style={{ flex: 1, minWidth: 120 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>{col.heading}</div>
                            {col.links.map(l => (
                                <div key={l} style={{ fontSize: 13, color: C.muted, marginBottom: 10, fontWeight: 300, cursor: "pointer", transition: "color 0.2s" }}
                                    onMouseEnter={e => e.target.style.color = C.text}
                                    onMouseLeave={e => e.target.style.color = C.muted}>{l}</div>
                            ))}
                        </div>
                    ))}
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 300 }}>
                        {new Date().getFullYear()} EmPay. All rights reserved.
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 300 }}>
                        Built with precision for modern HR teams.
                    </div>
                </div>
            </footer>
        </div>
    );
}