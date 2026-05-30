import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Avatar from "../shared/Avatar";
import { getLogoForTopic } from "../../utils/topicLogos";
import "./UserProfile.css";

const UserProfile = ({ username }) => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [profileMeta, setProfileMeta] = useState({
    memberSince: null,
    roomsJoinedCount: 0,
    roomsCreatedCount: 0,
    resourcesSharedCount: 0,
    publicJoinedRooms: [],
    privateJoinedRooms: [],
    createdRooms: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [form, setForm] = useState({
    username: "",
    bio: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const loadProfile = async (targetUsername) => {
    const res = await api.get(`/users/public/${targetUsername}`);
    setProfileUser(res.data.user);
    setProfileMeta({
      memberSince: res.data.profile?.memberSince || res.data.user.createdAt,
      roomsJoinedCount: res.data.profile?.roomsJoinedCount || res.data.user.roomsJoined?.length || 0,
      roomsCreatedCount: res.data.profile?.roomsCreatedCount || 0,
      resourcesSharedCount: res.data.profile?.resourcesSharedCount || 0,
      publicJoinedRooms: res.data.profile?.publicJoinedRooms || [],
      privateJoinedRooms: res.data.profile?.privateJoinedRooms || [],
      createdRooms: res.data.profile?.createdRooms || [],
      recentActivity: res.data.profile?.recentActivity || [],
    });
    setIsOwnProfile(res.data.user._id === user?._id);
    setForm({
      username: res.data.user.username,
      bio: res.data.user.bio || "",
    });
    return res.data.user;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(""); // Clear any previous errors
        await loadProfile(username);
      } catch (err) {
        setError("User not found");
        setProfileUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username, user?._id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccessMsg("");
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put("/users/update", form);
      login(res.data.user);
      const updatedUser = await loadProfile(res.data.user.username);
      if (updatedUser.username !== username) {
        navigate(`/${updatedUser.username}`, { replace: true });
      }
      setSuccessMsg("Profile updated successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.put("/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      login(res.data.user);
      await loadProfile(profileUser?.username || username);
      setSuccessMsg("Avatar updated");
    } catch {
      setError("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleOpenSharedResource = async (item) => {
    if (!item.fileUrl) return;

    try {
      const response = await fetch(item.fileUrl);
      if (!response.ok) throw new Error("Failed to load file");

      const mimeType =
        item.fileType === "pdf"
          ? "application/pdf"
          : response.headers.get("content-type") || "application/octet-stream";
      const blob = new Blob([await response.arrayBuffer()], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (err) {
      window.open(item.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (loading) {
    return <div className="profile"><p>Loading profile...</p></div>;
  }

  if (!profileUser) {
    return <div className="profile"><p className="profile-error">{error}</p></div>;
  }

  const totalHours = Math.floor((profileUser?.totalStudyTime || 0) / 60);
  const totalMinutes = (profileUser?.totalStudyTime || 0) % 60;
  const last7Days = getLast7Days(profileUser?.dailyStudyLog || []);
  const thisWeekMinutes = last7Days.reduce((acc, day) => acc + day.minutes, 0);
  const memberSinceLabel = formatDate(profileMeta.memberSince || profileUser?.createdAt);

  return (
    <div className="profile">
      <div className="profile-header">
        <h1 className="profile-title">{isOwnProfile ? "My Profile" : `${profileUser.username}'s Profile`}</h1>
        <p className="profile-sub">{isOwnProfile ? "Manage your account and view your stats" : "View their profile and stats"}</p>
      </div>

      <div className="profile-body">
        <div className="profile-left">
          <div className="profile-card">
            <div className="avatar-section">
              <div className="avatar-wrap">
                <Avatar
                  name={profileUser?.username}
                  src={profileUser?.avatar}
                  size={80}
                />
                {isOwnProfile && (
                  <button
                    className="avatar-edit-btn"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingAvatar}
                    title="Change avatar"
                  >
                    {uploadingAvatar ? (
                      <span className="avatar-upload-spinner" />
                    ) : (
                      <CameraIcon />
                    )}
                  </button>
                )}
                {isOwnProfile && (
                  <input
                    type="file"
                    ref={fileRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                )}
              </div>
              <div className="avatar-info">
                <h2 className="profile-username">{profileUser?.username}</h2>
                {isOwnProfile && <p className="profile-email">{profileUser?.email}</p>}
                <p className="profile-member-since">Member since {memberSinceLabel}</p>
              </div>
            </div>

            {successMsg && (
              <div className="profile-success">{successMsg}</div>
            )}
            {error && (
              <div className="profile-error">{error}</div>
            )}

            {isOwnProfile ? (
              <form onSubmit={handleSave} className="profile-form">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    maxLength={20}
                  />
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    placeholder="Tell others about yourself..."
                    rows={3}
                    maxLength={150}
                  />
                  <span className="char-count">{form.bio.length}/150</span>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profileUser?.email}
                    disabled
                    className="input-disabled"
                  />
                </div>

                <button
                  type="submit"
                  className="save-btn"
                  disabled={saving}
                >
                  {saving ? <span className="btn-loader" /> : "Save Changes"}
                </button>
              </form>
            ) : (
              <div className="profile-view-only">
                <div className="form-group">
                  <label>Bio</label>
                  <p>{profileUser?.bio || "No bio provided"}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="profile-right">
          <div className="stats-card">
            <h3 className="stats-title">Study Stats</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-value">
                  {totalHours}h {totalMinutes}m
                </span>
                <span className="stat-label">Total Study Time</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">
                  {profileMeta.roomsJoinedCount}
                </span>
                <span className="stat-label">Rooms Joined</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">
                  {profileMeta.roomsCreatedCount}
                </span>
                <span className="stat-label">Rooms Created</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">
                  {profileMeta.resourcesSharedCount}
                </span>
                <span className="stat-label">Resources Shared</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">
                  {Math.floor(thisWeekMinutes / 60)}h {thisWeekMinutes % 60}m
                </span>
                <span className="stat-label">This Week</span>
              </div>
            </div>
          </div>

          <div className="activity-card">
            <h3 className="stats-title">Last 7 Days</h3>
            <div className="activity-bars">
              {last7Days.map((day) => {
                const max = Math.max(...last7Days.map((d) => d.minutes), 1);
                const height = Math.max((day.minutes / max) * 100, 4);
                return (
                  <div key={day.date} className="activity-bar-wrap">
                    <div className="activity-bar-track" title={`${day.minutes} min`}> 
                      <div
                        className="activity-bar-fill"
                        style={{ height: `${height}%` }}
                      />
                      <span className="activity-bar-tooltip">{day.minutes}m</span>
                    </div>
                    <span className="activity-day">{day.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="activity-card">
            <h3 className="stats-title">Recent Activity</h3>
            {profileMeta.recentActivity.length === 0 ? (
              <p className="rooms-empty">No recent activity yet</p>
            ) : (
              <div className="activity-list">
                {profileMeta.recentActivity.map((item) => (
                  item.type === "shared_resource" ? (
                    <button
                      key={`${item.type}-${item.createdAt}`}
                      className="activity-item-link-row"
                      type="button"
                      onClick={() => handleOpenSharedResource(item)}
                    >
                      <div className={`activity-dot activity-dot-${item.type}`} />
                      <div className="activity-item-body">
                        <span className="activity-item-title">{item.fileName || item.title}</span>
                        <span className="activity-item-subtitle">{item.subtitle}</span>
                      </div>
                      <span className="activity-item-date">{formatDate(item.createdAt)}</span>
                    </button>
                  ) : (
                    <button
                      key={`${item.type}-${item.createdAt}`}
                      type="button"
                      className="activity-item-link-row"
                      onClick={() => item.roomId && navigate(`/room/${item.roomId}`)}
                    >
                      <div className={`activity-dot activity-dot-${item.type}`} />
                      <div className="activity-item-body">
                        <span className="activity-item-title">{item.title}</span>
                        <span className="activity-item-subtitle">{item.subtitle}</span>
                      </div>
                      <span className="activity-item-date">{formatDate(item.createdAt)}</span>
                    </button>
                  )
                ))}
              </div>
            )}
          </div>

          <div className="rooms-card">
            <h3 className="stats-title">{isOwnProfile ? "Your Rooms" : `${profileUser?.username}'s Rooms`}</h3>
            <div className="profile-room-group">
              <div className="profile-room-group-header">
                <span>Public Rooms Joined</span>
                <span>{profileMeta.publicJoinedRooms.length}</span>
              </div>
              {profileMeta.publicJoinedRooms.length === 0 ? (
                <p className="rooms-empty">No public rooms joined yet</p>
              ) : (
                <div className="profile-rooms-list">
                  {profileMeta.publicJoinedRooms.slice(0, 5).map((room) => (
                    <button
                      key={room._id || room}
                      type="button"
                      className="profile-room-item profile-room-button"
                      onClick={() => room?._id && navigate(`/room/${room._id}`)}
                    >
                      <div className="profile-room-icon profile-room-logo">
                        <img src={getLogoForTopic(room.topic)} alt={room.topic || room.name || "Room"} />
                      </div>
                      <div>
                        <span className="profile-room-name">{room.name || "Room"}</span>
                        <span className="profile-room-topic">{room.topic || "Public"}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="profile-room-group">
              <div className="profile-room-group-header">
                <span>Private Rooms Joined</span>
                <span>{profileMeta.privateJoinedRooms.length}</span>
              </div>
              {profileMeta.privateJoinedRooms.length === 0 ? (
                <p className="rooms-empty">No private rooms joined yet</p>
              ) : (
                <div className="profile-rooms-list">
                  {profileMeta.privateJoinedRooms.slice(0, 5).map((room) => (
                    <button
                      key={room._id || room}
                      type="button"
                      className="profile-room-item profile-room-button"
                      onClick={() => room?._id && navigate(`/room/${room._id}`)}
                    >
                      <div className="profile-room-icon profile-room-logo">
                        <img src={getLogoForTopic(room.topic)} alt={room.topic || room.name || "Room"} />
                      </div>
                      <div>
                        <span className="profile-room-name">{room.name || "Room"}</span>
                        <span className="profile-room-topic">{room.topic || "Private"}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="profile-room-group">
              <div className="profile-room-group-header">
                <span>Rooms Created by You</span>
                <span>{profileMeta.createdRooms.length}</span>
              </div>
              {profileMeta.createdRooms.length === 0 ? (
                <p className="rooms-empty">No rooms created yet</p>
              ) : (
                <div className="profile-rooms-list">
                  {profileMeta.createdRooms.slice(0, 5).map((room) => (
                    <button
                      key={room._id || room}
                      type="button"
                      className="profile-room-item profile-room-button"
                      onClick={() => room?._id && navigate(`/room/${room._id}`)}
                    >
                      <div className="profile-room-icon profile-room-logo">
                        <img src={getLogoForTopic(room.topic)} alt={room.topic || room.name || "Room"} />
                      </div>
                      <div>
                        <span className="profile-room-name">{room.name || "Room"}</span>
                        <span className="profile-room-topic">
                          {room.isPrivate ? "Private room" : "Public room"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getLast7Days = (dailyLog) => {
  const days = [];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const logEntry = dailyLog.find((l) => l.date === dateStr);
    days.push({
      date: dateStr,
      minutes: logEntry?.minutes || 0,
      label: dayLabels[date.getDay()],
    });
  }

  return days;
};

const formatDate = (value) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const CameraIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
  </svg>
);

export default UserProfile;