import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { colors, fonts } from "../styles/theme";

const allItems = [
  { to: "/", icon: "ti-layout-dashboard", label: "Dashboard", soloAdmin: false },
  { to: "/inventario", icon: "ti-package", label: "Inventario", soloAdmin: false },
  { to: "/ventas", icon: "ti-shopping-cart", label: "Ventas", soloAdmin: false },
  { to: "/caja", icon: "ti-cash", label: "Caja", soloAdmin: true },
  { to: "/reportes", icon: "ti-chart-bar", label: "Reportes", soloAdmin: true },
];

export default function Sidebar() {
  const { perfil, esAdmin, logout } = useAuth();
  const items = allItems.filter((i) => !i.soloAdmin || esAdmin);

  return (
    <aside
      style={{
        width: 220,
        background: colors.plum,
        padding: "28px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        flexShrink: 0,
        minHeight: "100vh",
      }}
    >
      <div style={{ padding: "0 8px 28px" }}>
        {/* Pon tu logo en: public/logo.png  (160x50 px recomendado) */}
        <img
          src="/logo.png"
          alt="Osadian"
          onError={(e) => { e.target.style.display = "none"; document.getElementById("sidebar-title").style.display = "block"; }}
          style={{ maxWidth: 150, maxHeight: 52, objectFit: "contain", marginBottom: 2 }}
        />
        <p id="sidebar-title" style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 20, color: colors.bg, margin: 0, display: "none" }}>
          Osadian
        </p>
        <p style={{ fontSize: 11.5, color: colors.rose, margin: "2px 0 0", letterSpacing: "0.04em" }}>
          Punto de venta
        </p>
      </div>

      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          style={({ isActive }) => ({
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            borderRadius: 8,
            background: isActive ? colors.rose : "transparent",
            cursor: "pointer",
            textDecoration: "none",
          })}
        >
          {({ isActive }) => (
            <>
              <i
                className={`ti ${item.icon}`}
                style={{ fontSize: 18, color: isActive ? colors.plum : colors.roseText }}
                aria-hidden="true"
              />
              <span style={{ fontSize: 14, fontWeight: 500, color: isActive ? colors.plum : colors.roseText }}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}

      <div style={{ marginTop: "auto", padding: "12px 8px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderTop: `1px solid ${colors.plumBorder}`,
            paddingTop: 16,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: esAdmin ? colors.gold : colors.sage,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
              color: esAdmin ? colors.plum : colors.bg,
            }}
          >
            {perfil?.nombre?.charAt(0) || "?"}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: colors.bg, margin: 0, fontWeight: 500 }}>
              {perfil?.nombre || "Usuario"}
            </p>
            <p style={{ fontSize: 11, color: "#A98E96", margin: 0 }}>
              {esAdmin ? "Administradora" : "Ventas"}
            </p>
          </div>
          <i
            onClick={logout}
            className="ti ti-logout"
            title="Cerrar sesión"
            style={{ fontSize: 16, color: "#A98E96", cursor: "pointer" }}
            aria-hidden="true"
          />
        </div>
      </div>
    </aside>
  );
}
