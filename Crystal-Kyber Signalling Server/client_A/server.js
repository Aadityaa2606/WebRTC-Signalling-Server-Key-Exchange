const fs = require('fs');
const io = require('socket.io-client');
const kyber = require('crystals-kyber');
const { performance } = require('perf_hooks');

// Generate Client A's Kyber key pair (if not already saved)
if (!fs.existsSync('client_a_public.pem') || !fs.existsSync('client_a_private.pem')) {
    let [clientAPublicKey, clientAPrivateKey] = kyber.KeyGen768();
    fs.writeFileSync('client_a_public.pem', clientAPublicKey.toString('base64'), 'utf8');
    fs.writeFileSync('client_a_private.pem', clientAPrivateKey.toString('base64'), 'utf8');
}

// Load Client A's Kyber key pair
const clientAPublicKey = Buffer.from(fs.readFileSync('client_a_public.pem', 'utf8'), 'base64');
const clientAPrivateKey = Buffer.from(fs.readFileSync('client_a_private.pem', 'utf8'), 'base64');

// Load Server's Public Key
const serverPublicKey = Buffer.from(fs.readFileSync('../server/server_public.pem', 'utf8'), 'base64');

// Connect to the signaling server
const socket = io('http://localhost:3030');

// Sending a message
const sendMessage = (message) => {
    const encryptedMessage = kyber.Encrypt768(serverPublicKey, Buffer.from(message, 'utf8'));
    socket.emit('sendMessage', encryptedMessage, (error, response) => {
        if (error) {
            console.error('Error sending message:', error);
        } else {
            console.log(response);
        }
    });
};

socket.on('connect', () => {
    console.log('Connected to the server');

    // Generate shared secret and encrypt it with the server's public key
    let [encryptedSharedSecret, sharedSecret] = kyber.Encrypt768(serverPublicKey);
    console.log(`Generated and encrypted shared secret: ${sharedSecret.toString('hex')}`);

    // Measure time for sending the shared secret
    const startTime = performance.now();
    socket.emit('sendSharedSecret', encryptedSharedSecret, () => {
        const endTime = performance.now();
        console.log(`Time taken to send shared secret: ${(endTime - startTime).toFixed(3)} ms`);
    });

    const message = `lorem ipsum dolor sit amet, consectetur adipiscing elit Nullam 
    auctor, nunc id aliquam lacinia, velit nunc tincidunt urna, nec molestie risus n
    isl et nunc. Sed id semper nisl. Fusce auctor, ligula  ligula vitae finibus tinc
    idunt, mauris justo efficitur nunc, nec ultrices nunc lectus a justo.";vitae finibus
     tincidunt, mauris justo efficitur nunc, nec ultrices nunc lectus a justo.`;
    sendMessage(message);
});
