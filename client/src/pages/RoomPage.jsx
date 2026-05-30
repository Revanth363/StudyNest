import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Sidebar from "../components/sidebar/Sidebar";
import ChatPanel from "../components/chat/ChatPanel";
import RightPanel from "../components/chat/RightPanel";
import {
  connectSocket,
  joinRoom,
  leaveRoom,
  onRoomOnlineUsers,
  offRoomOnlineUsers,
} from "../socket/socket";
import "./RoomPage.css";

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Chat");
  const [activeView, setActiveView] = useState("myrooms");
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    if (!user?._id) return;

    // Connect socket
    connectSocket(user._id);

    // Join room
    joinRoom(roomId);

    // Listen for online users
    onRoomOnlineUsers((data) => {
      if (data.roomId === roomId) {
        setOnlineUsers(data.onlineUsers);
      }
    });

    // Cleanup on unmount
    return () => {
      leaveRoom(roomId);
      offRoomOnlineUsers();
    };
  }, [roomId, user?._id]);

  useEffect(() => {
    if (activeView !== "myrooms") {
      navigate("/", { state: { activeView } });
    }
  }, [activeView, navigate]);

  const fetchRoom = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/rooms/${roomId}`);
      setRoom(res.data.room);
    } catch {
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="room-loading">
        <div className="room-loading-spinner" />
      </div>
    );
  }

  return (
    <div className="room-page">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onCreateRoom={() => {}}
        activeRoomId={roomId}
      />
      <div className="room-center">
        <ChatPanel
          room={room}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onRoomUpdate={fetchRoom}
          onBackToRooms={() => navigate("/yourrooms")}
        />
      </div>
      <RightPanel room={room} onRoomUpdate={fetchRoom} onlineUsers={onlineUsers} />
    </div>
  );
};

export default RoomPage;