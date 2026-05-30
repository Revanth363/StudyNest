import React, { createContext, useContext, useMemo, useState } from "react";

const ViewCacheContext = createContext(null);

export const ViewCacheProvider = ({ children }) => {
  const [exploreCache, setExploreCache] = useState({});
  const [savedMessagesCache, setSavedMessagesCache] = useState(null);
  const [notificationsCache, setNotificationsCache] = useState(null);

  const value = useMemo(() => ({
    exploreCache,
    setExploreCache,
    savedMessagesCache,
    setSavedMessagesCache,
    notificationsCache,
    setNotificationsCache,
  }), [exploreCache, savedMessagesCache, notificationsCache]);

  return <ViewCacheContext.Provider value={value}>{children}</ViewCacheContext.Provider>;
};

export const useViewCache = () => {
  const ctx = useContext(ViewCacheContext);
  if (!ctx) throw new Error("useViewCache must be used within ViewCacheProvider");
  return ctx;
};
