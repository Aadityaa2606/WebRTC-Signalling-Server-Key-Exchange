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

// Connect to the signaling server
const socket = io(process.env.SIGNALING_SERVER_URL || "http://localhost:3030");

socket.on("connect", () => {
    console.log("Connected to the server");
});

socket.on("receiveAESKey", (encryptedAESKey) => {
    const startTime = performance.now();

    try {
        // Decrypt the AES key with Client B's private key
        aesKey = decryptWithPrivateKey(encryptedAESKey, clientBPrivateKey);
        console.log("Received and decrypted AES key:", aesKey.toString("hex"));
        const endTime = performance.now(); // End measuring time
        console.log(`Time taken to receive and decrypt AES key: ${(endTime - startTime).toFixed(3)} ms`);
    } catch (error) {
        console.error("Error decrypting AES key:", error);
    }
});

console.log(process.env.TOKEN);
