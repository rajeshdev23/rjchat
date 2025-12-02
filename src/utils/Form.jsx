import React from "react";

const Form = ({
  children,
  onSubmit,
  className = "",
  ...props
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className={`
        w-full max-w-md mx-auto 
        p-6 bg-white rounded-2xl shadow 
        space-y-4
        ${className}
      `}
      {...props}
    >
      {children}
    </form>
  );
};

export default Form;
