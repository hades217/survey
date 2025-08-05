import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Define resources inline for immediate testing
const resources = {
	en: {
		translation: {
			appName: 'Sigma Survey Platform',
			language: {
				english: 'English',
				chinese: '中文',
			},
			landing: {
				hero: {
					title: 'Sigma — Smarter Assessments for Smarter Teams',
					subtitle: 'Create professional surveys and assessments in minutes. Track results, compare candidates, and make data-driven decisions.',
					startFreeTrial: 'Start Free Trial',
					seeLiveDemo: 'See Live Demo',
				},
				features: {
					title: 'Powerful Features for Modern Teams',
					feature1: {
						title: 'Create professional assessments easily',
						description: 'Use drag-and-drop survey builder or import CSV files to generate question banks.',
					},
					feature2: {
						title: 'Visual analytics & reporting',
						description: 'See score distribution, answer time, success rates, and more — all visualized.',
					},
					feature3: {
						title: 'AI-powered insights',
						description: 'Compare candidates, highlight top performers, and auto-generate reports.',
					},
					feature4: {
						title: 'Question bank manager',
						description: 'Centralized library with categories, tags, and reusable questions.',
					},
					feature5: {
						title: 'Multilingual assessments',
						description: 'Support for English, Chinese and more. Each user gets localized content.',
					},
					feature6: {
						title: 'Branding & company customization',
						description: 'Upload your logo, colors, and company info to personalize the experience.',
					},
				},
				useCases: {
					title: 'Who is Sigma for?',
					hrTeams: {
						title: 'HR Teams & Recruiters',
						description: 'Screen candidates faster with standardized assessments.',
					},
					training: {
						title: 'L&D / Internal Training',
						description: 'Evaluate employee progress and training outcomes.',
					},
					startups: {
						title: 'Startups & SMBs',
						description: 'Build lightweight internal surveys without coding.',
					},
					universities: {
						title: 'Universities / Bootcamps',
						description: 'Assess student learning and export structured reports.',
					},
					international: {
						title: 'International Teams',
						description: 'Use multilingual assessments for global hiring.',
					},
				},
				pricing: {
					title: 'Simple, transparent pricing',
					basic: {
						title: 'Basic Plan',
						price: '$19/month',
						subtitle: 'Perfect for small teams',
						features: [
							'Up to 3 assessments',
							'Up to 30 participants',
							'No CSV import',
							'No image-based questions',
							'Basic reporting',
						],
						button: 'Start with Basic',
					},
					pro: {
						title: 'Pro Plan',
						price: '$49/month',
						subtitle: 'For scaling companies',
						features: [
							'Unlimited assessments',
							'Unlimited candidates',
							'CSV import & image-based questions',
							'PDF reports & visual analytics',
							'Team accounts and branding',
						],
						button: 'Upgrade to Pro',
					},
				},
				testimonials: {
					title: 'What our customers say',
					testimonial1: {
						quote: 'Sigma helped streamline our internal evaluations — the PDF reports look very professional.',
						author: 'Jane L., HR Manager',
					},
					testimonial2: {
						quote: 'Love the ability to run assessments in Chinese and English. Easy to use and flexible.',
						author: 'Kevin Y., CTO, EdTech Startup',
					},
				},
				cta: {
					title: 'Ready to get started with Sigma?',
					subtitle: 'Create your first assessment today. No credit card required.',
					button: 'Start Free Trial',
					contactSales: 'Need a custom plan? Contact Sales',
				},
				footer: {
					features: 'Features',
					pricing: 'Pricing',
					helpCenter: 'Help Center',
					privacy: 'Privacy Policy',
					terms: 'Terms of Use',
					copyright: '© 2025 Sigma. All rights reserved.',
				},
			},
			navigation: {
				surveys: 'Surveys',
				questionBanks: 'Question Banks',
				profile: 'Profile',
				billing: 'Billing',
				dashboard: 'Dashboard',
			},
			buttons: {
				submit: 'Submit',
				cancel: 'Cancel',
				save: 'Save',
				delete: 'Delete',
				edit: 'Edit',
				create: 'Create',
				back: 'Back',
				next: 'Next',
				previous: 'Previous',
				logout: 'Logout',
				refresh: 'Refresh',
				duplicate: 'Duplicate',
			},
			common: {
				loading: 'Loading...',
				name: 'Name',
				email: 'Email',
				title: 'Title',
				description: 'Description',
			},
			profile: {
				settings: 'Profile Settings',
				manageInfo: 'Manage your personal information and company details',
				personalInfo: 'Personal Information',
				companyInfo: 'Company Information',
				dismiss: 'Dismiss',
				update: 'Update',
				updating: 'Updating...',
				fullName: 'Full Name',
				currentPassword: 'Current Password',
				newPassword: 'New Password',
				confirmPassword: 'Confirm Password',
				companyName: 'Company Name',
				industry: 'Industry',
				website: 'Website',
				companyLogo: 'Company Logo',
				uploadLogo: 'Upload your company logo',
				companyDescription: 'Company Description',
				updatePersonalInfo: 'Update Personal Information',
				updatePassword: 'Update Password',
				updateCompanyInfo: 'Update Company Information',
			},
			survey: {
				duplicateConfirm: 'Are you sure you want to duplicate "{{title}}"?',
				duplicateSuccess: 'Survey duplicated successfully',
				questions: 'questions',
				responses: 'responses',
				lastActivity: 'Last activity',
				noActivity: 'No activity yet',
				antiCheat: {
					copyWarning: 'For fair assessment, copying content is not allowed.',
					pasteWarning: 'For fair assessment, pasting content is not allowed.',
					rightClickWarning: 'Right-click is disabled during assessment.',
					selectAllWarning: 'Select all is disabled during assessment.',
					devToolsWarning: 'Developer tools are disabled during assessment.',
				},
			},
		},
		admin: {
			dashboard: {
				title: '{{companyName}} Admin Dashboard',
				subtitle: 'Manage your surveys, assessments and view responses',
			},
			survey: {
				createSurvey: 'Create Survey',
			},
		},
		survey: {
			form: {
				nameRequired: 'Name is required',
				emailInvalid: 'Invalid email format',
				pleaseSelectOption: 'Please select an option',
				enterAnswerHere: 'Enter your answer here...',
			},
		},
	},
	zh: {
		translation: {
			appName: 'Sigma 调研平台',
			language: {
				english: 'English',
				chinese: '中文',
			},
			landing: {
				hero: {
					title: 'Sigma — 更智能的团队评估解决方案',
					subtitle: '在几分钟内创建专业的调研和评估。跟踪结果，比较候选人，做出数据驱动的决策。',
					startFreeTrial: '开始免费试用',
					seeLiveDemo: '查看在线演示',
				},
				features: {
					title: '为现代团队打造的强大功能',
					feature1: {
						title: '轻松创建专业评估',
						description: '使用拖放式问卷构建器或导入CSV文件生成题库。',
					},
					feature2: {
						title: '可视化分析与报告',
						description: '查看分数分布、答题时间、成功率等——一切都可视化呈现。',
					},
					feature3: {
						title: 'AI驱动的洞察',
						description: '比较候选人，突出表现优异者，自动生成报告。',
					},
					feature4: {
						title: '题库管理器',
						description: '具有分类、标签和可重用题目的集中式题库。',
					},
					feature5: {
						title: '多语言评估',
						description: '支持英语、中文等多种语言。每位用户都能获得本地化内容。',
					},
					feature6: {
						title: '品牌与企业定制',
						description: '上传您的Logo、颜色和公司信息，个性化用户体验。',
					},
				},
				useCases: {
					title: 'Sigma适合谁？',
					hrTeams: {
						title: '人力资源团队与招聘人员',
						description: '通过标准化评估更快筛选候选人。',
					},
					training: {
						title: '学习与发展/内部培训',
						description: '评估员工进度和培训成果。',
					},
					startups: {
						title: '创业公司与中小企业',
						description: '无需编程即可构建轻量级内部调研。',
					},
					universities: {
						title: '大学/训练营',
						description: '评估学生学习情况并导出结构化报告。',
					},
					international: {
						title: '国际团队',
						description: '使用多语言评估进行全球招聘。',
					},
				},
				pricing: {
					title: '简单透明的定价',
					basic: {
						title: '基础版',
						price: '¥19/月',
						subtitle: '适合小团队',
						features: [
							'最多3个评估',
							'最多30名参与者',
							'不支持CSV导入',
							'不支持图片题目',
							'基础报告功能',
						],
						button: '选择基础版',
					},
					pro: {
						title: '专业版',
						price: '¥49/月',
						subtitle: '适合成长型公司',
						features: [
							'无限评估数量',
							'无限候选人数',
							'CSV导入和图片题目',
							'PDF报告和可视化分析',
							'团队账户和品牌定制',
						],
						button: '升级到专业版',
					},
				},
				testimonials: {
					title: '客户评价',
					testimonial1: {
						quote: 'Sigma帮助简化了我们的内部评估流程——PDF报告看起来非常专业。',
						author: 'Jane L., 人力资源经理',
					},
					testimonial2: {
						quote: '喜欢能够用中英文进行评估的功能。易于使用且灵活。',
						author: 'Kevin Y., 教育科技初创公司CTO',
					},
				},
				cta: {
					title: '准备开始使用Sigma了吗？',
					subtitle: '立即创建您的第一个评估。无需信用卡。',
					button: '开始免费试用',
					contactSales: '需要定制方案？联系销售',
				},
				footer: {
					features: '功能',
					pricing: '定价',
					helpCenter: '帮助中心',
					privacy: '隐私政策',
					terms: '使用条款',
					copyright: '© 2025 Sigma. 保留所有权利。',
				},
			},
			navigation: {
				surveys: '问卷调研',
				questionBanks: '题库管理',
				profile: '个人资料',
				billing: '账单管理',
				dashboard: '仪表盘',
			},
			buttons: {
				submit: '提交',
				cancel: '取消',
				save: '保存',
				delete: '删除',
				edit: '编辑',
				create: '创建',
				back: '返回',
				next: '下一步',
				previous: '上一步',
				logout: '退出',
				refresh: '刷新',
				duplicate: '复制',
			},
			common: {
				loading: '加载中...',
				name: '姓名',
				email: '邮箱',
				title: '标题',
				description: '描述',
			},
			profile: {
				settings: '个人设置',
				manageInfo: '管理您的个人信息和公司详情',
				personalInfo: '个人信息',
				companyInfo: '公司信息',
				dismiss: '关闭',
				update: '更新',
				updating: '更新中...',
				fullName: '全名',
				currentPassword: '当前密码',
				newPassword: '新密码',
				confirmPassword: '确认密码',
				companyName: '公司名称',
				industry: '行业',
				website: '网站',
				companyLogo: '公司Logo',
				uploadLogo: '上传您的公司Logo',
				companyDescription: '公司描述',
				updatePersonalInfo: '更新个人信息',
				updatePassword: '更新密码',
				updateCompanyInfo: '更新公司信息',
			},
			survey: {
				duplicateConfirm: '确定要复制 "{{title}}" 吗？',
				duplicateSuccess: '问卷复制成功',
				questions: '题目',
				responses: '回复',
				lastActivity: '最近活动',
				noActivity: '暂无活动',
				antiCheat: {
					copyWarning: '为保证测评公平，系统不允许复制内容。',
					pasteWarning: '为保证测评公平，系统不允许粘贴内容。',
					rightClickWarning: '测评期间禁用右键菜单。',
					selectAllWarning: '测评期间禁用全选功能。',
					devToolsWarning: '测评期间禁用开发者工具。',
				},
			},
		},
		admin: {
			dashboard: {
				title: '{{companyName}} 管理后台',
				subtitle: '管理您的问卷、测评并查看回复',
			},
			survey: {
				createSurvey: '创建问卷',
			},
		},
		survey: {
			form: {
				nameRequired: '姓名不能为空',
				emailInvalid: '邮箱格式不正确',
				pleaseSelectOption: '请选择一项',
				enterAnswerHere: '请在此输入您的答案...',
			},
		},
	},
};

i18n.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		fallbackLng: 'en',
		debug: true, // Enable debug to see what's happening

		interpolation: {
			escapeValue: false, // React already does escaping
		},

		// Use inline resources
		resources,

		detection: {
			order: ['localStorage', 'navigator', 'htmlTag'],
			caches: ['localStorage'],
		},

		// Default namespace
		defaultNS: 'translation',
	});

export default i18n;
