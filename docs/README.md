# Survey System Documentation

这个目录包含了Survey系统的所有技术文档，按照功能分类组织。

## 📁 目录结构

```
docs/
├── README.md                 # 本文档 - 主索引
├── admin/                    # 管理员功能文档
├── features/                 # 功能特性文档
├── implementation/           # 实现细节文档
├── testing/                  # 测试相关文档
├── deployment/               # 部署相关文档
└── development/              # 开发相关文档
```

## 📋 文档分类

### 🔐 管理员功能 (admin/)
- [管理员注册功能](./admin/ADMIN_REGISTRATION_FEATURE.md) - 管理员注册和认证系统
- [管理员个人资料功能](./admin/ADMIN_PROFILE_FEATURE.md) - 管理员个人资料管理
- [管理员分发指南](./admin/ADMIN_DISTRIBUTION_GUIDE.md) - 管理员功能分发和部署指南

### ⚡ 功能特性 (features/)
- [调查类型限制](./features/SURVEY_TYPE_RESTRICTIONS.md) - 不同调查类型的限制和规则
- [学生评估功能](./features/STUDENT_ASSESSMENT_FEATURES.md) - 学生评估系统功能
- [测验调查系统](./features/QUIZ_SURVEY_SYSTEM.md) - 测验类型调查的实现
- [评估评分系统](./features/ASSESSMENT_SCORING_SYSTEM.md) - 评估和测验的评分机制
- [CSV导入功能演示](./features/CSV_IMPORT_FEATURE_DEMO.md) - CSV文件导入功能
- [个人资料UI预览](./features/PROFILE_UI_PREVIEW.md) - 个人资料界面设计

### 🔧 实现细节 (implementation/)
- [实现总结](./implementation/IMPLEMENTATION_SUMMARY.md) - 系统整体实现总结
- [路由实现](./implementation/ROUTING_IMPLEMENTATION.md) - 前端路由系统实现
- [重构总结](./implementation/REFACTORING_SUMMARY.md) - 代码重构记录
- [统计功能增强总结](./implementation/STATISTICS_ENHANCEMENT_SUMMARY.md) - 统计功能改进
- [问题快照系统](./implementation/QUESTION_SNAPSHOT_SYSTEM.md) - 问题版本管理
- [统计筛选实现](./implementation/STATISTICS_FILTER_IMPLEMENTATION.md) - 统计筛选功能
- [筛选UI增强总结](./implementation/FILTER_UI_ENHANCEMENT_SUMMARY.md) - 筛选界面改进
- [默认统计视图更新](./implementation/DEFAULT_STATS_VIEW_UPDATE.md) - 统计视图默认设置

### 🧪 测试相关 (testing/)
- [端到端测试结果](./testing/END_TO_END_TEST_RESULTS.md) - 完整测试流程结果
- [邮箱筛选修复总结](./testing/EMAIL_FILTER_FIX_SUMMARY.md) - 邮箱筛选功能修复

### 🚀 部署相关 (deployment/)
- [Docker部署指南](./deployment/DOCKER_README.md) - Docker容器化部署
- [Cloudinary设置](./deployment/CLOUDINARY_SETUP.md) - 云存储服务配置

### 💻 开发相关 (development/)
- [AI编码规则](./development/AI_CODING_RULES.md) - AI辅助开发的编码规范
- [Claude配置](./development/CLAUDE.md) - Claude AI助手配置说明

## 📖 快速导航

### 新用户入门
1. [管理员注册功能](./admin/ADMIN_REGISTRATION_FEATURE.md) - 了解如何注册管理员账户
2. [实现总结](./implementation/IMPLEMENTATION_SUMMARY.md) - 了解系统整体架构
3. [Docker部署指南](./deployment/DOCKER_README.md) - 了解如何部署系统

### 功能开发
1. [调查类型限制](./features/SURVEY_TYPE_RESTRICTIONS.md) - 了解不同调查类型
2. [测验调查系统](./features/QUIZ_SURVEY_SYSTEM.md) - 了解测验功能实现
3. [评估评分系统](./features/ASSESSMENT_SCORING_SYSTEM.md) - 了解评分机制

### 问题排查
1. [邮箱筛选修复总结](./testing/EMAIL_FILTER_FIX_SUMMARY.md) - 常见筛选问题
2. [端到端测试结果](./testing/END_TO_END_TEST_RESULTS.md) - 测试覆盖范围

### 系统维护
1. [管理员分发指南](./admin/ADMIN_DISTRIBUTION_GUIDE.md) - 系统分发和维护
2. [Cloudinary设置](./deployment/CLOUDINARY_SETUP.md) - 文件存储配置

## 🔄 文档更新

这些文档会随着系统功能的开发和改进而更新。每个文档都包含了：

- **功能描述**: 详细的功能说明
- **技术实现**: 实现细节和代码示例
- **使用指南**: 如何使用该功能
- **测试验证**: 相关的测试用例和结果

## 📝 贡献指南

当添加新功能或修改现有功能时，请：

1. 在相应的目录下创建或更新文档
2. 更新本README.md文件中的索引
3. 确保文档内容准确且易于理解
4. 包含必要的代码示例和截图

---

*最后更新: 2024年12月*
