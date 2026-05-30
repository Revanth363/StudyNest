import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Avatar from "../shared/Avatar";
import "./MyRooms.css";
import { getLogoForTopic } from "../../utils/topicLogos";
import { useRooms } from "../../context/RoomsContext";

const MyRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [favoriteRoomIds, setFavoriteRoomIds] = useState([]);
  const { fetchMyRooms, pagesCache, invalidateRoomsCache, favoriteRoomIds: ctxFavoriteIds, toggleFavorite } = useRooms();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [togglingFavoriteId, setTogglingFavoriteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [joiningPrivate, setJoiningPrivate] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const cached = pagesCache["1:20"];
        if (cached && cached.rooms) {
          setRooms(cached.rooms);
          setFavoriteRoomIds(cached.favoriteRoomIds || []);
        } else {
          const payload = await fetchMyRooms(1, 20);
          if (!mounted) return;
          setRooms(payload?.rooms || []);
          setFavoriteRoomIds(payload?.favoriteRoomIds || []);
        }
      } catch {
        setRooms([]);
        setFavoriteRoomIds([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleJoinPrivate = async (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    try {
      setCodeError("");
      const res = await api.post("/rooms/join-private", { roomCode });
      // invalidate cache
      invalidateRoomsCache();
      navigate(`/room/${res.data.room._id}`);
    } catch (err) {
      setCodeError(err.response?.data?.message || "Invalid room code");
    }
  };

  const handleLeave = async (roomId) => {
    try {
      await api.post(`/rooms/${roomId}/leave`);
      invalidateRoomsCache();
      const payload = await fetchMyRooms(1, 20);
      setRooms(payload?.rooms || []);
      setFavoriteRoomIds(payload?.favoriteRoomIds || []);
    } catch {}
  };

  const handleToggleFavorite = async (roomId) => {
    try {
      setTogglingFavoriteId(roomId);
      const currentlyFavorite = favoriteRoomIds.includes(roomId);
      const nextFavorite = !currentlyFavorite;

      // optimistic update
      setFavoriteRoomIds((prev) => {
        if (nextFavorite) return prev.includes(roomId) ? prev : [...prev, roomId];
        return prev.filter((id) => id !== roomId);
      });

      try {
        const ids = await toggleFavorite(roomId, nextFavorite);
        setFavoriteRoomIds(ids || []);
      } catch (err) {
        // rollback by refetching from source of truth
        invalidateRoomsCache();
        const payload = await fetchMyRooms(1, 20);
        setRooms(payload?.rooms || []);
        setFavoriteRoomIds(payload?.favoriteRoomIds || []);
      }
    } catch {
      // rollback by refetching from source of truth
      invalidateRoomsCache();
      const payload = await fetchMyRooms(1, 20);
      setRooms(payload?.rooms || []);
      setFavoriteRoomIds(payload?.favoriteRoomIds || []);
    } finally {
      setTogglingFavoriteId("");
    }
  };

  const filteredRooms = showFavoritesOnly
    ? rooms.filter((room) => favoriteRoomIds.includes(room._id))
    : rooms;

  return (
    <div className="my-rooms">
      <div className="my-rooms-header">
        <div>
          <h1 className="my-rooms-title">My Rooms</h1>
          <p className="my-rooms-sub">Rooms you have joined</p>
          <button
            type="button"
            className={`favorites-filter-btn ${showFavoritesOnly ? "active" : ""}`}
            onClick={() => setShowFavoritesOnly((prev) => !prev)}
          >
            <StarIcon filled={showFavoritesOnly} />
            {showFavoritesOnly ? "Showing favorites" : "Show favorites"}
          </button>
        </div>

        <form className="join-private-form" onSubmit={handleJoinPrivate}>
          <div className="join-private-input-wrap">
            <input
              type="text"
              placeholder="Enter room code..."
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase());
                setCodeError("");
              }}
              maxLength={8}
            />
            <button type="submit" disabled={!roomCode.trim()}>
              Join Private
            </button>
          </div>
          {codeError && <p className="code-error">{codeError}</p>}
        </form>
      </div>

      <div className="my-rooms-body">
        {loading ? (
          <div className="my-rooms-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="my-room-skeleton" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="my-rooms-empty">
            <p>You have not joined any rooms yet</p>
            <button onClick={() => navigate("/")}>Explore Rooms</button>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="my-rooms-empty">
            <p>No favorite rooms yet</p>
            <button onClick={() => setShowFavoritesOnly(false)}>Show all rooms</button>
          </div>
        ) : (
          <div className="my-rooms-grid">
            {filteredRooms.map((room) => (
              <MyRoomCard
                key={room._id}
                room={room}
                onOpen={() => navigate(`/room/${room._id}`)}
                onLeave={() => handleLeave(room._id)}
                isFavorite={favoriteRoomIds.includes(room._id)}
                onToggleFavorite={() => handleToggleFavorite(room._id)}
                isTogglingFavorite={togglingFavoriteId === room._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MyRoomCard = ({ room, onOpen, onLeave, isFavorite, onToggleFavorite, isTogglingFavorite }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="my-room-card">
      <div className="my-room-card-top">
        <div className="my-room-icon">
          {(() => {
            const logo = getLogoForTopic(room.topic);
            return logo ? <img src={logo} alt={room.topic} /> : room.name.charAt(0);
          })()}
        </div>
        <div className="my-room-topic-badge">{room.topic}</div>
        <button
          className={`my-room-favorite-btn ${isFavorite ? "active" : ""}`}
          onClick={onToggleFavorite}
          disabled={isTogglingFavorite}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <StarIcon filled={isFavorite} />
        </button>
        <button
          className="my-room-menu-btn"
          onClick={() => setShowMenu(!showMenu)}
        >
          <DotsIcon />
        </button>
        {showMenu && (
          <div className="my-room-menu">
            <button onClick={() => { onOpen(); setShowMenu(false); }}>
              Open Room
            </button>
            <button
              className="leave-btn"
              onClick={() => { onLeave(); setShowMenu(false); }}
            >
              Leave Room
            </button>
          </div>
        )}
      </div>

      <h3 className="my-room-name">{room.name}</h3>

      {room.description && (
        <p className="my-room-desc">{room.description}</p>
      )}

      <div className="my-room-footer">
        <div className="my-room-members">
          {room.members?.slice(0, 3).map((member) => (
            <Avatar
              key={member._id}
              name={member.username}
              src={member.avatar}
              size={22}
            />
          ))}
          {room.members?.length > 3 && (
            <span className="members-extra">+{room.members.length - 3}</span>
          )}
          <span className="members-count">{room.members?.length} members</span>
        </div>

        {room.isPrivate && (
          <span className="private-badge">
            <LockIcon /> Private
          </span>
        )}
      </div>

      <button className="my-room-open-btn" onClick={onOpen}>
        Open Room
      </button>
    </div>
  );
};

const DotsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
  </svg>
);

const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const StarIcon = ({ filled = false }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default MyRooms;