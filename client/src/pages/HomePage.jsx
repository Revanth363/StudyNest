import { Link } from "react-router-dom";
import "./HomePage.css";

const roomItems = [
	{ name: "DBMS Room", active: true },
	{ name: "DSA Prep", active: false },
	{ name: "OS Concepts", active: false },
	{ name: "GATE 2026", active: false },
	{ name: "CN Doubts", active: false },
];

const previewMembers = [
	{ init: "A", color: "#15803d", name: "Ayush", you: true },
	{ init: "R", color: "#1d4ed8", name: "Rohit" },
	{ init: "N", color: "#7c3aed", name: "Neha" },
	{ init: "K", color: "#b45309", name: "Karan" },
	{ init: "S", color: "#0e7490", name: "Sahil" },
];

const features = [
	{
		title: "Real-Time Chat",
		desc: "Instant messaging with typing indicators, online status, and message history. No lag, no refresh needed.",
		icon: (
			<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
		),
	},
	{
		title: "Resource Sharing",
		desc: "Share PDFs, images, .txt files, and Google Drive links. All files auto-archive in the Resources tab.",
		icon: (
			<>
				<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
				<polyline points="14 2 14 8 20 8" />
			</>
		),
	},
	{
		title: "Pinned Messages",
		desc: "Admins can pin important notes, formulas, and resources so nothing gets lost in the chat scroll.",
		icon: (
			<>
				<line x1="12" y1="17" x2="12" y2="22" />
				<path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17z" />
			</>
		),
	},
	{
		title: "Room Moderation",
		desc: "Admins can delete messages, remove users, assign co-admins, and keep the room focused and clean.",
		icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
	},
	{
		title: "Study Time Tracking",
		desc: "Track your daily study hours, see your 7-day activity chart, and monitor your total time per room.",
		icon: (
			<>
				<circle cx="12" cy="12" r="10" />
				<polyline points="12 6 12 12 16 14" />
			</>
		),
	},
	{
		title: "Private Rooms",
		desc: "Create private rooms with a unique room code. Share with your batch or study group only.",
		icon: (
			<>
				<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
				<path d="M7 11V7a5 5 0 0110 0v4" />
			</>
		),
	},
];

const topics = [
	{ emoji: "🗄️", name: "DBMS", count: "12 active rooms" },
	{ emoji: "🧮", name: "DSA", count: "18 active rooms" },
	{ emoji: "⚙️", name: "Operating Systems", count: "9 active rooms" },
	{ emoji: "🌐", name: "Computer Networks", count: "7 active rooms" },
	{ emoji: "🔣", name: "TOC", count: "5 active rooms" },
	{ emoji: "⚛️", name: "React", count: "8 active rooms" },
	{ emoji: "🏆", name: "Competitive Programming", count: "11 active rooms" },
	{ emoji: "💼", name: "Interview Prep", count: "14 active rooms" },
];

const steps = [
	{
		num: "STEP 01",
		title: "Create your account",
		desc: "Sign up with your email. No credit card, no verification. Just your username and you are in.",
	},
	{
		num: "STEP 02",
		title: "Join a study room",
		desc: "Browse public rooms by topic or join a private room with a code from your study group.",
	},
	{
		num: "STEP 03",
		title: "Start collaborating",
		desc: "Ask doubts, share resources, pin important notes, and track your daily study hours — all in one place.",
	},
];

const HomePage = () => {
	return (
		<div className="home-root">
			<Nav />
			<Hero />
			<PreviewSection />
			<FeaturesSection />
			<TopicsSection />
			<HowItWorksSection />
			<CtaSection />
			<Footer />
		</div>
	);
};

const Nav = () => (
	<nav>
		<Link to="/" className="logo">
			<img
				src="/logo2.png"
				alt="StudyNest logo"
				className="logo-image"
			/>
			<span className="logo-text">StudyNest</span>
		</Link>

		<ul className="nav-links">
			<li><a href="#features">Features</a></li>
			<li><a href="#topics">Topics</a></li>
			<li><a href="#how">How it works</a></li>
		</ul>

		<div className="nav-actions">
			<Link to="/login" className="btn btn-ghost">Sign in</Link>
			<Link to="/signup" className="btn btn-primary">Get started</Link>
		</div>
	</nav>
);

const Hero = () => (
	<section className="hero">
		<div className="hero-bg" />
		<div className="hero-grid" />
		<div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
			<h1 className="hero-title">
				Study smarter.<br />
				<span className="green">Together.</span>
			</h1>

			<p className="hero-sub">
				Real-time study rooms for GATE, placements, DSA, and competitive programming.
				Join topic-focused rooms, share resources, and get doubts solved instantly.
			</p>

			<div className="hero-actions">
				<Link to="/signup" className="btn btn-primary btn-lg">
					Start studying free
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<line x1="5" y1="12" x2="19" y2="12" />
						<polyline points="12 5 19 12 12 19" />
					</svg>
				</Link>
				<Link to="/login" className="btn btn-outline btn-lg">Sign in</Link>
			</div>

			<div className="hero-stats">
				{[
					{ num: "2.4k+", label: "Active students" },
					{ num: "80+", label: "Study rooms" },
					{ num: "24/7", label: "Live discussions" },
					{ num: "8", label: "CS topics" },
				].map((stat, index) => (
					<div key={stat.label} className="hero-stat-group">
						{index > 0 && <div className="hero-stat-divider" />}
						<div className="hero-stat">
							<span className="hero-stat-num">{stat.num}</span>
							<span className="hero-stat-label">{stat.label}</span>
						</div>
					</div>
				))}
			</div>
		</div>
	</section>
);

const PreviewSection = () => (
	<div className="preview-section">
		<div className="preview-window">
			<div className="preview-bar">
				<div className="preview-dot" />
				<div className="preview-dot" />
				<div className="preview-dot" />
				<span className="preview-title">StudyNest — DBMS Room</span>
			</div>

			<div className="preview-body">
				<div className="preview-sidebar">
					<div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", padding: "4px 8px 8px" }}>
						Your Rooms
					</div>
					{roomItems.map((room) => (
						<div key={room.name} className={`preview-sidebar-room ${room.active ? "active" : ""}`}>
							<span className={`preview-room-dot ${room.active ? "" : "offline"}`} />
							{room.name}
						</div>
					))}
				</div>

				<div className="preview-chat">
					<PreviewMsg avatar="R" color="#15803d" sender="Rohit Singh" text="Can someone explain 3NF with an example?" />
					<PreviewMsg avatar="A" color="#1d4ed8" own text={"Sure! 3NF means no transitive dependency.\nIf A → B and B → C, then A should not → C directly."} />
					<PreviewMsg avatar="N" color="#7c3aed" sender="Neha Gupta" text="This helped! Thanks 🙏" />
					<TypingIndicator />
				</div>

				<div className="preview-right">
					<div className="preview-right-title">Online (5)</div>
					{previewMembers.map((member) => (
						<div key={member.name} className="preview-member">
							<div className="preview-member-avatar" style={{ backgroundColor: member.color }}>{member.init}</div>
							<span>{member.name}</span>
							{member.you && <span style={{ color: "var(--text-3)", fontSize: 10 }}>You</span>}
						</div>
					))}
				</div>
			</div>
		</div>
	</div>
);

const PreviewMsg = ({ avatar, color, sender, text, own }) => {
	const lines = text.split("\n");

	return (
		<div className={`preview-msg ${own ? "own" : ""}`}>
			<div className="preview-avatar" style={{ backgroundColor: color }}>{avatar}</div>
			<div>
				{sender && <div className="preview-sender">{sender}</div>}
				<div className={`preview-bubble ${own ? "own" : "other"}`}>
					{lines.map((line, index) => (
						<span key={line + index}>
							{line}
							{index < lines.length - 1 && <br />}
						</span>
					))}
				</div>
			</div>
		</div>
	);
};

const TypingIndicator = () => (
	<div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
		<div style={{ display: "flex", gap: 3, background: "var(--bg-card-2)", border: "1px solid var(--border)", padding: "6px 10px", borderRadius: 12, borderBottomLeftRadius: 4 }}>
			<span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--text-3)", display: "block", animation: "typingBounce 1.2s infinite" }} />
			<span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--text-3)", display: "block", animation: "typingBounce 1.2s 0.2s infinite" }} />
			<span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--text-3)", display: "block", animation: "typingBounce 1.2s 0.4s infinite" }} />
		</div>
		<span style={{ fontSize: 11, color: "var(--text-3)", fontStyle: "italic" }}>Karan is typing...</span>
	</div>
);

const FeaturesSection = () => (
	<section className="section" id="features">
		<div className="section-label">Features</div>
		<h2 className="section-title">Everything you need<br />to study effectively</h2>
		<p className="section-sub">Built specifically for CS students. No distractions, no noise — just focused academic collaboration.</p>

		<div className="features-grid">
			{features.map((feature) => (
				<div key={feature.title} className="feature-card">
					<div className="feature-icon">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							{feature.icon}
						</svg>
					</div>
					<div className="feature-title">{feature.title}</div>
					<div className="feature-desc">{feature.desc}</div>
				</div>
			))}
		</div>
	</section>
);

const TopicsSection = () => (
	<section className="topics-section" id="topics">
		<div className="section-label">Topics</div>
		<h2 className="section-title">Rooms for every<br />CS subject</h2>

		<div className="topics-grid">
			{topics.map((topic) => (
				<div key={topic.name} className="topic-card">
					<div className="topic-icon-box">{topic.emoji}</div>
					<div className="topic-info">
						<span className="topic-name">{topic.name}</span>
						<span className="topic-count">{topic.count}</span>
					</div>
				</div>
			))}
		</div>
	</section>
);

const HowItWorksSection = () => (
	<section className="section" id="how">
		<div className="section-label">How it works</div>
		<h2 className="section-title">Up and running<br />in 60 seconds</h2>

		<div className="steps-grid">
			{steps.map((step) => (
				<div key={step.num} className="step-card">
					<div className="step-number">{step.num}</div>
					<div className="step-title">{step.title}</div>
					<div className="step-desc">{step.desc}</div>
				</div>
			))}
		</div>
	</section>
);

const CtaSection = () => (
	<div className="cta-section">
		<div className="cta-glow" />
		<h2 className="cta-title">Ready to study smarter?</h2>
		<p className="cta-sub">Join thousands of CS students already using StudyNest to crack GATE, placements, and competitive programming.</p>
		<div className="cta-actions">
			<Link to="/signup" className="btn btn-primary btn-lg">Create free account</Link>
			<Link to="/login" className="btn btn-outline btn-lg">Sign in</Link>
		</div>
	</div>
);

const Footer = () => (
	<footer>
		<span className="footer-text">© 2026 StudyNest. Built for CS students.</span>
		<div className="footer-links">
			<a href="#">Privacy</a>
			<a href="#">Terms</a>
			<a href="#">Contact</a>
		</div>
	</footer>
);

export default HomePage;
