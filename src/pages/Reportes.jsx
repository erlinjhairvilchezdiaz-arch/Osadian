import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabase";
import { colors, fonts, FONT_IMPORT } from "../styles/theme";

const periodos = ["Hoy", "Esta semana", "Este mes"];

function getRango(periodo) {
  const ahora = new Date();
  const inicio = new Date();
  if (periodo === "Hoy") inicio.setHours(0, 0, 0, 0);
  else if (periodo === "Esta semana") {
    const dia = ahora.getDay() || 7;
    inicio.setDate(ahora.getDate() - dia + 1);
    inicio.setHours(0, 0, 0, 0);
  } else {
    inicio.setDate(1);
    inicio.setHours(0, 0, 0, 0);
  }
  return inicio.toISOString();
}

export default function Reportes() {
  const [periodo, setPeriodo] = useState("Esta semana");
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState({ totalVentas: 0, cantidadVentas: 0, gananciaNeta: 0 });
  const [ventasPorDia, setVentasPorDia] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [stockBajo, setStockBajo] = useState([]);

  useEffect(() => {
    cargar();
  }, [periodo]);

  async function cargar() {
    setLoading(true);
    const desde = getRango(periodo);

    const [ventasRes, itemsRes, stockRes] = await Promise.all([
      supabase.from("ventas").select("id, fecha, total").eq("anulada", false).gte("fecha", desde),
      supabase.from("venta_items").select("nombre_producto, cantidad, precio_unitario, costo_unitario, ventas!inner(fecha, anulada)").eq("ventas.anulada", false).gte("ventas.fecha", desde),
      supabase.from("productos").select("id, nombre, marca, stock, stock_minimo").eq("activo", true).order("stock", { ascending: true }),
    ]);

    const ventas = ventasRes.data || [];
    const items = itemsRes.data || [];
    const gananciaNeta = items.reduce((s, i) => s + (Number(i.precio_unitario) - Number(i.costo_unitario)) * i.cantidad, 0);
    setResumen({
      totalVentas: ventas.reduce((s, v) => s + Number(v.total), 0),
      cantidadVentas: ventas.length,
      gananciaNeta,
    });

    // Ventas agrupadas por día
    const porDia = {};
    ventas.forEach((v) => {
      const key = new Date(v.fecha).toLocaleDateString("es-PE", { weekday: "short", day: "numeric" });
      porDia[key] = (porDia[key] || 0) + Number(v.total);
    });
    setVentasPorDia(Object.entries(porDia).map(([dia, monto]) => ({ dia, monto })));

    // Top productos
    const agrupado = {};
    (itemsRes.data || []).forEach((i) => {
      const key = i.nombre_producto;
      if (!agrupado[key]) agrupado[key] = { name: key, unidades: 0, total: 0 };
      agrupado[key].unidades += i.cantidad;
      agrupado[key].total += i.cantidad * Number(i.precio_unitario);
    });
    setTopProductos(
      Object.values(agrupado).sort((a, b) => b.total - a.total).slice(0, 5)
    );

    // Stock bajo
    const bajo = (stockRes.data || []).filter((p) => p.stock <= p.stock_minimo).slice(0, 5);
    setStockBajo(bajo);

    setLoading(false);
  }

  const maxVenta = Math.max(...ventasPorDia.map((v) => v.monto), 1);

  return (
    <div style={{ fontFamily: fonts.body, background: colors.bg, minHeight: "100vh", display: "flex", color: colors.text }}>
      <style>{FONT_IMPORT}</style>
      <Sidebar />

      <main style={{ flex: 1, padding: "32px 40px", maxWidth: 1100 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <p style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 600, margin: 0, color: colors.plum }}>Reportes</p>
            <p style={{ fontSize: 13.5, color: colors.textSoft, margin: "4px 0 0" }}>Resumen del negocio</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {periodos.map((p) => (
              <button key={p} onClick={() => setPeriodo(p)} style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${colors.border}`, fontSize: 12.5, fontWeight: 500, cursor: "pointer", background: periodo === p ? colors.plum : colors.card, color: periodo === p ? colors.bg : colors.textMuted }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Tarjetas resumen */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 20px" }}>
            <p style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: colors.textSoft, fontWeight: 600, margin: "0 0 6px" }}>Total vendido</p>
            <p style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 600, margin: 0, color: colors.plum }}>
              {loading ? "—" : `S/ ${resumen.totalVentas.toFixed(2)}`}
            </p>
          </div>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 20px" }}>
            <p style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: colors.textSoft, fontWeight: 600, margin: "0 0 6px" }}>Ganancia neta</p>
            <p style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 600, margin: 0, color: colors.sageText }}>
              {loading ? "—" : `S/ ${resumen.gananciaNeta.toFixed(2)}`}
            </p>
          </div>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 20px" }}>
            <p style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: colors.textSoft, fontWeight: 600, margin: "0 0 6px" }}>Margen</p>
            <p style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 600, margin: 0, color: colors.plum }}>
              {loading || resumen.totalVentas === 0 ? "—" : `${((resumen.gananciaNeta / resumen.totalVentas) * 100).toFixed(1)}%`}
            </p>
          </div>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "16px 20px" }}>
            <p style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: colors.textSoft, fontWeight: 600, margin: "0 0 6px" }}>Número de ventas</p>
            <p style={{ fontFamily: fonts.display, fontSize: 24, fontWeight: 600, margin: 0, color: colors.plum }}>
              {loading ? "—" : resumen.cantidadVentas}
            </p>
          </div>
        </div>

        {/* Gráfico de barras */}
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "20px 22px", marginBottom: 20 }}>
          <p style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 600, margin: "0 0 18px", color: colors.plum }}>Ventas por día</p>

          {loading && <p style={{ fontSize: 13.5, color: colors.textFaint }}>Cargando...</p>}

          {!loading && ventasPorDia.length === 0 && (
            <p style={{ fontSize: 13.5, color: colors.textFaint }}>No hay ventas registradas en este período.</p>
          )}

          {!loading && ventasPorDia.length > 0 && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 140 }}>
              {ventasPorDia.map((v) => (
                <div key={v.dia} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: colors.textSoft }}>S/{v.monto.toFixed(0)}</span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 44,
                      height: `${Math.max((v.monto / maxVenta) * 100, 4)}px`,
                      background: v.monto === Math.max(...ventasPorDia.map((x) => x.monto)) ? colors.rose : colors.border,
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s ease",
                    }}
                  />
                  <span style={{ fontSize: 11.5, color: colors.textFaint }}>{v.dia}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
          {/* Top productos */}
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "20px 22px" }}>
            <p style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 600, margin: "0 0 14px", color: colors.plum }}>Productos más vendidos</p>
            {loading && <p style={{ fontSize: 13.5, color: colors.textFaint }}>Cargando...</p>}
            {!loading && topProductos.length === 0 && <p style={{ fontSize: 13.5, color: colors.textFaint }}>Sin datos en este período.</p>}
            {!loading && topProductos.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderTop: i === 0 ? "none" : `1px solid ${colors.borderLight}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: fonts.display, fontSize: 14, fontWeight: 600, color: colors.gold, width: 18 }}>{i + 1}</span>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0 }}>{p.name}</p>
                    <p style={{ fontSize: 11.5, color: colors.textFaint, margin: "2px 0 0" }}>{p.unidades} und. vendidas</p>
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>S/ {p.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Stock bajo */}
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "20px 22px" }}>
            <p style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 600, margin: "0 0 14px", color: colors.plum }}>Productos con poco stock</p>
            {stockBajo.length === 0 && !loading && <p style={{ fontSize: 13.5, color: colors.textFaint }}>Todo el inventario está en buen nivel.</p>}
            {stockBajo.map((p, i) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: i === 0 ? "none" : `1px solid ${colors.borderLight}` }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0 }}>{p.nombre}</p>
                  <p style={{ fontSize: 11.5, color: colors.textFaint, margin: "2px 0 0" }}>{p.marca}</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: p.stock === 0 ? colors.red : colors.amber, background: p.stock === 0 ? colors.redBg : colors.amberBg, padding: "3px 10px", borderRadius: 12 }}>
                  {p.stock === 0 ? "Agotado" : `${p.stock} und.`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
