import {
  LuLayoutDashboard,
  LuBookOpen,
  LuFileText,
  LuHistory,
  LuUser,
  LuLogOut,
  LuBadgeDollarSign,
} from "react-icons/lu";

export const SIDE_MENU_DATA = [
  { id: "01", label: "Dashboard", icon: LuLayoutDashboard, path: "/dashboard" },
  { id: "02", label: "Topics", icon: LuBookOpen, path: "/topics-dashboard" },
  { id: "03", label: "My Essays", icon: LuFileText, path: "/my-essays" },
  { id: "04", label: "My Reviews", icon: LuHistory, path: "/my-reviews" },
  { id: "05", label: "Profile", icon: LuUser, path: "/profile" },
  { id: "06", label: "Logout", icon: LuLogOut, path: "logout" },
];