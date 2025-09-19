const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../../../middleware/authMiddleware");
const {
  submitRequest,
  getRequestById,
  getAllRequests,
  updateRequest,
  donateToRequest,
  deleteRequest,
} = require("../controller/requestController");

router.post("/", submitRequest);
router.get("/:id", auth, authorize(["admin"]), getRequestById);
router.get("/", auth, authorize(["admin"]), getAllRequests);
router.put("/:id", auth, authorize(["admin"]), updateRequest);
router.put("/donate/:id", auth, authorize(["admin"]), donateToRequest);
router.delete("/:id", auth, authorize(["admin"]), deleteRequest);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Requests
 *   description: Request management for donations
 */

/**
 * @swagger
 * /requests:
 *   post:
 *     summary: Submit a new donation request
 *     tags: [Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - phone
 *               - email
 *               - personName
 *               - relationship
 *               - immediateNeed
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               email:
 *                 type: string
 *                 pattern: ^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$
 *                 example: john.doe@example.com
 *               personName:
 *                 type: string
 *                 example: Jane Smith
 *               relationship:
 *                 type: string
 *                 example: Friend
 *               immediateNeed:
 *                 type: string
 *                 example: Medical expenses
 *               preferredDate:
 *                 type: string
 *                 format: date
 *                 example: 2025-07-15
 *               additionalInfo:
 *                 type: string
 *                 example: Urgent need for surgery funding
 *     responses:
 *       201:
 *         description: Request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Request submitted successfully
 *                 request:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     fullName:
 *                       type: string
 *                       example: John Doe
 *                     phone:
 *                       type: string
 *                       example: "+1234567890"
 *                     email:
 *                       type: string
 *                       example: john.doe@example.com
 *                     personName:
 *                       type: string
 *                       example: Jane Smith
 *                     relationship:
 *                       type: string
 *                       example: Friend
 *                     immediateNeed:
 *                       type: string
 *                       example: Medical expenses
 *                     preferredDate:
 *                       type: string
 *                       format: date
 *                       example: 2025-07-15
 *                     additionalInfo:
 *                       type: string
 *                       example: Urgent need for surgery funding
 *                     donatedAmount:
 *                       type: number
 *                       example: 0
 *                     status:
 *                       type: string
 *                       example: pending
 *       400:
 *         description: Missing required fields or invalid email format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Missing required fields
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
 * /requests/{id}:
 *   get:
 *     summary: Get a request by ID (admin only)
 *     tags: [Requests]
 *     security:
 *       - xAuthToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 507f1f77bcf86cd799439011
 *                 fullName:
 *                   type: string
 *                   example: John Doe
 *                 phone:
 *                   type: string
 *                   example: "+1234567890"
 *                 email:
 *                   type: string
 *                   example: john.doe@example.com
 *                 personName:
 *                   type: string
 *                   example: Jane Smith
 *                 relationship:
 *                   type: string
 *                   example: Friend
 *                 immediateNeed:
 *                   type: string
 *                   example: Medical expenses
 *                 preferredDate:
 *                   type: string
 *                   format: date
 *                   example: 2025-07-15
 *                 additionalInfo:
 *                   type: string
 *                   example: Urgent need for surgery funding
 *                 donatedAmount:
 *                   type: number
 *                   example: 0
 *                 status:
 *                   type: string
 *                   example: pending
 *       400:
 *         description: Invalid request ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid request ID
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
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Forbidden
 *       404:
 *         description: Request not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Request not found
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
 * /requests:
 *   get:
 *     summary: Get all requests (admin only)
 *     tags: [Requests]
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
 *         description: Number of requests per page
 *     responses:
 *       200:
 *         description: List of requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 507f1f77bcf86cd799439011
 *                       fullName:
 *                         type: string
 *                         example: John Doe
 *                       phone:
 *                         type: string
 *                         example: "+1234567890"
 *                       email:
 *                         type: string
 *                         example: john.doe@example.com
 *                       personName:
 *                         type: string
 *                         example: Jane Smith
 *                       relationship:
 *                         type: string
 *                         example: Friend
 *                       immediateNeed:
 *                         type: string
 *                         example: Medical expenses
 *                       preferredDate:
 *                         type: string
 *                         format: date
 *                         example: 2025-07-15
 *                       additionalInfo:
 *                         type: string
 *                         example: Urgent need for surgery funding
 *                       donatedAmount:
 *                         type: number
 *                         example: 0
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
 *                     totalRequests:
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
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Forbidden
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
 * /requests/{id}:
 *   put:
 *     summary: Update a request (admin only)
 *     tags: [Requests]
 *     security:
 *       - xAuthToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               email:
 *                 type: string
 *                 pattern: ^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$
 *                 example: john.doe@example.com
 *               personName:
 *                 type: string
 *                 example: Jane Smith
 *               relationship:
 *                 type: string
 *                 example: Friend
 *               immediateNeed:
 *                 type: string
 *                 example: Medical expenses
 *               preferredDate:
 *                 type: string
 *                 format: date
 *                 example: 2025-07-15
 *               additionalInfo:
 *                 type: string
 *                 example: Urgent need for surgery funding
 *     responses:
 *       200:
 *         description: Request updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Request updated successfully
 *                 request:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     fullName:
 *                       type: string
 *                       example: John Doe
 *                     phone:
 *                       type: string
 *                       example: "+1234567890"
 *                     email:
 *                       type: string
 *                       example: john.doe@example.com
 *                     personName:
 *                       type: string
 *                       example: Jane Smith
 *                     relationship:
 *                       type: string
 *                       example: Friend
 *                     immediateNeed:
 *                       type: string
 *                       example: Medical expenses
 *                     preferredDate:
 *                       type: string
 *                       format: date
 *                       example: 2025-07-15
 *                     additionalInfo:
 *                       type: string
 *                       example: Urgent need for surgery funding
 *                     donatedAmount:
 *                       type: number
 *                       example: 0
 *                     status:
 *                       type: string
 *                       example: pending
 *       400:
 *         description: Invalid request ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid request ID
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
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Forbidden
 *       404:
 *         description: Request not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Request not found
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
 * /requests/donate/{id}:
 *   put:
 *     summary: Record a donation to a request (admin only)
 *     tags: [Requests]
 *     security:
 *       - xAuthToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - donatedAmount
 *             properties:
 *               donatedAmount:
 *                 type: number
 *                 example: 500
 *     responses:
 *       200:
 *         description: Donation recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Donation recorded successfully
 *                 request:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     fullName:
 *                       type: string
 *                       example: John Doe
 *                     phone:
 *                       type: string
 *                       example: "+1234567890"
 *                     email:
 *                       type: string
 *                       example: john.doe@example.com
 *                     personName:
 *                       type: string
 *                       example: Jane Smith
 *                     relationship:
 *                       type: string
 *                       example: Friend
 *                     immediateNeed:
 *                       type: string
 *                       example: Medical expenses
 *                     preferredDate:
 *                       type: string
 *                       format: date
 *                       example: 2025-07-15
 *                     additionalInfo:
 *                       type: string
 *                       example: Urgent need for surgery funding
 *                     donatedAmount:
 *                       type: number
 *                       example: 500
 *                     status:
 *                       type: string
 *                       example: completed
 *       400:
 *         description: Invalid request ID or invalid donated amount
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid donated amount
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
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Forbidden
 *       404:
 *         description: Request not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Request not found
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
 * /requests/{id}:
 *   delete:
 *     summary: Delete a request (admin only)
 *     tags: [Requests]
 *     security:
 *       - xAuthToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Request deleted successfully
 *       400:
 *         description: Invalid request ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid request ID
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
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Forbidden
 *       404:
 *         description: Request not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Request not found
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
