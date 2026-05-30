import { useState } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import Notifications from "../components/notifications/Notifications";

const NotificationsPage = () => {
  const [activeView, setActiveView] = useState("notifications");

  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onCreateRoom={() => {}}
      />
      <Notifications />
    </div>
  );
};

export default NotificationsPage;
