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

type Networks = "testnet" | "mainnet" | "previewnet";

interface PropsType {
  children: React.ReactNode;
  hashConnect: HashConnect;
  netWork: Networks;
  metaData?: HashConnectTypes.AppMetadata;
  debug?: boolean;
}

export interface HashConnectProviderAPI {
  connect: () => void;
  walletData: SaveData;
  metaData?: HashConnectTypes.AppMetadata;
  netWork: Networks;
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
  let foundData = localStorage.getItem("  hashConnectData");

  if (foundData) {
    const saveData: SaveData = JSON.parse(foundData);
    // setSaveData(saveData);
    return saveData;
  } else return null;
};

export const HashConnectAPIContext =
  React.createContext<HashConnectProviderAPI>({
    connect: () => null,
    walletData: INITIAL_SAVE_DATA,
    netWork: "testnet",
  });

export default function HashConnectProvider({
  children,
  hashConnect,
  metaData,
  netWork,
  debug,
}: PropsType) {
  //Saving Wallet Details in Ustate
  const [saveData, SetSaveData] = useState<SaveData>(INITIAL_SAVE_DATA);
  const [installedExtensions, setInstalledExtensions] =
    useState<HashConnectTypes.WalletMetadata | null>(null);

  //? Initialize the package in mount
  const initializeHashConnect = async () => {
    const saveData = INITIAL_SAVE_DATA;
    const localData = loadLocalData();
    try {
      if (!localData) {
        if (debug) console.log("===Local data not found.=====");

        //first init and store the private for later
        let initData = await hashConnect.init(metaData ?? APP_CONFIG);
        saveData.privateKey = initData.privKey;

        //then connect, storing the new topic for later
        const state = await hashConnect.connect();
        saveData.topic = state.topic;

        //generate a pairing string, which you can display and generate a QR code from
        saveData.pairingString = hashConnect.generatePairingString(
          state,
          netWork,
          debug ?? false
        );

        //find any supported local wallets
        hashConnect.findLocalWallets();
      } else {
        if (debug) console.log("====Local data found====", localData);
        //use loaded data for initialization + connection
        hashConnect.init(metaData ?? APP_CONFIG, localData?.privateKey);
        hashConnect.connect(
          localData?.topic,
          localData?.pairedWalletData ?? metaData
        );
      }
    } catch (error) {
      console.log(error);
    } finally {
      if (localData) {
        SetSaveData((prevData) => ({ ...prevData, ...localData }));
      } else {
        SetSaveData((prevData) => ({ ...prevData, ...saveData }));
      }
      if (debug) console.log("====Wallet details updated to state====");
    }
  };

  const saveDataInLocalStorage = () => {
    if (debug)
      console.info("===============Saving to localstorage::=============");
    let data = JSON.stringify(saveData);
    localStorage.setItem("hashconnectData", data);
  };

  const additionalAccountResponseEventHandler = (
    data: MessageTypes.AdditionalAccountResponse
  ) => {
    if (debug) console.debug("additionalAccountResponseEvent", data);
    // Do a thing
  };

  const foundExtensionEventHandler = (
    data: HashConnectTypes.WalletMetadata
  ) => {
    if (debug) console.debug("====foundExtensionEvent====", data);
    // Do a thing
    setInstalledExtensions(data);
  };

  const pairingEventHandler = (data: MessageTypes.ApprovePairing) => {
    if (debug) console.log("===Wallet connected=====", data);
    // Save Data to localStorage
    saveDataInLocalStorage();
  };

  useEffect(() => {
    //Intialize the setup
    initializeHashConnect();

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
  }, [saveData]);

  const connect = () => {
    console.log("Pairing String::", saveData.pairingString);
    hashConnect.connectToLocalWallet(saveData?.pairingString);
  };

  return (
    <HashConnectAPIContext.Provider
      value={{ connect, walletData: saveData, netWork }}
    >
      {children}
    </HashConnectAPIContext.Provider>
  );
}

const defaultProps: Partial<PropsType> = {
  metaData: {
    name: "dApp Example",
    description: "An example hedera dApp",
    icon: "https://absolute.url/to/icon.png",
  },
  netWork: "testnet",
  debug: false,
};

HashConnectProvider.defaultProps = defaultProps;

export function useHashConnectWallet() {
  const value = React.useContext(HashConnectAPIContext);
  return value;
}
