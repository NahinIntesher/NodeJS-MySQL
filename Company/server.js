const express = require("express");
const connection = require("./Connection");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookies = require("cookie-parser");
const cors = require("cors");
const verifyToken = require("./middleware");
const port = 3000;
const bcrypt = require("bcrypt");




// Middleware
app.use(cors());
app.use(cookies());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));



// Connect to the database
connection.connect((error) => {
  if (error) {
    console.error("Database connection failed: " + error.stack);
    return;
  }
  console.log("Connected to database.");
});






app.get("/registrationPage", (req, res) => {
  if (req.cookies.userRegistered) {
    res.redirect("/");
  } else {
    res.sendFile(path.join(__dirname, "registrationPage.html"));
  }
    
});
app.post("/registrationPage", (req, res) => {
  const token = req.cookies.userRegistered;
  if (token) {
    return res.redirect("/");
  }

  const { name, email, password, dept_name, admin_key } = req.body;
  if(admin_key !== '1234'){
    res.redirect('back');
  }

  bcrypt.hash(password, 10)
  .then(hashedPassword => {
    connection.query(
      "INSERT INTO admins (name, email, password, dept_name, admin_key) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, dept_name, admin_key],
      (err) => {
        if (err) {
          return res.status(500).send("Error registering user");
        }
        else {
          return res.redirect('/loginPage');
        }
      }
    );
  })
  .catch(function(error){
      throw error;
  });
});







app.get("/loginPage", (req, res) => {
  if (req.cookies.userRegistered) {
    res.redirect("/");
  } else {
    res.sendFile(path.join(__dirname, "loginPage.html"));
  }
});
app.post("/loginPage", (req, res) => {
  const token = req.cookies.userRegistered;
  if (token) {
    return res.redirect("/");
  }

  const { email, password } = req.body;

  connection.query(
    "SELECT * FROM admins WHERE email = ?",
    [email],
    (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res
          .status(500)
          .send("An error occurred while retrieving user data");
      }

      if (results.length === 0) {
        return res.status(401).send("Invalid credentials");
      }


      bcrypt
      .compare(password, results[0].password)
      .then(function(isMatched) {
        if(isMatched) {
          const uid = results[0].id;
        
          const token = jwt.sign({ id: uid }, "1234", { expiresIn: "10d" });
          const cookieOptions = {
            expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            httpOnly: true,
          };
          res.cookie("userRegistered", token, cookieOptions);
          res.redirect("/homePage");
        }
        else {
          return res.status(401).send("Invalid email or password");
        }
      })
      .catch(err => console.error(err.message));  
    }
  );
});








app.get("/", (req, res) => {
  if (req.cookies.userRegistered) {
    res.redirect("/homePage");
  } else {
    res.redirect("/loginPage");
  }
});
app.get("/homePage", verifyToken, (req, res) => {
  const userId = req.userId;

  // Fetch the admin's details
  connection.query(
    "SELECT * FROM admins WHERE id = ?",
    [userId],
    (err, adminResult) => {
      if (err) {
        console.error("Error fetching admin data:", err);
        return res.status(500).send("Internal Server Error");
      }

      if (adminResult.length === 0) {
        return res.status(404).send("Admin not found");
      }

      const admin = adminResult[0];
      const deptName = admin.dept_name;

      // Fetch employees under the same department
      connection.query(
        "SELECT * FROM employee WHERE adminId = ?",
        [userId],
        (err, employeeResult) => {
          if (err) {
            console.error("Error fetching employee data:", err);
            return res.status(500).send("Internal Server Error");
          }

          // Render the dashboard with admin details and employees
          res.render("homePage", { admin, employees: employeeResult });
        }
      );
    }
  );
});






// Fetch all employees
app.get("/homePage/employee", verifyToken, (req, res) => {
  const adminId = req.userId;
  console.log(adminId);

  const sql = "SELECT * FROM employee where adminId=?";
  connection.query(sql, [adminId], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Server error");
      return;
    }
    res.render("employee", { employee: result });
  });
});






// Delete an employee
app.get("/homePage/delete-employee", verifyToken, (req, res) => {
  const { id } = req.query;
  res.render("confirmDelete", { id: id });
});
// Route to handle deletion
app.post("/homePage/delete-employee", (req, res) => {
  const { id, confirm } = req.body;

  if (confirm === "true") {
    const sql = "DELETE FROM employee WHERE id = ?";
    connection.query(sql, [id], (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Server error");
        return;
      }
      res.redirect("/homePage");
    });
  } else {
    res.redirect("/homePage/employee");
  }
});








// Add a new employee
app.get("/homePage/add-employee", verifyToken,(req, res) => {
  const  id = req.userId;
  console.log(id);
  connection.query(
    "SELECT dept_name FROM admins WHERE id = ?",
    [id],
    (err, dept) => {
      if (err) {
        console.error("Error fetching employee data:", err);
        return res.status(500).send("Internal Server Error");
      }
      else{
        res.render("addEmployee", {adminDeptName: dept[0].dept_name});  

      }
    }
  );
});
app.post("/homePage/add-employee", verifyToken, (req, res) => {
  const { name, joining_date, agreementTill, email, salary, phone_number, dept_name} = req.body;

  const userId = req.userId;
    const sql =
    "INSERT INTO employee (name, joining_date, agreementTill, email, salary, phone_number, adminId) VALUES (?, ?, ?, ?, ?, ?, ?)";
  connection.query(
    sql,
    [name, joining_date, agreementTill, email, salary, phone_number, userId],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Server error");
        return;
      }
      res.redirect("/homePage");
    }
  );

});







app.get("/homePage/profile", verifyToken, (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).send("Admin ID is required");
  }

  const sql = "SELECT name, email, dept_name FROM admins WHERE id=?";
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error fetching admin details:", err);
      return res.status(500).send("Server error");
    }

    if (results.length === 0) {
      return res.status(404).send("Admin not found");
    }

    const admin = results[0];
    console.log("Admin details:", admin); // Added for debugging
    res.render("profile", { admin });
  });
});






app.get("/logoutPage", (req, res) => {
  res.clearCookie("userRegistered");
  res.redirect("/loginPage");
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
