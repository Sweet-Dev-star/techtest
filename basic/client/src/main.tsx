import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { bootstrap } from "./state/app.ts";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root is missing from index.html");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

void bootstrap();
