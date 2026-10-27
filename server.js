const express = require("express");
const crypt = require("crypto");
const path = require("path");
const mysql = require("mysql2");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const pass = process.env.ROOTPASS || "march7";
const conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: pass,
    database: "distrodb",
    port: 3306
});

const hashRounds = 100;
const hashLength = 64;
const salt = "salt";

conn.connect(function(err) {
    if (err)
        console.log("Couldnt connect to MySQL", err);
    else
        console.log("Database connection established");
});

app.get("/", function(req, res) {
    res.redirect("/login.html");
});

app.post("/signup", function(req, res) {
    let plainPass = req.body.password;
    let username = req.body.userName;
    let fname = req.body.fname;
    let lname = req.body.lname;

    const hashedPass = crypt.pbkdf2Sync(plainPass, salt, hashRounds, hashLength, "sha512").toString("hex");
    let sql = "INSERT INTO users (fname, lname, username, password) VALUES (?, ?, ?, ?)";

    conn.query(sql, [fname, lname, username, hashedPass], function(err, result) {
        if (err) {
            console.log("There was an error inserting user", err);
            res.status(500).send("Database error occurred");
        } else {
            res.send("<p>you have successfully registered<br><a href=\"login.html\">Login here</a></p>");
        }
    });
});

app.post("/login", function(req, res) {
    let plainPass = req.body.password;
    let username = req.body.username;

    const pass = crypt.pbkdf2Sync(plainPass, salt, hashRounds, hashLength, "sha512").toString("hex");
    let sql = "SELECT * FROM users WHERE username = ? AND password = ?";

    conn.query(sql, [username, pass], function(err, result) {
        if (err) {
            res.send(err);
        } else {
            if (result.length === 0) {
                console.log("results of the query", result);
                res.send("<p>the login credentials were in correct<br><a href=\"login.html\">Login here</a></p>");
            } else {
                res.send(`<p>You have logged in successfully ${username}</p>`);
            }
        }
    });
});

app.listen(3000, function() {
    console.log("DistroFit running at http://localhost:3000");
});