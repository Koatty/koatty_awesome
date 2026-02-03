/**
 * 服务器配置文件
 * 支持多协议：HTTP、gRPC、WebSocket、GraphQL
 */
export default {
  // 服务器主机名
  hostname: '127.0.0.1',
  
  // 端口配置：单值或数组
  // 如果是数组，每个端口对应相应的协议
  port: [3000, 50051, 3001],
  
  // 协议配置：支持 http, https, http2, grpc, ws, wss, graphql
  protocol: ['http', 'grpc', 'ws'],
  
  // 是否启用链路追踪
  trace: false,
  
  // SSL 配置（生产环境建议启用）
  ssl: {
    // 模式: 'auto' | 'manual' | 'mutual_tls'
    mode: 'auto',
    // SSL 密钥文件路径
    key: '',
    // SSL 证书文件路径
    cert: '',
    // CA 证书文件路径（双向认证时使用）
    ca: ''
  }
};
