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

// Generate the AES key save it as TOKEN in environment varialbes and encrypt it
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
});
