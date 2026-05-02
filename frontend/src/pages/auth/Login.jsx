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
  @keyframes loginFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
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
  @keyframes loginFloat1 {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }
  @keyframes loginFloat2 {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-16px); }
  }
  @keyframes loginFloat3 {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
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
  @keyframes loginStrokeDraw {
    from { stroke-dashoffset: 24; }
    to { stroke-dashoffset: 0; }
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

export default function Login() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [stageReady, setStageReady] = useState([false, false, false, false, false, false, false, false]);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(link);

    setMounted(true);

    const timers = [];
    const delays = [100, 250, 400, 550, 700, 850, 1000, 1150];
    delays.forEach((d, i) => {
      timers.push(setTimeout(() => {
        setStageReady((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, d));
    });

    return () => {
      timers.forEach(clearTimeout);
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!loginId.trim()) newErrors.loginId = "Login ID is required";
    if (!password.trim()) newErrors.password = "Password is required";
    setError(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const response = await authService.login({ login_id: loginId, password });
      setLoading(false);
      setSuccess(true);
      
      const mustChange = response?.data?.must_change_pwd || response?.must_change_pwd;
      
      setTimeout(() => {
        if (mustChange) {
          navigate("/change-password");
        } else {
          // Temporarily redirect to root until dashboard is built
          navigate("/"); 
        }
      }, 1000);
    } catch (err) {
      setLoading(false);
      setError({ submit: err.response?.data?.message || err.message || "Login failed" });
    }
  };

  const base = { fontFamily: "Poppins, sans-serif", color: C.text };

  const featurePills = [
    { label: "Face Auth Enabled", color: C.accent, delay: "0s" },
    { label: "Auto Payroll", color: C.cyan, delay: "0.3s" },
    { label: "Leave Tracking", color: "#10B981", delay: "0.6s" },
  ];

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
        {/* Radial glow blob */}
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

        {/* Floating dot particles */}
        <FloatingParticles />

        {/* Logo */}
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

          {/* Tagline */}
          <div style={{
            fontSize: 28,
            fontWeight: 600,
            color: C.text,
            marginBottom: 48,
            opacity: 0.92,
          }}>
            Smart HR. Simplified.
          </div>

          {/* Feature pills */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            alignItems: "center",
          }}>
            {featurePills.map((pill, i) => (
              <div
                key={pill.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: `rgba(20,184,166,0.06)`,
                  border: `1px solid ${C.border}`,
                  borderRadius: 24,
                  padding: "10px 22px",
                  animation: `loginFloat${i + 1} ${3.2 + i * 0.4}s ease-in-out ${pill.delay} infinite`,
                }}
              >
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: pill.color,
                  boxShadow: `0 0 10px ${pill.color}`,
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: C.text,
                  letterSpacing: "0.02em",
                }}>
                  {pill.label}
                </span>
              </div>
            ))}
          </div>
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
          {/* EmPay wordmark */}
          <div style={{
            opacity: stageReady[0] ? 1 : 0,
            transform: stageReady[0] ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}>
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
          </div>

          {/* Heading */}
          <div style={{
            opacity: stageReady[1] ? 1 : 0,
            transform: stageReady[1] ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}>
            <h1 style={{
              fontSize: 28,
              fontWeight: 600,
              marginBottom: 8,
              lineHeight: 1.2,
            }}>
              Welcome back
            </h1>
            <p style={{
              fontSize: 14,
              color: C.muted,
              fontWeight: 400,
              marginBottom: 36,
            }}>
              Sign in to your workspace
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            {/* Login ID field */}
            <div style={{
              marginBottom: 22,
              opacity: stageReady[2] ? 1 : 0,
              transform: stageReady[2] ? "translateY(0)" : "translateY(18px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}>
              <label style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: C.text,
                marginBottom: 8,
              }}>
                Login ID / Email
              </label>
              <div style={{
                animation: error.loginId ? "loginShake 0.3s ease" : "none",
              }}>
                <input
                  id="login-id-input"
                  type="text"
                  placeholder="e.g. OIJODO20220001"
                  value={loginId}
                  onChange={(e) => {
                    setLoginId(e.target.value);
                    if (error.loginId) setError((prev) => ({ ...prev, loginId: "" }));
                  }}
                  style={{
                    ...inputBase,
                    borderColor: error.loginId ? "#EF4444" : C.border,
                  }}
                  onFocus={(e) => {
                    if (!error.loginId) {
                      e.target.style.borderColor = inputFocusStyle.borderColor;
                      e.target.style.boxShadow = inputFocusStyle.boxShadow;
                    }
                  }}
                  onBlur={(e) => {
                    if (!error.loginId) {
                      e.target.style.borderColor = C.border;
                      e.target.style.boxShadow = "none";
                    }
                  }}
                />
              </div>
              {error.loginId && (
                <div style={{
                  fontSize: 12,
                  color: "#EF4444",
                  marginTop: 6,
                  fontWeight: 400,
                }}>
                  {error.loginId}
                </div>
              )}
            </div>

            {/* Password field */}
            <div style={{
              marginBottom: 12,
              opacity: stageReady[3] ? 1 : 0,
              transform: stageReady[3] ? "translateY(0)" : "translateY(18px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}>
              <label style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: C.text,
                marginBottom: 8,
              }}>
                Password
              </label>
              <div style={{
                position: "relative",
                animation: error.password ? "loginShake 0.3s ease" : "none",
              }}>
                <input
                  id="login-password-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error.password) setError((prev) => ({ ...prev, password: "" }));
                  }}
                  style={{
                    ...inputBase,
                    paddingRight: 48,
                    borderColor: error.password ? "#EF4444" : C.border,
                  }}
                  onFocus={(e) => {
                    if (!error.password) {
                      e.target.style.borderColor = inputFocusStyle.borderColor;
                      e.target.style.boxShadow = inputFocusStyle.boxShadow;
                    }
                  }}
                  onBlur={(e) => {
                    if (!error.password) {
                      e.target.style.borderColor = C.border;
                      e.target.style.boxShadow = "none";
                    }
                  }}
                />
                <button
                  type="button"
                  id="login-toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {error.password && (
                <div style={{
                  fontSize: 12,
                  color: "#EF4444",
                  marginTop: 6,
                  fontWeight: 400,
                }}>
                  {error.password}
                </div>
              )}
            </div>

            {/* Forgot password */}
            <div style={{
              textAlign: "right",
              marginBottom: 28,
              opacity: stageReady[4] ? 1 : 0,
              transition: "opacity 0.4s ease",
            }}>
              <span
                id="login-forgot-password"
                style={{
                  fontSize: 13,
                  color: C.accent,
                  cursor: "pointer",
                  fontWeight: 500,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => { e.target.style.opacity = "0.8"; }}
                onMouseLeave={(e) => { e.target.style.opacity = "1"; }}
              >
                Forgot password?
              </span>
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

            {/* SIGN IN button */}
            <div style={{
              opacity: stageReady[5] ? 1 : 0,
              transform: stageReady[5] ? "translateY(0)" : "translateY(18px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}>
              <button
                id="login-submit-btn"
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
                  "SIGN IN"
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "28px 0",
            opacity: stageReady[6] ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 400 }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* Contact HR */}
          <div style={{
            textAlign: "center",
            marginBottom: 32,
            opacity: stageReady[6] ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}>
            <span style={{ fontSize: 13, color: C.muted, fontWeight: 400 }}>
              Don't have an account?{" "}
              <span 
                onClick={() => navigate("/register")}
                style={{ color: C.accent, fontWeight: 500, cursor: "pointer", transition: "opacity 0.2s" }}
                onMouseEnter={(e) => { e.target.style.opacity = "0.8"; }}
                onMouseLeave={(e) => { e.target.style.opacity = "1"; }}
              >
                Register here
              </span>
            </span>
          </div>

          {/* Info card */}
          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "16px 20px",
            opacity: stageReady[7] ? 1 : 0,
            transform: stageReady[7] ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}>
            <div style={{
              fontSize: 13,
              color: C.text,
              fontWeight: 500,
              marginBottom: 6,
              lineHeight: 1.5,
            }}>
              Your Login ID format: [Company][Name][Year][Serial]
            </div>
            <div style={{
              fontSize: 12,
              color: C.muted,
              fontWeight: 400,
              lineHeight: 1.5,
            }}>
              e.g. OIJODO20220001
            </div>
          </div>
        </div>
      </div>

      {/* Responsive styles injected via style tag */}
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
