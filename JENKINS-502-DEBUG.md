# Jenkins构建后502错误调试指南

## 当前状态

Jenkins构建完成，但访问 `survey.jiangren.com.au` 仍出现502错误。

## 可能的原因

### 1. Jenkins使用了错误的docker-compose配置
**问题**: Jenkins可能使用了`docker-compose.prod.yml`而不是`docker-compose.aws.yml`
**检查**: 查看Jenkins构建日志中的"Using AWS-specific configuration"信息

### 2. 端口映射不正确
**问题**: 应用运行在5050端口，但没有映射到80端口
**结果**: EC2内部可以访问localhost:5050，但外部无法通过80端口访问

### 3. EC2安全组配置
**问题**: 安全组可能没有开放80端口
**检查**: AWS控制台 → EC2 → 安全组 → 入站规则

### 4. nginx服务冲突
**问题**: EC2上可能有nginx在运行，占用了80端口
**结果**: Docker无法绑定到80端口

## 立即诊断步骤

### 第一步：SSH到EC2实例
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 第二步：运行诊断脚本
```bash
cd /path/to/survey
./jenkins-test.sh
```

### 第三步：检查关键信息
1. **容器状态**:
   ```bash
   docker ps | grep survey
   ```

2. **端口映射**:
   ```bash
   docker ps --format "table {{.Names}}\t{{.Ports}}"
   ```

3. **80端口占用**:
   ```bash
   sudo netstat -tlnp | grep :80
   ```

4. **本地测试**:
   ```bash
   curl -I http://localhost:80
   curl -I http://localhost:5050
   ```

## 快速修复方案

### 方案1：自动修复（推荐）
```bash
./fix-aws-502.sh
```

### 方案2：手动修复
```bash
# 停止可能的nginx冲突
sudo systemctl stop nginx 2>/dev/null || true

# 重新部署使用AWS配置
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.aws.yml up -d

# 测试
curl http://localhost:80
```

### 方案3：如果AWS配置文件不存在
```bash
# 创建AWS配置
cp docker-compose.prod.yml docker-compose.aws.yml
sed -i 's/\${PORT:-5050}:\${PORT:-5050}/80:5050/g' docker-compose.aws.yml

# 重新部署
docker-compose -f docker-compose.aws.yml up -d
```

## 验证修复

### 本地测试
```bash
curl -I http://localhost:80
# 应该返回: HTTP/1.1 200 OK
```

### API测试
```bash
curl http://localhost:80/api/surveys
# 应该返回: []
```

### 日志检查
```bash
docker logs survey-app-1 --tail 20
```

## 常见问题排查

### 问题1：容器未运行
**症状**: `docker ps`没有survey容器
**解决**: 
```bash
docker-compose -f docker-compose.aws.yml up -d
docker logs survey-app-1
```

### 问题2：端口映射错误
**症状**: 容器运行但端口栏显示`5050/tcp`而不是`0.0.0.0:80->5050/tcp`
**解决**: 使用正确的AWS配置文件

### 问题3：应用启动失败
**症状**: 容器存在但一直重启
**解决**: 检查环境变量和MongoDB连接
```bash
docker logs survey-app-1
```

### 问题4：nginx冲突
**症状**: 80端口被nginx占用
**解决**: 
```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
```

## Jenkins配置检查

确保Jenkinsfile中的健康检查使用正确端口：
- 如果使用AWS配置，应该测试`localhost:80`
- 构建日志应显示"Using AWS-specific configuration"

## EC2安全组检查

确保以下入站规则存在：
- Type: HTTP, Protocol: TCP, Port: 80, Source: 0.0.0.0/0
- Type: HTTPS, Protocol: TCP, Port: 443, Source: 0.0.0.0/0

## DNS验证

```bash
nslookup survey.jiangren.com.au
# 应该返回EC2实例的公网IP
```

## 最终验证

修复后，通过以下方式验证：
1. SSH内部测试: `curl http://localhost:80`
2. 外部访问: `http://survey.jiangren.com.au`
3. API测试: `http://survey.jiangren.com.au/api/surveys`

如果外部仍无法访问，问题可能在于EC2安全组或DNS配置。