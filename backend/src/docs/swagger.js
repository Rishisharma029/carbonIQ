import swaggerJSDoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'CarbonIQ API',
      version: '1.0.0',
      description:
        'Production REST API for the CarbonIQ carbon footprint calculation and reduction tracking platform.',
      contact: {
        name: 'CarbonIQ Engineering',
        email: 'support@carboniq.com',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
      {
        url: 'https://api.carboniq.com',
        description: 'Production Server',
      },
    ],
    tags: [
      { name: 'Health', description: 'Service liveness and readiness probes' },
      { name: 'Auth', description: 'User registration, login, and token management' },
      { name: 'Users', description: 'User profile and settings management' },
      { name: 'Calculator', description: 'Carbon footprint calculation engine' },
      { name: 'Dashboard', description: 'Aggregated user metrics and monthly summaries' },
      { name: 'History', description: 'Paginated calculation history with filters' },
      { name: 'Goals', description: 'Carbon reduction goal tracking' },
      { name: 'Reports', description: 'PDF and CSV export endpoints' },
      { name: 'Recommendations', description: 'Actionable carbon reduction recommendations catalog' },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
          description: 'JWT token stored in HTTP-only cookie. Set automatically on login.',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'fail' },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
}

export const swaggerSpec = swaggerJSDoc(options)
export default swaggerSpec
