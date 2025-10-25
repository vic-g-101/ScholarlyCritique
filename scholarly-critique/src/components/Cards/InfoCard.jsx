import React from "react";

/**
 * Big tile used on the dashboard.
 * variant: "solid" | "outline"
 */
const InfoCard = ({ title, caption, onClick, variant = "solid" }) => {
  const base =
    "rounded-xl h-56 flex flex-col items-center justify-center text-center cursor-pointer transition-transform hover:-translate-y-0.5";
  const solid =
    "bg-[#f2e6de] border-2 border-[#874f3e] text-[#5a3a2f]";
  const outline =
    "bg-white border-2 border-dashed border-[#874f3e] text-[#5a3a2f]";

  return (
    <button className={`${base} ${variant === "outline" ? outline : solid}`} onClick={onClick}>
      <div className="text-sm opacity-80">{caption}</div>
      <div className="mt-2 font-semibold">{title}</div>
    </button>
  );
};

export default InfoCard;