require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const formController = require("./controllers/formController");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Views (static HTML)
app.get("/", formController.renderForm);
app.post("/submit", formController.handleSubmit);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
