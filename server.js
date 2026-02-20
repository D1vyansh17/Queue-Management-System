const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

// --- SETTINGS ---
const token = '8548218102:AAHaGJQHQV10mcveU3Gjp3ETxyXmPXJtKdg'; 
const bot = new TelegramBot(token, {polling: true});
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let currentToken = 0;
let queue = []; // Stores { id, chatId, name }

// 1. TELEGRAM: When a user sends a message to the bot
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || "User";

    // Increment Serial Counter
    currentToken++;
    const userToken = { id: currentToken, chatId: chatId, name: firstName };
    
    // Add to queue
    queue.push(userToken);

    // Update Staff Dashboard in real-time
    io.emit('new_entry', userToken);

    // Reply to User
    bot.sendMessage(chatId, `✅ Hello ${firstName}!\n\nYour Token Number is: ${currentToken}\n\nPlease wait here. I will notify you when it is your turn! 🔔`);
});

// 2. API: When staff calls the next person
app.get('/call-next', (req, res) => {
    if (queue.length > 0) {
        const nextInLine = queue.shift();
        
        // Update the big screen/monitor
        io.emit('now_calling', nextInLine);

        // Notify user via Telegram (FREE)
        bot.sendMessage(nextInLine.chatId, `🎉 TOKEN #${nextInLine.id}, IT IS YOUR TURN!\n\nPlease proceed to the counter now.`);

        res.send({ success: true, called: nextInLine.id });
    } else {
        res.status(400).send({ message: "No one in queue" });
    }
});

server.listen(3000, () => {
    console.log('--- FREE TOKEN SYSTEM ACTIVE ---');
    console.log('1. Users: Open Telegram and message your bot');
    console.log('2. Staff: Open http://localhost:3000/display.html');
});