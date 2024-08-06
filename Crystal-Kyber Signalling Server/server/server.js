const fs = require('fs');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');
const sirv = require('sirv');
const kyber = require('crystals-kyber');
const { performance } = require('perf_hooks');

// Environment Variables
const PORT = 3030;
const DEV = true;

// Setup Servers
const app = express();
app.use(express.json(), cors());
const server = http.createServer(app);
const io = socketio(server, { cors: {} });

// Generate server's Kyber key pair (if not already saved)
if (!fs.existsSync('server_public.pem') || !fs.existsSync('server_private.pem')) {
    let [serverPublicKey, serverPrivateKey] = kyber.KeyGen768();
    fs.writeFileSync('server_public.pem', serverPublicKey.toString('base64'), 'utf8');
    fs.writeFileSync('server_private.pem', serverPrivateKey.toString('base64'), 'utf8');
}

// Load Server's Kyber key pair
const serverPublicKey = Buffer.from(fs.readFileSync('server_public.pem', 'utf8'), 'base64');
const serverPrivateKey = Buffer.from(fs.readFileSync('server_private.pem', 'utf8'), 'base64');

// Load Clients' Public Keys
const clientAPublicKey = Buffer.from(fs.readFileSync('../client_A/client_a_public.pem', 'utf8'), 'base64');
const clientBPublicKey = Buffer.from(fs.readFileSync('../client_B/client_b_public.pem', 'utf8'), 'base64');

// Messaging Logic
io.on('connection', (socket) => {
    console.log('User connected with id', socket.id);

    socket.on('sendSharedSecret', (encryptedSharedSecret) => {
        const startTime = performance.now(); // Start measuring time

        try {
            // Decrypt the shared secret with the server's private key
            let [sharedSecret] = kyber.Decrypt768(encryptedSharedSecret, serverPrivateKey);
            console.log(`Received and decrypted shared secret: ${sharedSecret}`);
            
            // Encrypt the shared secret with Client B's public key
            let [encryptedSharedSecretForClientB] = kyber.Encrypt768(clientBPublicKey, sharedSecret);

            // Send the encrypted shared secret to Client B
            socket.broadcast.emit('receiveSharedSecret', encryptedSharedSecretForClientB);

            const endTime = performance.now(); // End measuring time
            console.log(`Time taken for key exchange: ${(endTime - startTime).toFixed(3)} ms`);
        } catch (error) {
            console.error('Error decrypting or encrypting shared secret:', error);
        }
    });
    
    socket.on('sendMessage', (encryptedMessage, callback) => {
        try {
            const message = kyber.Decrypt768(encryptedMessage, serverPrivateKey);
            console.log(`Server received message: ${message.toString('utf8')}`);

            // Encrypt the message with Client B's public key
            const [encryptedMessageForClientB] = kyber.Encrypt768(clientBPublicKey, message);

            // Send the encrypted message to Client B
            socket.broadcast.emit('receiveMessage', encryptedMessageForClientB);

            callback(null, 'Message sent to Client B');
        } catch (error) {
            console.error('Error decrypting or encrypting message:', error);
            callback(error);
        }
    });

    socket.on('disconnect', () => {
        console.log(socket.id, 'has disconnected');
    });

    socket.on('disconnect', () => {
        console.log(socket.id, 'has disconnected');
    });
});

// Serve Static Files
app.use(sirv('public', { DEV }));

// Run App
server.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));
