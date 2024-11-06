const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const http = require('http');
const path = require('path')
const WebSocket = require('ws');
const authController = require('./controllers/authController');
const messageController = require('./controllers/messageController');
const db = require('./config/db');

const app = express();
app.use(express.json());

// Configure express-session
app.use(
    session({
        secret: 'hud7ug873ge8hdugfyudgf',  
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 3600000 } 
    })
);

// Define routes for register and login
app.post('/register', authController.register);
app.post('/login', authController.login);
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

// Create an HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected users by their session ID
const clients = new Map();

// WebSocket connection logic with session check
wss.on('connection', (ws, req) => {
    const sessionId = req.session.id;
    if (!sessionId || !req.session.user) {
        ws.close(); 
        return;
    }

    const userId = req.session.user.id;
    clients.set(userId, ws);

    // Handle incoming messages
    ws.on('message', async (data) => {
        const message = JSON.parse(data);
        switch (message.type) {
            case 'privateMessage':
                await messageController.handlePrivateMessage(message.data, ws, wss, clients);
                break;
            case 'groupMessage':
                await messageController.handleGroupMessage(message.data, ws, wss, clients);
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    });

    // Remove client on disconnect
    ws.on('close', () => {
        clients.delete(userId);
    });
});

// Route for sending messages via HTTP
app.post('/send-message', async (req, res) => {
    const { sender_id, receiver_id, group_id, message, messageType } = req.body;

    // Validate the input
    if (!message || !sender_id || (!receiver_id && !group_id)) {
        return res.status(400).json({ message: 'Invalid input, missing required fields' });
    }

    try {
        if (messageType === 'private') {
            // Handle private message
            await messageController.handlePrivateMessage(
                { sender_id, receiver_id, message },
                null, 
                null, 
                null  
            );
            return res.status(200).json({ message: 'Private message sent successfully' });
        } else if (messageType === 'group') {
            // Handle group message
            await messageController.handleGroupMessage(
                { sender_id, group_id, message },
                null, 
                null, 
                null  
            );
            return res.status(200).json({ message: 'Group message sent successfully' });
        } else {
            return res.status(400).json({ message: 'Invalid message type' });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Start the server
const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
