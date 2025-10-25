import React, { useState } from "react";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import SideMenu from "./SideMenu";
import logo from "../../assets/images/FinalScholarlyCritiqueLogo.png";

const Navbar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);

  return (
    <div className="flex items-center gap-5 bg-white border border-b border-gray-200/50 backdrop-blur-[2px] py-3 px-6 sticky top-0 z-30">
      <button
        className="block lg:hidden text-black"
        onClick={() => setOpenSideMenu(!openSideMenu)}
        aria-label="Toggle menu"
      >
        {openSideMenu ? <HiOutlineX className="text-2xl" /> : <HiOutlineMenu className="text-2xl" />}
      </button>

      {/* Brand */}
      <div className="flex items-center gap-2">
        <img src={logo} alt="ScholarlyCritique" className="h-8 w-auto" />
        <span className="text-lg font-medium text-[#5a3a2f]" style={{ fontFamily: "Playfair Display", color: 'var(--primary-color)' }}>ScholarlyCritique</span>
      </div>

      {openSideMenu && (
        <div className="fixed top-[61px] -ml-4 bg-white shadow-lg">
          <SideMenu activeMenu={activeMenu} />
        </div>
      )}
    </div>
  );
};

export default Navbar;