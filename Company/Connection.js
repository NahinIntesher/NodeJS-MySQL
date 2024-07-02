var mysql = require("mysql");

var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", 
  database: "company",
});

module.exports = connection;
