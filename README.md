# Key Exchange using AES and Crystal-Kyber

This repo demonstrates key exchange mechanisms using AES and Crystal-Kyber algorithms. The setup involves two clients and one server for both key exchange methods.

## Prerequisites

- Node.js installed on your machine
- `openssl` installed for generating RSA keys

## AES Key Exchange

1. **Client A** generates a shared AES key.
2. **Client A** encrypts the AES key using the server's public RSA key.
3. **Client A** sends the encrypted AES key to the server.
4. **Server** decrypts the AES key using its private RSA key.
5. **Server** encrypts the AES key using **Client B**'s public RSA key.
6. **Server** sends the encrypted AES key to **Client B**.
7. **Client B** decrypts the AES key using its private RSA key.

## Crystal-Kyber Key Exchange

1. **Client A** generates a Crystal-Kyber public-private key pair and a shared symmetric key.
2. **Client A** encrypts the shared symmetric key using the server's Crystal-Kyber public key.
3. **Client A** sends the encrypted symmetric key to the server.
4. **Server** decrypts the symmetric key using its private Crystal-Kyber key.
5. **Server** encrypts the symmetric key using **Client B**'s Crystal-Kyber public key.
6. **Server** sends the encrypted symmetric key to **Client B**.
7. **Client B** decrypts the symmetric key using its private Crystal-Kyber key.

## Project Structure
    .
    ├── server
    │ ├── server.js
    │ ├── server_private.pem
    │ ├── server_public.pem
    │ └── .env
    ├── client_A
    │ ├── server.js
    │ ├── client_a_private.pem
    │ ├── client_a_public.pem
    │ ├── shared_secret.pem
    │ └── .env
    └── client_B
    ├── server.js
    ├── client_b_private.pem
    ├── client_b_public.pem
    └── shared_secret.pem


## Installation

1. Clone the repository
2. Navigate to each directory (`server`, `client_A`, `client_B`) and install dependencies:

```sh
cd server
npm install

cd ../client_A
npm install

cd ../client_B
npm install
```

## Key Generation

Generate RSA key pairs for the server and clients:

```sh
# Generate RSA key pair for the server
openssl genrsa -out server/server_private.pem 2048
openssl rsa -in server/server_private.pem -outform PEM -pubout -out server/server_public.pem

# Generate RSA key pair for Client A
openssl genrsa -out client_A/client_a_private.pem 2048
openssl rsa -in client_A/client_a_private.pem -outform PEM -pubout -out client_A/client_a_public.pem

# Generate RSA key pair for Client B
openssl genrsa -out client_B/client_b_private.pem 2048
openssl rsa -in client_B/client_b_private.pem -outform PEM -pubout -out client_B/client_b_public.pem
```

## Running the Project
### 1. Start the server:

```sh
cd server
npm run dev
```
### 2. Start Client A:

```sh
cd ../client_A
npm run dev
```
### 3. Start Client B:

```sh
cd ../client_B
npm run dev
```
## Measuring Key Exchange Time

The server logs the time taken to perform the key exchange in milliseconds for both AES and Crystal-Kyber key exchanges.