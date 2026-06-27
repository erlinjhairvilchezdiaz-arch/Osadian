import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { colors, fonts, FONT_IMPORT } from "../styles/theme";

function tipoStyle(tipo) {
  if (tipo === "Ingreso") return { bg: colors.sageBg, color: colors.sageText };
  if (tipo === "Egreso") return { bg: colors.redBg, color: colors.red };
  return { bg: colors.borderLight, color: colors.textSoft };
}

export default function Caja() {
  const { perfil } = useAuth();
  const [movs, setMovs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Ingreso");
  const [detalle, setDetalle] = useState("");
  const [monto, setMonto] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setLoading(true);
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("caja_movimientos")
      .select("*")
      .gte("fecha", hoyInicio.toISOString())
      .order("fecha", { ascending: true });
    setMovs(data || []);
    setLoading(false);
  }

  const ingresos = movs.filter((m) => m.monto > 0).reduce((s, m) => s + Number(m.monto), 0);
  const egresos = movs.filter((m) => m.monto < 0).reduce((s, m) => s + Math.abs(Number(m.monto)), 0);
  const saldo = ingresos - egresos;

  async function registrar() {
    if (!detalle || !monto) return;
    const val = parseFloat(monto);
    if (isNaN(val) || val <= 0) return;
    setSaving(true);
    await supabase.from("caja_movimientos").insert({
      tipo: tab,
      detalle,
      monto: tab === "Egreso" ? -val : val,
      usuario_id: perfil?.id,
    });
    setSaving(false);
    setDetalle("");
    setMonto("");
    cargar();
  }

  return (
    <div style={{ fontFamily: fonts.body, background: colors.bg, minHeight: "100vh", display: "flex", color: colors.text }}>
      <style>{FONT_IMPORT}</style>
      <Sidebar />

      <main style={{ flex: 1, padding: "32px 40px", display: "flex", gap: 24, maxWidth: 1100 }}>
        <div style={{ flex: 1.4 }}>
          <p style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 600, margin: "0 0 18px", color: colors.plum }}>Caja</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 }}>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 18px" }}>
              <p style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: colors.textSoft, fontWeight: 600, margin: "0 0 8px" }}>Ingresos</p>
              <p style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 600, margin: 0, color: colors.sageText }}>S/ {ingresos.toFixed(2)}</p>
            </div>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 18px" }}>
              <p style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: colors.textSoft, fontWeight: 600, margin: "0 0 8px" }}>Egresos</p>
              <p style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 600, margin: 0, color: colors.red }}>S/ {egresos.toFixed(2)}</p>
            </div>
            <div style={{ background: colors.plum, borderRadius: 10, padding: "16px 18px" }}>
              <p style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: colors.rose, fontWeight: 600, margin: "0 0 8px" }}>Saldo en caja</p>
              <p style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 600, margin: 0, color: colors.bg }}>S/ {saldo.toFixed(2)}</p>
            </div>
          </div>

          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${colors.borderLight}` }}>
              <p style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 600, margin: 0, color: colors.plum }}>Movimientos de hoy</p>
            </div>
            {loading && <p style={{ padding: "16px 18px", fontSize: 13.5, color: colors.textFaint }}>Cargando movimientos...</p>}
            {!loading && movs.length === 0 && <p style={{ padding: "16px 18px", fontSize: 13.5, color: colors.textFaint }}>Sin movimientos registrados hoy.</p>}
            {!loading && movs.map((m, i) => {
              const st = tipoStyle(m.tipo);
              return (
                <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderTop: i === 0 ? "none" : `1px solid ${colors.borderLight}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12.5, color: colors.textFaint, width: 40 }}>
                      {new Date(m.fecha).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: st.color, background: st.bg, padding: "3px 9px", borderRadius: 12 }}>{m.tipo}</span>
                    <span style={{ fontSize: 13.5 }}>{m.detalle}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: m.monto < 0 ? colors.red : colors.text }}>
                    {m.monto < 0 ? "-" : "+"}S/ {Math.abs(Number(m.monto)).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ width: 320, flexShrink: 0 }}>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "20px 20px 18px", position: "sticky", top: 32 }}>
            <p style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 600, margin: "0 0 14px", color: colors.plum }}>Registrar movimiento</p>

            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {["Ingreso", "Egreso"].map((t) => (
                <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 13, fontWeight: 500, cursor: "pointer", background: tab === t ? colors.plum : colors.card, color: tab === t ? colors.bg : colors.textMuted }}>
                  {t}
                </button>
              ))}
            </div>

            <label style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: colors.textSoft, fontWeight: 600 }}>Detalle</label>
            <input
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder={tab === "Ingreso" ? "Ej. Venta extra, abono" : "Ej. Compra de insumos"}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bg, fontSize: 13.5, fontFamily: fonts.body, outline: "none", boxSizing: "border-box", margin: "6px 0 14px" }}
            />

            <label style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: colors.textSoft, fontWeight: 600 }}>Monto (S/)</label>
            <input
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              type="number"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bg, fontSize: 13.5, fontFamily: fonts.body, outline: "none", boxSizing: "border-box", margin: "6px 0 18px" }}
            />

            <button onClick={registrar} disabled={saving} style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", background: colors.rose, color: colors.plum, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Guardando..." : `Registrar ${tab.toLowerCase()}`}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
