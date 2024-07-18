// IMPORRTS
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const cors = require("cors");
const sirv = require("sirv");
const fs = require("fs");
const crypto = require("crypto");
const { performance } = require('perf_hooks');

// ENVIRONMENT VARIABLES
const PORT = process.env.PORT || 3030;
const DEV = process.env.NODE_ENV === "development";

// SETUP SERVERS
const app = express();
app.use(express.json(), cors());
const server = http.createServer(app);
const io = socketio(server, { cors: {} });

// Load server's RSA key    pair
const serverPrivateKey = fs.readFileSync("server_private.pem", "utf8");
const serverPublicKey = fs.readFileSync("server_public.pem", "utf8");

// Load clients' public keys
const clientAPublicKey = fs.readFileSync("../client_A/client_a_public.pem", "utf8");
const clientBPublicKey = fs.readFileSync("../client_B/client_b_public.pem", "utf8");

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

// Function to encrypt AES key with RSA public key
function encryptWithPublicKey(aesKey, publicKey) {
    return crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        Buffer.from(aesKey)
    ).toString("base64");
}

// Messaging logic
io.on("connection", (socket) => {
    console.log("User connected with id", socket.id);
    socket.on("sendAESKey", (encryptedAESKey) => {
        try {
            const startTime = performance.now();

            // Decrypt the AES key with server's private key and save it in environment variable
            const aesKey = decryptWithPrivateKey(encryptedAESKey, serverPrivateKey);
            console.log("Decrypted AES key: ",aesKey.toString("hex"));

            // Encrypt the AES key with Client B's public key
            const encryptedAESKeyForClientB = encryptWithPublicKey(aesKey, clientBPublicKey);
            // console.log("Encrypted AES key for Client B:", encryptedAESKeyForClientB);
            
            // Send the encrypted AES key to Client B
            socket.broadcast.emit("receiveAESKey", encryptedAESKeyForClientB);

            const endTime = performance.now(); 
            console.log(`Time taken for key exchange: ${(endTime - startTime).toFixed(3)} ms`);
        } catch (error) {
            console.error("Error decrypting or encrypting AES key:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log(socket.id, "has disconnected");
    });
});

// SERVE STATIC FILES
app.use(sirv("public", { DEV }));

// RUN APP
server.listen(PORT, console.log(`Listening on PORT ${PORT}`));