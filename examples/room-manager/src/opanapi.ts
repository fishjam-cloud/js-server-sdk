export const openapi = {
  openapi: '3.0.0',
  info: {
    title: 'Room manager',
    version: '0.1.0'
  },
  servers: [
    {
      url: 'http://localhost:5004',
      description: 'Development server'
    }
  ],
  tags: [
    { name: 'user', description: 'User related end-points' },
    { name: 'code', description: 'Code related end-points' }
  ]
}
