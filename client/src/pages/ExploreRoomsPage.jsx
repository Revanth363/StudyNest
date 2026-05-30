import { useState } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import ExploreRooms from "../components/room/ExploreRooms";

const ExploreRoomsPage = () => {
  const [activeView, setActiveView] = useState("explore");

  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onCreateRoom={() => {}}
      />
      <ExploreRooms onCreateRoom={() => {}} />
    </div>
  );
};

export default ExploreRoomsPage;
