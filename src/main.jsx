import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Reset CSS global mínimo
const style = document.createElement("style");
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
