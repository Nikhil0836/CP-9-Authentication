const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initialize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Success"));
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initialize();

//API-1

const validatePassword = (password) => {
  return password.length > 4;
};

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const SelectedUserQuery = `
    SELECT
     *
    FROM
     user
    WHERE 
     username = '${username}';`;
  const dbUser = await db.get(SelectedUserQuery);

  if (dbUser === undefined) {
    const createUserQuery = `
        INSERT INTO
          user (username,name,password,gender,location)
          VALUES (
              '${username}',
              '${name}',
              '${hashedPassword}',
              '${gender}',
              '${location}'
          );`;
    if (validatePassword(password)) {
      await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API-2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const SelectedUserQuery = `
    SELECT
     *
    FROM
     user
    WHERE 
     username = '${username}';`;
  const dbUser = await db.get(SelectedUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);

    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API-3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const SelectedUserQuery = `
    SELECT
     *
    FROM
     user
    WHERE 
     username = '${username}';`;
  const dbUser = await db.get(SelectedUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );

    if (isPasswordMatched === true) {
      if (validatePassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
                 UPDATE 
                   user
                 SET
                   password = '${hashedPassword}'
                 WHERE
                   username = '${username}';`;
        const user = await db.run(updatePasswordQuery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
