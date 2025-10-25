import React, { useEffect, useRef, useState } from "react";
import { LuUpload, LuTrash } from "react-icons/lu";
import CharAvatar from "../Cards/CharAvatar";

const ProfilePhotoSelector = ({  image, setImage, firstName, lastName, variant = "icon" }) => {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreviewUrl(null);
  };

  const onChooseFile = () => inputRef.current?.click();

  // Revoke object URL on unmount / change
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const showPreview = !!image && !!previewUrl;
  const showInitials = variant === "initials";

   return (
    <div className="relative flex justify-center mb-6">
      <input type="file" accept="image/*" ref={inputRef} onChange={handleImageChange} className="hidden" />

      {!showPreview ? (
        <div className="relative">
          {showInitials ? (
            // INITIALS default (used on Profile)
            <CharAvatar
              firstName={firstName}
              lastName={lastName}
              width="w-20"
              height="h-20"
              style="text-2xl"
            />
          ) : (
            // ICON default (keeps Signup looking the same)
            <div className="w-20 h-20 flex items-center justify-center bg-[#ddd1c7] rounded-full border-2 border-primary relative">
              {/* keep your old LuUser here if you want that exact look */}
              {/* Or import LuUser and render it like before */}
            </div>
          )}

          <button
            type="button"
            title="Upload"
            className="w-8 h-8 flex items-center justify-center bg-primary text-#874f3e rounded-full absolute -bottom-1 -right-1 hover:bg-red-500 transition-colors"
            onClick={onChooseFile}
          >
            <LuUpload />
          </button>
        </div>
      ) : (
        <div className="relative">
          <img src={previewUrl} alt="profile preview" className="w-20 h-20 rounded-full object-cover" />
          <button
            type="button"
            title="Remove"
            className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full absolute -bottom-1 -right-1"
            onClick={handleRemoveImage}
          >
            <LuTrash />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoSelector;
