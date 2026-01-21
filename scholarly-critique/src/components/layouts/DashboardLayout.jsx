import React, { useContext, useState } from "react";
import { UserContext } from "../../context/userContext";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";
import { LayoutContext } from "../../context/layoutContext";




const DashboardLayout = ({ children, activeMenu }) => {
  const { user } = useContext(UserContext);

  // check if sidemenu should be closed
  const {isCollapsed, setIsCollapsed} = useContext(LayoutContext);

  // If not logged in / no user, you were already rendering nothing below navbar.
  // We'll keep that behavior.
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar
          activeMenu={activeMenu}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        {/* not logged in -> just render children centered */}
        <main className="flex-1 px-4 md:px-8 py-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* TOP NAV */}
      <Navbar
        activeMenu={activeMenu}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* BODY WRAPPER */}
      <div className="flex flex-1">
        {/* SIDEBAR */}
        {/* LINE ~40 UPDATED:
            We always render SideMenu now (not just on big screens),
            and we tell it whether it's collapsed.
        */}
        <SideMenu activeMenu={activeMenu} isCollapsed={isCollapsed} />

        {/* MAIN CONTENT AREA */}
        {/* LINE ~46 UPDATED:
            We give the main content a left margin that matches the sidebar width.
            - expanded sidebar = 16rem = 256px (ml-64)
            - collapsed sidebar = 4rem = 64px (ml-16)
            We also keep your mx-5 logic in spirit, but move it to padding.
        */}
        <main
          className={
            "flex-1 transition-all duration-200 px-4 md:px-8 py-6 " +
            (isCollapsed ? "ml-16" : "ml-64")
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;