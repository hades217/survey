# AWS EC2纯Docker部署指南

## 502错误解决方案

当前问题：Jenkins部署成功，但通过域名访问出现502错误。

### 配置说明

本项目采用**纯Docker部署**，不使用nginx反向代理：

- Docker容器直接监听80端口
- 简化架构，减少故障点
- 无需nginx配置

### 原因分析

1. **端口映射问题**：Docker容器需要将内部5050端口映射到外部80端口
2. **EC2安全组配置**：需要开放80端口
3. **端口冲突**：可能有其他服务占用80端口
4. **DNS配置**：域名需要正确指向EC2公网IP

### 解决步骤

#### 1. 更新EC2安全组

确保EC2实例的安全组开放以下端口：

```
入站规则：
- HTTP: TCP 80 来源 0.0.0.0/0
- HTTPS: TCP 443 来源 0.0.0.0/0 (如果使用SSL)
- SSH: TCP 22 来源 您的IP（用于管理）
```

#### 2. 确保使用正确的Docker配置

使用`docker-compose.aws.yml`确保端口映射到80：

```yaml
services:
    app:
        ports:
            - '80:5050' # 关键配置：外部80端口映射到内部5050
```

#### 3. 验证DNS配置

确保域名正确指向EC2实例：

```bash
# 检查DNS解析
nslookup survey.jiangren.com.au
# 应该返回您的EC2公网IP
```

### 快速修复

#### 一键修复脚本

```bash
./fix-aws-502.sh
```

该脚本会自动：

- 停止任何冲突的nginx服务
- 清理80端口占用
- 使用正确的Docker配置重新部署
- 测试服务状态

#### 诊断问题

```bash
./diagnose-502.sh
```

快速诊断可能的问题原因。

### 验证步骤

1. **SSH到EC2实例验证**：

    ```bash
    # 检查容器运行状态
    docker ps

    # 测试本地访问
    curl http://localhost:80
    curl http://localhost:80/api/surveys
    ```

2. **检查Docker日志**：

    ```bash
    docker logs survey-app-1
    ```

3. **检查端口监听**：
    ```bash
    sudo netstat -tlnp | grep :80
    ```

### 常见问题解决

#### 问题1：nginx冲突

如果EC2上安装了nginx并且在运行：

```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
```

#### 问题2：端口被占用

查看80端口占用：

```bash
sudo netstat -tlnp | grep :80
sudo fuser -k 80/tcp  # 强制释放端口
```

#### 问题3：Docker端口映射错误

确保使用AWS配置：

```bash
docker-compose -f docker-compose.aws.yml down
docker-compose -f docker-compose.aws.yml up -d
```

### 生产环境配置

#### 环境变量配置

在EC2上设置环境变量或使用.env文件：

```env
MONGODB_URI=mongodb://mongodb:27017/survey
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

#### SSL证书（可选）

如果需要HTTPS，可以使用Cloudflare或AWS Certificate Manager在负载均衡器层处理SSL。

### 故障排查清单

- ✅ EC2安全组开放80端口
- ✅ 域名DNS指向EC2公网IP
- ✅ Docker容器正常运行并映射到80端口
- ✅ 没有nginx或其他服务占用80端口
- ✅ 应用正常启动（检查Docker日志）

### 监控和日志

#### 实时监控

```bash
# 查看容器状态
docker ps

# 查看实时日志
docker-compose -f docker-compose.aws.yml logs -f

# 查看系统资源
htop
```

#### 日志管理

Docker自动管理日志轮转，配置在docker-compose.yml中：

```yaml
logging:
    driver: 'json-file'
    options:
        max-size: '10m'
        max-file: '3'
```

### 紧急联系

如果问题持续，请检查：

1. AWS控制台中的EC2实例状态
2. EC2安全组配置
3. Route53或DNS提供商的解析记录
4. EC2实例的公网IP是否正确
