const fs = require("fs");
const path = require("path");

// Path to the log file
const logFile = path.join(__dirname, "../../logs/app.log");

// Ensure the logs directory exists
if (!fs.existsSync(path.dirname(logFile))) {
  fs.mkdirSync(path.dirname(logFile));
}

// Simple function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  
  // Append to log file
  fs.appendFileSync(logFile, logMessage, (err) => {
    if (err) console.error("Failed to write to log file:", err);
  });
  
  // Also log to console for development
  console.log(logMessage.trim());
}

module.exports = { log };