import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { colors, fonts, FONT_IMPORT } from "../styles/theme";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await login(email, password);
    setLoading(false);
    if (err) setError("Correo o contraseña incorrectos.");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.body,
      }}
    >
      <style>{FONT_IMPORT}</style>
      <form
        onSubmit={handleSubmit}
        style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: 14,
          padding: "36px 36px 30px",
          width: 340,
        }}
      >
        <img
          src="/logo.png"
          alt="Osadian"
          onError={(e) => { e.target.style.display = "none"; document.getElementById("login-title").style.display = "block"; }}
          style={{ maxWidth: 160, maxHeight: 56, objectFit: "contain", marginBottom: 6 }}
        />
        <p id="login-title" style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 600, margin: "0 0 2px", color: colors.plum, display: "none" }}>
          Osadian
        </p>
        <p style={{ fontSize: 13, color: colors.textSoft, margin: "0 0 26px" }}>
          Ingresa a tu cuenta para continuar
        </p>

        <label style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: colors.textSoft, fontWeight: 600 }}>
          Correo
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="elena@osadian.co"
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${colors.border}`,
            background: colors.bg, fontSize: 13.5, fontFamily: fonts.body, outline: "none", boxSizing: "border-box", margin: "6px 0 16px",
          }}
        />

        <label style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: colors.textSoft, fontWeight: 600 }}>
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••"
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${colors.border}`,
            background: colors.bg, fontSize: 13.5, fontFamily: fonts.body, outline: "none", boxSizing: "border-box", margin: "6px 0 20px",
          }}
        />

        {error && (
          <p style={{ fontSize: 12.5, color: colors.red, margin: "0 0 14px" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
            cursor: loading ? "default" : "pointer", background: colors.rose, color: colors.plum,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
