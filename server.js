const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const fs = require("fs");
const crypt = require("crypto");
const session = require("express-session");

const app = express();
const port = 3000;

//Parses form data
app.use(express.urlencoded({extended: true}));

//Middleware setup
app.use(
    session({
        secret: "distrofit_secret_key_12345",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 }
    })
);

//Retrieves HTML files from views directory
app.use(express.static(path.join(__dirname, "views")));

// Database connection
const pass = process.env.DBPASS || "password123";
const conn = mysql.createConnection({
    host: "localhost",
    user: "distro_user",
    password: pass,
    database: "distrofit_db",
    port: 3306
});

conn.connect((err) => {
    if (err) console.error("Couldnt connect to MySQL", err);
    else console.log("Connected to MySQL successfully");
});

//Password hashing config
const salt = "distrofit_salt";
const hashRounds = 1000;
const hashLength = 64;

//Redirects based on login status
app.get("/", function(req, res) {
    if (req.session && req.session.username) {
        res.redirect("/profile");
    } else {
        res.redirect("/login.html");
    }
});

//User registration
app.post("/signup", function(req, res) {
    const plainPass = req.body.password;
    const username = req.body.userName;
    const fname = req.body.fname;
    const lname = req.body.lname;

    const hashedPass = crypt.pbkdf2Sync(plainPass, salt, hashRounds, hashLength, "sha512").toString("hex"); //Password hashing
    
    //Saving user to database
    const sql = "INSERT INTO users (fname, lname, username, password) VALUES (?, ?, ?, ?)"; //
    conn.query(sql, [fname, lname, username, hashedPass], function(err) {
        if (err) return res.status(500).send("Registration error: " + err.message);
        res.redirect("/login.html");
    });
});

//User login
app.post("/login", function(req, res) {
    const plainPass = req.body.password;
    const username = req.body.username;

    //Hashes entered password to compare with stored hash
    const hashedPass = crypt.pbkdf2Sync(plainPass, salt, hashRounds, hashLength, "sha512").toString("hex");

    //Authenticates user data
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    conn.query(sql, [username, hashedPass], function(err, result) {
        if (err) return res.status(500).send("Database error: " + err.message);

        if (result && result.length > 0) {
            req.session.username = result[0].username;
            req.session.fname = result[0].fname;
            res.redirect("/profile");
        } else {
            res.status(401).send("Invalid username or password. <a href='/login.html'>Try again</a>");
        }
    });
});

//Protect profile route
app.get("/profile", function(req, res) {
    if (!req.session || !req.session.username) {
        return res.status(401).send("You must log in to view this page. <a href='/login.html'>Login here</a>");
    }
    //Reads profile.html
    const filePath = path.join(__dirname, "views", "profile.html");
    fs.readFile(filePath, "utf8", function(err, htmlContent) {
        if (err) return res.status(500).send("Error loading profile page.");
        //Displays profile.html
        const renderedHtml = htmlContent
            .replace("{{fname}}", req.session.fname || req.session.username)
            .replace("{{username}}", req.session.username);
        res.send(renderedHtml);
    });
});

//User logout
app.get("/logout", function(req, res) {
    req.session.destroy(function() {
        res.clearCookie("connect.sid");
        res.sendFile(path.join(__dirname, "views", "logout.html"));
    });
});

app.listen(port, () => {
    console.log(`DistroFit running at http://localhost:${port}`);
});