const db = require('../config/db');

// Function to handle sending private messages
async function handlePrivateMessage(messageData, ws, wss, clients) {
    const { sender_id, receiver_id, message } = messageData;

    // Insert the private message into the database
    const query = 'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)';
    await db.execute(query, [sender_id, receiver_id, message]);

    console.log(`Private message from ${sender_id} to ${receiver_id}: ${message}`);

    // Send the message to the receiver via WebSocket
    if (clients.has(receiver_id)) {
        const receiverWs = clients.get(receiver_id);
        receiverWs.send(JSON.stringify({
            type: 'privateMessage',
            data: { sender_id, receiver_id, message }
        }));
    }

    // Send the message to the sender as well, so they see the sent message
    if (clients.has(sender_id)) {
        const senderWs = clients.get(sender_id);
        senderWs.send(JSON.stringify({
            type: 'privateMessage',
            data: { sender_id, receiver_id, message }
        }));
    }
}

async function handleGroupMessage(messageData, ws, wss, clients) {
    const { sender_id, group_id, message } = messageData;

    // Insert the group message into the database
    const query = 'INSERT INTO messages (sender_id, group_id, message) VALUES (?, ?, ?)';
    await db.execute(query, [sender_id, group_id, message]);

    console.log(`Group message from ${sender_id} to group ${group_id}: ${message}`);

    // Query to get the list of users who are part of the group
    const queryMembers = 'SELECT user_id FROM group_members WHERE group_id = ?';
    const [groupMembers] = await db.execute(queryMembers, [group_id]);

    // Send the message to all members of the group
    groupMembers.forEach(({ user_id }) => {
        if (clients.has(user_id)) {
            const userWs = clients.get(user_id);
            userWs.send(JSON.stringify({
                type: 'groupMessage',
                data: { sender_id, group_id, message }
            }));
        }
    });

    // Optionally, you can also send the message to the sender
    if (clients.has(sender_id)) {
        const senderWs = clients.get(sender_id);
        senderWs.send(JSON.stringify({
            type: 'groupMessage',
            data: { sender_id, group_id, message }
        }));
    }
}


module.exports = {
    handlePrivateMessage,
    handleGroupMessage,
};
