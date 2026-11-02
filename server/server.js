const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err.message);
    return;
  }

  console.log("✅ MySQL connected successfully!");
});
app.post("/api/register", (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password are required"
    });
  }

  const sql = `
    INSERT INTO users (name, email, password, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [
    name,
    email,
    password,
    role || "participant",
    phone || null
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Registration error:", err.message);

      return res.status(500).json({
        message: "Registration failed",
        error: err.message
      });
    }

    res.status(201).json({
      message: "Registration successful",
      userId: result.insertId
    });
  });
});
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }

  const sql = `
    SELECT id, name, email, password, role, phone
    FROM users
    WHERE email = ?
  `;

  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Login error:", err.message);

      return res.status(500).json({
        message: "Login failed"
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = results[0];

    if (user.password !== password) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  });
});


app.get("/api/users", (req, res) => {
  const sql = `
    SELECT id, name, email, role, phone, created_at
    FROM users
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Users fetch error:", err.message);

      return res.status(500).json({
        message: "Failed to fetch users"
      });
    }

    res.json(results);
  });
});
app.post("/api/events", (req, res) => {
  const {
    title,
    description,
    event_date,
    event_time,
    venue,
    organizer_id
  } = req.body;

  if (!title || !event_date) {
    return res.status(400).json({
      message: "Event title and date are required"
    });
  }

  const sql = `
    INSERT INTO events
    (title, description, event_date, event_time, venue, organizer_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [
    title,
    description || null,
    event_date,
    event_time || null,
    venue || null,
    organizer_id || null
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Event creation error:", err.message);

      return res.status(500).json({
        message: "Failed to create event"
      });
    }

    res.status(201).json({
      message: "Event created successfully",
      eventId: result.insertId
    });
  });
});
app.get("/api/events", (req, res) => {
  const sql = `
    SELECT 
      e.id,
      e.title,
      e.description,
      e.event_date,
      e.event_time,
      e.venue,
      e.organizer_id,
      u.name AS organizer_name
    FROM events e
    LEFT JOIN users u ON e.organizer_id = u.id
    ORDER BY e.event_date ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Events fetch error:", err.message);

      return res.status(500).json({
        message: "Failed to fetch events"
      });
    }

    res.json(results);
  });
});
app.post("/api/event-register", (req, res) => {
  const { event_id, user_id } = req.body;

  if (!event_id || !user_id) {
    return res.status(400).json({
      message: "Event ID and User ID are required"
    });
  }

  const sql = `
    INSERT INTO event_registrations (event_id, user_id)
    VALUES (?, ?)
  `;

  db.query(sql, [event_id, user_id], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
          message: "Already registered for this event"
        });
      }

      console.error("Event registration error:", err.message);

      return res.status(500).json({
        message: "Event registration failed"
      });
    }

    res.status(201).json({
      message: "Event registration successful",
      registrationId: result.insertId
    });
  });
});
app.get("/api/event-registrations/:eventId", (req, res) => {
  const { eventId } = req.params;

  const sql = `
    SELECT
      er.id,
      u.name,
      u.email,
      u.phone,
      e.title AS event_title,
      er.registered_at
    FROM event_registrations er
    JOIN users u ON er.user_id = u.id
    JOIN events e ON er.event_id = e.id
    WHERE er.event_id = ?
    ORDER BY er.registered_at DESC
  `;

  db.query(sql, [eventId], (err, results) => {
    if (err) {
      console.error("Registration fetch error:", err.message);

      return res.status(500).json({
        message: "Failed to fetch registered participants"
      });
    }

    res.json(results);
  });
});
app.post("/api/announcements", (req, res) => {
  const { title, message, created_by } = req.body;

  if (!title || !message) {
    return res.status(400).json({
      message: "Announcement title and message are required"
    });
  }

  const sql = `
    INSERT INTO announcements
    (title, message, created_by)
    VALUES (?, ?, ?)
  `;

  db.query(
    sql,
    [title, message, created_by || null],
    (err, result) => {
      if (err) {
        console.error(
          "Announcement creation error:",
          err.message
        );

        return res.status(500).json({
          message: "Failed to create announcement"
        });
      }

      res.status(201).json({
        message: "Announcement created successfully",
        announcementId: result.insertId
      });
    }
  );
});


app.get("/api/announcements", (req, res) => {
  const sql = `
    SELECT
      a.id,
      a.title,
      a.message,
      a.created_at,
      u.name AS creator_name
    FROM announcements a
    LEFT JOIN users u
      ON a.created_by = u.id
    ORDER BY a.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(
        "Announcements fetch error:",
        err.message
      );

      return res.status(500).json({
        message: "Failed to fetch announcements"
      });
    }

    res.json(results);
  });
});
app.get("/", (req, res) => {
  res.json({
    message: "ConnectSphere Backend is Running 🚀"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});