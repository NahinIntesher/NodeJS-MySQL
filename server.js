const express = require("express");
const connection = require("./Connection");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database: ", err);
    return;
  }
  console.log("Connected to database");
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Handle registration form submission on POST request
app.post("/register.html", (req, res) => {
  const { name, id, phone_no, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }

  connection.query(
    "INSERT INTO students (name, id, phone_no, email, password, confirmPassword) VALUES (?, ?, ?, ?, ?, ?)",
    [name, id, phone_no, email, password, confirmPassword],
    (err, results) => {
      if (err) {
        return res.status(500).send("Error registering user");
      }
      res.send("Registered successfully!");
    }
  );
});

// Handle login form submission on POST request
app.post("/login.html", (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  connection.query(
    "SELECT * FROM students WHERE email = ?",
    [email],
    (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res
          .status(500)
          .send("An error occurred while retrieving user data");
      }
      console.log(results);
      if (results.length === 0) {
        return res.status(401).send("Invalid email or password");
      }

      const storedPassword = results[0].password;
      if (storedPassword === password) {
        res.send("Login successful");
      } else {
        res.status(401).send("Invalid email or password");
      }
    }
  );
});

// Start the server
app.listen(3000);
