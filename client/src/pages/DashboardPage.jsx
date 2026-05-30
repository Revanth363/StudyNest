import { useLayoutEffect, useRef, useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRooms } from "../context/RoomsContext";
import Sidebar from "../components/sidebar/Sidebar";
import ExploreRooms from "../components/room/ExploreRooms";
import MyRooms from "../components/room/MyRooms";
import SavedMessages from "../components/saved/SavedMessages";
import Notifications from "../components/notifications/Notifications";
import UserProfile from "../components/profile/UserProfile";
import CreateRoomModal from "../components/room/CreateRoomModal";
import { getLogoForTopic } from "../utils/topicLogos";
import "./DashboardPage.css";

const VIEW_META = {
  yourrooms: { title: "Your Rooms", label: "Your Rooms" },
  myrooms: { title: "My Rooms", label: "My Rooms" },
  explore: { title: "Explore Rooms", label: "Explore" },
  saved: { title: "Saved Messages", label: "Saved" },
  notifications: { title: "Notifications", label: "Notifications" },
};

const getViewFromPath = (pathname) => {
  const path = pathname.replace(/\/+$/, "");
  if (path === "/yourrooms") return "yourrooms";
  if (path === "/explore") return "explore";
  if (path === "/saved") return "saved";
  if (path === "/notifications") return "notifications";
  return "myrooms";
};

const DashboardPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileContentRef = useRef(null);

  const activeView = useMemo(() => getViewFromPath(location.pathname), [location.pathname]);

  useEffect(() => {
    if (location.state?.openCreateRoom) {
      setShowCreateModal(true);
    }
  }, [location.state?.openCreateRoom]);

  const handleNavigate = (view) => {
    setShowMobileMenu(false);
    navigate(`/${view}`);
  };

  const handleCreateRoom = () => {
    setShowMobileMenu(false);
    setShowCreateModal(true);
  };

  // scroll to top after the new page has rendered so headings stay visible
  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      mobileContentRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      window.scrollTo(0, 0);
    });
  }, [activeView]);

  const handleProfile = () => {
    setShowMobileMenu(false);
    navigate(`/${user?.username}`);
  };

  const handleLogout = async () => {
    setShowMobileMenu(false);
    await logout();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      <Sidebar
        activeView={activeView}
        setActiveView={handleNavigate}
        onCreateRoom={handleCreateRoom}
      />

      <div className="dashboard-main">
        <div className="dashboard-mobile-shell">
          <div className="dashboard-mobile-content" ref={mobileContentRef} key={activeView}>
            {activeView === "yourrooms" && (
              <YourRoomsScreen onOpenRoom={(roomId) => navigate(`/room/${roomId}`)} />
            )}
            {activeView === "explore" && (
              <ExploreRooms onCreateRoom={handleCreateRoom} />
            )}
            {activeView === "myrooms" && <MyRooms />}
            {activeView === "saved" && <SavedMessages />}
            {activeView === "notifications" && <Notifications />}
          </div>

          <MobileBottomNav
            activeView={activeView}
            onNavigate={handleNavigate}
            onCreateRoom={handleCreateRoom}
          />
        </div>

        <div className="dashboard-mobile-float-actions">
          <button
            className="dashboard-mobile-hamburger"
            onClick={() => setShowMobileMenu((prev) => !prev)}
            aria-label="Open menu"
          >
            <HamburgerIcon />
          </button>

          {showMobileMenu && (
            <div className="dashboard-mobile-menu" onClick={() => setShowMobileMenu(false)}>
              <div className="dashboard-mobile-menu-card" onClick={(e) => e.stopPropagation()}>
                <div className="dashboard-mobile-menu-header">
                  <span>Menu</span>
                </div>

                <div className="dashboard-mobile-menu-links">
                  <button onClick={handleProfile}>Profile</button>
                  <button onClick={() => { setShowMobileMenu(false); navigate("/myrooms"); }}>My Rooms</button>
                  <button onClick={handleLogout} className="menu-danger">Logout</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-desktop-content">
          {activeView === "explore" && (
            <ExploreRooms onCreateRoom={() => setShowCreateModal(true)} />
          )}
          {activeView === "myrooms" && <MyRooms />}
          {activeView === "saved" && <SavedMessages />}
          {activeView === "notifications" && <Notifications />}
          {activeView === "profile" && <UserProfile />}
        </div>
      </div>

      {showCreateModal && (
        <CreateRoomModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

export default DashboardPage;

const MobileBottomNav = ({ activeView, onNavigate, onCreateRoom }) => (
  <div className="dashboard-mobile-bottomnav">
    <button className={`mobile-nav-item ${activeView === "yourrooms" ? "active" : ""}`} onClick={() => onNavigate("yourrooms") }>
      <YourRoomsIcon />
      <span>Rooms</span>
    </button>
    <button className={`mobile-nav-item ${activeView === "explore" ? "active" : ""}`} onClick={() => onNavigate("explore")}>
      <ExploreIcon />
      <span>Explore</span>
    </button>
    <button className="mobile-nav-create" onClick={onCreateRoom} aria-label="Create room">
      <PlusIcon />
    </button>
    <button className={`mobile-nav-item ${activeView === "saved" ? "active" : ""}`} onClick={() => onNavigate("saved")}>
      <SavedIcon />
      <span>Saved</span>
    </button>
    <button className={`mobile-nav-item ${activeView === "notifications" ? "active" : ""}`} onClick={() => onNavigate("notifications")}>
      <BellIcon />
      <span>Alerts</span>
    </button>
  </div>
);

const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
);

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const YourRoomsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16M4 12h10M4 18h16" />
  </svg>
);

const ExploreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SavedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const YourRoomsScreen = ({ onOpenRoom }) => {
  const { user } = useAuth();
  const { fetchMyRooms, pagesCache } = useRooms();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const cached = pagesCache["1:20"];
        if (cached?.rooms) {
          setRooms(cached.rooms || []);
          setLoading(false);
          return;
        }

        setLoading(true);
        const payload = await fetchMyRooms(1, 20);
        if (!mounted) return;
        setRooms(payload?.rooms || []);
      } catch {
        if (!mounted) return;
        setRooms([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (user?._id) load();
    return () => { mounted = false; };
  }, [user?._id, fetchMyRooms, pagesCache]);

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Recently";
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Active now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  };

  const filteredRooms = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return rooms;

    return rooms.filter((room) => {
      const name = room.name || "";
      const topic = room.topic || "";
      return [name, topic].some((value) => value.toLowerCase().includes(term));
    });
  }, [rooms, searchQuery]);

  return (
    <div className="your-rooms-screen">
      <div className="your-rooms-header">
        <div>
          <h1 className="your-rooms-title">Your Rooms</h1>
        </div>

        <div className="your-rooms-search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search rooms"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="your-rooms-list">
        {loading ? (
          <div className="your-rooms-empty">Loading rooms...</div>
        ) : filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <button
              key={room._id}
              className="your-room-row"
              onClick={() => onOpenRoom(room._id)}
            >
              <div className="your-room-icon" data-topic={room.topic || "Other"}>
                {(() => {
                  const logo = getLogoForTopic(room.topic);
                  return logo ? <img src={logo} alt={room.topic} /> : room.name.charAt(0);
                })()}
              </div>
              <div className="your-room-copy">
                <div className="your-room-topline">
                  <span className="your-room-name">{room.name}</span>
                  <span className="your-room-time">{formatLastSeen(room.updatedAt)}</span>
                </div>
                <div className="your-room-subline">
                  {room.topic || "Other"}
                  {room.members?.length ? ` · ${room.members.length} members` : ""}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="your-rooms-empty">
            {searchQuery ? "No matching rooms found" : "No rooms joined yet"}
          </div>
        )}
      </div>
    </div>
  );
};