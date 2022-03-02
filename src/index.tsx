import React from "react";
import ReactDOM from "react-dom";
import { HashConnect } from "hashconnect";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import HashConnectProvider from "./HashConnectAPIProvider";
const hashConnect = new HashConnect(true);

ReactDOM.render(
  <React.StrictMode>
    <HashConnectProvider hashConnect={hashConnect} debug>
      <App />
    </HashConnectProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
