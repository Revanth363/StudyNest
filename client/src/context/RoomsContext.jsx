import React, { createContext, useContext, useState, useCallback } from "react";
import api from "../services/api";

const RoomsContext = createContext(null);

export const RoomsProvider = ({ children }) => {
  const [pagesCache, setPagesCache] = useState({}); // key: `${page}:${limit}` -> { rooms, page, limit, total }
  const [favoriteRoomIds, setFavoriteRoomIds] = useState([]);
  const [loadingPages, setLoadingPages] = useState({});

  const fetchMyRooms = useCallback(async (page = 1, limit = 20) => {
    const key = `${page}:${limit}`;
    if (pagesCache[key]) return pagesCache[key];
    if (loadingPages[key]) return null;
    try {
      setLoadingPages((p) => ({ ...p, [key]: true }));
      const res = await api.get("/users/me/rooms", { params: { page, limit } });
      const payload = res.data || {};
      setPagesCache((p) => ({ ...p, [key]: payload }));
      if (payload.favoriteRoomIds) setFavoriteRoomIds(payload.favoriteRoomIds);
      return payload;
    } catch (err) {
      return null;
    } finally {
      setLoadingPages((p) => {
        const copy = { ...p };
        delete copy[key];
        return copy;
      });
    }
  }, [pagesCache, loadingPages]);

  const invalidateRoomsCache = useCallback(() => {
    setPagesCache({});
  }, []);

  const toggleFavorite = useCallback(async (roomId, nextFavorite) => {
    try {
      const res = await api.post(`/users/me/rooms/${roomId}/favorite`, { favorite: nextFavorite });
      const ids = res.data.favoriteRoomIds || [];
      setFavoriteRoomIds(ids);
      // Update cached pages to reflect change
      setPagesCache((pages) => {
        const copy = { ...pages };
        Object.keys(copy).forEach((k) => {
          if (copy[k] && copy[k].rooms) {
            copy[k].rooms = copy[k].rooms.map((r) => (r._id === roomId ? { ...r } : r));
          }
        });
        return copy;
      });
      return ids;
    } catch (err) {
      throw err;
    }
  }, []);

  return (
    <RoomsContext.Provider value={{ fetchMyRooms, pagesCache, invalidateRoomsCache, favoriteRoomIds, toggleFavorite }}>
      {children}
    </RoomsContext.Provider>
  );
};

export const useRooms = () => {
  const ctx = useContext(RoomsContext);
  if (!ctx) throw new Error("useRooms must be used within RoomsProvider");
  return ctx;
};

export default RoomsContext;
