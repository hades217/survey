#!/bin/bash

# AWS EC2 502错误修复脚本
# 纯Docker部署模式，不使用nginx

echo "🔧 开始修复AWS EC2 502错误..."

# 检查是否在EC2上运行
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "📍 操作系统: $NAME $VERSION"
fi

# 停止可能冲突的nginx服务
if command -v nginx &> /dev/null && sudo systemctl is-active nginx &>/dev/null; then
    echo "⏸️  停止nginx服务（本项目不需要nginx）..."
    sudo systemctl stop nginx
    sudo systemctl disable nginx
fi

# 清理80端口占用
echo "🧹 清理80端口占用..."
sudo fuser -k 80/tcp 2>/dev/null || true

# 停止现有容器
echo "📦 停止现有容器..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.aws.yml down 2>/dev/null || true

# 清理旧镜像
echo "🧹 清理旧镜像..."
docker images | grep survey | awk '{print $3}' | xargs -r docker rmi -f || true

# 确保使用AWS配置（80端口映射）
echo "📝 使用AWS配置（80端口直接映射）..."
if [ ! -f "docker-compose.aws.yml" ]; then
    echo "⚠️  创建AWS配置文件..."
    cp docker-compose.prod.yml docker-compose.aws.yml
    sed -i 's/\${PORT:-5050}:\${PORT:-5050}/80:5050/g' docker-compose.aws.yml
fi

COMPOSE_FILE="docker-compose.aws.yml"

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
if curl -f -s http://localhost:80 > /dev/null; then
    echo "✅ 服务正常运行在80端口"
    
    # 测试API
    if curl -f -s http://localhost:80/api/surveys > /dev/null; then
        echo "✅ API端点正常"
    else
        echo "⚠️  API端点可能有问题"
    fi
else
    echo "❌ 服务未能正常启动"
    echo ""
    echo "📋 Docker日志："
    docker-compose -f $COMPOSE_FILE logs --tail=30
fi

# 显示访问信息
echo ""
echo "🎯 修复完成！"
echo ""
echo "📌 访问信息："
echo "  本地测试: http://localhost:80"
echo "  域名访问: http://survey.jiangren.com.au"
echo ""
echo "📝 常用命令："
echo "  查看日志: docker-compose -f $COMPOSE_FILE logs -f"
echo "  重启服务: docker-compose -f $COMPOSE_FILE restart"
echo "  停止服务: docker-compose -f $COMPOSE_FILE down"
echo ""
echo "⚠️  确保以下配置正确："
echo "  1. EC2安全组已开放80端口（HTTP）"
echo "  2. EC2安全组已开放443端口（HTTPS，如需要）"
echo "  3. 域名DNS正确指向EC2实例的公网IP"
echo "  4. EC2实例具有公网IP或弹性IP"
echo ""
echo "🔍 如果仍有问题，运行: ./diagnose-502.sh"