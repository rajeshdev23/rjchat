import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { BsCheck, BsCheckAll, BsFileEarmarkText, BsFileEarmarkZip, BsFileEarmarkPdf, BsFileEarmarkImage, BsFileEarmarkPlay, BsFileEarmarkMusic, BsReplyFill } from "react-icons/bs";
import { MdClose, MdDownload, MdDelete } from "react-icons/md";

const Message = ({ message, selectionMode, isSelected, onSelect, onDelete, isGroup, onReply }) => {
  const { user } = useSelector((state) => state.auth)
  const ref = useRef()
  const [showImageModal, setShowImageModal] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" })
  }, [message])

  const isOwner = message.senderId === user.uid

  // Format time
  const date = message.date?.toDate()
  const timeString = date ? `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}` : ""

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || `file-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed, falling back to new tab:", error);
      // Fallback to opening in new tab which handles cross-origin downloads better
      window.open(url, '_blank');
    }
  };

  const getFileIcon = (type, name) => {
    const extension = name?.split('.').pop()?.toLowerCase();

    if (type?.includes('pdf') || extension === 'pdf') {
      return <BsFileEarmarkPdf size={20} className="text-white" />;
    }
    if (type?.includes('zip') || type?.includes('compressed') || extension === 'zip' || extension === 'rar') {
      return <BsFileEarmarkZip size={20} className="text-white" />;
    }
    if (type?.includes('image') || ['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return <BsFileEarmarkImage size={20} className="text-white" />;
    }
    if (type?.includes('video') || ['mp4', 'mov', 'avi'].includes(extension)) {
      return <BsFileEarmarkPlay size={20} className="text-white" />;
    }
    if (type?.includes('audio') || ['mp3', 'wav'].includes(extension)) {
      return <BsFileEarmarkMusic size={20} className="text-white" />;
    }
    return <BsFileEarmarkText size={20} className="text-white" />;
  };

  const getFileColor = (type, name) => {
    const extension = name?.split('.').pop()?.toLowerCase();

    if (type?.includes('pdf') || extension === 'pdf') return "bg-red-500";
    if (type?.includes('zip') || type?.includes('compressed') || extension === 'zip' || extension === 'rar') return "bg-yellow-500";
    if (type?.includes('image')) return "bg-purple-500";
    if (type?.includes('video')) return "bg-pink-500";
    if (type?.includes('audio')) return "bg-blue-500";
    return "bg-gray-500";
  };

  const handleContentClick = () => {
    if (selectionMode) {
      onSelect();
    }
  };

  return (
    <>
      <div
        ref={ref}
        className={`flex mb-2 group ${isOwner ? "justify-end" : "justify-start"} ${selectionMode ? "cursor-pointer" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={selectionMode ? handleContentClick : undefined}
      >
        {/* Selection Checkbox */}
        {selectionMode && (
          <div className={`flex items-center justify-center mr-3 ${isOwner ? "order-first" : "order-first"}`}>
            <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? "bg-teal-500 border-teal-500" : "border-gray-400"}`}>
              {isSelected && <BsCheck className="text-white" />}
            </div>
          </div>
        )}

        {/* Action Buttons (Reply/Delete) - Only show if NOT in selection mode */}
        {!selectionMode && isHovered && (
          <div className={`flex items-center gap-2 self-center ${isOwner ? "mr-2" : "ml-2 order-last"}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReply();
              }}
              className="text-gray-400 hover:text-white transition opacity-0 group-hover:opacity-100"
              title="Reply"
            >
              <BsReplyFill size={20} />
            </button>

            {isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-gray-400 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                title="Delete Message"
              >
                <MdDelete size={18} />
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col max-w-[65%]">
          {/* Sender Name for Group Chats (Incoming only) */}
          {isGroup && !isOwner && (
            <span className="text-xs text-teal-400 ml-1 mb-1 font-medium">
              {message.senderName || "Unknown"}
            </span>
          )}

          <div
            className={`relative px-3 py-2 rounded-lg shadow-sm flex flex-col gap-1
                  ${isOwner
                ? "bg-[#005c4b] text-white rounded-tr-none"
                : "bg-[#202c33] text-white rounded-tl-none"
              }
              ${isSelected ? "ring-2 ring-teal-500 ring-offset-1 ring-offset-gray-900" : ""}
                `}
          >
            {/* Reply Context */}
            {message.replyTo && (
              <div className="bg-black/20 border-l-4 border-teal-500 rounded p-2 mb-1 text-sm flex flex-col cursor-pointer opacity-80 hover:opacity-100">
                <span className="text-teal-400 font-medium text-xs mb-0.5">{message.replyTo.senderName}</span>
                <span className="text-gray-300 truncate">{message.replyTo.text || (message.replyTo.file ? "📎 Attachment" : "Message")}</span>
              </div>
            )}

            {/* Image Attachment */}
            {message.img && (
              <img
                src={message.img}
                alt=""
                className="w-full rounded-md mb-1 object-cover max-h-40 max-w-[250px] cursor-pointer hover:opacity-90 transition"
                onClick={(e) => {
                  if (selectionMode) {
                    onSelect();
                  } else {
                    setShowImageModal(true);
                  }
                }}
              />
            )}

            {/* File Attachment */}
            {message.file && (
              <div
                className="flex items-center gap-3 bg-black/20 p-2 rounded-md mb-1 cursor-pointer hover:bg-black/30 transition"
                onClick={(e) => {
                  if (selectionMode) {
                    onSelect();
                  } else {
                    handleDownload(message.file.url, message.file.name);
                  }
                }}
              >
                <div className={`${getFileColor(message.file.type, message.file.name)} p-2 rounded-lg`}>
                  {getFileIcon(message.file.type, message.file.name)}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate max-w-[150px]">{message.file.name}</span>
                  <span className="text-xs text-gray-300 uppercase">{message.file.type?.split('/')[1] || message.file.name?.split('.').pop() || 'FILE'}</span>
                </div>
                <MdDownload size={20} className="text-gray-300 ml-auto" />
              </div>
            )}

            <div className="flex flex-wrap items-end gap-2">
              {message.text && (
                <p className="text-sm leading-relaxed break-words">
                  {message.text}
                </p>
              )}
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
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center">
            {/* Controls */}
            <div className="absolute top-[-40px] right-0 flex gap-4">
              <button
                onClick={() => handleDownload(message.img, `image-${Date.now()}.jpg`)}
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