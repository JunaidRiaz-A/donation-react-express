const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const dotenv = require("dotenv");
dotenv.config();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Acts of Sharing API",
      version: "1.0.0",
      description: "API documentation for Acts of Sharing backend",
    },
    servers: [
      {
        url: process.env.backend_url + "/api", 
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        xAuthToken: {
          type: "apiKey",
          in: "header",
          name: "x-auth-token",
          description: "Custom header for passing JWT token",
        },
      },
    },
    security: [{ xAuthToken: [] }], 
  },
apis: [
  "./src/services/user-service/routes/*.js",
  "./src/services/event-service/routes/*.js",
  "./src/services/story-service/routes/*.js",
  "./src/services/contribution-service/routes/*.js",
  "./src/services/contact-service/routes/*.js", 
  "./src/services/request-assistance-service/routes/*.js",
],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerUi, swaggerSpec };
