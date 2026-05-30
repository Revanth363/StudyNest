import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { getSocket, onNotificationNew, offNotificationNew } from "../../socket/socket";
import "./Notifications.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const refreshNotifications = () => {
      fetchNotifications();
    };

    onNotificationNew(refreshNotifications);

    return () => {
      offNotificationNew();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="notifications">
      <div className="notif-header">
        <div>
          <h1 className="notif-title">Notifications</h1>
          <p className="notif-sub">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={handleMarkAllRead}>
            Mark all read
          </button>
        )}
      </div>

      <div className="notif-body">
        {loading ? (
          <div className="notif-list">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="notif-skeleton" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            <BellIcon />
            <p>No notifications yet</p>
            <span>You will see activity from your rooms here</span>
          </div>
        ) : (
          <div className="notif-list">
            {notifications.map((notif) => (
              <NotifItem
                key={notif._id}
                notif={notif}
                onMarkRead={handleMarkRead}
                onNavigate={() => {
                  handleMarkRead(notif._id);
                  if (notif.room) navigate(`/room/${notif.room}`);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const NotifItem = ({ notif, onMarkRead, onNavigate }) => {
  const time = new Date(notif.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`notif-item ${!notif.isRead ? "notif-unread" : ""}`}
      onClick={onNavigate}
    >
      <div className="notif-icon-wrap" data-type={notif.type}>
        <NotifIcon type={notif.type} />
      </div>

      <div className="notif-content">
        <p className="notif-message">{notif.message}</p>
        <span className="notif-time">{time}</span>
      </div>

      {!notif.isRead && (
        <button
          className="notif-dot-btn"
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead(notif._id);
          }}
          title="Mark as read"
        >
          <span className="notif-unread-dot" />
        </button>
      )}
    </div>
  );
};

const NotifIcon = ({ type }) => {
  if (type === "user_joined") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    );
  }
  if (type === "message_pinned") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17z" />
      </svg>
    );
  }
  if (type === "made_admin") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
};

const BellIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

export default Notifications;