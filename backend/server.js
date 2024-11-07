require('dotenv').config()
const express = require('express')
const session = require('express-session')
const bcrypt = require('bcryptjs')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const path = require('path')
const app = express()
const port = 3000

// Middleware to parse JSON request bodies
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Session middleware
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
)

// MySQL database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err)
    return
  }
  console.log('Connected to the database')
})

app.use(express.static(path.join(__dirname, '../frontend')))

// Serve the landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'landingPage.html'))
})

// Serve the registration page
app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'register.html'))
})

// Serve the login page
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'login.html'))
})

// Serve the homepage
app.get('/homePage.html', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login.html')
  }
  res.sendFile(path.join(__dirname, '../frontend', 'homePage.html'))
})

// Registration logic
app.post('/registerPage', async (req, res) => {
  const { email, password, username, phone } = req.body

  // Check if the email already exists
  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database query error' })
      }

      if (result.length > 0) {
        return res.status(400).json({ message: 'Email already exists' })
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Store the new user in the database
      db.query(
        'INSERT INTO users (email, password, username, phone) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, username, phone],
        (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error saving user' })
          }

          // Redirect to the login page after successful registration
          res.redirect('/login.html')
        }
      )
    }
  )
})

// Login logic
app.post('/login', (req, res) => {
  const { email, password } = req.body

  // Query the database for the user with the given email
  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database query error' })
      }

      if (result.length === 0) {
        return res.status(400).json({ message: 'Email not found' })
      }

      const user = result[0]

      // Compare the entered password with the hashed password in the database
      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid password' })
      }

      // Store user info in session for persistent login
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        image_url: user.image_url, // Add image_url to session if necessary
      }

      // Query other users (excluding the current logged-in user)
      db.query(
        'SELECT * FROM users WHERE email != ?',
        [email],
        (err, otherUsers) => {
          if (err) {
            return res
              .status(500)
              .json({ message: 'Error fetching other users' })
          }

          // Store other users in session
          req.session.otherUsers = otherUsers

          // Redirect to homepage after successful login
          res.redirect('/homePage.html')
        }
      )
    }
  )
})

app.get('/api/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not logged in' })
  }

  // Send the logged-in user's info and other users' info
  res.json({ user: req.session.user, otherUsers: req.session.otherUsers })
})
// Log out endpoint
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to log out' })
    }
    res.clearCookie('connect.sid')
    res.redirect('/login.html')
  })
})

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
