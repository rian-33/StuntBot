require("dotenv").config();
const express = require("express");
const path = require("path");

const formController = require("./controllers/formController");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

// Parse incoming form and JSON payloads.
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve the frontend, including public/index.html at "/".
app.use(express.static(PUBLIC_DIR));

// API endpoint for form submissions.
app.post("/submit", formController.handleSubmit);
app.get("/api/records", formController.handleList);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
