// IMPORTS
const crypto = require("crypto");
const fs = require("fs");
const io = require("socket.io-client");
const { performance } = require('perf_hooks');

// SHARED SECRET
let aesKey;

// Load Client B's Private Key
const clientBPrivateKey = fs.readFileSync("client_b_private.pem", "utf8");

// Function to decrypt AES key with RSA private key
function decryptWithPrivateKey(encryptedKey, privateKey) {
    return crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        Buffer.from(encryptedKey, "base64")
    );
}

function decryptMessage(aesKey, iv, encryptedMessage, authTag) {
    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Connect to the signaling server
const socket = io(process.env.SIGNALING_SERVER_URL || "http://localhost:3030");

socket.on("connect", () => {
    console.log("Connected to the server");
});

socket.on("receiveAESKey", (encryptedAESKey) => {
    const startTime = performance.now();

    try {
        console.log("Received encrypted AES key:", encryptedAESKey);
        // Decrypt the AES key with Client B's private key
        aesKey = decryptWithPrivateKey(encryptedAESKey, clientBPrivateKey);
        console.log("Received and decrypted AES key:", aesKey.toString("hex"));
        const endTime = performance.now(); // End measuring time
        console.log(`Time taken to receive and decrypt AES key: ${(endTime - startTime).toFixed(3)} ms`);
    } catch (error) {
        console.error("Error decrypting AES key:", error);
    }
});

socket.on("receiveMessage", ({ encryptedMessage, iv, authTag }) => {
    console.log("Client B received encrypted message.");
    // console.log("Encrypted message:", encryptedMessage);
    // console.log("IV:", iv.toString('hex'));
    // console.log("Auth Tag:", authTag);
    const messageStartTime = performance.now();
    try {
        const decryptedMessage = decryptMessage(aesKey, iv, encryptedMessage, authTag);
        const messageEndTime = performance.now();
        console.log(`Decrypted message: ${decryptedMessage}`);
        console.log(`Time taken to decrypt message: ${(messageEndTime - messageStartTime).toFixed(3)} ms`);
    } catch (error) {
        console.error("Error decrypting message:", error);
    }
});

console.log(process.env.TOKEN);
