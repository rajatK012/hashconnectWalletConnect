import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { useHashConnectWallet } from "./HashConnectAPIProvider";

function App() {
  const { connect, walletData } = useHashConnectWallet();

  const handleCopy = () => {
    navigator.clipboard.writeText(walletData.pairingString);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />

        <p>Paring key : {walletData.pairingString.substring(0, 15)}...</p>

        <p>
          <button onClick={handleCopy}>Copy Paring String</button>
        </p>

        <button onClick={() => connect()}>Connect TO Wallet</button>
      </header>
    </div>
  );
}

export default App;
