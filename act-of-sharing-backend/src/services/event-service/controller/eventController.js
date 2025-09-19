const Event = require("../models/Event");
const User = require("../../user-service/models/User");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const { sendEmail } = require("../../../utils/mailer");
const { v4: uuidv4 } = require("uuid");
const eventInvitationTemplate = require("../../email-templates/eventInvitationTemplate");
const Contribution = require("../../contribution-service/models/Contribution");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, filename);
  },
});
const upload = multer({ storage }).single("eventImage");

const createEvent = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      console.error("Multer error:", err.message);
      return res.status(400).json({ message: "File upload error" });
    }

    try {
      const {
        title,
        description,
        date,
        time,
        location,
        guestCount,
        suggestedDonation,
        isPublic,
        isDraft,
      } = req.body;

      const hostId = req.user.id;

      let eventImageUrl = null;
      if (req.file) {
        eventImageUrl = `/uploads/${req.file.filename}`;
      }

      const eventId = new mongoose.Types.ObjectId();

      const event = new Event({
        _id: eventId,
        hostId,
        title: title || "Untitled Event",
        description,
        date,
        time,
        location,
        guestCount,
        suggestedDonation,
        imageUrl: eventImageUrl,
        isPublic: isPublic || false,
        isDraft: isDraft !== undefined ? isDraft : false,
        uniqueUrl: `/events/${eventId}`,
      });

      await event.save();

      await User.findByIdAndUpdate(hostId, {
        $push: { hostedEvents: event._id },
      });

      res.status(201).json({
        message: isDraft
          ? "Event draft created successfully"
          : "Event created successfully",
        event,
      });
    } catch (error) {
      console.error("Create event error:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  });
};

const updateEvent = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid event ID" });
  }

  upload(req, res, async function (err) {
    if (err) {
      console.error("Multer error:", err.message);
      return res.status(400).json({ message: "File upload error" });
    }

    try {
      const updates = {};

      if (req.body.title) updates.title = req.body.title;
      if (req.body.description) updates.description = req.body.description;
      if (req.body.date) updates.date = req.body.date;
      if (req.body.time) updates.time = req.body.time;
      if (req.body.location) updates.location = req.body.location;
      if (req.body.guestCount)
        updates.guestCount = parseInt(req.body.guestCount);
      if (req.body.suggestedDonation)
        updates.suggestedDonation = parseFloat(req.body.suggestedDonation);
      if (req.body.isPublic !== undefined)
        updates.isPublic = req.body.isPublic === "true";
      if (req.body.isDraft !== undefined)
        updates.isDraft = req.body.isDraft === "true";

      if (req.file) {
        updates.imageUrl = `/uploads/${req.file.filename}`;
      }

      const event = await Event.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (
        event.hostId.toString() !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return res
          .status(403)
          .json({ message: "Only the host or an admin can update this event" });
      }

      res.status(200).json({
        message: event.isDraft
          ? "Event draft updated successfully"
          : "Event updated successfully",
        event,
      });
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
};

const discardEventChanges = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid event ID" });
  }

  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.hostId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the host can discard changes" });
    }

    if (!event.isDraft) {
      return res
        .status(400)
        .json({ message: "Only draft events can be discarded" });
    }

    await Event.findByIdAndDelete(id);
    await User.findByIdAndUpdate(event.hostId, { $pull: { hostedEvents: id } });

    res.status(200).json({ message: "Event draft discarded successfully" });
  } catch (error) {
    console.error("Discard event changes error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateEventStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid event ID" });
  }

  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.hostId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the host can update status" });
    }

    if (
      ![
        "upcoming",
        "story_capture",
        "voting",
        "completed",
        "cancelled",
      ].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (event.isDraft && status !== "cancelled") {
      return res
        .status(400)
        .json({ message: "Draft events can only be set to cancelled" });
    }

    event.status = status;
    await event.save();

    res.status(200).json({ message: "Event status updated", event });
  } catch (error) {
    console.error("Update event status error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const getEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const events = await Event.find({ isDraft: false })
      .populate("hostId", "firstname lastname")
      .skip(skip)
      .limit(limit);

    const totalEvents = await Event.countDocuments({ isDraft: false });
    const totalPages = Math.ceil(totalEvents / limit);

    res.status(200).json({
      events,
      pagination: {
        currentPage: page,
        totalPages,
        totalEvents,
        limit,
      },
    });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getDraftEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query based on user role
    const query = isAdmin
      ? { isDraft: true }
      : { hostId: userId, isDraft: true };

    const events = await Event.find(query)
      .populate("hostId", "firstname lastname")
      .skip(isAdmin ? 0 : skip) // Skip pagination for admin
      .limit(isAdmin ? 0 : limit); // Remove limit for admin

    const totalEvents = await Event.countDocuments(query);
    const totalPages = isAdmin ? 1 : Math.ceil(totalEvents / limit);

    res.status(200).json({
      events,
      pagination: {
        currentPage: isAdmin ? 1 : page,
        totalPages,
        totalEvents,
        limit: isAdmin ? totalEvents : limit,
      },
    });
  } catch (error) {
    console.error("Get draft events error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getEventsCount = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments({ isDraft: false });
    res.status(200).json({ totalEvents });
  } catch (error) {
    console.error("Get events count error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getEventById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid event ID" });
  }
  try {
    const event = await Event.findById(id)
      .populate("hostId", "firstname lastname")
      .populate("guests", "firstname lastname email");
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.isDraft && event.hostId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the host can view draft events" });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("Get event by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllEventsPublic = async (req, res) => {
  try {
    const currentDate = new Date();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const skip = (page - 1) * limit;

    const events = await Event.find({
      status: "upcoming",
      isPublic: true,
      isDraft: false,
      date: { $gte: currentDate },
    })
      .populate("hostId", "firstname lastname")
      .select("title description date location imageUrl suggestedDonation")
      .skip(skip)
      .limit(limit);

    const totalEvents = await Event.countDocuments({
      status: "upcoming",
      isPublic: true,
      isDraft: false,
      date: { $gte: currentDate },
    });

    const totalPages = Math.ceil(totalEvents / limit);

    res.status(200).json({
      events,
      pagination: {
        currentPage: page,
        totalPages,
        totalEvents,
        limit,
      },
    });
  } catch (error) {
    console.error("Get all public events error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserEvents = async (req, res) => {
  try {
    console.log("User ID:", req.user.id);
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";
    const currentDate = new Date();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    // If user is not admin, filter events by hostId or guests
    if (!isAdmin) {
      query = {
        $or: [{ hostId: userId }, { guests: userId }],
        isDraft: false,
        date: { $gte: currentDate },
      };
    } else {
      // For admin, show all non-draft events from current date
      query = {
        isDraft: false,
      };
    }

    const events = await Event.find(query)
      .populate("hostId", "firstname lastname")
      .populate("guests", "firstname lastname email")
      .skip(skip)
      .limit(limit);

    const totalEvents = await Event.countDocuments(query);

    const totalPages = Math.ceil(totalEvents / limit);

    res.status(200).json({
      events,
      pagination: {
        currentPage: page,
        totalPages,
        totalEvents,
        limit,
      },
    });
  } catch (error) {
    console.error("Get user events error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid event ID" });
  }
  try {
    const event = await Event.findByIdAndDelete(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    await User.findByIdAndUpdate(event.hostId, { $pull: { hostedEvents: id } });
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const inviteGuest = async (req, res) => {
  const { eventId, guestEmail } = req.body;

  if (!guestEmail || !guestEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ message: "Valid guest email is required" });
  }

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.isDraft) {
      return res
        .status(400)
        .json({ message: "Cannot invite guests to a draft event" });
    }

    if (event.hostId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the host can invite guests" });
    }

    const guest = await User.findOne({ email: guestEmail });
    if (guest && !event.guests.includes(guest._id)) {
      event.guests.push(guest._id);
    }

    if (!event.invitedEmails.includes(guestEmail.toLowerCase())) {
      event.invitedEmails.push(guestEmail.toLowerCase());
      await event.save();

      const votingUrl = `${process.env.FRONTEND_URL}/events/${eventId}/vote`;
      await sendEmail(
        guestEmail,
        "You're Invited to an Acts of Sharing Event!",
        `<p>Dear Guest,</p><p>You've been invited to ${event.title} on ${event.date}. RSVP at ${process.env.FRONTEND_URL}/events/${eventId}</p><p>Vote for a cause at: <a href="${votingUrl}">${votingUrl}</a></p>`
      );
    }

    res.status(200).json({ message: "Guest invited successfully" });
  } catch (error) {
    console.error("Invite guest error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getEventByUniqueUrl = async (req, res) => {
  const { url } = req.params;
  try {
    const event = await Event.findOne({ uniqueUrl: `${url}` })
      .populate("hostId", "firstname lastname")
      .populate("guests", "firstname lastname email");
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (
      event.isDraft &&
      (!req.user || event.hostId.toString() !== req.user.id)
    ) {
      return res
        .status(403)
        .json({ message: "Only the host can view draft events" });
    }

    if (!event.isPublic && !req.user) {
      return res
        .status(403)
        .json({ message: "Authentication required for private event" });
    }
    if (!event.isPublic && req.user) {
      const userId = req.user.id;
      if (
        event.hostId.toString() !== userId &&
        !event.guests.includes(userId)
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to view this private event" });
      }
    }
    res.status(200).json(event);
  } catch (error) {
    console.error("Get event by unique URL error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const inviteByEmail = async (req, res) => {
  const { from, to, eventId } = req.body;

  if (!from || !to || !eventId) {
    return res
      .status(400)
      .json({ message: "Missing required fields: from, to, or eventId" });
  }

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: "Invalid event ID" });
  }

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.isDraft) {
      return res
        .status(400)
        .json({ message: "Cannot send invitations for draft events" });
    }
    const host = await User.findOne({ email: from });
    if (!host) return res.status(404).json({ message: "Host not found" });

    const userId = req.user.id;
    if (event.hostId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to invite guests to this event" });
    }

    if (!event.invitedEmails.includes(to.toLowerCase())) {
      event.invitedEmails.push(to.toLowerCase());
      await event.save();

      const emailHtml = eventInvitationTemplate({
        event,
        host,
        frontendUrl: process.env.FRONTEND_URL,
      });

      const votingUrl = `${process.env.FRONTEND_URL}/events/${eventId}/vote`;
      const enhancedEmailHtml = emailHtml.replace(
        "</p>",
        `</p><p>Vote for a cause at: <a href="${votingUrl}">${votingUrl}</a></p>`
      );

      await sendEmail(
        to,
        `Invitation to ${event.title} - Acts of Sharing`,
        enhancedEmailHtml,
        {
          disableTracking: true,
        }
      );
    }

    res.status(200).json({ message: "Invitation sent successfully" });
  } catch (error) {
    console.error("Invite by email error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getParticipantEventCount = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Events where user is a guest
    const guestEventIds = await Event.find(
      { guests: userId, isDraft: false },
      "_id"
    ).lean();
    const guestEventIdSet = new Set(guestEventIds.map((e) => e._id.toString()));

    // 2. Events where user has donated
    const contributions = await Contribution.find({
      userId,
      status: "success",
    }).select("eventId");
    const donatedEventIds = contributions.map((c) => c.eventId.toString());

    // 3. Combine both sets (no duplicates)
    donatedEventIds.forEach((id) => guestEventIdSet.add(id));

    const totalEvents = guestEventIdSet.size;

    res.status(200).json({ totalEvents });
  } catch (error) {
    console.error("Get participant event count error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// Get total amount donated by the participant
const getParticipantTotalDonated = async (req, res) => {
  try {
    const userId = req.user.id;
    // Sum all successful contributions by this user
    const contributions = await Contribution.find({
      userId,
      status: "success",
    });
    const totalDonated = contributions.reduce(
      (sum, c) => sum + (c.amount || 0),
      0
    );
    res.status(200).json({ totalDonated });
  } catch (error) {
    console.error("Get participant total donated error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getParticipantEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Events where user is a guest
    const guestEvents = await Event.find(
      { guests: userId, isDraft: false },
      "_id title description date time location imageUrl status"
    ).lean();

    // 2. Events where user has donated
    const contributions = await Contribution.find({
      userId,
      status: "success",
    }).select("eventId");

    const donatedEventIds = contributions.map((c) => c.eventId.toString());

    // 3. Fetch events for donatedEventIds (excluding those already in guestEvents)
    const guestEventIdsSet = new Set(guestEvents.map((e) => e._id.toString()));
    const uniqueDonatedEventIds = donatedEventIds.filter(
      (id) => !guestEventIdsSet.has(id)
    );

    const donatedEvents = await Event.find(
      { _id: { $in: uniqueDonatedEventIds }, isDraft: false },
      "_id title description date time location imageUrl status"
    ).lean();

    // 4. Combine both arrays
    const allEvents = [...guestEvents, ...donatedEvents];

    res.status(200).json({ events: allEvents });
  } catch (error) {
    console.error("Get participant events error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  inviteGuest,
  getAllEventsPublic,
  getUserEvents,
  getEventByUniqueUrl,
  inviteByEmail,
  updateEventStatus,
  discardEventChanges,
  getDraftEvents, // New endpoint
  getEventsCount, // New endpoint
  getParticipantEventCount,
  getParticipantTotalDonated,
  getParticipantEvents,
};
