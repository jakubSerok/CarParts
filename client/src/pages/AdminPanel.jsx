import React, { useState } from "react";
import SidebarAdmin from "../components/admin/SidebarAdmin";
import Test from "../components/user/Test";

const AdminPanel = () => {
  const [activeComponent, setActiveComponent] = useState("Profil");

  // Function to render the selected component
  const renderComponent = () => {
    console.log("Active Component:", activeComponent); // Debug log

    switch (activeComponent) {
      case "Profil":
        return <Test />;
      case "Kalendarz":
        return <Test />;
      case "Karnety":
        return <Test />;
      case "Treningi":
        return <Test />;
      case "Dopobrania":
        return <Test />;
      case "Platności":
        return <Test />;
      case "Linki":
        return <Test />;
      default:
        return <Test />;
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <SidebarAdmin 
        setActiveComponent={setActiveComponent} 
        activeComponent={activeComponent} 
      />

      {/* Main content area */}
      <div className="flex-1  bg-gray-100">{renderComponent()}</div>
    </div>
  );
};

export default AdminPanel;