import { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import Avatar from "../shared/Avatar";
import FormattedContent from "../shared/FormattedContent";
import "./SavedMessages.css";

const SavedMessages = () => {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    try {
      setLoading(true);
      const res = await api.get("/messages/saved");
      setSaved(res.data.messages);
    } catch {
      setSaved([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}/save`);
      setSaved((prev) => prev.filter((m) => m._id !== messageId));
    } catch {}
  };

  const filteredSaved = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return saved;

    return saved.filter((message) => {
      const content = message.content || "";
      const sender = message.sender?.username || "";
      const room = message.room?.name || "";
      const fileName = message.fileName || "";
      const createdAt = message.createdAt ? new Date(message.createdAt) : null;
      const dateText = createdAt
        ? createdAt.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "";
      const isoDateText = createdAt ? createdAt.toISOString().toLowerCase() : "";

      return [content, sender, room, fileName, dateText, isoDateText].some((value) =>
        value.toLowerCase().includes(term)
      );
    });
  }, [saved, searchTerm]);

  return (
    <div className="saved">
      <div className="saved-header">
        <h1 className="saved-title">Saved Messages</h1>
        <p className="saved-sub">Messages you bookmarked across all rooms</p>
        <div className="saved-search-wrap">
          <input
            type="text"
            className="saved-search"
            placeholder="Search saved messages, rooms, people, files, or dates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="saved-body">
        {loading ? (
          <div className="saved-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="saved-skeleton" />
            ))}
          </div>
        ) : filteredSaved.length === 0 ? (
          <div className="saved-empty">
            <BookmarkIcon />
            <p>{searchTerm ? "No matching saved messages" : "No saved messages yet"}</p>
            <span>
              {searchTerm
                ? "Try a different keyword"
                : "Bookmark messages in any room to find them here"}
            </span>
          </div>
        ) : (
          <div className="saved-list">
            {filteredSaved.map((message) => (
              <SavedItem
                key={message._id}
                message={message}
                onUnsave={handleUnsave}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SavedItem = ({ message, onUnsave }) => {
  const time = new Date(message.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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
  };

  return (
    <div className="saved-item">
      <div className="saved-item-header">
        <div className="saved-item-user">
          <Avatar
            name={message.sender?.username}
            src={message.sender?.avatar}
            size={30}
          />
          <div>
            <span className="saved-sender">{message.sender?.username}</span>
            <span className="saved-room">
              in {message.room?.name || "Unknown Room"}
            </span>
          </div>
        </div>
        <div className="saved-item-right">
          <button
            className="copy-btn"
            onClick={handleCopy}
            title="Copy message"
          >
            <CopyIcon />
          </button>
          <span className="saved-time">{time}</span>
          <button
            className="unsave-btn"
            onClick={() => onUnsave(message._id)}
            title="Remove bookmark"
          >
            <BookmarkFilledIcon />
          </button>
        </div>
      </div>

      <div className="saved-item-content">
        {message.fileType !== "none" && message.fileUrl ? (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="saved-file"
          >
            <FileIcon />
            <span>{message.fileName}</span>
          </a>
        ) : (
          <FormattedContent content={message.content} className="saved-text" />
        )}
      </div>
    </div>
  );
};

const BookmarkIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
);

const BookmarkFilledIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
);

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);

const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export default SavedMessages;