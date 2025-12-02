import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

const Message = ({ message }) => {
  const { user } = useSelector((state) => state.auth)
  const ref = useRef()

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" })
  }, [message])

  const isOwner = message.senderId === user.uid

  // Format time
  const date = message.date?.toDate()
  const timeString = date ? `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}` : ""

  return (
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
            className="w-full rounded-md mb-1 object-cover max-h-40 max-w-[250px]"
          />
        )}

        <div className="flex flex-wrap items-end gap-2">
          <p className="text-sm leading-relaxed break-words">
            {message.text}
          </p>
          <span className={`text-[10px] min-w-fit ml-auto ${isOwner ? "text-gray-300" : "text-gray-400"}`}>
            {timeString}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Message