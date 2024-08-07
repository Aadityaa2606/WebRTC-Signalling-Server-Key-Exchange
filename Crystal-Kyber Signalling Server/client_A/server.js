const fs = require("fs");
const io = require("socket.io-client");
const kyber = require("crystals-kyber");
const { performance } = require("perf_hooks");

// Generate Client A's Kyber key pair (if not already saved)
if (
  !fs.existsSync("client_a_public.pem") ||
  !fs.existsSync("client_a_private.pem")
) {
  let [clientAPublicKey, clientAPrivateKey] = kyber.KeyGen768();
  fs.writeFileSync(
    "client_a_public.pem",
    clientAPublicKey.toString("base64"),
    "utf8"
  );
  fs.writeFileSync(
    "client_a_private.pem",
    clientAPrivateKey.toString("base64"),
    "utf8"
  );
}

// Load Client A's Kyber key pair
const clientAPublicKey = Buffer.from(
  fs.readFileSync("client_a_public.pem", "utf8"),
  "base64"
);
const clientAPrivateKey = Buffer.from(
  fs.readFileSync("client_a_private.pem", "utf8"),
  "base64"
);

// Load Server's Public Key
const serverPublicKey = Buffer.from(
  fs.readFileSync("../server/server_public.pem", "utf8"),
  "base64"
);

// Connect to the signaling server
const socket = io("http://localhost:3030");

// Sending a message
const sendMessage = (message, callback) => {
  const messageStartTime = performance.now();
  const encryptedMessage = kyber.Encrypt768(
    serverPublicKey,
    Buffer.from(message, "utf8")
  );
  socket.emit("sendMessage", encryptedMessage, (error, response) => {
    if (error) {
      console.error("Error sending message:", error);
      callback(error);
    } else {
      const messageEndTime = performance.now();
      console.log(
        `Time taken to send message: ${(
          messageEndTime - messageStartTime
        ).toFixed(3)} ms`
      );
      callback(null, (messageEndTime - messageStartTime).toFixed(3)); // Return time for logging
    }
  });
};

socket.on("connect", () => {
  console.log("Connected to the server");

  // Generate shared secret and encrypt it with the server's public key
  let [encryptedSharedSecret, sharedSecret] = kyber.Encrypt768(serverPublicKey);
  console.log(
    `Generated and encrypted shared secret: ${sharedSecret.toString("hex")}`
  );

  // Measure time for sending the shared secret
  const startTime = performance.now();
  socket.emit("sendSharedSecret", encryptedSharedSecret, (error, timeTaken) => {
    const endTime = performance.now();
    if (error) {
      console.error("Error sending shared secret:", error);
    } else {
      console.log(`Time taken to send shared secret: ${timeTaken} ms`);
      callback(timeTaken);
    }
  });

  const message =
    `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. 
    Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor. Praesent et
    diam eget libero egestas mattis sit amet vitae augue. Nam tincidunt congue enim, ut porta lorem lacinia 
    consectetur. Donec ut libero sed arcu vehicula ultricies a non tortor. Lorem ipsum dolor sit amet, consectetur 
    adipiscing elit. Aenean ut gravida lorem. Ut turpis felis, pulvinar a semper sed, adipiscing id dolor. Pellentesque 
    auctor nisi id magna consequat sagittis. Curabitur dapibus enim sit amet elit pharetra tincidunt feugiat nisl imperdiet. 
    Ut convallis libero in urna ultrices accumsan. Donec sed odio eros. Donec viverra mi quis quam pulvinar at malesuada arcu 
    rhoncus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In rutrum accumsan ultricies. 
    Mauris vitae nisi at sem facilisis semper ac in est.`.repeat(messageLength);

  sendMessage(message, (error, timeTaken) => {
    if (error) {
      console.error("Error sending message:", error);
    } else {
      console.log(`Time taken to send and receive message: ${timeTaken} ms`);
      callback(null, timeTaken);
    }
  });
});
