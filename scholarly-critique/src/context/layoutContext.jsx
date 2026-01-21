import React, { createContext, useState } from "react";

export const LayoutContext = createContext({
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export const LayoutProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <LayoutContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {children}
    </LayoutContext.Provider>
  );
};