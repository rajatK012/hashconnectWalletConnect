import { HashConnect, HashConnectTypes, MessageTypes } from "hashconnect";
import { HashConnectConnectionState } from "hashconnect/dist/types";
import React from "react";

//create the hashconnect instance
const hashconnect = new HashConnect(true);

export interface ProviderProps {
  children: React.ReactNode;
  network: "testnet" | "mainnet" | "previewnet";
  metaData?: HashConnectTypes.AppMetadata;
  debug?: boolean;
}

export interface HashconnectContextAPI {
  availableExtension: HashConnectTypes.WalletMetadata;
  state: HashConnectConnectionState;
  topic: string;
  pairingString: string;
  pairingData: HashConnectTypes.SavedPairingData | null;
}

const appMetadata: HashConnectTypes.AppMetadata = {
  name: "dApp Example",
  description: "An example hedera dApp",
  icon: "https://www.hashpack.app/img/logo.svg",
};

const HashconectServiceContext = React.createContext<
  Partial<
    HashconnectContextAPI & {
      network: "testnet" | "mainnet" | "previewnet";
      setState: React.Dispatch<React.SetStateAction<Partial<HashconnectContextAPI>>>;
    }
  >
>({});

export const HashconnectAPIProvider = ({ children, metaData, network, debug }: ProviderProps) => {
  const [state, setState] = React.useState<Partial<HashconnectContextAPI>>({});

  const initHashconnect = async () => {
    //initialize and use returned data
    let initData = await hashconnect.init(metaData ?? appMetadata, network, false);
    const topic = initData.topic;
    const pairingString = initData.pairingString;
    //Saved pairings will return here, generally you will only have one unless you are doing something advanced
    const pairingData = initData.savedPairings[0];

    setState((exState) => ({ ...exState, topic, pairingData, pairingString, state: HashConnectConnectionState.Disconnected }));
  };

  const onFoundExtension = (data: HashConnectTypes.WalletMetadata) => {
    console.log("Found extension", data);
    setState((exState) => ({ ...exState, availableExtension: data }));
  };

  const onParingEvent = (data: MessageTypes.ApprovePairing) => {
    console.log("Paired with wallet", data);
    setState((exState) => ({ ...exState, pairingData: data.pairingData }));
  };

  const onConnectionChange = (state: HashConnectConnectionState) => {
    console.log("hashconnect state change event", state);
    setState((exState) => ({ ...exState, state }));
  };

  //register events
  React.useEffect(() => {
    hashconnect.foundExtensionEvent.on(onFoundExtension);
    hashconnect.pairingEvent.on(onParingEvent);
    hashconnect.connectionStatusChangeEvent.on(onConnectionChange);
    return () => {
      hashconnect.foundExtensionEvent.off(onFoundExtension);
      hashconnect.pairingEvent.on(onParingEvent);
      hashconnect.connectionStatusChangeEvent.off(onConnectionChange);
    };
  }, []);

  //Call Initialization
  React.useEffect(() => {
    initHashconnect();
  }, []);

  return <HashconectServiceContext.Provider value={{ ...state, setState, network }}>{children}</HashconectServiceContext.Provider>;
};

export const useHashconnectService = () => {
  const value = React.useContext(HashconectServiceContext);
  const { topic, pairingData, network, setState } = value;

  const connectToExtension = async () => {
    //this will automatically pop up a pairing request in the HashPack extension
    hashconnect.connectToLocalWallet();
  };

  const sendTransaction = async (trans: Uint8Array, acctToSign: string, return_trans: boolean = false, hideNfts: boolean = false) => {
    const transaction: MessageTypes.Transaction = {
      topic: topic!,
      byteArray: trans,

      metadata: {
        accountToSign: acctToSign,
        returnTransaction: return_trans,
        hideNft: hideNfts,
      },
    };

    return await hashconnect.sendTransaction(topic!, transaction);
  };

  const disconnect = () => {
    hashconnect.disconnect(pairingData?.topic!);
    setState!((exState) => ({ ...exState, pairingData: null }))!;
  };

  const requestAccountInfo = async () => {
    const request: MessageTypes.AdditionalAccountRequest = {
      topic: topic!,
      network: network!,
      multiAccount: true,
    };

    await hashconnect.requestAdditionalAccounts(topic!, request);
  };

  const clearPairings = () => {
    hashconnect.clearConnectionsAndData();
    setState!((exState) => ({ ...exState, pairingData: null }));
  };

  return { ...value, connectToExtension, sendTransaction, disconnect, requestAccountInfo, clearPairings };
};

