import { useState } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import SavedMessages from "../components/saved/SavedMessages";

const SavedMessagesPage = () => {
  const [activeView, setActiveView] = useState("saved");

  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onCreateRoom={() => {}}
      />
      <SavedMessages />
    </div>
  );
};

export default SavedMessagesPage;
