#!/bin/bash

# Jenkins构建后测试脚本
# 用于验证部署是否成功

echo "🧪 开始Jenkins部署测试..."
echo "=========================="

# 1. 显示当前目录和文件
echo "📁 当前工作目录:"
pwd
echo ""
echo "📄 可用的docker-compose文件:"
ls -la docker-compose*.yml 2>/dev/null || echo "❌ 未找到docker-compose文件"

# 2. 检查容器状态
echo ""
echo "🐳 Docker容器状态:"
echo "----------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -10

# 3. 检查survey容器
echo ""
echo "🔍 Survey相关容器:"
echo "-----------------"
SURVEY_CONTAINERS=$(docker ps | grep survey || echo "无")
echo "$SURVEY_CONTAINERS"

# 4. 检查端口监听
echo ""
echo "🔌 端口监听状态:"
echo "---------------"
echo "80端口:"
sudo netstat -tlnp | grep :80 || echo "❌ 80端口未监听"
echo ""
echo "5050端口:"
sudo netstat -tlnp | grep :5050 || echo "❌ 5050端口未监听"

# 5. 测试本地访问
echo ""
echo "🌐 本地访问测试:"
echo "---------------"

# 测试80端口
echo -n "测试 localhost:80 - "
HTTP_80=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 2>/dev/null || echo "failed")
echo "$HTTP_80"

# 测试5050端口
echo -n "测试 localhost:5050 - "
HTTP_5050=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5050 2>/dev/null || echo "failed")
echo "$HTTP_5050"

# 6. 检查日志（如果容器存在）
echo ""
echo "📋 最新Docker日志:"
echo "----------------"
if docker ps | grep -q survey-app; then
    echo "survey-app-1 日志:"
    docker logs survey-app-1 --tail 5 2>&1
else
    echo "❌ survey-app容器未运行"
fi

# 7. 环境变量检查
echo ""
echo "🔧 环境配置检查:"
echo "---------------"
if [ -f ".env" ]; then
    echo "✅ .env文件存在"
    echo "环境变量内容:"
    cat .env | grep -v PASSWORD | head -5  # 不显示密码
else
    echo "❌ .env文件不存在"
fi

# 8. 诊断建议
echo ""
echo "🩺 诊断结果:"
echo "----------"

if [ "$HTTP_80" = "200" ]; then
    echo "✅ 应用在80端口正常运行"
    echo "   域名应该可以正常访问: http://survey.jiangren.com.au"
elif [ "$HTTP_5050" = "200" ]; then
    echo "⚠️  应用在5050端口运行，但80端口无响应"
    echo "   可能原因: docker-compose配置未正确映射端口"
    echo "   建议: 检查是否使用了docker-compose.aws.yml"
else
    echo "❌ 应用未正常运行"
    echo "   可能原因:"
    echo "   - Docker容器启动失败"
    echo "   - 端口映射配置错误"
    echo "   - 应用内部错误"
fi

# 检查nginx冲突
if command -v nginx &> /dev/null && sudo systemctl is-active nginx &>/dev/null; then
    echo "⚠️  检测到nginx正在运行，可能与Docker端口冲突"
    echo "   建议: sudo systemctl stop nginx"
fi

echo ""
echo "📝 下一步操作建议:"
if [ "$HTTP_80" != "200" ]; then
    echo "1. SSH到EC2实例"
    echo "2. 运行: ./fix-aws-502.sh"
    echo "3. 检查EC2安全组是否开放80端口"
    echo "4. 验证域名DNS解析"
else
    echo "✅ 部署成功！应用应该可以通过域名访问"
fi

echo ""
echo "🔗 相关命令:"
echo "查看实时日志: docker-compose logs -f"
echo "重启服务: docker-compose restart"
echo "诊断问题: ./diagnose-502.sh"