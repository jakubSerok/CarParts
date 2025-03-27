import React, { useEffect, useState } from 'react';
import { createContext } from 'react';

export const Context = createContext(null);
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ContextProvider = (props) => {
  const url = BACKEND_URL;
  const [token, setToken] = useState("");

  useEffect(() => {
    async function loadData() {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
      }
    }
    loadData();
  }, []);

  const contextValue = {
    url,
    token,
    setToken,
  };

  return (
    <Context.Provider value={contextValue}>{props.children}</Context.Provider>
  );
};

export default ContextProvider;