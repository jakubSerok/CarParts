import React, { useState } from "react";
import SidebarUser from "../components/user/SidebarUser";
import ActiveOffersList from "../components/user/ActiveOffersList";
import Test from "../components/user/Test";
import AddProduct from "../components/user/AddProduct";
import Chat from "../components/user/Chat";

const UserPanel = () => {
  const [activeComponent, setActiveComponent] = useState("Profil");

  // Function to render the selected component
  const renderComponent = () => {
    console.log("Active Component:", activeComponent); // Debug log

    switch (activeComponent) {
      case "Wystaw Produkty":
        return <AddProduct />;
      case "Lista":
        return <ActiveOffersList />;
      case "Wiadomości":
        return <Chat />;
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
      <SidebarUser 
        setActiveComponent={setActiveComponent} 
        activeComponent={activeComponent} 
      />

      {/* Main content area */}
      <div className="flex-1  bg-gray-100">
        
        {renderComponent()}
      </div>
    </div>
  );
};

export default UserPanel;