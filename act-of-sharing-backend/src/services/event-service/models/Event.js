const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Untitled Event", // Default for drafts
    },
    description: {
      type: String,
      trim: true,
      default: "no goal defined", // Default for drafts
    },
    date: {
      type: Date,
      required: [
        function () {
          return !this.isDraft;
        },
        "Date is required for published events",
      ],
    },
    time: {
      type: String,
      required: [
        function () {
          return !this.isDraft;
        },
        "Time is required for published events",
      ],
      trim: true,
    },
    location: {
      type: String,
      required: [
        function () {
          return !this.isDraft;
        },
        "Location is required for published events",
      ],
      trim: true,
    },
    guestCount: {
      type: Number,
      required: [
        function () {
          return !this.isDraft;
        },
        "Guest count is required for published events",
      ],
    },
    suggestedDonation: {
      type: Number,
      default: 100, // Default for drafts
    },
    currentAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["upcoming", "story_capture", "voting", "completed", "cancelled"],
      default: "upcoming",
    },
    guests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    invitedEmails: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    contributions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contribution",
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    disbursement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Disbursement",
    },
    imageUrl: {
      type: String,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    isDraft: {
      type: Boolean,
      default: false, // New field for draft status
    },
    uniqueUrl: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
