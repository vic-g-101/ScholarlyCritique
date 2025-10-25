import React, { useContext } from "react";
import { SIDE_MENU_DATA } from "../../utils/data";
import { UserContext } from "../../context/userContext";
import { useNavigate } from "react-router-dom";
import CharAvatar from "../Cards/CharAvatar";

const SideMenu = ({ activeMenu }) => {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();

  const handleClick = (route) => {
    if (route === "logout") {
      handleLogout();
      return;
    }
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.clear();
    logout();
    navigate("/login", { replace: true });
  };

  const fullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "";

  return (
    <div className="w-64 h-[calc(100vh-61px)] bg-white border-r border-gray-200/50 p-5 sticky top-[61px] z-20">
      {/* Header: avatar + name + email + rating */}
      <div className="flex flex-col items-center justify-center gap-2 mt-3 mb-7">
        {user?.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover bg-slate-200"
          />
        ) : (
          <CharAvatar firstName={user?.firstName}
  lastName={user?.lastName}
  width="w-20"
  height="h-20"
  style="text-xl" />
        )}

        <h5 className="text-gray-950 font-medium leading-6">{fullName}</h5>
        {user?.email && <p className="text-[12px] text-gray-500">{user.email}</p>}

        <div className="flex items-center gap-1 text-[12px] text-amber-600">
          <span aria-hidden>★</span>
          <span>{(user?.ratingAvg ?? 0).toFixed(2)} Reviewer Rating</span>
        </div>
      </div>

      {/* Menu items */}
      {SIDE_MENU_DATA.map((item) => {
        const isActive = activeMenu === item.label;
        return (
          <button
            key={item.id || item.label}
            type="button"
            title={item.label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => handleClick(item.path)}
            className={[
              "w-full flex items-center gap-4 text-[15px] py-3 px-6 rounded-lg mb-3 transition-colors",
              isActive
                ? "text-white bg-primary bg-[#874f3e]"
                : "text-[#5a3a2f] hover:bg-[#f8f3f0]",
            ].join(" ")}
          >
            <item.icon className="text-xl" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default SideMenu;
