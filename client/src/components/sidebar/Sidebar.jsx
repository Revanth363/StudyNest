import { memo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useRooms } from "../../context/RoomsContext";
import Avatar from "../shared/Avatar";
import "./Sidebar.css";
import { getLogoForTopic } from "../../utils/topicLogos";

// Icon components
const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ExploreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const MyRoomsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
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

const DotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
  </svg>
);

const NAV_ITEMS = [
  { id: "myrooms", label: "My Rooms", icon: MyRoomsIcon },
  { id: "explore", label: "Explore Rooms", icon: ExploreIcon },
  { id: "saved", label: "Saved Messages", icon: SavedIcon },
  { id: "notifications", label: "Notifications", icon: BellIcon },
];

const Sidebar = ({ activeView, setActiveView, onCreateRoom, activeRoomId }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [width, setWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [showAllRooms, setShowAllRooms] = useState(false);
  const sidebarRef = useRef(null);
  const roomsSectionRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 500) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleLogout = async () => {
    await logout();
  };

  const handleNavClick = (itemId) => {
    if (activeRoomId) {
      navigate(`/${itemId}`);
      return;
    }

    setActiveView(itemId);
  };

  const handleCreateRoom = () => {
    navigate("/myrooms", { state: { openCreateRoom: true } });
  };

  return (
    <div className="sidebar" style={{ width: `${width}px`, minWidth: `${width}px` }} ref={sidebarRef}>
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <img src="/logo2.png" alt="StudyNest Logo" className="sidebar-logo-img" />
          <span>StudyNest</span>
        </div>

        <button className="create-room-btn" onClick={handleCreateRoom}>
          <span className="plus-icon">+</span>
          Create Room
        </button>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${!activeRoomId && activeView === item.id ? "nav-item-active" : ""}`}
              onClick={() => handleNavClick(item.id)}
            >
              <item.icon />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-section-label">Your Rooms</div>
        <div className={`sidebar-rooms ${showAllRooms ? "sidebar-rooms-expanded" : ""}`} ref={roomsSectionRef}>
          <YourRoomsList
            setActiveView={setActiveView}
            activeRoomId={activeRoomId}
            showAllRooms={showAllRooms}
            setShowAllRooms={setShowAllRooms}
            roomsSectionRef={roomsSectionRef}
          />
        </div>
      </div>

      <div className="sidebar-bottom">
        <div
          className="sidebar-user"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <Avatar name={user?.username} src={user?.avatar} size={36} />
          <div className="user-info">
            <span className="user-name">{user?.username}</span>
            <span className="user-handle">@{user?.username}</span>
          </div>
          <DotsIcon />
        </div>

        {showUserMenu && (
          <div className="user-menu">
            <button onClick={() => { navigate(`/${user?.username}`); setShowUserMenu(false); }}>Profile</button>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        )}
      </div>
      <div 
        className="sidebar-resize-handle" 
        onMouseDown={() => setIsResizing(true)}
      />
    </div>
  );
};

const YourRoomsList = ({ setActiveView, activeRoomId, showAllRooms, setShowAllRooms, roomsSectionRef }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchMyRooms, pagesCache } = useRooms();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadRooms = async () => {
      try {
        const cached = pagesCache["1:20"];
        if (cached?.rooms) {
          setRooms(cached.rooms);
          setLoading(false);
          return;
        }

        setLoading(true);
        const payload = await fetchMyRooms(1, 20);
        if (!mounted) return;
        setRooms(payload?.rooms || []);
      } catch (error) {
        if (!mounted) return;
        console.error("Failed to fetch rooms:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (user?._id) loadRooms();
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

  const handleViewAll = () => {
    setShowAllRooms((prev) => {
      const next = !prev;

      if (next && roomsSectionRef?.current) {
        requestAnimationFrame(() => {
          roomsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }

      return next;
    });
  };

  const visibleRooms = showAllRooms ? rooms : rooms.slice(0, 5);

  if (loading) {
    return (
      <>
        <div style={{ color: "#999", textAlign: "center", padding: "10px" }}>
          Loading...
        </div>
      </>
    );
  }

  return (
    <>
      {rooms.length > 0 ? (
        visibleRooms.map((room) => (
          <button
            key={room._id}
            className={`sidebar-room-item ${activeRoomId === room._id ? "sidebar-room-active" : ""}`}
            onClick={() => navigate(`/room/${room._id}`)}
            title={room.name}
          >
            <div className="room-item-icon" data-topic={room.topic || "Other"}>
              {(() => {
                const logo = getLogoForTopic(room.topic);
                return logo ? <img src={logo} alt={room.topic} /> : room.name.charAt(0);
              })()}
            </div>
            <div className="room-item-info">
              <span className="room-item-name">{room.name}</span>
              <span className="room-item-last">
                {formatLastSeen(room.updatedAt)}
              </span>
            </div>
          </button>
        ))
      ) : (
        <div style={{ color: "#999", textAlign: "center", padding: "10px" }}>
          No rooms joined yet
        </div>
      )}
      <button
        className="view-all-btn"
        onClick={handleViewAll}
      >
        {showAllRooms ? "Show Less" : "View All"}
      </button>
    </>
  );
};

export default memo(Sidebar);