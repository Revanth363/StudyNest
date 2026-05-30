import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/sidebar/Sidebar";
import UserProfile from "../components/profile/UserProfile";
import { useState, useEffect } from "react";

const ProfilePage = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("profile");

  // Handle navigation to other sections
  useEffect(() => {
    if (activeView !== "profile") {
      navigate("/", { state: { activeView } });
    }
  }, [activeView, navigate]);

  // If no username in URL but user is logged in, redirect to their profile
  if (!username && user?.username) {
    navigate(`/${user.username}`, { replace: true });
    return null;
  }

  // If not authenticated and no username, redirect to login
  if (!username && !user) {
    navigate("/login", { replace: true });
    return null;
  }

  // Don't render until we have a username
  if (!username) {
    return null;
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onCreateRoom={() => {}}
      />
      <UserProfile username={username} />
    </div>
  );
};

export default ProfilePage;
