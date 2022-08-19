import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { useHashConnect } from "./HashConnectAPIProvider-1.10";

function App() {
  const { connectToExtension , disconnect , pairingData , availableExtension , network , pairingString } = useHashConnect();

  const conCatAccounts = (lastAccs: string, Acc: string) => {
    return lastAccs + " " + Acc;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pairingString!);
  };

  const handleClick = () => {
    if (availableExtension && !pairingData) connectToExtension();
    else if(pairingData) disconnect();
    else
      alert(
        "Please install hashconnect wallet extension first. from chrome web store."
      );
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {pairingData?.accountIds && pairingData.accountIds?.length > 0 && (
          <div>
            <h3>Connected Accounts Details:</h3>
            <p>Network:{network}</p>
            <p>Accounts: [{pairingData?.accountIds && pairingData?.accountIds.reduce(conCatAccounts)}]</p>
          </div>
        )}

        {!availableExtension && <p>Wallet is not installed in your browser</p>}

        <p>Paring key : {pairingString?.substring(0, 15)}...</p>

        <p>
          <button onClick={handleCopy}>Copy Paring String</button>
        </p>

        <button onClick={handleClick}>{pairingData ? "Disconnect" : "Connect"}</button>
      </header>
    </div>
  );
}

export default App;
