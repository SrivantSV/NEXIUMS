export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Execution limits
  maxExecutionTime: parseInt(process.env.MAX_EXECUTION_TIME || '30000', 10),
  maxMemory: parseInt(process.env.MAX_MEMORY || '512', 10), // MB
  maxCPU: parseFloat(process.env.MAX_CPU || '1.0'),
  maxOutputSize: 1024 * 1024, // 1MB

  // Docker
  dockerSocket: process.env.DOCKER_SOCKET || '/var/run/docker.sock',

  // Allowed modules/libraries
  allowedNodeModules: [
    'lodash',
    'moment',
    'date-fns',
    'uuid',
    'axios',
    'crypto',
    'util',
    'path',
    'url',
    'querystring'
  ],

  allowedPythonLibraries: [
    'numpy',
    'pandas',
    'matplotlib',
    'seaborn',
    'scikit-learn',
    'requests',
    'json',
    'csv',
    'datetime',
    'math',
    'random',
    're'
  ]
};
