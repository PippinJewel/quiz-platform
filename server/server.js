const express = require("express");
const app = express();

// Allow frontend to call this backend
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Simple test route
app.get("/", (req, res) => {
  res.json({ message: "Quiz Platform Backend", status: "OK" });
});

// Your quiz routes would go here
app.get("/create-game", (req, res) => {
  const gameCode = Math.random().toString(36).substring(7).toUpperCase();
  res.json({ gameCode, message: "Game created!" });
});

app.get("/join/:code", (req, res) => {
  res.json({ message: `Joining game ${req.params.code}` });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Quiz Platform Backend running on port " + PORT);
});
