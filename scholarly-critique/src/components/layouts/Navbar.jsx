import React from "react";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import logo from "../../assets/images/FinalScholarlyCritiqueLogo.png";

const Navbar = ({ activeMenu, isCollapsed, setIsCollapsed }) => {
  return (
    <div className="flex items-center gap-5 bg-white border border-b border-gray-200/50 backdrop-blur-[2px] py-3 px-6 sticky top-0 z-30">
      {/* Collapse toggle button (always visible) */}
      <button
        className="text-black mr-2 flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100 transition"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? (
          <HiOutlineMenu className="text-2xl" />
        ) : (
          <HiOutlineX className="text-2xl" />
        )}
      </button>

      {/* Brand */}
      <div className="flex items-center gap-2">
        <img src={logo} alt="ScholarlyCritique" className="h-8 w-auto" />
        <span
          className="text-lg font-medium text-[#5a3a2f]"
          style={{ fontFamily: "Playfair Display", color: "var(--primary-color)" }}
        >
          ScholarlyCritique
        </span>
      </div>
    </div>
  );
};

export default Navbar;