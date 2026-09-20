import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PendingVerificationContextValue {
  pendingEmail: string | null;
  setPendingEmail: (email: string | null) => void;
  clearPendingEmail: () => void;
}

const PendingVerificationContext = createContext<PendingVerificationContextValue | undefined>(
  undefined
);

export const PendingVerificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const clearPendingEmail = () => {
    setPendingEmail(null);
  };

  return (
    <PendingVerificationContext.Provider
      value={{
        pendingEmail,
        setPendingEmail,
        clearPendingEmail,
      }}
    >
      {children}
    </PendingVerificationContext.Provider>
  );
};

export function usePendingVerification(): PendingVerificationContextValue {
  const context = useContext(PendingVerificationContext);
  if (!context) {
    throw new Error('usePendingVerification must be used within a PendingVerificationProvider');
  }
  return context;
}
