import { HashConnect, HashConnectTypes, MessageTypes } from "hashconnect";
import React, { useEffect, useState } from "react";

//Type declarations
interface SaveData {
  topic: string;
  pairingString: string;
  privateKey: string;
  pairedWalletData: HashConnectTypes.WalletMetadata | null;
  pairedAccounts: string[];
}

interface PropsType {
  children: React.ReactNode;
  hashConnect: HashConnect;
}

export interface hashConnectAPI {
  connect: () => void;
  walletData: SaveData;
}
const availableExtensions: HashConnectTypes.WalletMetadata[] = [];
const INITIAL_SAVE_DATA: SaveData = {
  topic: "",
  pairingString: "",
  privateKey: "",
  pairedAccounts: [],
  pairedWalletData: null,
};

let APP_CONFIG: HashConnectTypes.AppMetadata = {
  name: "dApp Example",
  description: "An example hedera dApp",
  icon: "https://absolute.url/to/icon.png",
};

const loadLocalData = (): null | SaveData => {
  let foundData = localStorage.getItem("hashconnectData");

  if (foundData) {
    const saveData: SaveData = JSON.parse(foundData);
    // setSaveData(saveData);
    return saveData;
  } else return null;
};

export const initializeHashConnect = async (
  hashconnect: HashConnect,
  setInitialData: React.Dispatch<React.SetStateAction<SaveData>>
) => {
  const saveData = INITIAL_SAVE_DATA;
  const localData = loadLocalData();
  try {
    if (!localData) {
      //first init and store the private for later
      let initData = await hashconnect.init(APP_CONFIG);
      saveData.privateKey = initData.privKey;

      //then connect, storing the new topic for later
      const state = await hashconnect.connect();
      saveData.topic = state.topic;

      //generate a pairing string, which you can display and generate a QR code from
      saveData.pairingString = hashconnect.generatePairingString(
        state,
        "testnet",
        true
      );

      //find any supported local wallets
      hashconnect.findLocalWallets();
    } else {
      //use loaded data for initialization + connection
      hashconnect.init(APP_CONFIG, localData?.privateKey);
      hashconnect.connect(
        localData?.topic,
        localData?.pairedWalletData ?? APP_CONFIG
      );
    }
    //setUpEvents();
    // saveDataInLocalstorage();
  } catch (error) {
    console.log(error);
  } finally {
    if (localData) {
      setInitialData((prevData) => ({ ...prevData, ...localData }));
    } else {
      setInitialData((prevData) => ({ ...prevData, ...saveData }));
    }
  }
};

export const HashConnectAPIContext = React.createContext<hashConnectAPI>({
  connect: () => null,
  walletData: INITIAL_SAVE_DATA,
});

export default function HashConnectProvider({
  children,
  hashConnect,
}: PropsType) {
  const [saveData, SetSaveData] = useState<SaveData>(INITIAL_SAVE_DATA);
  const saveDataInLocalStorage = () => {
    console.info("Saving to Localstoregae::=============");
    let data = JSON.stringify(saveData);
    localStorage.setItem("hashconnectData", data);
  };

  useEffect(() => {
    initializeHashConnect(hashConnect, SetSaveData);
    const additionalAccountResponseEventHandler = (
      data: MessageTypes.AdditionalAccountResponse
    ) => {
      console.debug("additionalAccountResponseEvent", data);
      // Do a thing
    };

    const foundExtensionEventHandler = (
      data: HashConnectTypes.WalletMetadata
    ) => {
      console.debug("foundExtensionEvent", data);
      // Do a thing
    };

    const pairingEventHandler = (data: MessageTypes.ApprovePairing) => {
      console.log("pairingEvent", data);
      // Save Data to localStorage
      saveDataInLocalStorage();
    };

    // Attach event handlers
    hashConnect.additionalAccountResponseEvent.on(
      additionalAccountResponseEventHandler
    );
    hashConnect.foundExtensionEvent.on(foundExtensionEventHandler);
    hashConnect.pairingEvent.on(pairingEventHandler);

    return () => {
      // Detach existing handlers
      hashConnect.additionalAccountResponseEvent.off(
        additionalAccountResponseEventHandler
      );
      hashConnect.foundExtensionEvent.off(foundExtensionEventHandler);
      hashConnect.pairingEvent.off(pairingEventHandler);
    };
  }, []);

  const connect = () => {
    console.log("Pairing String::", INITIAL_SAVE_DATA.pairingString);
    hashConnect.connectToLocalWallet(INITIAL_SAVE_DATA.pairingString);
  };

  return (
    <HashConnectAPIContext.Provider
      value={{ connect, walletData: INITIAL_SAVE_DATA }}
    >
      {children}
    </HashConnectAPIContext.Provider>
  );
}

export function useHashConnectWallet() {
  const value = React.useContext(HashConnectAPIContext);
  return value;
}
