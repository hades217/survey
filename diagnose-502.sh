#!/bin/bash

# 502错误诊断脚本
# 纯Docker部署模式诊断

echo "🔍 开始诊断502错误..."
echo "=========================="

# 1. 检查Docker容器状态
echo ""
echo "1️⃣ Docker容器状态:"
echo "-------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAMES|survey)" || echo "❌ 没有找到survey相关容器"

# 2. 检查端口监听状态
echo ""
echo "2️⃣ 端口监听状态:"
echo "----------------"
echo "80端口:"
sudo netstat -tlnp | grep :80 || echo "❌ 80端口未被监听"
echo ""
echo "5050端口:"
sudo netstat -tlnp | grep :5050 || echo "❌ 5050端口未被监听"

# 3. 检查是否有nginx干扰（不应该有）
echo ""
echo "3️⃣ Nginx检查（应该没有）:"
echo "----------------------"
if command -v nginx &> /dev/null; then
    echo -n "⚠️  检测到nginx安装，状态: "
    sudo systemctl is-active nginx || echo "未运行（正确）"
    
    if sudo systemctl is-active nginx &>/dev/null; then
        echo "❌ nginx正在运行！需要停止，因为本项目不使用nginx"
    fi
else
    echo "✅ 未安装nginx（正确）"
fi

# 4. 测试本地访问
echo ""
echo "4️⃣ 本地访问测试:"
echo "---------------"
echo -n "localhost:80 - "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 2>/dev/null || echo "failed")
echo "$HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 本地80端口访问正常"
elif [ "$HTTP_CODE" = "failed" ]; then
    echo "❌ 无法连接到80端口"
else
    echo "⚠️  返回状态码: $HTTP_CODE"
fi

# 5. 检查Docker日志
echo ""
echo "5️⃣ Docker容器日志（最后10行）:"
echo "-----------------------------"
if docker ps | grep -q survey-app; then
    docker logs survey-app-1 --tail 10 2>&1
else
    echo "❌ survey-app容器未运行"
fi

# 6. 检查端口冲突
echo ""
echo "6️⃣ 端口冲突检查:"
echo "---------------"
PORT_80_PROCESS=$(sudo netstat -tlnp | grep :80 | head -1)
if [ ! -z "$PORT_80_PROCESS" ]; then
    echo "80端口被占用: $PORT_80_PROCESS"
    if echo "$PORT_80_PROCESS" | grep -q docker; then
        echo "✅ 被Docker占用（正确）"
    else
        echo "❌ 被其他进程占用，需要停止"
    fi
else
    echo "❌ 80端口未被占用"
fi

# 7. EC2配置检查清单
echo ""
echo "7️⃣ EC2配置检查清单:"
echo "-------------------"
echo "请手动确认以下配置："
echo "[ ] EC2安全组允许80端口入站流量（来源：0.0.0.0/0）"
echo "[ ] EC2安全组允许443端口入站流量（如果使用HTTPS）"
echo "[ ] 域名DNS正确指向EC2实例的公网IP"
echo "[ ] EC2实例具有公网IP或弹性IP地址"

# 8. 可能的原因和解决方案
echo ""
echo "8️⃣ 问题诊断和解决方案:"
echo "--------------------"

# 检查是否有容器在运行
if ! docker ps | grep -q survey; then
    echo "❌ 问题: Docker容器未运行"
    echo "   解决: 运行 ./fix-aws-502.sh"
fi

# 检查端口映射
if docker ps | grep -q survey && ! docker ps | grep survey | grep -q "80->"; then
    echo "❌ 问题: Docker容器未映射到80端口"
    echo "   解决: 使用docker-compose.aws.yml配置"
fi

# 检查nginx冲突
if command -v nginx &> /dev/null && sudo systemctl is-active nginx &>/dev/null; then
    echo "❌ 问题: nginx服务正在运行（与Docker冲突）"
    echo "   解决: sudo systemctl stop nginx && sudo systemctl disable nginx"
fi

# 如果Docker在运行但80端口无响应
if docker ps | grep -q survey && [ "$HTTP_CODE" != "200" ]; then
    echo "❌ 问题: Docker容器运行但80端口无响应"
    echo "   可能原因: 应用启动失败或端口映射错误"
    echo "   解决: 检查Docker日志，运行 ./fix-aws-502.sh"
fi

# 如果本地正常但外部无法访问
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 本地访问正常，502错误可能是由于："
    echo "   - EC2安全组未开放80端口"
    echo "   - DNS解析问题"
    echo "   - 网络配置问题"
fi

echo ""
echo "📝 推荐操作:"
echo "1. 首先运行: ./fix-aws-502.sh（一键修复）"
echo "2. 检查EC2安全组设置"
echo "3. 验证DNS解析: nslookup survey.jiangren.com.au"
echo "4. 查看详细日志: docker-compose -f docker-compose.aws.yml logs -f"