import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../lib/supabase";
import { colors, fonts, FONT_IMPORT } from "../styles/theme";

function StockBadge({ stock, minimo }) {
  let bg = colors.sageBg, color = colors.sageText, label = `${stock} und.`;
  if (stock === 0) { bg = colors.redBg; color = colors.red; label = "Agotado"; }
  else if (stock <= minimo) { bg = colors.amberBg; color = colors.amber; }
  return <span style={{ fontSize: 12, fontWeight: 600, color, background: bg, padding: "3px 10px", borderRadius: 12 }}>{label}</span>;
}

const emptyForm = { id: null, nombre: "", marca: "", categoria_id: "", precio: "", costo: "", stock: "", codigo_barras: "", stock_minimo: 3 };

export default function Inventario() {
  const [products, setProducts] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [query, setQuery] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setLoading(true);
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("productos").select("*, categorias(nombre)").eq("activo", true).order("nombre"),
      supabase.from("categorias").select("*").order("nombre"),
    ]);
    setProducts(prods || []);
    setCategorias(cats || []);
    setLoading(false);
  }

  const filtered = products.filter((p) => {
    const matchQuery =
      p.nombre.toLowerCase().includes(query.toLowerCase()) ||
      (p.marca || "").toLowerCase().includes(query.toLowerCase()) ||
      (p.codigo_barras || "").includes(query);
    const matchCat = categoriaFiltro === "Todas" || p.categorias?.nombre === categoriaFiltro;
    return matchQuery && matchCat;
  });

  function abrirNuevo() {
    setForm(emptyForm);
    setShowForm(true);
  }

  function abrirEditar(p) {
    setForm({
      id: p.id, nombre: p.nombre, marca: p.marca || "", categoria_id: p.categoria_id || "",
      precio: p.precio, costo: p.costo || 0, stock: p.stock, codigo_barras: p.codigo_barras || "", stock_minimo: p.stock_minimo,
    });
    setShowForm(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      nombre: form.nombre,
      marca: form.marca,
      categoria_id: form.categoria_id || null,
      precio: parseFloat(form.precio) || 0,
      costo: parseFloat(form.costo) || 0,
      stock: parseInt(form.stock) || 0,
      codigo_barras: form.codigo_barras || null,
      stock_minimo: parseInt(form.stock_minimo) || 3,
    };

    if (form.id) {
      await supabase.from("productos").update(payload).eq("id", form.id);
    } else {
      await supabase.from("productos").insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    cargar();
  }

  async function eliminar(id) {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    await supabase.from("productos").update({ activo: false }).eq("id", id);
    cargar();
  }

  return (
    <div style={{ fontFamily: fonts.body, background: colors.bg, minHeight: "100vh", display: "flex", color: colors.text }}>
      <style>{FONT_IMPORT}</style>
      <Sidebar />

      <main style={{ flex: 1, padding: "32px 40px", maxWidth: 1100 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <p style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 600, margin: 0, color: colors.plum }}>Inventario</p>
            <p style={{ fontSize: 13.5, color: colors.textSoft, margin: "4px 0 0" }}>{products.length} productos registrados</p>
          </div>
          <button
            onClick={abrirNuevo}
            style={{ display: "flex", alignItems: "center", gap: 8, background: colors.plum, color: colors.bg, border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}
          >
            <i className="ti ti-plus" style={{ fontSize: 16 }} aria-hidden="true" />
            Nuevo producto
          </button>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <i className="ti ti-search" style={{ position: "absolute", left: 12, top: 11, fontSize: 16, color: colors.textFaint }} aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, marca o código de barras"
              style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, fontSize: 13.5, fontFamily: fonts.body, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Todas", ...categorias.map((c) => c.nombre)].map((c) => (
              <button
                key={c}
                onClick={() => setCategoriaFiltro(c)}
                style={{
                  padding: "8px 14px", borderRadius: 20, border: `1px solid ${colors.border}`, fontSize: 12.5, fontWeight: 500, cursor: "pointer",
                  background: categoriaFiltro === c ? colors.plum : colors.card, color: categoriaFiltro === c ? colors.bg : colors.textMuted,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: colors.bg }}>
                {["Producto", "Marca", "Categoría", "Costo", "Precio", "Margen", "Stock", ""].map((h, i) => (
                  <th key={i} style={{ textAlign: i >= 3 ? "right" : "left", padding: "12px 18px", fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: colors.textSoft, fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} style={{ padding: "28px 18px", textAlign: "center", color: colors.textFaint }}>Cargando productos...</td></tr>
              )}
              {!loading && filtered.map((p, i) => (
                <tr key={p.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${colors.borderLight}` }}>
                  <td style={{ padding: "13px 18px", fontWeight: 500 }}>{p.nombre}</td>
                  <td style={{ padding: "13px 18px", color: colors.textMuted }}>{p.marca}</td>
                  <td style={{ padding: "13px 18px", color: colors.textMuted }}>{p.categorias?.nombre || "—"}</td>
                  <td style={{ padding: "13px 18px", textAlign: "right", color: colors.textMuted }}>S/ {Number(p.costo || 0).toFixed(2)}</td>
                  <td style={{ padding: "13px 18px", textAlign: "right", fontWeight: 500 }}>S/ {Number(p.precio).toFixed(2)}</td>
                  <td style={{ padding: "13px 18px", textAlign: "right" }}>
                    {p.costo > 0 ? (
                      <span style={{ fontSize: 12, fontWeight: 600, color: colors.sageText, background: colors.sageBg, padding: "3px 10px", borderRadius: 12 }}>
                        +S/ {(Number(p.precio) - Number(p.costo)).toFixed(2)}
                      </span>
                    ) : <span style={{ color: colors.textFaint, fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: "13px 18px", textAlign: "right" }}><StockBadge stock={p.stock} minimo={p.stock_minimo} /></td>
                  <td style={{ padding: "13px 18px", textAlign: "right" }}>
                    <i onClick={() => abrirEditar(p)} className="ti ti-edit" style={{ fontSize: 16, color: colors.textFaint, cursor: "pointer", marginRight: 10 }} aria-hidden="true" />
                    <i onClick={() => eliminar(p.id)} className="ti ti-trash" style={{ fontSize: 16, color: colors.textFaint, cursor: "pointer" }} aria-hidden="true" />
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "28px 18px", textAlign: "center", color: colors.textFaint }}>No se encontraron productos con esa búsqueda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(61,36,54,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <form onSubmit={guardar} style={{ background: colors.card, borderRadius: 12, padding: "26px 28px", width: 380, maxHeight: "90vh", overflowY: "auto" }}>
            <p style={{ fontFamily: fonts.display, fontSize: 18, fontWeight: 600, margin: "0 0 18px", color: colors.plum }}>
              {form.id ? "Editar producto" : "Nuevo producto"}
            </p>

            {[
              { key: "nombre", label: "Nombre", type: "text", required: true },
              { key: "marca", label: "Marca", type: "text" },
              { key: "codigo_barras", label: "Código de barras", type: "text" },
              { key: "precio", label: "Precio de venta (S/)", type: "number" },
              { key: "costo", label: "Costo del producto (S/)", type: "number" },
              { key: "stock", label: "Stock", type: "number" },
              { key: "stock_minimo", label: "Stock mínimo (alerta)", type: "number" },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: colors.textSoft, fontWeight: 600 }}>{f.label}</label>
                <input
                  type={f.type}
                  required={f.required}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bg, fontSize: 13.5, fontFamily: fonts.body, outline: "none", boxSizing: "border-box", marginTop: 6 }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", color: colors.textSoft, fontWeight: 600 }}>Categoría</label>
              <select
                value={form.categoria_id}
                onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bg, fontSize: 13.5, fontFamily: fonts.body, outline: "none", boxSizing: "border-box", marginTop: 6 }}
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textMuted, fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "none", background: colors.rose, color: colors.plum, fontSize: 13.5, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
