import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";

const C = {
  bg: "#0A0A0F",
  surface: "#13131A",
  accent: "#14B8A6",
  accentGlow: "rgba(20,184,166,0.25)",
  cyan: "#06B6D4",
  text: "#F0FDFA",
  muted: "#8B8A9B",
  border: "#2E2E3E",
};

const KEYFRAMES = `
  @keyframes loginSlideIn {
    from { opacity: 0; transform: translateX(40px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes loginFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes loginShake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-5px); }
    80% { transform: translateX(5px); }
  }
  @keyframes loginSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes loginCheckPop {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes loginStrokeDraw {
    from { stroke-dashoffset: 24; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes loginParticleFloat {
    0% { transform: translateY(0) translateX(0); opacity: 0.3; }
    25% { opacity: 0.7; }
    50% { transform: translateY(-40px) translateX(20px); opacity: 0.5; }
    75% { opacity: 0.6; }
    100% { transform: translateY(-80px) translateX(-10px); opacity: 0; }
  }
  @keyframes loginGlowPulse {
    0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.08); }
  }
`;

function FloatingParticles() {
  const particles = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 3,
      delay: Math.random() * 6,
      duration: 4 + Math.random() * 5,
      opacity: 0.15 + Math.random() * 0.3,
    }))
  ).current;

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.id % 3 === 0 ? C.accent : p.id % 3 === 1 ? C.cyan : C.muted,
            opacity: p.opacity,
            animation: `loginParticleFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});
  const [serverMsg, setServerMsg] = useState("");
  
  // Step 1 State
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  
  // Step 2 State
  const [companyId, setCompanyId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(link);
    setMounted(true);
    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, []);

  const handleNext = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!companyName.trim()) newErrors.companyName = "Company Name is required";
    setError(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await authService.createCompany({ name: companyName, logo_url: logoUrl });
      setLoading(false);
      if (response?.data?.id) {
        setCompanyId(response.data.id);
        setStep(2);
      } else {
        setError({ submit: "Failed to retrieve company ID. Please try again." });
      }
    } catch (err) {
      setLoading(false);
      setError({ submit: err.response?.data?.message || err.message || "Failed to register company" });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = "First Name is required";
    if (!lastName.trim()) newErrors.lastName = "Last Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Invalid email format";
    if (phone && !/^\+?[0-9]{10,15}$/.test(phone.replace(/\s+/g, ''))) newErrors.phone = "Invalid phone number";
    
    setError(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await authService.registerUser({
        company_id: companyId,
        name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone || null
      });
      setLoading(false);
      setStep(3); // Success step
    } catch (err) {
      setLoading(false);
      setError({ submit: err.response?.data?.message || err.message || "Registration failed" });
    }
  };

  const base = { fontFamily: "Poppins, sans-serif", color: C.text };
  const inputBase = {
    width: "100%", background: C.bg, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: "13px 16px", fontSize: 14, fontWeight: 400,
    color: C.text, outline: "none", fontFamily: "Poppins, sans-serif",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease", boxSizing: "border-box",
  };
  const inputFocusStyle = { borderColor: C.accent, boxShadow: `0 0 0 3px ${C.accentGlow}` };

  return (
    <div style={{ ...base, background: C.bg, minHeight: "100vh", display: "flex", overflow: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      {/* LEFT PANEL */}
      <div id="login-left-panel" style={{
        flex: 1, background: C.surface, position: "relative", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", overflow: "hidden",
        animation: mounted ? "loginFadeIn 0.4s ease-out both" : "none",
        ...(typeof window !== "undefined" && window.innerWidth < 1024 ? { display: "none" } : {}),
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", width: 400, height: 400,
          background: `radial-gradient(circle, rgba(20,184,166,0.14) 0%, rgba(6,182,212,0.06) 40%, transparent 70%)`,
          borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none", animation: "loginGlowPulse 5s ease-in-out infinite",
        }} />
        <FloatingParticles />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <div style={{
            fontSize: 52, fontWeight: 700, background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 16, letterSpacing: "-0.02em",
          }}>EmPay</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: C.text, marginBottom: 24, opacity: 0.92 }}>
            Join the Network
          </div>
          <p style={{ fontSize: 15, color: C.muted, fontWeight: 400, maxWidth: 320, lineHeight: 1.6 }}>
            Set up your organization in minutes and unlock seamless HR automation.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div id="login-right-panel" style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "40px 24px", animation: mounted ? "loginSlideIn 0.5s ease-out both" : "none",
        minHeight: "100vh", boxSizing: "border-box",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{
              fontSize: 20, fontWeight: 700, background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 32, cursor: "pointer"
            }} onClick={() => navigate("/")}>
              EmPay
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8, lineHeight: 1.2 }}>
              {step === 1 ? "Register Company" : step === 2 ? "Admin Details" : "Registration Sent"}
            </h1>
            <p style={{ fontSize: 14, color: C.muted, fontWeight: 400 }}>
              {step === 1 && "Start by adding your company details"}
              {step === 2 && "Setup the primary admin account"}
              {step === 3 && "Thank you for registering"}
            </p>
          </div>

          {error.submit && (
            <div style={{ fontSize: 13, color: "#EF4444", marginBottom: 16, fontWeight: 500, textAlign: "center", padding: "8px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
              {error.submit}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleNext} style={{ width: "100%" }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 8 }}>Company Name</label>
                <div style={{ animation: error.companyName ? "loginShake 0.3s ease" : "none" }}>
                  <input
                    type="text" placeholder="e.g. Acme Corp" value={companyName}
                    onChange={(e) => { setCompanyName(e.target.value); if (error.companyName) setError(p => ({...p, companyName: ""})); }}
                    style={{ ...inputBase, borderColor: error.companyName ? "#EF4444" : C.border }}
                    onFocus={e => { if (!error.companyName) { e.target.style.borderColor = inputFocusStyle.borderColor; e.target.style.boxShadow = inputFocusStyle.boxShadow; } }}
                    onBlur={e => { if (!error.companyName) { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; } }}
                  />
                </div>
                {error.companyName && <div style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>{error.companyName}</div>}
              </div>

              <div style={{ marginBottom: 32 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 8 }}>Company Logo URL (Optional)</label>
                <div>
                  <input
                    type="text" placeholder="https://example.com/logo.png" value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    style={{ ...inputBase, borderColor: C.border }}
                    onFocus={e => { e.target.style.borderColor = inputFocusStyle.borderColor; e.target.style.boxShadow = inputFocusStyle.boxShadow; }}
                    onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={{
                width: "100%", height: 48, background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`,
                color: C.text, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
                cursor: loading ? "default" : "pointer", fontFamily: "Poppins, sans-serif",
                transition: "transform 0.3s ease, box-shadow 0.3s ease", display: "flex", alignItems: "center", justifyContent: "center"
              }} onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${C.accentGlow}, 0 0 48px rgba(20,184,166,0.15)`; } }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                {loading ? <div style={{ width: 22, height: 22, border: `2.5px solid rgba(240,253,250,0.3)`, borderTopColor: C.text, borderRadius: "50%", animation: "loginSpin 0.7s linear infinite" }} /> : "NEXT"}
              </button>
              
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <span style={{ fontSize: 13, color: C.muted, fontWeight: 400 }}>
                  Already have an account?{" "}
                  <span onClick={() => navigate("/login")} style={{ color: C.accent, fontWeight: 500, cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={(e) => { e.target.style.opacity = "0.8"; }} onMouseLeave={(e) => { e.target.style.opacity = "1"; }}>
                    Sign in
                  </span>
                </span>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleRegister} style={{ width: "100%" }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 8 }}>Company ID</label>
                <input type="text" value={companyId} disabled style={{ ...inputBase, background: "rgba(255,255,255,0.03)", color: C.muted }} />
              </div>

              <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 8 }}>First Name</label>
                  <div style={{ animation: error.firstName ? "loginShake 0.3s ease" : "none" }}>
                    <input
                      type="text" placeholder="John" value={firstName}
                      onChange={(e) => { setFirstName(e.target.value); if (error.firstName) setError(p => ({...p, firstName: ""})); }}
                      style={{ ...inputBase, borderColor: error.firstName ? "#EF4444" : C.border }}
                      onFocus={e => { if (!error.firstName) { e.target.style.borderColor = inputFocusStyle.borderColor; e.target.style.boxShadow = inputFocusStyle.boxShadow; } }}
                      onBlur={e => { if (!error.firstName) { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; } }}
                    />
                  </div>
                  {error.firstName && <div style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>{error.firstName}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 8 }}>Last Name</label>
                  <div style={{ animation: error.lastName ? "loginShake 0.3s ease" : "none" }}>
                    <input
                      type="text" placeholder="Doe" value={lastName}
                      onChange={(e) => { setLastName(e.target.value); if (error.lastName) setError(p => ({...p, lastName: ""})); }}
                      style={{ ...inputBase, borderColor: error.lastName ? "#EF4444" : C.border }}
                      onFocus={e => { if (!error.lastName) { e.target.style.borderColor = inputFocusStyle.borderColor; e.target.style.boxShadow = inputFocusStyle.boxShadow; } }}
                      onBlur={e => { if (!error.lastName) { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; } }}
                    />
                  </div>
                  {error.lastName && <div style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>{error.lastName}</div>}
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 8 }}>Email Address</label>
                <div style={{ animation: error.email ? "loginShake 0.3s ease" : "none" }}>
                  <input
                    type="email" placeholder="john@company.com" value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error.email) setError(p => ({...p, email: ""})); }}
                    style={{ ...inputBase, borderColor: error.email ? "#EF4444" : C.border }}
                    onFocus={e => { if (!error.email) { e.target.style.borderColor = inputFocusStyle.borderColor; e.target.style.boxShadow = inputFocusStyle.boxShadow; } }}
                    onBlur={e => { if (!error.email) { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; } }}
                  />
                </div>
                {error.email && <div style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>{error.email}</div>}
              </div>

              <div style={{ marginBottom: 32 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 8 }}>Phone Number (Optional)</label>
                <div style={{ animation: error.phone ? "loginShake 0.3s ease" : "none" }}>
                  <input
                    type="tel" placeholder="+1 234 567 8900" value={phone}
                    onChange={(e) => { setPhone(e.target.value); if (error.phone) setError(p => ({...p, phone: ""})); }}
                    style={{ ...inputBase, borderColor: error.phone ? "#EF4444" : C.border }}
                    onFocus={e => { if (!error.phone) { e.target.style.borderColor = inputFocusStyle.borderColor; e.target.style.boxShadow = inputFocusStyle.boxShadow; } }}
                    onBlur={e => { if (!error.phone) { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; } }}
                  />
                </div>
                {error.phone && <div style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>{error.phone}</div>}
              </div>

              <button type="submit" disabled={loading} style={{
                width: "100%", height: 48, background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`,
                color: C.text, border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
                cursor: loading ? "default" : "pointer", fontFamily: "Poppins, sans-serif",
                transition: "transform 0.3s ease, box-shadow 0.3s ease", display: "flex", alignItems: "center", justifyContent: "center"
              }} onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${C.accentGlow}, 0 0 48px rgba(20,184,166,0.15)`; } }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                {loading ? <div style={{ width: 22, height: 22, border: `2.5px solid rgba(240,253,250,0.3)`, borderTopColor: C.text, borderRadius: "50%", animation: "loginSpin 0.7s linear infinite" }} /> : "REGISTER"}
              </button>
              
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <span onClick={() => setStep(1)} style={{ fontSize: 13, color: C.muted, fontWeight: 500, cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = C.text} onMouseLeave={e => e.target.style.color = C.muted}>
                  ← Back to Company Details
                </span>
              </div>
            </form>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", border: "2px solid #10B981" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L19 7" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12, color: C.text }}>
                Wait till your company gets verified
              </h2>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.6, marginBottom: 32 }}>
                Your registration has been submitted successfully. You will be able to log in once a super admin verifies your company.
              </p>
              <button onClick={() => navigate("/login")} style={{
                background: "transparent", color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Poppins, sans-serif", transition: "all 0.2s"
              }} onMouseEnter={e => { e.target.style.background = "rgba(255,255,255,0.05)"; }} onMouseLeave={e => { e.target.style.background = "transparent"; }}>
                Return to Login
              </button>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        #login-left-panel { display: flex; }
        @media (max-width: 1023px) {
          #login-left-panel { display: none !important; }
          #login-right-panel { flex: 1 1 100% !important; }
        }
        @media (min-width: 1024px) {
          #login-left-panel { display: flex !important; flex: 1 1 50%; }
          #login-right-panel { flex: 1 1 50%; }
        }
      `}} />
    </div>
  );
}
