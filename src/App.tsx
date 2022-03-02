import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { useHashConnect } from "./HashConnectAPIProvider";

function App() {
  const { connect, walletData } = useHashConnect();
  const { accountIds, netWork, id } = walletData;

  const conCatAccounts = (lastAccs: string, Acc: string) => {
    return lastAccs + " " + Acc;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(walletData.pairingString);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {accountIds && accountIds?.length > 0 && (
          <div>
            <h3>Connected Accounts Details:</h3>
            <p>Network:{netWork}</p>
            <p>Accounts: [{accountIds.reduce(conCatAccounts)}]</p>
          </div>
        )}

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
