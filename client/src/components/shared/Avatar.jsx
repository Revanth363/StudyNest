import "./Avatar.css";

const COLORS = [
  "#15803d", "#1d4ed8", "#7c3aed", "#b45309",
  "#0e7490", "#be185d", "#4d7c0f", "#9a3412",
];

const getColor = (name = "") => {
  const index = name.charCodeAt(0) % COLORS.length;
  return COLORS[index];
};

const Avatar = ({ name = "", src = "", size = 36 }) => {
  const initials = name.slice(0, 2).toUpperCase();
  const bg = getColor(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="avatar-img"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="avatar-fallback"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
};

export default Avatar;