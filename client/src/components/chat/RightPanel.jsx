import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Avatar from "../shared/Avatar";
import "./RightPanel.css";

const RightPanel = ({ room, onRoomUpdate, onlineUsers = [] }) => {
  const { user } = useAuth();
  const isAdmin = room.admins?.some(
    (a) => a._id === user?._id || a === user?._id
  );

  return (
    <div className="right-panel">
      <AboutSection room={room} />
      <OnlineMembersSection
        room={room}
        isAdmin={isAdmin}
        currentUser={user}
        onRoomUpdate={onRoomUpdate}
        onlineUsers={onlineUsers}
      />
      <FilesSection room={room} />
    </div>
  );
};

const AboutSection = ({ room }) => {
  return (
    <div className="rp-section">
      <h3 className="rp-section-title">About this room</h3>
      <p className="rp-about-text">
        {room.description || "No description provided."}
      </p>
      <div className="rp-about-meta">
        <div className="rp-meta-row">
          <ShieldIcon />
          <div>
            <span className="rp-meta-label">Created by</span>
            <span className="rp-meta-value">{room.createdBy?.username}</span>
          </div>
        </div>
        <div className="rp-meta-row">
          <CalendarIcon />
          <div>
            <span className="rp-meta-label">Created on</span>
            <span className="rp-meta-value">
              {new Date(room.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const OnlineMembersSection = ({ room, isAdmin, currentUser, onRoomUpdate, onlineUsers = [] }) => {
  const [menuOpen, setMenuOpen] = useState(null);

  // Filter members to only show those who are online
  const allMembers = room.members || [];
  const onlineMembers = allMembers.filter((member) =>
    onlineUsers.includes(member._id)
  );

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const handleRemoveUser = async (userId) => {
    try {
      await api.post(`/rooms/${room._id}/remove-user`, { userId });
      onRoomUpdate();
    } catch {}
    setMenuOpen(null);
  };

  const handleAssignAdmin = async (userId) => {
    try {
      await api.post(`/rooms/${room._id}/assign-admin`, { userId });
      onRoomUpdate();
    } catch {}
    setMenuOpen(null);
  };

  return (
    <div className="rp-section">
      <div className="rp-section-header">
        <h3 className="rp-section-title">
          Online Members ({onlineUsers.length})
        </h3>
      </div>

      <div className="rp-members-list">
        {onlineMembers.length === 0 ? (
          <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: "13px" }}>
            No one online right now
          </div>
        ) : (
          onlineMembers.map((member) => {
            const memberId = member._id;
            const isMemberAdmin = room.admins?.some(
              (a) => a._id === memberId || a === memberId
            );
            const isCurrentUser = memberId === currentUser?._id;

          return (
            <div key={memberId} className="rp-member-row">
              <div className="rp-member-avatar-wrap">
                <Avatar
                  name={member.username}
                  src={member.avatar}
                  size={32}
                />
                {isUserOnline(memberId) && (
                  <span className="rp-online-dot" />
                )}
              </div>

              <div className="rp-member-info">
                <span className="rp-member-name">
                  {member.username}
                  {isCurrentUser && (
                    <span className="rp-you-tag">You</span>
                  )}
                </span>
                {isMemberAdmin && (
                  <span className="rp-admin-tag">Admin</span>
                )}
              </div>

              {isAdmin && !isCurrentUser && (
                <div className="rp-member-actions">
                  <button
                    className="rp-member-menu-btn"
                    onClick={() =>
                      setMenuOpen(menuOpen === memberId ? null : memberId)
                    }
                  >
                    <DotsIcon />
                  </button>

                  {menuOpen === memberId && (
                    <div className="rp-member-menu">
                      {!isMemberAdmin && (
                        <button onClick={() => handleAssignAdmin(memberId)}>
                          Make Admin
                        </button>
                      )}
                      <button
                        className="rp-remove-btn"
                        onClick={() => handleRemoveUser(memberId)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
            })
        )}
      </div>
    </div>
  );
};

const FilesSection = ({ room }) => {
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [files, setFiles] = useState([]);
  const filesListRef = useRef(null);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const res = await api.get(`/messages/${room._id}`);
        const sharedFiles = (res.data.messages || []).filter(
          (message) => message.fileType && message.fileType !== "none" && message.fileUrl
        );
        setFiles(sharedFiles);
      } catch {
        setFiles([]);
      }
    };

    loadFiles();
  }, [room._id]);

  useEffect(() => {
    if (showAllFiles) {
      filesListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showAllFiles]);

  const visibleFiles = showAllFiles ? files : files.slice(0, 4);

  return (
    <div className="rp-section">
      <div className="rp-section-header">
        <h3 className="rp-section-title">Files & Resources</h3>
        <button
          className="rp-view-all"
          type="button"
          onClick={() => setShowAllFiles((prev) => !prev)}
        >
          {showAllFiles ? "View less" : "View all"}
        </button>
      </div>

      {files.length === 0 ? (
        <p className="rp-files-empty">No files shared yet</p>
      ) : (
        <div className="rp-files-list" ref={filesListRef}>
          {visibleFiles.map((file) => (
            <a
              key={file._id}
              href={file.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="rp-file-item"
              onClick={async (e) => {
                // Prevent default navigation and open blob URL with correct MIME (PDF handling)
                e.preventDefault();
                try {
                  const resp = await fetch(file.fileUrl);
                  const blob = await resp.blob();
                  const forcedMime = file.fileType === "pdf" ? "application/pdf" : (blob.type || "application/octet-stream");
                  const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: forcedMime }));
                  window.open(blobUrl, "_blank");
                } catch (err) {
                  console.error("Open resource failed", err);
                  // fallback: allow default behaviour
                  window.open(file.fileUrl, "_blank");
                }
              }}
            >
              <div className="rp-file-icon" data-type={file.fileType}>
                <FileIcon type={file.fileType} />
              </div>
              <div className="rp-file-info">
                <span className="rp-file-name">{file.fileName}</span>
                <span className="rp-file-meta">
                  {file.fileType?.toUpperCase()}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const DotsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
  </svg>
);

const FileIcon = ({ type }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={type === "pdf" ? "#ef4444" : type === "image" ? "#22c55e" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);

export default RightPanel;