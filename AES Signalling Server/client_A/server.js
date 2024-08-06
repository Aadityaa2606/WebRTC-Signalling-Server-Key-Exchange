const crypto = require("crypto");
const fs = require("fs");
const io = require("socket.io-client");
const { performance } = require('perf_hooks');

// Load Server's Public Key
const serverPublicKey = fs.readFileSync("../server/server_public.pem", "utf8");

// Function to generate an AES key
function generateAESKey() {
  return crypto.randomBytes(32); // 256-bit key
}

function encryptWithPublicKey(aesKey, publicKey) {
    return crypto
      .publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        aesKey
      )
      .toString("base64");
}

function encryptMessage(aesKey, iv, message) {
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return {
        encryptedMessage: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag
    };
}

// Generate the AES key and encrypt it
const aesKey = generateAESKey();

const encryptedAESKey = encryptWithPublicKey(aesKey, serverPublicKey);

// Connect to the signaling server
const socket = io(process.env.SIGNALING_SERVER_URL || "http://localhost:3030");

socket.on("connect", () => {
  console.log("Connected to the server");
  const startTime = performance.now();
  // Send the encrypted AES key to the server
  socket.emit("sendAESKey", encryptedAESKey, () => {
    const endTime = performance.now();
    console.log(`Time taken to send AES key: ${(endTime - startTime).toFixed(3)} ms`);
  });
  console.log("Sent AES key to the server: ", aesKey.toString("hex"));

    // Example message
    const message = `lorem ipsum dolor sit amet, consectetur adipiscing elit Nullam 
    auctor, nunc id aliquam lacinia, velit nunc tincidunt urna, nec molestie risus n
    isl et nunc. Sed id semper nisl. Fusce auctor, ligula  ligula vitae finibus tinc
    idunt, mauris justo efficitur nunc, nec ultrices nunc lectus a justo.";vitae finibus
     tincidunt, mauris justo efficitur nunc, nec ultrices nunc lectus a justo.`;
    const iv = crypto.randomBytes(16);
    const { encryptedMessage, authTag } = encryptMessage(aesKey, iv, message);
    // console.log("Encrypted message:", encryptedMessage);
    // console.log("IV:", iv.toString('hex'));
    // console.log("Auth Tag:", authTag);
    const messageStartTime = performance.now();
    socket.emit("sendMessage", { encryptedMessage, iv: iv.toString('hex'), authTag: authTag }, () => {
        const messageEndTime = performance.now();
        console.log(`Time taken to send message: ${(messageEndTime - messageStartTime).toFixed(3)} ms`);
    });
});

