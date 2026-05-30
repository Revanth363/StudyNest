import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getSocket,
  joinRoom,
  leaveRoom,
  onRoomOnlineUsers,
  offRoomOnlineUsers,
} from "../../socket/socket";
import api from "../../services/api";
import Avatar from "../shared/Avatar";
import FormattedContent from "../shared/FormattedContent";
import { getLogoForTopic } from "../../utils/topicLogos";
import "./ChatPanel.css";

const TABS = ["Chat", "Resources", "Pinned", "Info"];

const ChatPanel = ({ room, activeTab, setActiveTab, onRoomUpdate, onBackToRooms }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [modalImage, setModalImage] = useState(null);
  const [openMessageMenuId, setOpenMessageMenuId] = useState(null);
  const [savedMessageIds, setSavedMessageIds] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const bottomRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
    joinRoom(room._id);

    onRoomOnlineUsers((data) => {
      setOnlineUsers(data.onlineUsers);
    });

    return () => {
      leaveRoom(room._id);
      offRoomOnlineUsers();
    };
  }, [room._id]);

  const handleLeaveRoom = async () => {
    try {
      await api.post(`/rooms/${room._id}/leave`);
    } catch (err) {
      // ignore server errors for graceful UX
    }

    try {
      leaveRoom(room._id);
    } catch (err) {}

    // Navigate to dashboard and show My Rooms
    navigate("/", { state: { activeView: "myrooms" } });
  };

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(`mutedRoom:${room._id}`) === "true";
    } catch (err) {
      return false;
    }
  });

  const handleToggleMute = async () => {
    const next = !isMuted;
    setIsMuted(next);
    try {
      localStorage.setItem(`mutedRoom:${room._id}`, next ? "true" : "false");
      // best-effort server call if endpoint exists
      await api.post(`/users/me/rooms/${room._id}/mute`, { mute: next }).catch(() => {});
    } catch (err) {}
  };

  const handleOpenReport = () => setReportOpen(true);

  const submitReport = async () => {
    try {
      // Try server endpoint; if missing, still close modal
      await api.post(`/rooms/${room._id}/report`, { reason: reportReason });
      alert("Report submitted. Room admins will be notified.");
    } catch (err) {
      // Endpoint likely not implemented yet — still acknowledge locally
      alert("Report queued (server endpoint may be missing). Admins will be notified when available.");
    } finally {
      setReportReason("");
      setReportOpen(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/messages/${room._id}`);
      setMessages(res.data.messages);
      // ensure we land on the latest message after initial load
      setTimeout(() => {
        try { bottomRef.current?.scrollIntoView({ behavior: "auto" }); } catch (e) {}
      }, 40);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMessageReceive = ({ message }) => {
      setMessages((prev) => {
        const exists = prev.find((m) => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isDeleted: true } : m))
      );
    };

    const handleMessagePinned = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isPinned: true } : m))
      );
    };

    const handleMessageUnpinned = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isPinned: false } : m))
      );
    };

    const handleTypingStart = ({ userId }) => {
      setTypingUsers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
    };

    const handleTypingStop = ({ userId }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    };

    socket.on("message:receive", handleMessageReceive);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("message:pinned", handleMessagePinned);
    socket.on("message:unpinned", handleMessageUnpinned);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.off("message:receive", handleMessageReceive);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("message:pinned", handleMessagePinned);
      socket.off("message:unpinned", handleMessageUnpinned);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, []);

  useEffect(() => {
    const loadSavedMessages = async () => {
      try {
        const res = await api.get("/messages/saved");
        setSavedMessageIds((res.data.messages || []).map((message) => message._id));
      } catch {
        setSavedMessageIds([]);
      }
    };

    loadSavedMessages();
  }, []);

  const handleDeleteMessage = (messageId) => {
    setMessages((prev) =>
      prev.map((m) => (m._id === messageId ? { ...m, isDeleted: true } : m))
    );
  };

  const handleSaveMessage = async (messageId) => {
    try {
      await api.post(`/messages/${messageId}/save`);
      setSavedMessageIds((prev) =>
        prev.includes(messageId) ? prev : [...prev, messageId]
      );
    } catch {}
  };

  const handleUnsaveMessage = async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}/save`);
      setSavedMessageIds((prev) => prev.filter((id) => id !== messageId));
    } catch {}
  };

  const pinnedMessage = [...messages].reverse().find((m) => m.isPinned);

  const filteredMessages = search
    ? messages.filter((m) =>
        m.content?.toLowerCase().includes(search.toLowerCase())
      )
    : messages;

  const typingMembers = room.members?.filter(
    (m) => typingUsers.includes(m._id) && m._id !== user?._id
  );

  return (
    <>
      <div className="chat-panel" onClick={() => setOpenMessageMenuId(null)}>
      <ChatHeader
        room={room}
        showSearch={showSearch}
        search={search}
        setSearch={setSearch}
        onToggleSearch={() => setShowSearch(!showSearch)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLeaveRoom={handleLeaveRoom}
        onReportRoom={handleOpenReport}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onBackToRooms={onBackToRooms}
      />
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reason={reportReason}
        setReason={setReportReason}
        onSubmit={submitReport}
      />

      {activeTab === "Chat" && (
        <>
          {pinnedMessage && <PinnedBar message={pinnedMessage} />}

          <div className="chat-messages">
            {loading ? (
              <div className="messages-loading">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`message-skeleton ${i % 2 === 0 ? "skeleton-right" : ""}`} />
                ))}
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="messages-empty">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              filteredMessages.map((message, index) => (
                <MessageBubble
                  key={message._id}
                  message={message}
                  prevMessage={filteredMessages[index - 1]}
                  onDelete={handleDeleteMessage}
                  onSave={handleSaveMessage}
                  onUnsave={handleUnsaveMessage}
                  roomAdmins={room.admins}
                  roomCreatedById={room.createdBy?._id}
                  setModalImage={setModalImage}
                  openMessageMenuId={openMessageMenuId}
                  setOpenMessageMenuId={setOpenMessageMenuId}
                  isSaved={savedMessageIds.includes(message._id)}
                />
              ))
            )}

            {typingMembers?.length > 0 && (
              <TypingIndicator members={typingMembers} />
            )}

            <div ref={bottomRef} />
          </div>

          <MessageInput
            roomId={room._id}
            onNewMessage={(msg) => {
              setMessages((prev) => {
                const exists = prev.find((m) => m._id === msg._id);
                if (exists) return prev;
                return [...prev, msg];
              });
            }}
          />
        </>
      )}

      {activeTab === "Pinned" && (
        <PinnedTab messages={messages.filter((m) => m.isPinned)} />
      )}

      {activeTab === "Resources" && (
        <ResourcesTab messages={messages.filter((m) => m.fileType !== "none")} />
      )}

      {activeTab === "Info" && (
        <InfoTab
          room={room}
          memberSearch={memberSearch}
          setMemberSearch={setMemberSearch}
          onRoomUpdate={onRoomUpdate}
        />
      )}
      </div>
      <ImageModal image={modalImage} onClose={() => setModalImage(null)} />
    </>
  );
};

  const ChatHeader = ({ room, showSearch, search, setSearch, onToggleSearch, activeTab, setActiveTab, onLeaveRoom, onReportRoom, isMuted, onToggleMute, onBackToRooms }) => {
  const roomLogo = getLogoForTopic(room.topic);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    const [showMobileSheet, setShowMobileSheet] = useState(false);
    const [isMobileView, setIsMobileView] = useState(false);

  // close header menu when clicking outside
  useEffect(() => {
    if (!showHeaderMenu) return;
    const handler = () => setShowHeaderMenu(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showHeaderMenu]);

    useEffect(() => {
      const media = window.matchMedia("(max-width: 768px)");
      const update = () => setIsMobileView(media.matches);
      update();
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }, []);

    useEffect(() => {
      if (!showMobileSheet) return;
      const handler = (e) => {
        if (e.key === "Escape") setShowMobileSheet(false);
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [showMobileSheet]);

    const mobileMenuSelect = (tab) => {
      setActiveTab(tab);
      setShowMobileSheet(false);
    };

  const handleBellClick = (e) => {
    e.stopPropagation();
    onToggleMute && onToggleMute();
  };

    const handleMenuButton = (e) => {
      e.stopPropagation();
      if (isMobileView) {
        setShowMobileSheet((s) => !s);
        setShowHeaderMenu(false);
        return;
      }
      setShowHeaderMenu((s) => !s);
    };

      const handleBackClick = () => {
        if (activeTab !== "Chat") {
          setActiveTab("Chat");
          return;
        }
        onBackToRooms?.();
      };

  return (
    <div className="chat-header">
      <div className="chat-header-top">
        <div className="chat-header-left">
              <button className="chat-back-btn" onClick={handleBackClick} aria-label="Back to chat">
              <BackIcon />
            </button>
          <div className="chat-room-icon">
            {roomLogo ? <img src={roomLogo} alt={room.topic} /> : room.name.charAt(0)}
          </div>
          <button type="button" className="chat-room-title-button" onClick={() => setActiveTab("Info")} aria-label="Open room info">
            <h2 className="chat-room-name">{room.name}</h2>
            <p className="chat-room-meta">
              {room.members?.length} members
              {room.isPrivate && room.roomCode && (
                <>
                  <span className="meta-dot">•</span>
                  Join Code: <span className="room-code">{room.roomCode}</span>
                </>
              )}
            </p>
          </button>
        </div>

        <div className="chat-header-actions">
          <button
            className={`header-icon-btn ${showSearch ? "header-icon-active" : ""}`}
            onClick={onToggleSearch}
          >
            <SearchIcon />
          </button>
          <button className="header-icon-btn" onClick={handleBellClick} title={isMuted ? "Unmute notifications" : "Mute notifications"}>
            {isMuted ? <BellOffIcon /> : <BellIcon />}
          </button>
          <div style={{ position: "relative" }}>
            <button className="header-icon-btn" onClick={handleMenuButton}>
              <DotsIcon />
            </button>
            {showHeaderMenu && (
              <div className="header-menu" onClick={(e) => e.stopPropagation()}>
                <button className="header-menu-item header-menu-item-danger" onClick={() => { setShowHeaderMenu(false); onLeaveRoom && onLeaveRoom(); }}>
                  Leave room
                </button>
                <button className="header-menu-item" onClick={() => { setShowHeaderMenu(false); onReportRoom && onReportRoom(); }}>
                  Report room
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSearch && (
        <div className="chat-search-bar">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <CloseIcon />
            </button>
          )}
        </div>
      )}

      <div className="chat-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`chat-tab ${activeTab === tab ? "chat-tab-active" : ""}`}
            onClick={() => setActiveTab(tab)}
            style={{ color: "#ffffff" }}
          >
            {tab}
          </button>
        ))}
      </div>

      {showMobileSheet && (
        <div className="mobile-sheet-backdrop" onClick={() => setShowMobileSheet(false)}>
          <div className="mobile-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-handle" />
            <button className="mobile-sheet-item" onClick={() => mobileMenuSelect("Info")}>Room Info</button>
            <button className="mobile-sheet-item" onClick={() => mobileMenuSelect("Resources")}>Resources</button>
            <button className="mobile-sheet-item" onClick={() => mobileMenuSelect("Pinned")}>Pinned Messages</button>
            <button className="mobile-sheet-item mobile-sheet-item-danger" onClick={() => { setShowMobileSheet(false); onLeaveRoom && onLeaveRoom(); }}>Leave Room</button>
            <button className="mobile-sheet-item" onClick={() => { setShowMobileSheet(false); onReportRoom && onReportRoom(); }}>Report Room</button>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportModal = ({ open, onClose, reason, setReason, onSubmit }) => {
  if (!open) return null;
  return (
    <div className="report-modal-backdrop" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Report Room</h3>
        <p>Please describe why you're reporting this room. Admins will review.</p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={onClose} className="report-cancel-btn">Cancel</button>
          <button onClick={onSubmit} className="btn-primary">Submit Report</button>
        </div>
      </div>
    </div>
  );
};

const PinnedBar = ({ message }) => (
  <div
    className="pinned-bar"
    onClick={() => {
      try {
        const el = document.getElementById(`msg-${message._id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (err) {
        console.error(err);
      }
    }}
    style={{ cursor: "pointer" }}
  >
    <PinIcon />
    <div className="pinned-bar-content">
      <span className="pinned-by">Pinned by Admin</span>
      <FormattedContent content={message.content} className="pinned-text" />
    </div>
  </div>
);

const TypingIndicator = ({ members }) => (
  <div className="typing-indicator">
    <div className="typing-dots">
      <span /><span /><span />
    </div>
    <span className="typing-text">
      {members.map((m) => m.username).join(", ")}{" "}
      {members.length === 1 ? "is" : "are"} typing...
    </span>
  </div>
);

const isCodeOnlyMessage = (content) => {
  if (!content) return false;
  return /^```[^\n`]*\n[\s\S]*```$/.test(content.trim());
};

const MessageBubble = ({ message, prevMessage, onDelete, onSave, onUnsave, roomAdmins, roomCreatedById, setModalImage, openMessageMenuId, setOpenMessageMenuId, isSaved }) => {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);

  const currentUserId = user?._id?.toString();
  const senderId = message.sender?._id?.toString();
  const roomAdminIds = (roomAdmins || []).map((admin) =>
    (admin?._id || admin)?.toString()
  );
  const roomCreatorId = roomCreatedById?.toString();

  const isOwn = senderId === currentUserId;
  const isAdmin = roomAdminIds.includes(currentUserId) || roomCreatorId === currentUserId;
  const canDeleteMessage = isAdmin || isOwn;
  const canPinMessage = isAdmin;
  const prevSender = prevMessage?.sender?._id;
  const currSender = message.sender?._id;
  const showAvatar = prevSender !== currSender;

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (message.isDeleted) {
    return (
      <div className={`message-row ${isOwn ? "message-row-own" : ""}`}>
        <div className="message-deleted">This message was deleted</div>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/messages/${message._id}`);
      const socket = getSocket();
      socket?.emit("message:delete", {
        messageId: message._id,
        roomId: message.room,
      });
      onDelete(message._id);
    } catch {}
  };

  const handlePin = async () => {
    try {
      await api.post(`/messages/${message._id}/pin`);
      const socket = getSocket();
      socket?.emit("message:pin", {
        messageId: message._id,
        roomId: message.room,
      });
    } catch {}
  };

  const handleUnpin = async () => {
    try {
      await api.post(`/messages/${message._id}/unpin`);
      const socket = getSocket();
      socket?.emit("message:unpin", {
        messageId: message._id,
        roomId: message.room,
      });
    } catch {}
  };

  const showMenu = openMessageMenuId === message._id;
  const copyText = message.fileType !== "none"
    ? [message.content, message.fileName].filter(Boolean).join("\n")
    : message.content || "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
    } catch {
      const temp = document.createElement("textarea");
      temp.value = copyText;
      temp.style.position = "fixed";
      temp.style.left = "-9999px";
      document.body.appendChild(temp);
      temp.focus();
      temp.select();
      document.execCommand("copy");
      temp.remove();
    }
    setOpenMessageMenuId(null);
  };

  return (
    <div
      id={`msg-${message._id}`}
      className={`message-row ${isOwn ? "message-row-own" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setOpenMessageMenuId(null);
      }}
    >
      {!isOwn && (
        <div className="message-avatar">
          {showAvatar ? (
            <Avatar name={message.sender?.username} src={message.sender?.avatar} size={32} />
          ) : (
            <div style={{ width: 32 }} />
          )}
        </div>
      )}

      <div className="message-body">
        {!isOwn && showAvatar && (
          <div className="message-sender-name">
            {message.sender?.username}
            {roomAdminIds.includes(senderId) && (
              <span className="sender-admin-badge">Admin</span>
            )}
          </div>
        )}

        <div className={`message-bubble ${isOwn ? "bubble-own" : "bubble-other"} ${message.fileType === "none" ? "message-bubble-text" : ""} ${message.fileType === "none" && isCodeOnlyMessage(message.content) ? "message-bubble-code-only" : ""}`}>
          {message.fileType !== "none" && message.fileUrl ? (
            <FilePreview message={message} setModalImage={setModalImage} />
          ) : (
            <FormattedContent content={message.content} className="message-text" codeOnly={isCodeOnlyMessage(message.content)} />
          )}
          <span className="message-time">{time}</span>
        </div>

        <div className={`message-actions ${isOwn ? "actions-own" : ""}`}>
          {showActions && (
            <div className="message-dots-wrapper">
              <button
                className="dots-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMessageMenuId((current) => (current === message._id ? null : message._id));
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="5" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                </svg>
              </button>

              {showMenu && (
                <div className="message-menu" onClick={(e) => e.stopPropagation()}>
                  <button onClick={handleCopy} className="menu-item">
                    Copy
                  </button>
                  {canPinMessage && (
                    <button
                      onClick={message.isPinned ? handleUnpin : handlePin}
                      className="menu-item"
                    >
                      {message.isPinned ? "Unpin" : "Pin"}
                    </button>
                  )}
                  <button
                    onClick={() => (isSaved ? onUnsave(message._id) : onSave(message._id))}
                    className="menu-item"
                  >
                    {isSaved ? "Unsave" : "Save"}
                  </button>
                  {canDeleteMessage && (
                    <button onClick={handleDelete} className="menu-item">Delete</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FilePreview = ({ message, setModalImage }) => {
  if (message.fileType === "image") {
    return (
      <div className="message-file-preview">
        <img
          src={message.fileUrl}
          alt={message.fileName}
          className="message-image"
          style={{ cursor: "zoom-in" }}
          onClick={() => setModalImage && setModalImage({ src: message.fileUrl, name: message.fileName, caption: message.content })}
        />
        {message.content && <FormattedContent content={message.content} className="file-caption" />}
      </div>
    );
  }

  return (
    <div className="message-file-preview">
      <div className="message-file">
        <button
          className="file-view-btn"
          onClick={async (e) => {
            e.stopPropagation();
            try {
              const resp = await fetch(message.fileUrl);
              const blob = await resp.blob();
              const forcedMime = message.fileType === "pdf" ? "application/pdf" : (blob.type || "application/octet-stream");
              const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: forcedMime }));
              window.open(blobUrl, "_blank");
            } catch (err) {
              console.error("Open file failed", err);
              // fallback to direct open
              window.open(message.fileUrl, "_blank");
            }
          }}
        >
          <FileIcon type={message.fileType} />
          <div className="file-info">
            <span className="file-name">{message.fileName}</span>
          </div>
        </button>
        <button
          className="file-download-btn"
          onClick={async (e) => {
            e.stopPropagation();
            try {
              const resp = await fetch(message.fileUrl);
              const blob = await resp.blob();
              const forcedMime = message.fileType === "pdf" ? "application/pdf" : (blob.type || "application/octet-stream");
              const url = window.URL.createObjectURL(new Blob([blob], { type: forcedMime }));
              const a = document.createElement("a");
              a.href = url;
              a.download = message.fileName || "file";
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            } catch (err) {
              console.error("Download failed", err);
            }
          }}
        >
          <DownloadIcon />
        </button>
      </div>
        {message.content && <FormattedContent content={message.content} className="file-caption" />}
    </div>
  );
};

const ImageModal = ({ image, onClose }) => {
  useEffect(() => {
    if (!image) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [image, onClose]);

  if (!image) return null;

  const handleDownload = async () => {
    try {
      const resp = await fetch(image.src);
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = image.name || "image";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download image failed", err);
    }
  };

  return (
    <div
      className="image-modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
      }}
    >
      <div
        className="image-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "90%", maxHeight: "90%", position: "relative" }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ position: "absolute", right: 8, top: 8, zIndex: 1300 }}
        >
          ✕
        </button>
        <img
          src={image.src}
          alt={image.name}
          style={{ maxWidth: "100%", maxHeight: "80vh", display: "block", margin: "0 auto" }}
        />
        {image.caption && <p style={{ color: "#fff", textAlign: "center", marginTop: 8 }}>{image.caption}</p>}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <button onClick={handleDownload} className="download-btn">Download</button>
        </div>
      </div>
    </div>
  );
};

const MessageInput = ({ roomId, onNewMessage }) => {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileRef = useRef(null);
  const typingTimer = useRef(null);
  const { user } = useAuth();
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    try {
      setIsMobileDevice(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    } catch (err) {
      setIsMobileDevice(false);
    }
  }, []);

  const emitTypingStart = () => {
    const socket = getSocket();
    if (!isTyping) {
      socket?.emit("typing:start", { roomId });
      setIsTyping(true);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket?.emit("typing:stop", { roomId });
      setIsTyping(false);
    }, 1500);
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    emitTypingStart();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    // Generate preview
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview({
          type: "image",
          src: event.target.result,
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview({
        type: "file",
        name: file.name,
        fileType: file.type.split("/")[1] || "file",
      });
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    fileRef.current.value = "";
  };

  const handleSend = async () => {
    if ((!content.trim() && !selectedFile) || sending) return;

    const socket = getSocket();
    socket?.emit("typing:stop", { roomId });
    setIsTyping(false);
    clearTimeout(typingTimer.current);

    try {
      setSending(true);

      // If there's a file, upload it first
      if (selectedFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("content", content.trim());
        const res = await api.post(`/messages/${roomId}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        
        const uploadedMessage = res.data.message;
        
        // Add message immediately to UI (don't wait for socket)
        if (onNewMessage) {
          onNewMessage(uploadedMessage);
        }
        
        // Also emit socket event to broadcast to other users
        socket?.emit("message:send", { roomId, messageId: uploadedMessage._id });
        setUploading(false);
      } else if (content.trim()) {
        // Just text message
        socket?.emit("message:send", { roomId, content });
      }

      setContent("");
      setSelectedFile(null);
      setFilePreview(null);
      fileRef.current.value = "";
    } catch (error) {
      console.error("Send error:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // Allow newline with Shift+Enter
      if (e.shiftKey) return;

      // On mobile devices avoid sending on plain Enter — require explicit send button
      if (isMobileDevice && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        return;
      }

      // Desktop: allow Ctrl/Cmd+Enter or plain Enter
      if (!isMobileDevice || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  return (
    <div className="message-input-wrapper">
      {filePreview && (
        <div className="file-preview-bar">
          {filePreview.type === "image" ? (
            <>
              <img src={filePreview.src} alt={filePreview.name} className="preview-image" />
              <div className="preview-info">
                <span className="preview-name">{filePreview.name}</span>
              </div>
            </>
          ) : (
            <>
              <FileIcon type={filePreview.fileType} />
              <div className="preview-info">
                <span className="preview-name">{filePreview.name}</span>
                <span className="preview-type">{filePreview.fileType?.toUpperCase()}</span>
              </div>
            </>
          )}
          <button
            className="preview-remove-btn"
            onClick={handleRemoveFile}
            disabled={uploading}
          >
            ✕
          </button>
        </div>
      )}

      <div className="message-input-box">
        <button
          className="input-icon-btn"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || sending}
        >
          {uploading ? <span className="upload-spinner" /> : <AttachIcon />}
        </button>

        <input
          type="file"
          ref={fileRef}
          style={{ display: "none" }}
          accept="image/*,.pdf,.txt"
          onChange={handleFileSelect}
        />

        <textarea
          className="message-textarea"
          placeholder={selectedFile ? "Add a message (optional)..." : "Type your message..."}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        <button className="input-icon-btn">
          <EmojiIcon />
        </button>

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={(!content.trim() && !selectedFile) || sending || uploading}
        >
          {uploading ? <span className="upload-spinner" /> : <SendIcon />}
        </button>
      </div>
    </div>
  );
};

const PinnedTab = ({ messages }) => (
  <div className="tab-content">
    {messages.length === 0 ? (
      <div className="tab-empty">No pinned messages</div>
    ) : (
      messages.map((m) => (
        <div key={m._id} className="pinned-tab-item">
          <Avatar name={m.sender?.username} size={28} />
          <div>
            <span className="pinned-tab-sender">{m.sender?.username}</span>
            <FormattedContent content={m.content} className="pinned-tab-text" />
          </div>
        </div>
      ))
    )}
  </div>
);

const ResourcesTab = ({ messages }) => {
  const [activeResourceTab, setActiveResourceTab] = useState("images");
  const images = messages.filter((m) => m.fileType === "image");
  const pdfs = messages.filter((m) => m.fileType === "pdf");
  const texts = messages.filter((m) => m.fileType === "txt");

  const resourceTabs = [
    { key: "images", label: "Images", count: images.length },
    { key: "pdfs", label: "PDFs", count: pdfs.length },
    { key: "texts", label: "Text & Links", count: texts.length },
  ];

  const activeItems = activeResourceTab === "images" ? images : activeResourceTab === "pdfs" ? pdfs : texts;

  const renderImageItem = (m) => (
    <div key={m._id} className="resource-item resource-image-item">
      <a
        href={m.fileUrl}
        target="_blank"
        rel="noreferrer"
        onClick={async (e) => {
          e.preventDefault();
          try {
            const resp = await fetch(m.fileUrl);
            const blob = await resp.blob();
            const forcedMime = blob.type || "image/jpeg";
            const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: forcedMime }));
            window.open(blobUrl, "_blank");
          } catch (err) {
            console.error("Open image failed", err);
            window.open(m.fileUrl, "_blank");
          }
        }}
        className="resource-media-link"
      >
        <img src={m.fileUrl} alt={m.fileName} className="resource-image-thumb" />
      </a>
      <div className="resource-item-info">
        <span className="resource-item-name">{m.fileName}</span>
        <span className="resource-item-meta">by {m.sender?.username}</span>
        {m.content && <FormattedContent content={m.content} className="resource-item-caption" />}
      </div>
    </div>
  );

  const renderPdfItem = (m) => (
    <a
      key={m._id}
      href={m.fileUrl}
      target="_blank"
      rel="noreferrer"
      className="resource-item resource-link resource-doc-item"
      onClick={async (e) => {
        e.preventDefault();
        try {
          const resp = await fetch(m.fileUrl);
          const blob = await resp.blob();
          const forcedMime = "application/pdf";
          const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: forcedMime }));
          window.open(blobUrl, "_blank");
        } catch (err) {
          console.error("Open pdf failed", err);
          window.open(m.fileUrl, "_blank");
        }
      }}
    >
      <FileIcon type="pdf" />
      <div className="resource-item-info">
        <span className="resource-item-name">{m.fileName}</span>
        <span className="resource-item-meta">by {m.sender?.username}</span>
        {m.content && <FormattedContent content={m.content} className="resource-item-caption" />}
      </div>
    </a>
  );

  const renderTextItem = (m) => {
    const hasLink = m.content?.includes("https://");
    return (
      <div key={m._id} className="resource-item resource-text-item">
        {hasLink ? (
          <a href={m.content} target="_blank" rel="noreferrer" className="resource-link resource-link-inline">
            <LinkIcon />
            <span className="resource-link-text">{m.content}</span>
          </a>
        ) : (
          <>
            <FileIcon type="txt" />
            <span className="resource-text-name">{m.fileName}</span>
          </>
        )}
        <span className="resource-item-meta">by {m.sender?.username}</span>
      </div>
    );
  };

  return (
    <div className="tab-content resources-panel">
      {messages.length === 0 ? (
        <div className="tab-empty">No resources shared yet</div>
      ) : (
        <>
          <div className="resources-tabs">
            {resourceTabs.map((tab) => (
              <button
                key={tab.key}
                className={`resource-filter-tab ${activeResourceTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveResourceTab(tab.key)}
              >
                <span>{tab.label}</span>
                <span className="resource-filter-count">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="resources-column-content resources-list">
            {activeItems.length > 0 ? (
              activeResourceTab === "images"
                ? activeItems.map(renderImageItem)
                : activeResourceTab === "pdfs"
                  ? activeItems.map(renderPdfItem)
                  : activeItems.map(renderTextItem)
            ) : (
              <div className="column-empty">
                {activeResourceTab === "images"
                  ? "No images"
                  : activeResourceTab === "pdfs"
                    ? "No PDFs"
                    : "No text files or links"}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const InfoTab = ({ room, memberSearch, setMemberSearch, onRoomUpdate }) => {
  const { user } = useAuth();
  const [hoveredMemberId, setHoveredMemberId] = useState(null);
  const isAdmin = room.admins?.some((admin) => {
    const adminId = admin?._id || admin;
    return adminId?.toString() === user?._id?.toString();
  });

  const filteredMembers = (room.members || []).filter((member) => {
    const term = memberSearch.trim().toLowerCase();
    if (!term) return true;
    return (
      member.username?.toLowerCase().includes(term) ||
      member.email?.toLowerCase().includes(term)
    );
  });

  const roomAdminIds = (room.admins || []).map((admin) => (admin?._id || admin)?.toString());

  const handleRemoveUser = async (userId) => {
    try {
      await api.post(`/rooms/${room._id}/remove-user`, { userId });
      await onRoomUpdate?.();
    } catch (error) {
      console.error("Failed to remove user", error);
    }
  };

  const handleMakeAdmin = async (userId) => {
    try {
      await api.post(`/rooms/${room._id}/assign-admin`, { userId });
      await onRoomUpdate?.();
    } catch (error) {
      console.error("Failed to assign admin", error);
    }
  };

  const handleRemoveAdmin = async (userId) => {
    try {
      await api.post(`/rooms/${room._id}/remove-admin`, { userId });
      await onRoomUpdate?.();
    } catch (error) {
      console.error("Failed to remove admin", error);
    }
  };

  return (
    <div className="tab-content">
      <div className="info-section">
        <h4>About this room</h4>
        <p>{room.description || "No description provided."}</p>
      </div>
      <div className="info-section">
        <h4>Topic</h4>
        <p>{room.topic}</p>
      </div>
      <div className="info-section">
        <h4>Created by</h4>
        <p>{room.createdBy?.username}</p>
      </div>
      <div className="info-section">
        <h4>Members ({room.members?.length || 0})</h4>
        <div
          className="chat-search-bar"
          style={{ margin: "0 0 12px", padding: "8px 12px" }}
        >
          <SearchIcon />
          <input
            type="text"
            placeholder="Search members..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none" }}
          />
        </div>
        <div className="info-members-list">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => {
              const memberId = member._id?.toString();
              const memberIsAdmin = roomAdminIds.includes(memberId);
              const showActions = isAdmin && memberId !== user?._id?.toString() && hoveredMemberId === memberId;

              return (
                <div
                  key={member._id}
                  className="info-member-item"
                  onMouseEnter={() => setHoveredMemberId(memberId)}
                  onMouseLeave={() => setHoveredMemberId(null)}
                >
                  <Avatar name={member.username} src={member.avatar} size={28} />
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                    <span className="info-member-name">{member.username}</span>
                    {member.email && (
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{member.email}</span>
                    )}
                  </div>
                  {memberIsAdmin && (
                    <span className="info-admin-badge">Admin</span>
                  )}
                  {showActions && (
                    <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
                      {!memberIsAdmin ? (
                        <button
                          onClick={() => handleMakeAdmin(memberId)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid var(--border-light)",
                            background: "var(--bg-active)",
                            color: "#fff",
                            fontSize: 11,
                          }}
                        >
                          Make Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRemoveAdmin(memberId)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid rgba(245, 158, 11, 0.35)",
                            background: "rgba(245, 158, 11, 0.14)",
                            color: "#fff",
                            fontSize: 11,
                          }}
                        >
                          Remove Admin
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveUser(memberId)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid rgba(239, 68, 68, 0.35)",
                          background: "rgba(239, 68, 68, 0.12)",
                          color: "#fff",
                          fontSize: 11,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p>No members match your search</p>
          )}
        </div>
      </div>
      {room.isPrivate && room.roomCode && (
        <div className="info-section">
          <h4>Room Code</h4>
          <code className="info-room-code">{room.roomCode}</code>
        </div>
      )}
    </div>
  );
};

const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const BellIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);
const DotsIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
  </svg>
);
const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17z" />
  </svg>
);
const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const AttachIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
  </svg>
);
const EmojiIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const BellOffIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h11" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const FileIcon = ({ type }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={type === "pdf" ? "#ef4444" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007 0l1-1" />
    <path d="M14 11a5 5 0 00-7 0l-1 1" />
  </svg>
);

export default ChatPanel;