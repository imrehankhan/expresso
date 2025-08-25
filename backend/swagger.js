const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UnDoubt API',
      version: '1.0.0',
      description: 'A real-time doubt/question management platform for educational environments',
      contact: {
        name: 'UnDoubt Team',
        email: 'support@undoubt.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://undoubt-backend.onrender.com',
        description: 'Production server'
      }
    ],
    components: {
      schemas: {
        Room: {
          type: 'object',
          required: ['roomId', 'topic', 'createdBy'],
          properties: {
            roomId: {
              type: 'string',
              description: 'Unique identifier for the room',
              example: '12345'
            },
            topic: {
              type: 'string',
              description: 'Topic or subject of the room',
              example: 'React.js Fundamentals'
            },
            createdBy: {
              type: 'string',
              description: 'User ID of the room creator',
              example: 'user123'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Room creation timestamp'
            }
          }
        },
        Doubt: {
          type: 'object',
          required: ['roomId', 'text', 'user'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the doubt',
              example: 'doubt123'
            },
            roomId: {
              type: 'string',
              description: 'ID of the room where doubt was asked',
              example: '12345'
            },
            text: {
              type: 'string',
              description: 'The question or doubt text',
              example: 'What is the difference between useState and useEffect?'
            },
            user: {
              type: 'string',
              description: 'Name or email of the user who asked',
              example: 'john@example.com'
            },
            userId: {
              type: 'string',
              description: 'Unique user identifier',
              example: 'user123'
            },
            upvotes: {
              type: 'integer',
              description: 'Number of upvotes received',
              example: 5
            },
            upvotedBy: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of user IDs who upvoted'
            },
            answered: {
              type: 'boolean',
              description: 'Whether the doubt has been answered',
              example: false
            },
            answeredAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when doubt was marked as answered'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Doubt creation timestamp'
            }
          }
        },
        User: {
          type: 'object',
          required: ['userId', 'email', 'displayName'],
          properties: {
            userId: {
              type: 'string',
              description: 'Unique user identifier',
              example: 'user123'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com'
            },
            displayName: {
              type: 'string',
              description: 'User display name',
              example: 'John Doe'
            },
            questionsAsked: {
              type: 'integer',
              description: 'Total number of questions asked',
              example: 15
            },
            roomsJoined: {
              type: 'integer',
              description: 'Total number of rooms joined',
              example: 8
            },
            upvotesReceived: {
              type: 'integer',
              description: 'Total upvotes received on questions',
              example: 42
            },
            timeSpent: {
              type: 'integer',
              description: 'Total time spent in minutes',
              example: 1200
            },
            streak: {
              type: 'integer',
              description: 'Current activity streak',
              example: 7
            },
            joinedRooms: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  roomId: { type: 'string' },
                  joinedAt: { type: 'string', format: 'date-time' },
                  role: { type: 'string', enum: ['host', 'participant'] },
                  lastVisited: { type: 'string', format: 'date-time' }
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User registration timestamp'
            },
            lastActive: {
              type: 'string',
              format: 'date-time',
              description: 'Last activity timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Resource not found'
            },
            error: {
              type: 'string',
              description: 'Detailed error information'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Operation completed successfully'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Rooms',
        description: 'Room management operations'
      },
      {
        name: 'Doubts',
        description: 'Question/doubt management operations'
      },
      {
        name: 'Users',
        description: 'User management and statistics'
      },
      {
        name: 'Statistics',
        description: 'Platform statistics and analytics'
      },
      {
        name: 'Debug',
        description: 'Debug and testing endpoints'
      }
    ]
  },
  apis: ['./routes/*.js'], // Path to the API files
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
