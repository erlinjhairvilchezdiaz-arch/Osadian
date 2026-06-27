import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { colors, fonts, FONT_IMPORT } from "../styles/theme";

const metodos = ["Efectivo", "Tarjeta", "Yape"];

export default function Ventas() {
  const { perfil } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [metodo, setMetodo] = useState("Efectivo");
  const [cobrando, setCobrando] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);

  useEffect(() => {
    cargarCatalogo();
  }, []);

  async function cargarCatalogo() {
    const { data } = await supabase.from("productos").select("*").eq("activo", true).gt("stock", 0).order("nombre");
    setCatalog(data || []);
  }

  const results = query
    ? catalog.filter(
        (p) =>
          p.nombre.toLowerCase().includes(query.toLowerCase()) ||
          (p.marca || "").toLowerCase().includes(query.toLowerCase()) ||
          (p.codigo_barras || "").includes(query)
      )
    : [];

  // Si el query coincide exacto con un código de barras, agrega directo (flujo de lector USB)
  function handleQueryChange(value) {
    setQuery(value);
    const exacto = catalog.find((p) => p.codigo_barras === value);
    if (exacto) addToCart(exacto);
  }

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      const enCarrito = existing?.qty || 0;
      if (enCarrito >= product.stock) return prev; // no exceder stock disponible
      if (existing) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...product, qty: 1 }];
    });
    setQuery("");
  }

  function updateQty(id, delta) {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.min(i.qty + delta, i.stock) } : i)).filter((i) => i.qty > 0)
    );
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  const total = cart.reduce((sum, i) => sum + i.precio * i.qty, 0);

  async function cobrar() {
    if (cart.length === 0 || !perfil) return;
    setCobrando(true);

    const items = cart.map((i) => ({
      producto_id: i.id,
      nombre_producto: i.nombre,
      cantidad: i.qty,
      precio_unitario: i.precio,
    }));

    const { data, error } = await supabase.rpc("registrar_venta", {
      p_items: items,
      p_metodo_pago: metodo,
      p_usuario_id: perfil.id,
    });

    setCobrando(false);

    if (error) {
      alert("Hubo un error al registrar la venta: " + error.message);
      return;
    }

    setConfirmacion({ id: data, total, items: cart, metodo });
    setCart([]);
    cargarCatalogo();
  }

  return (
    <div style={{ fontFamily: fonts.body, background: colors.bg, minHeight: "100vh", display: "flex", color: colors.text }}>
      <style>{FONT_IMPORT}</style>
      <Sidebar />

      <main style={{ flex: 1, padding: "32px 40px", display: "flex", gap: 24 }}>
        <div style={{ flex: 1.3 }}>
          <p style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 600, margin: "0 0 18px", color: colors.plum }}>Nueva venta</p>

          <div style={{ position: "relative", marginBottom: 16 }}>
            <i className="ti ti-barcode" style={{ position: "absolute", left: 14, top: 14, fontSize: 18, color: colors.textFaint }} aria-hidden="true" />
            <input
              autoFocus
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Escanea un código de barras o busca un producto"
              style={{ width: "100%", padding: "13px 14px 13px 42px", borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.card, fontSize: 14.5, fontFamily: fonts.body, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {query && (
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, overflow: "hidden" }}>
              {results.length === 0 && <p style={{ padding: "16px 18px", fontSize: 13.5, color: colors.textFaint, margin: 0 }}>Sin resultados.</p>}
              {results.map((p, i) => (
                <div key={p.id} onClick={() => addToCart(p)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderTop: i === 0 ? "none" : `1px solid ${colors.borderLight}`, cursor: "pointer" }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0 }}>{p.nombre}</p>
                    <p style={{ fontSize: 11.5, color: colors.textFaint, margin: "2px 0 0" }}>{p.marca} · stock {p.stock}</p>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>S/ {Number(p.precio).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {!query && (
            <div>
              <p style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: colors.textSoft, fontWeight: 600, margin: "20px 0 10px" }}>
                Productos disponibles
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {catalog.slice(0, 8).map((p) => (
                  <div key={p.id} onClick={() => addToCart(p)} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer" }}>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{p.nombre}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: colors.rose, margin: "6px 0 0" }}>S/ {Number(p.precio).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 360, flexShrink: 0 }}>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "20px 20px 18px", position: "sticky", top: 32 }}>
            <p style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 600, margin: "0 0 14px", color: colors.plum }}>Ticket actual</p>

            {cart.length === 0 && <p style={{ fontSize: 13, color: colors.textFaint, margin: "8px 0 18px" }}>Agrega productos para iniciar la venta.</p>}

            {cart.map((i, idx) => (
              <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: idx === 0 ? "none" : `1px solid ${colors.borderLight}` }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{i.nombre}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <i onClick={() => updateQty(i.id, -1)} className="ti ti-minus" style={{ fontSize: 13, cursor: "pointer", color: colors.textFaint }} aria-hidden="true" />
                    <span style={{ fontSize: 12.5, width: 14, textAlign: "center" }}>{i.qty}</span>
                    <i onClick={() => updateQty(i.id, 1)} className="ti ti-plus" style={{ fontSize: 13, cursor: "pointer", color: colors.textFaint }} aria-hidden="true" />
                    <i onClick={() => removeItem(i.id)} className="ti ti-trash" style={{ fontSize: 13, cursor: "pointer", color: colors.rose, marginLeft: 4 }} aria-hidden="true" />
                  </div>
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>S/ {(i.precio * i.qty).toFixed(2)}</span>
              </div>
            ))}

            <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: 8, paddingTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 600 }}>Total</span>
                <span style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 600, color: colors.plum }}>S/ {total.toFixed(2)}</span>
              </div>

              <p style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: colors.textSoft, fontWeight: 600, margin: "0 0 8px" }}>Método de pago</p>
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {metodos.map((m) => (
                  <button key={m} onClick={() => setMetodo(m)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 12.5, fontWeight: 500, cursor: "pointer", background: metodo === m ? colors.plum : colors.card, color: metodo === m ? colors.bg : colors.textMuted }}>
                    {m}
                  </button>
                ))}
              </div>

              <button
                onClick={cobrar}
                disabled={cart.length === 0 || cobrando}
                style={{ width: "100%", padding: "13px 0", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, cursor: cart.length === 0 ? "not-allowed" : "pointer", background: cart.length === 0 ? colors.border : colors.rose, color: cart.length === 0 ? "#A99B85" : colors.plum }}
              >
                {cobrando ? "Procesando..." : "Cobrar e imprimir ticket"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {confirmacion && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(61,36,54,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: colors.card, borderRadius: 12, padding: "28px 30px", width: 320 }}>
            <i className="ti ti-circle-check" style={{ fontSize: 36, color: colors.sageText, display: "block", marginBottom: 10 }} aria-hidden="true" />
            <p style={{ fontFamily: fonts.display, fontSize: 18, fontWeight: 600, margin: "0 0 4px", color: colors.plum }}>Venta registrada</p>
            <p style={{ fontSize: 13, color: colors.textSoft, margin: "0 0 16px" }}>Ticket #{confirmacion.id} · {confirmacion.metodo}</p>

            {confirmacion.items.map((i) => (
              <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                <span>{i.qty}x {i.nombre}</span>
                <span>S/ {(i.precio * i.qty).toFixed(2)}</span>
              </div>
            ))}

            <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span style={{ fontWeight: 600 }}>S/ {confirmacion.total.toFixed(2)}</span>
            </div>

            <button
              onClick={() => { window.print(); setConfirmacion(null); }}
              style={{ width: "100%", marginTop: 18, padding: "11px 0", borderRadius: 8, border: "none", background: colors.rose, color: colors.plum, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
            >
              Imprimir ticket
            </button>
            <button
              onClick={() => setConfirmacion(null)}
              style={{ width: "100%", marginTop: 8, padding: "11px 0", borderRadius: 8, border: `1px solid ${colors.border}`, background: "transparent", color: colors.textMuted, fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}
            >
              Nueva venta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
