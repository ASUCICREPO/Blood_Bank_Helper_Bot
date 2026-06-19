const BloodBankLogo = ({ color = "#FFFFFF", width = 60, height = 60 }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blood drop icon */}
      <path
        d="M12 2C12 2 6 8 6 14C6 17.31 8.69 20 12 20C15.31 20 18 17.31 18 14C18 8 12 2 12 2Z"
        fill={color}
        stroke={color}
        strokeWidth="1"
      />
      {/* Heart symbol inside */}
      <path
        d="M12 8C10.5 8 9.5 9 9.5 10.5C9.5 12 12 15 12 15S14.5 12 14.5 10.5C14.5 9 13.5 8 12 8Z"
        fill="#B71C1C"
      />
    </svg>
  );
};

export default BloodBankLogo;