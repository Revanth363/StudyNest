import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./CreateRoomModal.css";

const TOPICS = ["DBMS", "DSA", "Operating Systems", "Computer Networks", "TOC", "React", "Interview Preparation", "Competitive Programming", "Other"];

const CreateRoomModal = ({ onClose }) => {
  const [form, setForm] = useState({ name: "", description: "", topic: "", isPrivate: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.topic) {
      setError("Room name and topic are required");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/rooms", form);
      onClose();
      navigate(`/room/${res.data.room._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create a Room</h2>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Room Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. GATE 2026 DBMS"
              value={form.name}
              onChange={handleChange}
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label>Topic</label>
            <select name="topic" value={form.topic} onChange={handleChange}>
              <option value="">Select a topic</option>
              {TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              name="description"
              placeholder="What is this room about?"
              value={form.description}
              onChange={handleChange}
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="form-toggle">
            <div className="toggle-info">
              <span className="toggle-label">Private Room</span>
              <span className="toggle-sub">Only joinable with a room code</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="isPrivate"
                checked={form.isPrivate}
                onChange={handleChange}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-submit" disabled={loading}>
              {loading ? <span className="btn-loader" /> : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default CreateRoomModal;