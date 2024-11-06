const express = require('express')
const mysql = require('mysql2')
const bcrypt = require('bcryptjs')
const bodyParser = require('body-parser')
const path = require('path')
const session = require('express-session')

const app = express()
const port = 3000

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: false }))

// Middleware for session management
app.use(
  session({
    secret: 'yourSecretKey', // Choose a strong secret key
    resave: false,
    saveUninitialized: true,
  })
)

// MySQL Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Your MySQL username
  password: '', // Your MySQL password
  database: 'chatbox', // Your MySQL database
})

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack)
    return
  }
  console.log('Connected to the database')
})

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../frontend')))

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'landingPage.html'))
})

app.get('/registerPage.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'registerPage.html'))
})

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'login.html'))
})

// Register endpoint (For registration)
app.post('/registerPage', async (req, res) => {
  const { username, email, password, phone } = req.body

  // Check if the email already exists
  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, result) => {
      if (err) {
        console.error('Database query error:', err)
        return res.status(500).json({ message: 'Database query error' })
      }

      if (result.length > 0) {
        return res.status(400).json({ message: 'Email already in use' })
      }

      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10)

      // Insert new user into the database
      const query =
        'INSERT INTO users (username, email, password, phone) VALUES (?, ?, ?, ?)'
      db.query(query, [username, email, hashedPassword, phone], (err) => {
        if (err) {
          console.error('Database insertion error:', err)
          return res.status(500).json({ message: 'Error registering user' })
        }

        console.log('User registered successfully.')
        // Redirect to login page after successful registration
        res.redirect('/login.html')
      })
    }
  )
})

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body

  // Query the database for the user with the given email
  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, result) => {
      if (err) {
        console.error('Database query error:', err)
        return res.status(500).json({ message: 'Database query error' })
      }

      if (result.length === 0) {
        return res.status(400).json({ message: 'Email not found' })
      }

      const user = result[0]

      // Log the received data for debugging purposes
      console.log('User from DB:', user)
      console.log('Entered password:', password)

      // Compare the entered password with the hashed password in the database
      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid password' })
      }

      console.log('Login successful')

      // Store user info in session for persistent login
      req.session.user = user

      // Redirect to home page after successful login
      console.log('done')
      res.redirect('/homePage.html')
    }
  )
})

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
