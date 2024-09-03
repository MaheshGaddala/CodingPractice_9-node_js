const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");
let db = null;
app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
app.get("/", (req, res) => {
  res.send("Welcome to the registration server!");
});

// Register User
app.post("/register/", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
    SELECT * FROM user
    WHERE username='${username}';
    `;
  const dbUser = await db.get(selectUserQuery);
  console.log(dbUser);
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO user(username,name,password,gender,location)
      VALUES
        (
            "${username}",
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        )
      `;
    if (password.length >= 5) {
      await db.run(createUserQuery);
      res.status(200);
      res.send("User created successfully");
    } else {
      res.status(400);
      res.send("Password is too short");
    }
  } else {
    res.status(400);
    res.send("User already exists");
  }
});

// Login User
app.post("/login/", async (req, res) => {
  const { username, password } = req.body;
  const selectUserQuery = `
    SELECT * FROM user
    WHERE username='${username}';
    `;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    res.status(400);
    res.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      res.status(200);
      res.send("Login success!");
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  }
});

// Update password
app.put("/change-password/", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const selectUserQuery = `
    SELECT * FROM user WHERE username="${username}";
    `;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    res.status(400);
    res.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === false) {
      res.status(400);
      res.send("Invalid current password");
    } else {
      if (newPassword.length < 5) {
        res.status(400);
        res.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
              UPDATE user SET password="${hashedPassword}" WHERE username="${username}";
              `;

        await db.run(updatePasswordQuery);
        res.status(200);
        res.send("Password updated");
      }
    }
  }
});

module.exports = app;
