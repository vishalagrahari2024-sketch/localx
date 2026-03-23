const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// --- Middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// --- MongoDB Connection ---
if (!MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is missing in .env file!");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// --- Socket.IO Setup ---
const setupSocket = require("./socket");
const io = setupSocket(server);
app.set("io", io);

// --- API Routes ---
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const adminRoutes = require("./routes/admin");
const notificationRoutes = require("./routes/notifications");
const messageRoutes = require("./routes/messages");
const groupRoutes = require("./routes/groups");

// New modular routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

// Legacy routes (backward compatibility - mounted last to avoid collisions)
const legacyRoutes = require("./routes");
app.use("/api", legacyRoutes);

// --- Health Check ---
app.get("/", (req, res) => {
  res.json({
    status: "running",
    message: "LocalX Backend API v2.0",
    timestamp: new Date().toISOString(),
  });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Error:", err);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`🚀 LocalX Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready for real-time connections`);
});
