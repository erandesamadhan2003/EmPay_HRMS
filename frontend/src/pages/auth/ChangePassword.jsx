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

function EyeIcon({ open }) {
  if (open) {
    return (
      <div style={{ width: 20, height: 20, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: 16, height: 10, border: `1.5px solid ${C.muted}`,
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", width: 5, height: 5,
          borderRadius: "50%", background: C.muted,
          top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        }} />
      </div>
    );
  }
  return (
    <div style={{ width: 20, height: 20, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: 16, height: 10, border: `1.5px solid ${C.muted}`,
        borderRadius: "50%",
      }} />
      <div style={{
        position: "absolute", width: 5, height: 5,
        borderRadius: "50%", background: C.muted,
        top: "50%", left: "50%", transform: "translate(-50%, -50%)",
      }} />
      <div style={{
        position: "absolute", width: 22, height: 1.5,
        background: C.muted, transform: "rotate(-45deg)",
        top: "50%", left: "-1px",
      }} />
    </div>
  );
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!currentPassword.trim()) newErrors.currentPassword = "Original password is required";
    if (!newPassword.trim()) newErrors.newPassword = "New password is required";
    else if (newPassword.length < 6) newErrors.newPassword = "Password must be at least 6 characters";
    if (!confirmPassword.trim()) newErrors.confirmPassword = "Confirm password is required";
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    
    setError(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }, 1500);
    } catch (err) {
      setLoading(false);
      setError({ submit: err.response?.data?.message || err.message || "Failed to change password" });
    }
  };

  const base = { fontFamily: "Poppins, sans-serif", color: C.text };

  const inputBase = {
    width: "100%",
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: "13px 16px",
    fontSize: 14,
    fontWeight: 400,
    color: C.text,
    outline: "none",
    fontFamily: "Poppins, sans-serif",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    boxSizing: "border-box",
  };

  const inputFocusStyle = {
    borderColor: C.accent,
    boxShadow: `0 0 0 3px ${C.accentGlow}`,
  };

  return (
    <div style={{
      ...base,
      background: C.bg,
      minHeight: "100vh",
      display: "flex",
      overflow: "hidden",
    }}>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      {/* LEFT PANEL */}
      <div
        id="login-left-panel"
        style={{
          flex: 1,
          background: C.surface,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          animation: mounted ? "loginFadeIn 0.4s ease-out both" : "none",
          ...(typeof window !== "undefined" && window.innerWidth < 1024
            ? { display: "none" }
            : {}),
        }}
      >
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 400,
          height: 400,
          background: `radial-gradient(circle, rgba(20,184,166,0.14) 0%, rgba(6,182,212,0.06) 40%, transparent 70%)`,
          borderRadius: "50%",
          filter: "blur(40px)",
          pointerEvents: "none",
          animation: "loginGlowPulse 5s ease-in-out infinite",
        }} />

        <FloatingParticles />

        <div style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
        }}>
          <div style={{
            fontSize: 52,
            fontWeight: 700,
            background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}>
            EmPay
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 600,
            color: C.text,
            marginBottom: 24,
            opacity: 0.92,
          }}>
            Secure Your Account
          </div>
          <p style={{
            fontSize: 15,
            color: C.muted,
            fontWeight: 400,
            maxWidth: 320,
            lineHeight: 1.6,
          }}>
            For your security, you must change your password before accessing the system.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        id="login-right-panel"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          animation: mounted ? "loginSlideIn 0.5s ease-out both" : "none",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div>
            <div style={{
              fontSize: 20,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 32,
            }}>
              EmPay
            </div>
            <h1 style={{
              fontSize: 28,
              fontWeight: 600,
              marginBottom: 8,
              lineHeight: 1.2,
            }}>
              Change Password
            </h1>
            <p style={{
              fontSize: 14,
              color: C.muted,
              fontWeight: 400,
              marginBottom: 36,
            }}>
              Please set a new password to continue
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            
            {/* Original Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 8 }}>
                Original Password
              </label>
              <div style={{ position: "relative", animation: error.currentPassword ? "loginShake 0.3s ease" : "none" }}>
                <input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (error.currentPassword) setError((prev) => ({ ...prev, currentPassword: "" }));
                  }}
                  style={{ ...inputBase, paddingRight: 48, borderColor: error.currentPassword ? "#EF4444" : C.border }}
                  onFocus={(e) => { if (!error.currentPassword) { e.target.style.borderColor = inputFocusStyle.borderColor; e.target.style.boxShadow = inputFocusStyle.boxShadow; } }}
                  onBlur={(e) => { if (!error.currentPassword) { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; } }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <EyeIcon open={showCurrent} />
                </button>
              </div>
              {error.currentPassword && <div style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>{error.currentPassword}</div>}
            </div>

            {/* New Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 8 }}>
                New Password
              </label>
              <div style={{ position: "relative", animation: error.newPassword ? "loginShake 0.3s ease" : "none" }}>
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error.newPassword) setError((prev) => ({ ...prev, newPassword: "" }));
                  }}
                  style={{ ...inputBase, paddingRight: 48, borderColor: error.newPassword ? "#EF4444" : C.border }}
                  onFocus={(e) => { if (!error.newPassword) { e.target.style.borderColor = inputFocusStyle.borderColor; e.target.style.boxShadow = inputFocusStyle.boxShadow; } }}
                  onBlur={(e) => { if (!error.newPassword) { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; } }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <EyeIcon open={showNew} />
                </button>
              </div>
              {error.newPassword && <div style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>{error.newPassword}</div>}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 32 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 8 }}>
                Confirm Password
              </label>
              <div style={{ position: "relative", animation: error.confirmPassword ? "loginShake 0.3s ease" : "none" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error.confirmPassword) setError((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                  style={{ ...inputBase, paddingRight: 48, borderColor: error.confirmPassword ? "#EF4444" : C.border }}
                  onFocus={(e) => { if (!error.confirmPassword) { e.target.style.borderColor = inputFocusStyle.borderColor; e.target.style.boxShadow = inputFocusStyle.boxShadow; } }}
                  onBlur={(e) => { if (!error.confirmPassword) { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; } }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {error.confirmPassword && <div style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>{error.confirmPassword}</div>}
            </div>

            {error.submit && (
              <div style={{
                fontSize: 13,
                color: "#EF4444",
                marginBottom: 16,
                fontWeight: 500,
                textAlign: "center",
                padding: "8px",
                background: "rgba(239, 68, 68, 0.1)",
                borderRadius: "8px",
                border: "1px solid rgba(239, 68, 68, 0.2)"
              }}>
                {error.submit}
              </div>
            )}

            {/* UPDATE PASSWORD button */}
            <div>
              <button
                type="submit"
                disabled={loading || success}
                style={{
                  width: "100%",
                  height: 48,
                  background: success
                    ? "#10B981"
                    : `linear-gradient(135deg, ${C.accent}, ${C.cyan})`,
                  color: C.text,
                  border: "none",
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading || success ? "default" : "pointer",
                  fontFamily: "Poppins, sans-serif",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!loading && !success) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 8px 32px ${C.accentGlow}, 0 0 48px rgba(20,184,166,0.15)`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {loading ? (
                  <div style={{
                    width: 22,
                    height: 22,
                    border: `2.5px solid rgba(240,253,250,0.3)`,
                    borderTopColor: C.text,
                    borderRadius: "50%",
                    animation: "loginSpin 0.7s linear infinite",
                  }} />
                ) : success ? (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ animation: "loginCheckPop 0.4s ease-out both" }}
                  >
                    <path
                      d="M5 12l5 5L19 7"
                      stroke={C.text}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="24"
                      strokeDashoffset="0"
                      style={{ animation: "loginStrokeDraw 0.5s ease-out both 0.1s" }}
                    />
                  </svg>
                ) : (
                  "UPDATE PASSWORD"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        #login-left-panel {
          display: flex;
        }
        @media (max-width: 1023px) {
          #login-left-panel {
            display: none !important;
          }
          #login-right-panel {
            flex: 1 1 100% !important;
          }
        }
        @media (min-width: 1024px) {
          #login-left-panel {
            display: flex !important;
            flex: 1 1 50%;
          }
          #login-right-panel {
            flex: 1 1 50%;
          }
        }
      `}} />
    </div>
  );
}
