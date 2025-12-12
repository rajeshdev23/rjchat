import React from "react";

const Input = React.forwardRef((
  {
    type = "text",
    value,
    placeholder,
    onChange,
    onFocus,
    className = "",
    ...props
  },
  ref
) => {
  return (
    <input
      ref={ref}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      onFocus={onFocus}
      className={`
        w-full px-4 py-2 rounded-xl 
        border border-gray-300 
        focus:outline-none focus:ring-2 focus:ring-blue-500 
        transition-all duration-200
        bg-white text-gray-800 ${className.includes("w-") ? "" : "w-full"}
        ${className}
      `}
      {...props}
    />
  );
});

Input.displayName = "Input";

export default Input;
