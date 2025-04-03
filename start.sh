#!/bin/bash

# Set the OpenSSL legacy provider option
export NODE_OPTIONS=--openssl-legacy-provider

# Run the app
echo "Starting React app with legacy OpenSSL provider..."
npx react-scripts start