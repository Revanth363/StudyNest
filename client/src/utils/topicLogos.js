const TOPIC_LOGOS = {
  DSA: "/dsa_logo.png",
  "Operating Systems": "/OS.png",
  OS: "/OS.png",
  "Computer Networks": "/cn.png",
  CN: "/cn.png",
  TOC: "/toc_logo.png",
  React: "/react.png",
  DBMS: "/dbms_logo.png",
  dbms: "/dbms_logo.png",
};

const getLogoForTopic = (topic) => {
  if (!topic) return null;
  // normalize some common variants
  const normalized = topic.trim();
  return (
    TOPIC_LOGOS[normalized] || TOPIC_LOGOS[normalized.toUpperCase()] || "/logo.png"
  );
};

export { getLogoForTopic };