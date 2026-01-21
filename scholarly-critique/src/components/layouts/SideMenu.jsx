import React, { useContext } from "react";
import { SIDE_MENU_DATA } from "../../utils/data";
import { UserContext } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import CharAvatar from "../Cards/CharAvatar";

const SideMenu = ({ activeMenu, isCollapsed }) => {
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
    <div className={
              "h-[calc(100vh-61px)] bg-white border-r border-gray-200/50 fixed top-[61px] left-0 z-20 flex flex-col transition-all duration-200 " +
              (isCollapsed ? "w-16 p-3" : "w-64 p-5")
            }
          >

            {/* Header: avatar + name + email + rating */}
      <div
        className={
          "flex flex-col items-center justify-center gap-2 mt-3 mb-7 " +
          (isCollapsed ? "" : "")
        }
      >
        {/* Avatar always shows, just smaller when collapsed */}
        {user?.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt="Profile"
            className={
              (isCollapsed ? "w-10 h-10" : "w-20 h-20") +
              " rounded-full object-cover bg-slate-200"
            }
          />
        ) : (
          <CharAvatar
            firstName={user?.firstName}
            lastName={user?.lastName}
            width={isCollapsed ? "w-10" : "w-20"}
            height={isCollapsed ? "h-10" : "h-20"}
            style={isCollapsed ? "text-sm" : "text-xl"}
          />
        )}

        {/* Hide text when collapsed */}
        {!isCollapsed && (
          <>
            <h5 className="text-gray-950 font-medium leading-6 text-center">
              {fullName}
            </h5>

            {user?.email && (
              <p className="text-[12px] text-gray-500 text-center break-all">
                {user.email}
              </p>
            )}

            <div className="flex items-center gap-1 text-[12px] text-amber-600">
              <span aria-hidden>★</span>
              <span>{(user?.ratingAvg ?? 0).toFixed(2)} Reviewer Rating</span>
            </div>
          </>
        )}
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
              "w-full flex items-center rounded-lg mb-3 transition-colors text-[15px]",
              isCollapsed ? "justify-center py-3" : "gap-4 py-3 px-6 justify-start",
              isActive
                ? "text-white bg-[#874f3e]"
                : "text-[#5a3a2f] hover:bg-[#f8f3f0]",
            ].join(" ")}
          >
            <item.icon className="text-xl shrink-0" />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default SideMenu;
