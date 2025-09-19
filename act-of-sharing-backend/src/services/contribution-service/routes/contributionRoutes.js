const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../../../middleware/authMiddleware");
const {
  getContributionById,
  getAllContributions,
  getTotalFundsRaised,
  processDonation,
  updateContribution,
  deleteContribution,
} = require("../controller/contributionController");

// Specific routes first
router.get(
  "/total-funds",
  auth,
  authorize(["admin", "host"]),
  getTotalFundsRaised
);
router.post("/", processDonation);
router.get("/", auth, authorize(["admin", "host"]), getAllContributions);
router.post("/donate", processDonation);

// Generic routes last
router.get("/:id", auth, getContributionById);
router.put("/:id", auth, authorize(["admin"]), updateContribution);
router.delete("/:id", auth, authorize(["admin"]), deleteContribution);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Contributions
 *   description: Contribution management for events
 */

/**
 * @swagger
 * /contributions/total-funds:
 *   get:
 *     summary: Get total funds raised
 *     tags: [Contributions]
 *     security:
 *       - xAuthToken: []
 *     responses:
 *       200:
 *         description: Total funds raised retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalFunds:
 *                   type: number
 *                   example: 1500
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized access
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */

/**
 * @swagger
 * /contributions:
 *   post:
 *     summary: Process a donation
 *     tags: [Contributions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - firstname
 *               - lastname
 *               - email
 *               - mobile
 *               - amount
 *             properties:
 *               eventId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               firstname:
 *                 type: string
 *                 example: John
 *               lastname:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 pattern: ^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$
 *                 example: john.doe@example.com
 *               mobile:
 *                 type: string
 *                 example: "+1234567890"
 *               amount:
 *                 type: number
 *                 example: 100
 *     responses:
 *       201:
 *         description: Donation processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Donation processed
 *                 contribution:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     eventId:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     userId:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439012
 *                     amount:
 *                       type: number
 *                       example: 100
 *                     paymentIntentId:
 *                       type: string
 *                       example: pi_3N6Z5K...
 *                     status:
 *                       type: string
 *                       example: pending
 *                 clientSecret:
 *                   type: string
 *                   example: seti_1N6Z5K...
 *       400:
 *         description: Missing required fields or invalid event ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Missing required fields
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Event not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */

/**
 * @swagger
 * /contributions/donate:
 *   post:
 *     summary: Process a donation (alias for /contributions)
 *     tags: [Contributions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - firstname
 *               - lastname
 *               - email
 *               - mobile
 *               - amount
 *             properties:
 *               eventId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               firstname:
 *                 type: string
 *                 example: John
 *               lastname:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 pattern: ^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$
 *                 example: john.doe@example.com
 *               mobile:
 *                 type: string
 *                 example: "+1234567890"
 *               amount:
 *                 type: number
 *                 example: 100
 *     responses:
 *       201:
 *         description: Donation processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Donation processed
 *                 contribution:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     eventId:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     userId:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439012
 *                     amount:
 *                       type: number
 *                       example: 100
 *                     paymentIntentId:
 *                       type: string
 *                       example: pi_3N6Z5K...
 *                     status:
 *                       type: string
 *                       example: pending
 *                 clientSecret:
 *                   type: string
 *                   example: seti_1N6Z5K...
 *       400:
 *         description: Missing required fields or invalid event ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Missing required fields
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Event not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */

/**
 * @swagger
 * /contributions:
 *   get:
 *     summary: Get all contributions (admin or host only)
 *     tags: [Contributions]
 *     security:
 *       - xAuthToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of contributions per page
 *     responses:
 *       200:
 *         description: List of contributions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contributions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 507f1f77bcf86cd799439011
 *                       eventId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 507f1f77bcf86cd799439011
 *                           title:
 *                             type: string
 *                             example: Charity Run
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 507f1f77bcf86cd799439012
 *                           firstname:
 *                             type: string
 *                             example: John
 *                           lastname:
 *                             type: string
 *                             example: Doe
 *                           email:
 *                             type: string
 *                             example: john.doe@example.com
 *                       amount:
 *                         type: number
 *                         example: 100
 *                       paymentIntentId:
 *                         type: string
 *                         example: pi_3N6Z5K...
 *                       status:
 *                         type: string
 *                         example: pending
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalContributions:
 *                       type: integer
 *                       example: 50
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized access
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */

/**
 * @swagger
 * /contributions/{id}:
 *   get:
 *     summary: Get a contribution by ID
 *     tags: [Contributions]
 *     security:
 *       - xAuthToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Contribution ID
 *     responses:
 *       200:
 *         description: Contribution retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 507f1f77bcf86cd799439011
 *                 eventId:
 *                   type: string
 *                   example: 507f1f77bcf86cd799439011
 *                 userId:
 *                   type: string
 *                   example: 507f1f77bcf86cd799439012
 *                 amount:
 *                   type: number
 *                   example: 100
 *                 paymentIntentId:
 *                   type: string
 *                   example: pi_3N6Z5K...
 *                 status:
 *                   type: string
 *                   example: pending
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Contribution not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contribution not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */
