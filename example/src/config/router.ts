/**
 * 路由配置文件
 * 包含路由前缀、载荷解析、协议特定扩展配置
 */
export default {
  // 路由前缀
  prefix: '/api',
  
  // 支持的 HTTP 方法
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  
  // 路由路径
  routerPath: '',
  
  // 是否大小写敏感
  sensitive: false,
  
  // 是否严格匹配
  strict: false,
  
  // 载荷解析选项
  payload: {
    // 支持的 Content-Type
    extTypes: {
      json: ['application/json'],
      form: ['application/x-www-form-urlencoded'],
      text: ['text/plain'],
      grpc: ['application/grpc'],
      graphql: ['application/graphql+json'],
      websocket: ['application/websocket']
    },
    // 最大请求体大小
    limit: '20mb',
    // 编码
    encoding: 'utf-8',
    // 是否启用 multipart 解析（文件上传）
    multipart: true,
    // 文件上传配置
    formidable: {
      uploadDir: '${APP_PATH}/uploads',
      keepExtensions: true,
      maxFieldsSize: 10 * 1024 * 1024 // 10MB
    }
  },
  
  // 协议特定扩展配置
  ext: {
    // HTTP 协议配置（无特殊配置）
    http: {},
    
    // gRPC 协议配置
    grpc: {
      // gRPC proto 文件路径
      protoFile: './resource/proto/hello.proto',
      // 连接池大小
      poolSize: 10,
      // 批处理大小
      batchSize: 10,
      // 流配置
      streamConfig: {
        // 最大并发流数量
        maxConcurrentStreams: 50,
        // 流超时时间(ms)
        streamTimeout: 60000,
        // 背压阈值(字节)
        backpressureThreshold: 2048
      },
      // 是否启用反射
      enableReflection: true
    },
    
    // WebSocket 协议配置
    ws: {
      // 最大分帧大小(字节)
      maxFrameSize: 1024 * 1024, // 1MB
      // 心跳检测间隔(ms)
      heartbeatInterval: 15000,
      // 心跳超时时间(ms)
      heartbeatTimeout: 30000,
      // 最大连接数
      maxConnections: 1000,
      // 最大缓冲区大小(字节)
      maxBufferSize: 10 * 1024 * 1024 // 10MB
    },
    
    // GraphQL 协议配置（可选）
    graphql: {
      // GraphQL Schema 文件路径
      schemaFile: './resource/graphql/schema.graphql',
      // 启用 GraphQL Playground
      playground: true,
      // 启用内省查询
      introspection: true,
      // 调试模式
      debug: false,
      // 查询深度限制
      depthLimit: 10,
      // 查询复杂度限制
      complexityLimit: 1000
    }
  }
};
