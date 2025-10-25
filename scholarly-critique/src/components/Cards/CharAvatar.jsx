import React from "react";
import { getInitials } from "../../utils/helper";

const CharAvatar = ({ firstName, lastName, fullName, width, height, style }) => {
  // Build a name safely from the pieces you have
  const name =
    fullName ||
    [firstName, lastName].filter(Boolean).join(" ").trim();

  const initials = getInitials(name);

  return (
    <div
      className={`${width || "w-12"} ${height || "h-12"} ${style || ""} flex items-center justify-center rounded-full text-gray-900 font-medium bg-gray-100`}
      aria-label={name || "User avatar"}
      title={name || "User"}
    >
      {initials}
    </div>
  );
};

export default CharAvatar;
