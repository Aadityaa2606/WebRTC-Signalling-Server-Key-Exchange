const fs = require('fs');
const io = require('socket.io-client');
const kyber = require('crystals-kyber');
const { performance } = require('perf_hooks');

// Generate Client B's Kyber key pair (if not already saved)
if (!fs.existsSync('client_b_public.pem') || !fs.existsSync('client_b_private.pem')) {
    let [clientBPublicKey, clientBPrivateKey] = kyber.KeyGen768();
    fs.writeFileSync('client_b_public.pem', clientBPublicKey.toString('base64'), 'utf8');
    fs.writeFileSync('client_b_private.pem', clientBPrivateKey.toString('base64'), 'utf8');
}

// Load Client B's Kyber key pair
const clientBPublicKey = Buffer.from(fs.readFileSync('client_b_public.pem', 'utf8'), 'base64');
const clientBPrivateKey = Buffer.from(fs.readFileSync('client_b_private.pem', 'utf8'), 'base64');

let sharedSecret = null;

const socket = io('http://localhost:3030');

socket.on('connect', () => {
    console.log('Connected to the server');
});

socket.on('receiveSharedSecret', (encryptedSharedSecret) => {
    const startTime = performance.now(); // Start measuring time

    try {
        // Decrypt the shared secret with Client B's private key
        [sharedSecret] = kyber.Decrypt768(encryptedSharedSecret, clientBPrivateKey);
        const endTime = performance.now(); // End measuring time
        console.log(`Received and decrypted shared secret: ${sharedSecret.toString('hex')}`);
        console.log(`Time taken to receive and decrypt shared secret: ${(endTime - startTime).toFixed(3)} ms`);
    } catch (error) {
        console.error('Error decrypting shared secret:', error);
    }
});
