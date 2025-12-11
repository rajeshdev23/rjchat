import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { BsCheck, BsCheckAll } from "react-icons/bs";
import { MdClose, MdDownload } from "react-icons/md";

const Message = ({ message }) => {
  const { user } = useSelector((state) => state.auth)
  const ref = useRef()
  const [showImageModal, setShowImageModal] = useState(false)

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" })
  }, [message])

  const isOwner = message.senderId === user.uid

  // Format time
  const date = message.date?.toDate()
  const timeString = date ? `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}` : ""

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <>
      <div
        ref={ref}
        className={`flex mb-2 ${isOwner ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`relative max-w-[65%] px-3 py-2 rounded-lg shadow-sm flex flex-col gap-1
                  ${isOwner
              ? "bg-[#005c4b] text-white rounded-tr-none"
              : "bg-[#202c33] text-white rounded-tl-none"
            }
              `}
        >
          {message.img && (
            <img
              src={message.img}
              alt=""
              className="w-full rounded-md mb-1 object-cover max-h-40 max-w-[250px] cursor-pointer hover:opacity-90 transition"
              onClick={() => setShowImageModal(true)}
            />
          )}

          <div className="flex flex-wrap items-end gap-2">
            <p className="text-sm leading-relaxed break-words">
              {message.text}
            </p>
            <div className={`flex items-center gap-1 min-w-fit ml-auto ${isOwner ? "text-gray-300" : "text-gray-400"}`}>
              <span className="text-[10px]">
                {timeString}
              </span>
              {isOwner && (
                <span className="text-sm">
                  {message.status === "seen" ? (
                    <BsCheckAll className="text-blue-400" />
                  ) : (
                    <BsCheck className="text-gray-400" />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center">
            {/* Controls */}
            <div className="absolute top-[-40px] right-0 flex gap-4">
              <button
                onClick={() => handleDownload(message.img)}
                className="text-white hover:text-gray-300 transition"
                title="Download"
              >
                <MdDownload size={24} />
              </button>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-white hover:text-gray-300 transition"
                title="Close"
              >
                <MdClose size={24} />
              </button>
            </div>

            <img
              src={message.img}
              alt="Full size"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  )
}

export default Message