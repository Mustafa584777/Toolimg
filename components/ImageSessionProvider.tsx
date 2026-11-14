'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type InfoModalType = 'privacy' | 'terms' | 'about' | 'contact' | null;

interface ImageSessionContextValue {
  pendingFile: File | null;
  setPendingFile: (file: File | null) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  activeInfoModal: InfoModalType;
  setActiveInfoModal: (modal: InfoModalType) => void;
}

const ImageSessionContext = createContext<ImageSessionContextValue | null>(null);

export function ImageSessionProvider({ children }: { children: React.ReactNode }) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<InfoModalType>(null);

  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const isInput =
      target?.tagName === 'INPUT' ||
      target?.tagName === 'TEXTAREA' ||
      target?.isContentEditable;

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setIsSearchOpen((prev) => !prev);
      return;
    }

    if (e.key === '/' && !isInput) {
      e.preventDefault();
      setIsSearchOpen(true);
      return;
    }

    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setActiveInfoModal(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  return (
    <ImageSessionContext.Provider
      value={{
        pendingFile,
        setPendingFile,
        isSearchOpen,
        setIsSearchOpen,
        activeInfoModal,
        setActiveInfoModal,
      }}
    >
      {children}
    </ImageSessionContext.Provider>
  );
}

export function useImageSession() {
  const ctx = useContext(ImageSessionContext);
  if (!ctx) {
    throw new Error('useImageSession must be used inside ImageSessionProvider');
  }
  return ctx;
}
