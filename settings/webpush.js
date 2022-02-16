const webpush = require("web-push");
const { PUBLIC_NOTIFY_KEY, PRIVATE_NOTIFY_KEY } = process.env;

webpush.setVapidDetails(
  "mailto:test@faztweb.com",
  PUBLIC_NOTIFY_KEY,
  PRIVATE_NOTIFY_KEY
);

module.exports = webpush;