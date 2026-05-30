import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./ExploreRooms.css";
import { getLogoForTopic } from "../../utils/topicLogos";

const TOPICS = ["All", "DBMS", "DSA", "Operating Systems", "Computer Networks", "TOC", "React", "Interview Preparation", "Competitive Programming", "Other"];

const ExploreRooms = ({ onCreateRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState("All");
  const [search, setSearch] = useState("");
  const [joining, setJoining] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, [activeTopic, search]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeTopic !== "All") params.topic = activeTopic;
      if (search) params.search = search;
      const res = await api.get("/rooms", { params });
      setRooms(res.data.rooms);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (room) => {
    try {
      setJoining(room._id);
      await api.post(`/rooms/${room._id}/join`);
      navigate(`/room/${room._id}`);
    } catch {
    } finally {
      setJoining(null);
    }
  };

  return (
    <div className="explore">
      <div className="explore-header">
        <div className="explore-title-row">
          <div>
            <h1 className="explore-title">Explore Rooms</h1>
            <p className="explore-sub">Find and join study rooms for your topics</p>
          </div>
        </div>

        <div className="explore-search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="topic-filters">
          {TOPICS.map((topic) => (
            <button
              key={topic}
              className={`topic-filter ${activeTopic === topic ? "topic-active" : ""}`}
              onClick={() => setActiveTopic(topic)}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <div className="explore-body">
        {loading ? (
          <div className="explore-loading">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="room-card-skeleton" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="explore-empty">
            <p>No rooms found</p>
            <button onClick={onCreateRoom}>Create one</button>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <RoomCard
                key={room._id}
                room={room}
                onJoin={handleJoin}
                joining={joining === room._id}
                onOpen={() => navigate(`/room/${room._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const RoomCard = ({ room, onJoin, joining, onOpen }) => {
  return (
    <div className="room-card">
      <div className="room-card-top">
        <div className="room-card-icon">
          {(() => {
            const logo = getLogoForTopic(room.topic);
            return logo ? <img src={logo} alt={room.topic} /> : room.name.charAt(0);
          })()}
        </div>
        <span className="room-card-topic">{room.topic}</span>
      </div>

      <h3 className="room-card-name">{room.name}</h3>

      {room.description && (
        <p className="room-card-desc">{room.description}</p>
      )}

      <div className="room-card-meta">
        <span className="room-card-members">
          <UsersIcon />
          {room.members?.length || 0} members
        </span>
        <span className="room-card-by">
          by {room.createdBy?.username}
        </span>
      </div>

      <div className="room-card-actions">
        <button className="room-card-open" onClick={onOpen}>
          Open
        </button>
        <button
          className="room-card-join"
          onClick={() => onJoin(room)}
          disabled={joining}
        >
          {joining ? "Joining..." : "Join"}
        </button>
      </div>
    </div>
  );
};

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const UsersIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

export default ExploreRooms;