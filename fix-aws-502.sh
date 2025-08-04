#!/bin/bash

# AWS 502错误快速修复脚本
# 用于紧急修复部署后的502错误

echo "🔧 开始修复AWS 502错误..."

# 停止现有容器
echo "📦 停止现有容器..."
docker-compose -f docker-compose.prod.yml down || true
docker-compose -f docker-compose.aws.yml down || true

# 清理旧镜像
echo "🧹 清理旧镜像..."
docker images | grep survey | awk '{print $3}' | xargs -r docker rmi -f || true

# 检查是否有AWS配置文件
if [ -f "docker-compose.aws.yml" ]; then
    echo "✅ 使用AWS专用配置..."
    COMPOSE_FILE="docker-compose.aws.yml"
else
    echo "⚠️  未找到AWS配置，修改标准配置..."
    # 复制并修改标准配置
    cp docker-compose.prod.yml docker-compose.aws.yml
    # 修改端口映射为80:5050
    sed -i 's/5050:5050/80:5050/g' docker-compose.aws.yml
    COMPOSE_FILE="docker-compose.aws.yml"
fi

# 启动服务
echo "🚀 启动服务..."
docker-compose -f $COMPOSE_FILE up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 15

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose -f $COMPOSE_FILE ps

# 测试服务
echo "🧪 测试服务..."
if curl -f http://localhost:80 2>/dev/null; then
    echo "✅ 服务在80端口正常运行"
    PORT=80
elif curl -f http://localhost:5050 2>/dev/null; then
    echo "✅ 服务在5050端口正常运行"
    PORT=5050
else
    echo "❌ 服务未能正常启动"
    echo "查看日志："
    docker-compose -f $COMPOSE_FILE logs --tail=50
    exit 1
fi

# 测试API
echo "🔍 测试API端点..."
curl -f http://localhost:$PORT/api/surveys && echo " ✅ API正常"

# 显示访问信息
echo ""
echo "✅ 修复完成！"
echo "📌 访问地址："
echo "  - 本地: http://localhost:$PORT"
echo "  - 域名: https://survey.jiangren.com.au"
echo ""
echo "📝 查看日志: docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo "⚠️  注意事项："
echo "1. 确保AWS安全组已开放相应端口"
echo "2. 确保ALB/ELB目标组指向正确端口"
echo "3. 如果使用nginx反向代理，确保配置正确"