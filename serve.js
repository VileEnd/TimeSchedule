#!/usr/bin/env node

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name from the current file URL
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const BUILD_DIR = join(__dirname, 'build');

// Map file extensions to MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Create a basic HTTP server
const server = createServer(async (req, res) => {
  try {
    console.log(`Requested: ${req.url}`);
    
    // Parse the URL path
    let filePath = req.url;
    
    // Serve index.html for the root path and any path that doesn't match a file
    if (filePath === '/' || !extname(filePath)) {
      filePath = '/index.html';
    }
    
    // Create absolute file path
    const absolutePath = join(BUILD_DIR, filePath);
    
    // Determine the content type based on file extension
    const ext = extname(absolutePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Read file and send response
    const content = await readFile(absolutePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
    
  } catch (err) {
    // Handle errors
    console.error(`Error serving ${req.url}: ${err.message}`);
    
    if (err.code === 'ENOENT') {
      // If file not found, try serving index.html for SPA routing
      try {
        const content = await readFile(join(BUILD_DIR, '/index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
      } catch (indexErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found', 'utf-8');
      }
    } else {
      // For other errors, return 500
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error', 'utf-8');
    }
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Serving content from ${BUILD_DIR}`);
  console.log('Press Ctrl+C to stop');
});