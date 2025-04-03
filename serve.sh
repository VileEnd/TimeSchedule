#!/bin/bash

# Set the OpenSSL legacy provider option
export NODE_OPTIONS=--openssl-legacy-provider

# Run the serve.js script
echo "Starting server with legacy OpenSSL provider..."
node serve.js