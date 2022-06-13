import * as React from "react";
import {Context} from "./../internetIdentity/InternetIdentityAuthProvider"

export const NFIDInternetIdentityAuthProviderContext = React.createContext<Context | undefined>(undefined)
export const useNFIDInternetIdentityAuthProviderContext = () => {
    const context = React.useContext<Context | undefined>(NFIDInternetIdentityAuthProviderContext);
    if (!context) {
        throw new Error("useNFIDInternetIdentityAuthProviderContext must be used within a NFIDInternetIdentityAuthProviderContext.Provider")
    }
    return context;
};
