const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../../../middleware/authMiddleware");
const {
  addStory,
  getAllStories,
  getStoryById,
  updateStory,
  deleteStory,
} = require("../controller/storyController");

router.post("/", auth, authorize(["admin"]), addStory);
router.get("/", getAllStories);
router.get("/:id", auth, authorize(["admin"]), getStoryById);
router.put("/:id", auth, authorize(["admin"]), updateStory);
router.delete("/:id", auth, authorize(["admin"]), deleteStory);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Stories
 *   description: Story management
 */

/**
 * @swagger
 * /stories:
 *   post:
 *     summary: Add a new story (admin only)
 *     tags: [Stories]
 *     security:
 *       - xAuthToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - quote
 *               - name
 *               - location
 *               - category
 *               - amount
 *             properties:
 *               quote:
 *                 type: string
 *                 example: An inspiring story of hope.
 *               name:
 *                 type: string
 *                 example: Jane Smith
 *               location:
 *                 type: string
 *                 example: New York, NY
 *               category:
 *                 type: string
 *                 example: Community Support
 *               amount:
 *                 type: number
 *                 example: 1000
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file for the story
 *     responses:
 *       201:
 *         description: Story added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Story added successfully
 *                 story:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     quote:
 *                       type: string
 *                       example: An inspiring story of hope.
 *                     name:
 *                       type: string
 *                       example: Jane Smith
 *                     location:
 *                       type: string
 *                       example: New York, NY
 *                     category:
 *                       type: string
 *                       example: Community Support
 *                     amount:
 *                       type: number
 *                       example: 1000
 *                     image:
 *                       type: string
 *                       example: /uploads/1697051234567-image.jpg
 *       400:
 *         description: Missing required fields, invalid amount, or file upload error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Missing required fields
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
 * /stories:
 *   get:
 *     summary: Get all stories
 *     tags: [Stories]
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
 *         description: Number of stories per page
 *     responses:
 *       200:
 *         description: List of stories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 507f1f77bcf86cd799439011
 *                       quote:
 *                         type: string
 *                         example: An inspiring story of hope.
 *                       name:
 *                         type: string
 *                         example: Jane Smith
 *                       location:
 *                         type: string
 *                         example: New York, NY
 *                       category:
 *                         type: string
 *                         example: Community Support
 *                       amount:
 *                         type: number
 *                         example: 1000
 *                       image:
 *                         type: string
 *                         example: /uploads/1697051234567-image.jpg
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalStories:
 *                       type: integer
 *                       example: 50
 *                     limit:
 *                       type: integer
 *                       example: 10
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
 * /stories/{id}:
 *   get:
 *     summary: Get a story by ID (admin only)
 *     tags: [Stories]
 *     security:
 *       - xAuthToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Story ID
 *     responses:
 *       200:
 *         description: Story retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 507f1f77bcf86cd799439011
 *                 quote:
 *                   type: string
 *                   example: An inspiring story of hope.
 *                 name:
 *                   type: string
 *                   example: Jane Smith
 *                 location:
 *                   type: string
 *                   example: New York, NY
 *                 category:
 *                   type: string
 *                   example: Community Support
 *                 amount:
 *                   type: number
 *                   example: 1000
 *                 image:
 *                   type: string
 *                   example: /uploads/1697051234567-image.jpg
 *       400:
 *         description: Invalid story ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid story ID
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
 *         description: Story not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Story not found
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
 * /stories/{id}:
 *   put:
 *     summary: Update a story (admin only)
 *     tags: [Stories]
 *     security:
 *       - xAuthToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Story ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               quote:
 *                 type: string
 *                 example: Updated inspiring story of hope.
 *               name:
 *                 type: string
 *                 example: Jane Smith
 *               location:
 *                 type: string
 *                 example: Boston, MA
 *               category:
 *                 type: string
 *                 example: Education Support
 *               amount:
 *                 type: number
 *                 example: 1500
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional new image file for the story
 *     responses:
 *       200:
 *         description: Story updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Story updated successfully
 *                 story:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     quote:
 *                       type: string
 *                       example: Updated inspiring story of hope.
 *                     name:
 *                       type: string
 *                       example: Jane Smith
 *                     location:
 *                       type: string
 *                       example: Boston, MA
 *                     category:
 *                       type: string
 *                       example: Education Support
 *                     amount:
 *                       type: number
 *                       example: 1500
 *                     image:
 *                       type: string
 *                       example: /uploads/1697051234568-image.jpg
 *       400:
 *         description: Invalid story ID, invalid amount, or file upload error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid story ID
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
 *         description: Story not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Story not found
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
 * /stories/{id}:
 *   delete:
 *     summary: Delete a story (admin only)
 *     tags: [Stories]
 *     security:
 *       - xAuthToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Story ID
 *     responses:
 *       200:
 *         description: Story deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Story deleted successfully
 *       400:
 *         description: Invalid story ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid story ID
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
 *         description: Story not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Story not found
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
