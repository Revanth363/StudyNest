const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      default: "",
      maxlength: 200,
    },
    topic: {
      type: String,
      enum: [
        "DBMS",
        "Operating Systems",
        "Computer Networks",
        "DSA",
        "TOC",
        "React",
        "Interview Preparation",
        "Competitive Programming",
        "Other",
      ],
      required: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    roomCode: {
      type: String,
      unique: true,
      sparse: true,   // only private rooms have a code
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    reports: [
      {
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: { type: String, default: "" },
        reportedAt: { type: Date, default: Date.now },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);