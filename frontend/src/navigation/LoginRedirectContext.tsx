import React, { createContext, useCallback, useContext, useRef } from 'react';

type LoginRedirectContextValue = {
  registerGoToLogin: (fn: () => void) => void;
  requestGoToLogin: () => void;
};

const LoginRedirectContext = createContext<LoginRedirectContextValue | null>(null);

export function LoginRedirectProvider({ children }: { children: React.ReactNode }) {
  const handlerRef = useRef<(() => void) | null>(null);

  const registerGoToLogin = useCallback((fn: () => void) => {
    handlerRef.current = fn;
  }, []);

  const requestGoToLogin = useCallback(() => {
    handlerRef.current?.();
  }, []);

  return (
    <LoginRedirectContext.Provider value={{ registerGoToLogin, requestGoToLogin }}>
      {children}
    </LoginRedirectContext.Provider>
  );
}

export function useLoginRedirect() {
  const ctx = useContext(LoginRedirectContext);
  if (!ctx) {
    throw new Error('useLoginRedirect must be used within LoginRedirectProvider');
  }
  return ctx;
}
