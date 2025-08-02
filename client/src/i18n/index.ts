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
