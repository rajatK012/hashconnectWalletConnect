import { HashConnect, HashConnectTypes, MessageTypes } from "hashconnect";
import { HashConnectConnectionState } from "hashconnect/dist/types";
import React, { useCallback, useEffect, useState } from "react";
import { useCookies } from "react-cookie";

//initialize hashconnect
const hashConnect = new HashConnect(true);


export interface SavedPairingData {
  metadata: HashConnectTypes.AppMetadata | HashConnectTypes.WalletMetadata;
  pairingData: MessageTypes.ApprovePairing;
  privKey?: string;
}

export interface PropsType {
  children: React.ReactNode;
  network:  "testnet" | "mainnet" | "previewnet";
  metaData?: HashConnectTypes.AppMetadata;
  debug?: boolean;
}

//Intial App config
let APP_CONFIG: HashConnectTypes.AppMetadata = {
  name: "dApp Example",
  description: "An example hedera dApp",
  icon: "https://absolute.url/to/icon.png",
};



export interface HashconnectContextAPI {
  availableExtension: HashConnectTypes.WalletMetadata;
  state: HashConnectConnectionState;
  topic: string;
  privKey?: string;
  pairingString: string;
  pairingData: MessageTypes.ApprovePairing | null;
  acknowledgeData: MessageTypes.Acknowledge;
}

export const HashConnectAPIContext = React.createContext<
  Partial<
    HashconnectContextAPI & {
      setState: React.Dispatch<React.SetStateAction<Partial<HashconnectContextAPI>>>;
      network: "testnet" | "mainnet" | "previewnet";
    }
  >
>({state: HashConnectConnectionState.Disconnected});

export const HashConnectAPIProvider = ({ children, metaData, network, debug }: PropsType) => {
  const [cookies, setCookie] = useCookies(["hashconnectData"]);
  const [stateData, setState] = useState<Partial<HashconnectContextAPI>>({});

  const localData = cookies.hashconnectData as any as SavedPairingData;

  //initialise the thing
  const initializeHashConnect = useCallback(async () => {
    localStorage.removeItem("hashconnectData");
    try {
      if (!localData) {
        if (debug) console.log("===Local data not found.=====");

        //first init and store the private for later
        let initData = await hashConnect.init(metaData ?? APP_CONFIG);
        const privateKey = initData.privKey;

        //then connect, storing the new topic for later
        const state = await hashConnect.connect();
        hashConnect.findLocalWallets();

        const topic = state.topic;

        //generate a pairing string, which you can display and generate a QR code from
        const pairingString = hashConnect.generatePairingString(state, network, debug ?? false);
        setState((exState) => ({
          ...exState,
          topic,
          privKey: privateKey,
          pairingString,
          state: HashConnectConnectionState.Disconnected
        }));
      } else {
        if (debug) console.log("====Local data found====", localData);
        //use loaded data for initialization + connection
        await hashConnect.init(metaData ?? APP_CONFIG, localData?.privKey);
        await hashConnect.connect(localData?.pairingData.topic, localData?.pairingData.metadata ?? metaData);
      }
    } catch (error) {
      console.log(error);
    }
  }, [debug, localData, metaData, network]);

  const foundExtensionEventHandler = useCallback(
    (data: HashConnectTypes.WalletMetadata) => {
      if (debug) console.log("====foundExtensionEvent====", data);
      setState((exState) => ({ ...exState, availableExtension: data }));
    },
    [debug]
  );

  const saveDataInLocalStorage = useCallback(
    (data: MessageTypes.ApprovePairing) => {
      if (debug) console.info("===============Saving to localstorage::=============");
      const dataToSave: SavedPairingData = {
        metadata: stateData.availableExtension!,
        privKey: stateData.privKey!,
        pairingData: stateData.pairingData!,
      };
      setCookie("hashconnectData", dataToSave, { path: "/" });
    },
    [debug]
  );

  const pairingEventHandler = useCallback(
    (data: MessageTypes.ApprovePairing) => {
      if (debug) console.log("===Wallet connected=====", data);
      setState((exState) => ({ ...exState, pairingData: data }));
      saveDataInLocalStorage(data);
    },
    [debug, saveDataInLocalStorage]
  );

  const acknowledgeEventHandler = useCallback(
    (data: MessageTypes.Acknowledge) => {
      if (debug) console.log("====::acknowledgeData::====", data);
      setState((iniData) => ({ ...iniData, acknowledgeData: data }));
    },
    [debug]
  );

  const onStatusChange = (state: HashConnectConnectionState) => {
    console.log("hashconnect state change event", state);
    setState((exState) => ({ ...exState, state }));
  };

  useEffect(() => {
    initializeHashConnect();
  }, []);

  useEffect(() => {
    hashConnect.foundExtensionEvent.on(foundExtensionEventHandler);
    hashConnect.pairingEvent.on(pairingEventHandler);
    hashConnect.acknowledgeMessageEvent.on(acknowledgeEventHandler);
    hashConnect.connectionStatusChange.on(onStatusChange);
    return () => {
      hashConnect.foundExtensionEvent.off(foundExtensionEventHandler);
      hashConnect.pairingEvent.off(pairingEventHandler);
      hashConnect.acknowledgeMessageEvent.off(acknowledgeEventHandler);
    };
  }, []);

  return <HashConnectAPIContext.Provider value={{ ...stateData, setState , network }}>{children}</HashConnectAPIContext.Provider>;
};

const defaultProps: Partial<PropsType> = {
  metaData: {
    name: "dApp Example",
    description: "An example hedera dApp",
    icon: "https://absolute.url/to/icon.png",
  },
  network: "testnet",
  debug: false,
};

HashConnectAPIProvider.defaultProps = defaultProps;

// export const HashConnectProvider = React.memo(HashConnectProviderWarped);

export const useHashConnect = () => {
  const [cookies, setCookie, removeCookie] = useCookies(["hashconnectData"]);
  const value = React.useContext(HashConnectAPIContext);
  const { topic, pairingString, setState } = value;

  const connectToExtension = async () => {
    //this will automatically pop up a pairing request in the HashPack extension
    hashConnect.connectToLocalWallet(pairingString!);
  };

  const sendTransaction = async (trans: Uint8Array, acctToSign: string, return_trans: boolean = false, hideNfts: boolean = false) => {
    const transaction: MessageTypes.Transaction = {
      topic: topic!,
      byteArray: trans,

      metadata: {
        accountToSign: acctToSign,
        returnTransaction: return_trans,
      },
    };

    return await hashConnect.sendTransaction(topic!, transaction);
  };

  const disconnect = () => {
    removeCookie("hashconnectData");
    setState!((exData) => ({ ...exData, pairingData: null }));
  };

  return { ...value, connectToExtension, sendTransaction, disconnect };
};

// export default HashConnectProvider;
