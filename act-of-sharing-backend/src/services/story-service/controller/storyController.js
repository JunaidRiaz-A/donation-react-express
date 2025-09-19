const Story = require("../models/story");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Setup Multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, filename);
  },
});

// Use .fields instead of .single to support both file and text data
const upload = multer({ storage: storage }).fields([
  { name: "image", maxCount: 1 },
]);

const addStory = async (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      console.error("Multer error:", err.message);
      return res.status(400).json({ message: "File upload error" });
    }

    const { quote, name, location, category, amount } = req.body;

    if (!quote || !name || !location || !category || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ message: "Amount must be a positive number" });
    }

    let imageUrl = "";
    if (req.files && req.files.image) {
      imageUrl = `/uploads/${req.files.image[0].filename}`;
    }

    try {
      const story = new Story({
        quote,
        name,
        location,
        category,
        amount: parseFloat(amount),
        image: imageUrl,
      });

      await story.save();
      res.status(201).json({ message: "Story added successfully", story });
    } catch (error) {
      console.error("Add story error:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  });
};

const getAllStories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const stories = await Story.find().skip(skip).limit(limit);
    const totalStories = await Story.countDocuments();
    const totalPages = Math.ceil(totalStories / limit);

    res.status(200).json({
      stories,
      pagination: {
        currentPage: page,
        totalPages,
        totalStories,
        limit,
      },
    });
  } catch (error) {
    console.error("Get all stories error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const getStoryById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid story ID" });
  }

  try {
    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    res.status(200).json(story);
  } catch (error) {
    console.error("Get story by ID error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const updateStory = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid story ID" });
  }

  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res
        .status(400)
        .json({ message: "Multer upload error", error: err.message });
    } else if (err) {
      return res
        .status(500)
        .json({ message: "Unknown upload error", error: err.message });
    }

    const { quote, name, location, category, amount } = req.body;

    if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
      return res
        .status(400)
        .json({ message: "Amount must be a positive number" });
    }

    try {
      const story = await Story.findById(id);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }

      if (quote !== undefined) story.quote = quote;
      if (name !== undefined) story.name = name;
      if (location !== undefined) story.location = location;
      if (category !== undefined) story.category = category;
      if (amount !== undefined) story.amount = parseFloat(amount);

      if (req.files && req.files.image) {
        story.image = `/uploads/${req.files.image[0].filename}`;
      }

      await story.save();
      res.status(200).json({ message: "Story updated successfully", story });
    } catch (error) {
      console.error("Update story error:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  });
};

const deleteStory = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid story ID" });
  }

  try {
    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    await Story.deleteOne({ _id: id });
    res.status(200).json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Delete story error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addStory,
  getAllStories,
  getStoryById,
  updateStory,
  deleteStory,
};
