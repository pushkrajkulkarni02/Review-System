const dotenv = require("dotenv");
dotenv.config();

console.log("Server starting...");

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

/* ---------------- DB CONNECTION ---------------- */
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "review_system"
});

db.connect((err) => {
  if (err) {
    console.error("DB connection failed:", err);
    return;
  }
  console.log("MySQL Connected");
});

/* ---------------- REGISTER ---------------- */
app.post("/register", (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.json({ status: "error", message: "All fields required" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userRole = role || "user";

  const sql =
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";

  db.query(sql, [name, email, hashedPassword, userRole], (err) => {
    if (err) {
      console.error(err);
      return res.json({ status: "error", message: "User already exists or error" });
    }
    res.json({ status: "success" });
  });
});

/* ---------------- LOGIN ---------------- */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, result) => {
    if (err) return res.json({ status: "error" });

    if (result.length === 0) {
      return res.json({ status: "invalid" });
    }

    const user = result[0];
    const isMatch = bcrypt.compareSync(password, user.password);

    if (!isMatch) {
      return res.json({ status: "invalid" });
    }

    res.json({
      status: "success",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
});

/* ---------------- MOVIES LIST ---------------- */
app.get("/movies", (req, res) => {
  const sql = "SELECT * FROM movies";

  db.query(sql, (err, result) => {
    if (err) {
      return res.json([]);
    }
    res.json(result);
  });
});

/* ---------------- MOVIE DETAILS (FIXED) ---------------- */
app.get("/movies/:id", (req, res) => {
  const movieId = req.params.id;

  const sql = "SELECT * FROM movies WHERE id = ?";

  db.query(sql, [movieId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.json(result[0]);
  });
});

/* ---------------- MOVIE REVIEWS ---------------- */

// Get reviews of a movie
app.get("/movies/:id/reviews", (req, res) => {
  const movieId = req.params.id;

  const sql =
    "SELECT * FROM reviews WHERE movie_id = ?";

  db.query(sql, [movieId], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ status: "error", message: err.message });
    }

    res.json(result);
  });
});

// Add review to a movie
app.post("/movies/:id/reviews", (req, res) => {
  const movieId = req.params.id;
  const { user_name, rating, review } = req.body;

  if (!user_name || !rating || !review) {
    return res
      .status(400)
      .json({ status: "error", message: "All fields required" });
  }

  const sql =
    "INSERT INTO reviews (movie_id, user_name, rating, review) VALUES (?, ?, ?, ?)";

  db.query(sql, [movieId, user_name, rating, review], (err) => {
    if (err) {
      return res
        .status(500)
        .json({ status: "error", message: err.message });
    }

    res.json({ status: "success" });
  });
});

/* ---------------- DELETE REVIEW ---------------- */
app.delete("/reviews/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM reviews WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ status: "error", message: err.message });
    }
    res.json({ status: "success" });
  });
});

/* ---------------- BOOKS LIST ---------------- */
app.get("/books", (req, res) => {
  const sql = "SELECT * FROM books";
  db.query(sql, (err, result) => {
    if (err) return res.json([]);
    res.json(result);
  });
});

/* ---------------- BOOK DETAILS ---------------- */
app.get("/books/:id", (req, res) => {
  const bookId = req.params.id;
  const sql = "SELECT * FROM books WHERE id = ?";

  db.query(sql, [bookId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json(result[0]);
  });
});

/* ---------------- BOOK REVIEWS ---------------- */
app.get("/books/:id/reviews", (req, res) => {
  const bookId = req.params.id;

  const sql = "SELECT * FROM book_reviews WHERE book_id = ?";

  db.query(sql, [bookId], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ status: "error", message: err.message });
    }

    res.json(result);
  });
});

app.post("/books/:id/reviews", (req, res) => {
  const bookId = req.params.id;
  const { user_name, rating, review } = req.body;

  if (!user_name || !rating || !review) {
    return res
      .status(400)
      .json({ status: "error", message: "All fields required" });
  }

  const sql = "INSERT INTO book_reviews (book_id, user_name, rating, review) VALUES (?, ?, ?, ?)";

  db.query(sql, [bookId, user_name, rating, review], (err) => {
    if (err) {
      return res
        .status(500)
        .json({ status: "error", message: "Error adding review" });
    }

    res.json({ status: "success" });
  });
});

app.delete("/book-reviews/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM book_reviews WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ status: "error", message: err.message });
    }
    res.json({ status: "success" });
  });
});



/* ---------------- ADD CONTENT ---------------- */
app.post("/add-movie", (req, res) => {
  const { title, description, poster, cast_members } = req.body;
  if (!title || !description || !poster) {
    return res.json({ status: "error", message: "Missing fields" });
  }
  const sql = "INSERT INTO movies (title, description, poster, cast) VALUES (?, ?, ?, ?)";
  db.query(sql, [title, description, poster, cast_members], (err) => {
    if (err) return res.json({ status: "error", message: err.message });
    res.json({ status: "success" });
  });
});

app.post("/add-book", (req, res) => {
  const { title, description, poster, author } = req.body;
  if (!title || !description || !poster || !author) {
    return res.json({ status: "error", message: "Missing fields" });
  }
  const sql = "INSERT INTO books (title, description, poster, author) VALUES (?, ?, ?, ?)";
  db.query(sql, [title, description, poster, author], (err) => {
    if (err) return res.json({ status: "error", message: err.message });
    res.json({ status: "success" });
  });
});

/* ---------------- SERVER ---------------- */
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on http://localhost:${process.env.PORT || 5000}`);
});
