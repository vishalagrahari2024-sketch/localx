const express = require("express");
const router = express.Router();
const Post = require("./models/Post");
const authMiddleware = require("./middleware");
const cloudinary = require("./cloudinary");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "social_media_uploads", 
    allowed_formats: ["jpg", "jpeg", "png", "mp4", "mov"],
  },
});

const upload = multer({ storage });


router.post("/posts", authMiddleware, upload.single("media"), async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log(" Uploaded File:", req.file);

    
    if (!req.body) {
      return res.status(400).json({ message: "Missing post data." });
    }

    const { text } = req.body;
    const userId = req.user?.uid;
    const username =
      req.user?.name || req.user?.email?.split("@")[0] || "Anonymous";

    const mediaUrl = req.file ? req.file.path : "";
    const mediaType = req.file
      ? req.file.mimetype.startsWith("video")
        ? "video"
        : "image"
      : "";

    if ((!text || text.trim().length === 0) && !mediaUrl) {
      return res.status(400).json({ message: "Post must have text or media." });
    }

    const newPost = new Post({
      userId,
      username,
      text: text?.trim() || "",
      mediaUrl,
      mediaType,
    });

    const post = await newPost.save();
    res.status(201).json({ message: " Post created successfully!", post });
  } catch (err) {
    console.error("❌ Error creating post:", err);
    res.status(500).json({ message: "Server error during post creation" });
  }
});

module.exports = router;

router.get("/posts", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    console.error("❌ Error fetching posts:", err.message);
    res.status(500).json({ message: "Server error while fetching posts" });
  }
});
