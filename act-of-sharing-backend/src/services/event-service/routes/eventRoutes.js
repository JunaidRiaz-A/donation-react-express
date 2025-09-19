const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../../../middleware/authMiddleware");
const {
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
  getDraftEvents, // Added new controller
  getEventsCount, // Added new controller
  getParticipantEventCount,
  getParticipantTotalDonated,
  getParticipantEvents,
} = require("../controller/eventController");
const { addStory, getStories } = require("../controller/storyController");
const { submitVote, getResults } = require("../controller/voteController");

router.get("/public", getAllEventsPublic);
router.get("/url/:url", getEventByUniqueUrl);
router.get("/my-events", auth, getUserEvents);
router.get("/drafts", auth, authorize(["host", "admin"]), getDraftEvents); // New route for draft events
router.get("/count", auth, authorize(["host", "admin"]), getEventsCount); // New route for event count
router.post(
  "/invite-by-email",
  auth,
  authorize(["host", "admin"]),
  inviteByEmail
);
router.get("/participant/events", auth, getParticipantEvents);

router.post("/", auth, authorize(["host", "admin"]), createEvent);
router.get("/", auth, getEvents);
router.get("/:id", getEventById);
router.put("/:id", auth, authorize(["host", "admin"]), updateEvent);
router.delete("/:id", auth, authorize(["host", "admin"]), deleteEvent);
router.delete(
  "/:id/discard",
  auth,
  authorize(["host", "admin"]),
  discardEventChanges
);
router.post("/invite", auth, authorize(["host", "admin"]), inviteGuest);

router.post("/stories", addStory);
router.get("/:eventId/stories", auth, getStories);
router.post("/votes", submitVote);
router.get("/:eventId/results", auth, getResults);

router.patch("/:id/status", auth, updateEventStatus);
router.get("/participant/total-events", auth, getParticipantEventCount);
router.get("/participant/total-donated", auth, getParticipantTotalDonated);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management and related actions
 */

/**
 * @swagger
 * /events/public:
 *   get:
 *     summary: Get all public events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of public events
 */

/**
 * @swagger
 * /events/my-events:
 *   get:
 *     summary: Get events for the current user
 *     tags: [Events]
 *     security:
 *       - xAuthToken: []
 *     responses:
 *       200:
 *         description: List of user's events
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /events/invite-by-email:
 *   post:
 *     summary: Invite guest by email
 *     tags: [Events]
 *     security:
 *       - xAuthToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - email
 *             properties:
 *               eventId:
 *                 type: string
 *                 example: 60f6c2b8e1b1c2a5d8e8b456
 *               email:
 *                 type: string
 *                 example: guest@example.com
 *     responses:
 *       200:
 *         description: Invitation sent
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - xAuthToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - date
 *               - time
 *               - location
 *               - guestCount
 *               - suggestedDonation
 *             properties:
 *               title:
 *                 type: string
 *                 example: Generosity Dinner
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-07-10T18:00:00Z
 *               time:
 *                 type: string
 *                 example: 18:00
 *               location:
 *                 type: string
 *                 example: 123 Main St
 *               guestCount:
 *                 type: integer
 *                 example: 10
 *               suggestedDonation:
 *                 type: number
 *                 example: 100
 *               isPublic:
 *                 type: boolean
 *                 example: false
 *               isDraft:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Event created
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events (for logged-in user)
 *     tags: [Events]
 *     security:
 *       - xAuthToken: []
 *     responses:
 *       200:
 *         description: List of events
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event found
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Update event
 *     tags: [Events]
 *     security:
 *       - xAuthToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               time:
 *                 type: string
 *               location:
 *                 type: string
 *               guestCount:
 *                 type: integer
 *               suggestedDonation:
 *                 type: number
 *               isPublic:
 *                 type: boolean
 *               isDraft:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Event updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete event
 *     tags: [Events]
 *     security:
 *       - xAuthToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /events/{id}/discard:
 *   delete:
 *     summary: Discard event draft
 *     tags: [Events]
 *     security:
 *       - xAuthToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event draft discarded
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */

/**
 * @swagger
 * /events/stories:
 *   post:
 *     summary: Add story to event
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - title
 *               - description
 *               - nominator
 *             properties:
 *               eventId:
 *                 type: string
 *                 example: 60f6c2b8e1b1c2a5d8e8b456
 *               title:
 *                 type: string
 *                 example: Help for Jane's family
 *               description:
 *                 type: string
 *                 example: Jane's family needs support after a fire.
 *               nominator:
 *                 type: string
 *                 example: Mike
 *     responses:
 *       201:
 *         description: Story added
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /events/{eventId}/stories:
 *   get:
 *     summary: Get stories for an event
 *     tags: [Events]
 *     security:
 *       - xAuthToken: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of stories
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /events/{eventId}/votes:
 *   post:
 *     summary: Submit vote for event stories
 *     tags: [Events]
 *     security:
 *       - xAuthToken: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storyId
 *             properties:
 *               storyId:
 *                 type: string
 *                 example: 60f6c2b8e1b1c2a5d8e8b789
 *     responses:
 *       200:
 *         description: Vote submitted
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /events/{eventId}/results:
 *   get:
 *     summary: Get voting results for event
 *     tags: [Events]
 *     security:
 *       - xAuthToken: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: string
 *         required: true
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Voting results
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /events/{id}/status:
 *   patch:
 *     summary: Update event status
 *     tags: [Events]
 *     security:
 *       - xAuthToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 example: voting
 *     responses:
 *       200:
 *         description: Event status updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
/**
 * @swagger
 * /events/participant/events:
 *   get:
 *     summary: Get all events for a participant (invited or attended)
 *     tags: [Events]
 *     security:
 *       - xAuthToken: []
 *     responses:
 *       200:
 *         description: List of events for the participant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       time:
 *                         type: string
 *                       location:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                       status:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /events/participant/total-events:
 *   get:
 *     summary: Get total number of events for a participant (invited or attended)
 *     tags: [Events]
 *     security:
 *       - xAuthToken: []
 *     responses:
 *       200:
 *         description: Total events count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEvents:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /events/participant/total-donated:
 *   get:
 *     summary: Get total amount donated by the participant
 *     tags: [Events]
 *     security:
 *       - xAuthToken: []
 *     responses:
 *       200:
 *         description: Total donated amount
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalDonated:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
