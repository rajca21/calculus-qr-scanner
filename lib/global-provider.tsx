import React, { createContext, useContext, ReactNode, useState } from 'react';

import { User } from './types/User';
import { Receipt } from './types/Receipt';

interface GlobalContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  scannedReceipts: Receipt[];
  setScannedReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>;
  cameraOpen: boolean;
  setCameraOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider = ({ children }: GlobalProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannedReceipts, setScannedReceipts] = useState([]);
  const [cameraOpen, setCameraOpen] = useState(false);

  return (
    <GlobalContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        user,
        setUser,
        loading,
        setLoading,
        scannedReceipts,
        setScannedReceipts,
        cameraOpen,
        setCameraOpen,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context)
    throw new Error('useGlobalContext must be used within a GlobalProvider');

  return context;
};

export default GlobalProvider;
