const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Initialize WhatsApp client with local session persistence
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './sessions'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

let isReady = false;

client.on('qr', (qr) => {
    console.log('--- WHATSAPP QR CODE ---');
    console.log('Scan the QR code below with your WhatsApp phone:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('============================================');
    console.log('WhatsApp Service is READY and connected!');
    console.log('The system is now listening for messages.');
    console.log('============================================');
    isReady = true;
});

client.on('loading_screen', (percent, message) => {
    console.log('LOADING WHATSAPP:', percent, '%', message);
});

client.on('authenticated', () => {
    console.log('WhatsApp Authenticated successfully!');
});

client.on('auth_failure', (msg) => {
    console.error('WhatsApp Authentication failure:', msg);
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp was disconnected:', reason);
    isReady = false;
    client.initialize(); // Try to re-initialize
});

// Start initialization
client.initialize().catch(err => {
    console.error('Error during WhatsApp initialization:', err);
});

// API Endpoint to send message
app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;

    if (!isReady) {
        return res.status(503).json({ 
            success: false, 
            message: 'WhatsApp service is not ready yet. Please wait for the QR code scan.' 
        });
    }

    if (!phone || !message) {
        return res.status(400).json({ 
            success: false, 
            message: 'Phone and message are required.' 
        });
    }

    try {
        // Clean phone number: remove '+' and any non-numeric chars
        let cleanedPhone = phone.replace(/\D/g, '');
        
        // Ensure it has international format (e.g., starts with 20 for Egypt)
        // If it starts with 01, assume Egypt (20)
        if (cleanedPhone.startsWith('01')) {
            cleanedPhone = '20' + cleanedPhone.substring(1);
        } else if (cleanedPhone.length === 11 && cleanedPhone.startsWith('1')) {
             cleanedPhone = '20' + cleanedPhone;
        }

        const chatId = cleanedPhone + "@c.us";
        
        console.log(`Sending message to ${chatId}...`);
        await client.sendMessage(chatId, message);
        
        console.log(`Message sent successfully to ${phone}`);
        res.json({ success: true, message: 'Message sent successfully.' });
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send WhatsApp message.', 
            error: error.message 
        });
    }
});

app.get('/status', (req, res) => {
    res.json({ ready: isReady });
});

app.listen(port, () => {
    console.log(`WhatsApp Microservice listening at http://localhost:${port}`);
});
