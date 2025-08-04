# AWS部署配置指南

## 502错误解决方案

当前问题：Jenkins部署成功，但通过域名访问出现502错误。

### 原因分析

1. **端口不匹配**：应用现在运行在5050端口，但AWS的负载均衡器/反向代理可能仍指向80端口
2. **健康检查失败**：ALB/ELB的健康检查可能配置错误
3. **安全组规则**：EC2实例的安全组可能未开放5050端口

### 解决步骤

#### 1. 更新EC2安全组

确保EC2实例的安全组允许5050端口：

```
入站规则：
- Type: Custom TCP
- Protocol: TCP
- Port Range: 5050
- Source: 负载均衡器的安全组ID 或 0.0.0.0/0（如果直接访问）
```

#### 2. 更新负载均衡器目标组

如果使用ALB/ELB：

```
目标组配置：
- Protocol: HTTP
- Port: 5050
- Health check path: /api/surveys
- Health check interval: 30 seconds
- Healthy threshold: 2
- Unhealthy threshold: 3
```

#### 3. 更新nginx反向代理（如果使用）

如果在EC2上有nginx作为反向代理：

```nginx
server {
    listen 80;
    server_name survey.jiangren.com.au;

    location / {
        proxy_pass http://localhost:5050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. 使用Docker端口映射（临时方案）

修改docker-compose.prod.yml，将5050映射到80：

```yaml
    app:
        ports:
            - '80:5050'  # 将内部5050端口映射到主机80端口
```

### 验证步骤

1. **SSH到EC2实例验证**：
   ```bash
   # 检查容器运行状态
   docker ps
   
   # 测试本地访问
   curl http://localhost:5050
   curl http://localhost:5050/api/surveys
   ```

2. **检查Docker日志**：
   ```bash
   docker logs survey-app-1
   ```

3. **检查负载均衡器健康状态**：
   - 在AWS控制台查看Target Health
   - 确认实例显示为"healthy"

### 推荐的生产配置

为了更好地适应AWS环境，建议创建专门的AWS配置：

1. **使用环境变量配置端口**
2. **配置合适的健康检查端点**
3. **使用AWS Systems Manager参数存储管理敏感配置**

### Jenkins配置更新建议

在Jenkinsfile中添加AWS特定的配置：

```groovy
// 检查是否在AWS环境
if (env.AWS_REGION) {
    // 使用80端口以兼容ALB
    sh 'sed -i "s/5050:5050/80:5050/g" docker-compose.prod.yml'
}
```

### 紧急修复脚本

如果需要快速修复，可以在EC2上运行：

```bash
#!/bin/bash
# 快速修复502错误

# 停止现有容器
docker-compose -f docker-compose.prod.yml down

# 修改端口映射
sed -i 's/5050:5050/80:5050/g' docker-compose.prod.yml

# 重新启动
docker-compose -f docker-compose.prod.yml up -d

# 验证
sleep 10
curl http://localhost
```

### 联系支持

如果问题持续，请检查：
1. CloudWatch日志
2. ALB访问日志
3. EC2系统日志