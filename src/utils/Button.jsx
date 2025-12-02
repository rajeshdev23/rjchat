import React from "react";

const Button = ({
  type = "button",
  text,
  className = "",
  onClick,
  disabled = false,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-5 py-2 rounded-xl 
        bg-blue-600 text-white 
        hover:bg-blue-700 
        disabled:bg-gray-400 disabled:cursor-not-allowed
        transition-all duration-200 
        font-medium shadow-sm cursor-pointer
        ${className}
      `}
      {...props}
    >
      {text}
    </button>
  );
};

export default Button;
