import React, { useContext, useState } from "react";
import {
  FaHome,
  FaUsers,
  FaCalendarAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { Context } from "../../context/ContextProvider";
import { useNavigate } from "react-router-dom";

const SidebarAdmin = ({ setActiveComponent, activeComponent }) => {
  const { setToken } = useContext(Context);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    navigate("/");
  };

  return (
    <div>
      {/* Przycisk otwierania menu */}
      <button
        className="md:hidden p-4 text-gray-200 hover:text-white transition-colors duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 border-r border-gray-700 
        transform ${
          isOpen ? "translate-x-0" : "-translate-x-64"
        } md:translate-x-0 
        transition-transform duration-300 md:relative md:flex md:flex-col`}
      >
        <div className="p-5 text-center text-lg font-bold border-b border-gray-700 text-gray-200">
          Panel Administratora
        </div>

        <ul className="flex-1 p-4 space-y-2">
          {[
            { name: "Profil", icon: <FaHome /> },
            { name: "Kalendarz", icon: <FaCalendarAlt /> },
            { name: "Karnety", icon: <FaUsers /> },
            { name: "Treningi", icon: <FaCalendarAlt /> },
            { name: "Platności", icon: <FaCalendarAlt /> },
            { name: "Dopobrania", icon: <FaCalendarAlt /> },
            { name: "Linki", icon: <FaCalendarAlt /> },
          ].map((item) => (
            <li
              key={item.name}
              onClick={() => {
                setActiveComponent(item.name);
                setIsOpen(false);
              }}
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer 
              transition-all duration-200 hover:bg-gray-700 
              ${
                activeComponent === item.name
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </li>
          ))}
        </ul>

        <div className="p-4 border-t border-gray-700">
          <button
            className="w-full p-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm text-white transition-colors duration-200"
            onClick={handleLogout}
          >
            Wyloguj
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidebarAdmin;