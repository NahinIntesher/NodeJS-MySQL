const express = require("express");
const connection = require("./Connection");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookies = require("cookie-parser");
const cors = require("cors");
const verifyToken = require("./middleware");

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database: ", err);
    return;
  }
  console.log("Connected to database");
});

// Middleware
app.use(cors());
app.use(cookies());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/register", (req, res) => {
  if (req.cookies.userRegistered) {
    res.redirect("/");
  } else {
    res.sendFile(path.join(__dirname, "register.html"));
  }
});

app.get("/login", (req, res) => {
  if (req.cookies.userRegistered) {
    res.redirect("/");
  } else {
    res.sendFile(path.join(__dirname, "login.html"));
  }
});

app.get("/", (req, res) => {
  if (req.cookies.userRegistered) {
    res.redirect("/homePage");
  } else {
    res.redirect("/login");
  }
});

app.get("/homePage", verifyToken, (req, res) => {
  const userId = req.userId; // Get the user ID from the request object

  connection.query(
    "SELECT * FROM students WHERE id = ?",
    [userId],
    (err, result) => {
      if (err) {
        console.error("Error fetching student data:", err);
        return res.status(500).send("Internal Server Error");
      }

      if (result.length === 0) {
        return res.status(404).send("Student not found");
      }

      const sql = `
        SELECT posts.*, students.name AS studentsName 
        FROM posts 
        INNER JOIN students ON posts.UserID = students.id 
        ORDER BY posts.CreatedAt DESC;
      `;
      connection.query(sql, (err, postsResult) => {
        if (err) {
          console.error("Error fetching posts:", err);
          return res.status(500).send("Internal Server Error");
        }
        res.render("index", { students: result[0], posts: postsResult });
      });
    }
  );
});

app.get("/settings", verifyToken, (req, res) => {
  const userId = req.userId;
  connection.query("SELECT * FROM students WHERE id=?", [userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }
    res.render("settings", { student: result[0] });
  });
});

app.get("/settings/change-password", verifyToken, (req, res) => {
  const userId = req.userId;

  connection.query("SELECT * FROM students WHERE id=?", [userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }
    res.render("changepassword", { student: result[0], message: "" });
  });
});

app.get("/logout", (req, res) => {
  res.clearCookie("userRegistered");
  res.redirect("/");
});

app.get("/students", (req, res) => {
  connection.query("SELECT * FROM students", (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }
    res.render("students", { students: result });
  });
});

app.get("/delete-student", (req, res) => {
  const { id } = req.query;
  connection.query("DELETE FROM students WHERE id = ?", [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }
    res.redirect("/students");
  });
});

app.get("/update-student", (req, res) => {
  const { id } = req.query;
  connection.query("SELECT * FROM students WHERE id=?", [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }
    res.render("update-student", { student: result });
  });
});

app.post("/posts", verifyToken, (req, res) => {
  const { postContent } = req.body;
  const userId = req.userId;

  connection.query(
    "INSERT INTO posts (UserID, Content) VALUES (?, ?)",
    [userId, postContent],
    (err) => {
      if (err) {
        console.error("Error inserting post:", err);
        return res.status(500).send("Internal Server Error");
      }
      res.redirect("/homePage");
    }
  );
});

app.get("/posts", (req, res) => {
  const sql =
    "SELECT posts.*, students.name FROM posts JOIN students ON posts.UserID = students.id ORDER BY CreatedAt DESC";

  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching posts:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.render("posts", { posts: results });
  });
});

// Get method to retrieve all posts

app.post("/register", (req, res) => {
  const { name, phone_no, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }

  connection.query(
    "INSERT INTO students (name, phone_no, email, password) VALUES (?, ?, ?, ?)",
    [name, phone_no, email, password],
    (err) => {
      if (err) {
        return res.status(500).send("Error registering user");
      }
      return res.status(201).send({ message: "Registered successfully!" });
    }
  );
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  connection.query(
    "SELECT * FROM students WHERE email = ?",
    [email],
    (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("An error occurred while retrieving user data");
      }

      if (results.length === 0) {
        return res.status(401).send("Invalid credentials");
      }

      const storedPassword = results[0].password;
      const uid = results[0].id;

      if (storedPassword !== password) {
        return res.status(401).send("Invalid email or password");
      }

      const token = jwt.sign({ id: uid }, "1234", { expiresIn: "10d" });
      const cookieOptions = {
        expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      // res.cookie("userRegistered", token, cookieOptions);
      // res.send({
      //   logged: token,
      //   result: results[0],
      // });
      res.redirect('/homePage');
    }
  );
});

app.post("/update-student", verifyToken, (req, res) => {
  const { name, phone_no, email, password, id } = req.body;

  connection.query(
    "UPDATE students SET name=?, phone_no=?, email=?, password=? WHERE id=?",
    [name, phone_no, email, password, id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
      }
      res.redirect("/students");
    }
  );
});

app.post("/settings/change-password", verifyToken, (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const userId = req.userId;

  connection.query("SELECT * FROM students WHERE id = ?", [userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.render("changepassword", { message: "DATABASE_QUERY_ERROR" });
    }

    const user = result[0];

    if (confirmNewPassword !== newPassword) {
      return res.render("changepassword", { message: "CONFIRM_PASSWORD_DOES_NOT_MATCH" });
    }
    if (user.password !== currentPassword) {
      return res.render("changepassword", { message: "CURRENT_PASSWORD_DOES_NOT_MATCH" });
    }

    connection.query("UPDATE students SET password = ? WHERE id = ?", [newPassword, userId], (err) => {
      if (err) {
        console.error(err);
        return res.render("changepassword", { message: "PASSWORD_UPDATE_FAILED" });
      }

      return res.render("changepassword", { message: "SUCCESS" });
    });
  });
});

app.locals.getTimeString = function (postDate) {
  const currentTime = new Date();
  const postTime = new Date(postDate);
  const timeDifference = (currentTime - postTime) / 1000;

  if (timeDifference < 60) {
    return "Few sec ago";
  } else if (timeDifference / 60 < 60) {
    return Math.floor(timeDifference / 60) + " min ago";
  } else if (timeDifference / (60 * 60) < 24) {
    return Math.floor(timeDifference / (60 * 60)) + " hour ago";
  } else {
    return Math.floor(timeDifference / (60 * 60 * 24)) + " day ago";
  }
};

app.get("/postsAPI", (req, res) => {
  const sql = "SELECT posts.*, students.name FROM posts JOIN students ON posts.UserID = students.id ORDER BY CreatedAt DESC";

  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching posts:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.json(results);
  });
});

// Start the server
app.listen(3002, () => {
  console.log("Server is running on port 3001");
});
