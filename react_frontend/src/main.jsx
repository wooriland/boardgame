// ✅ 파일: src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/global.css";

/**
 * ✅ HashRouter (GitHub Pages 안정형)
 * - basename 제거: dev에서 BASE_URL="/" -> "" 이 되어 라우팅이 깨지는 케이스 방지
 *
 * URL 예:
 * - dev: http://localhost:5173/#/m
 * - gh-pages: https://<user>.github.io/<repo>/#/m
 */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);