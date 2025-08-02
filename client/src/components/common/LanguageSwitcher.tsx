import React from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
	className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
	const { i18n, t } = useTranslation();

	// Debug: log current language and translations
	console.log('Current language:', i18n.language);
	console.log('English text:', t('language.english'));
	console.log('Chinese text:', t('language.chinese'));

	const handleLanguageChange = async (lang: string) => {
		try {
			await i18n.changeLanguage(lang);
			localStorage.setItem('i18nextLng', lang);
			console.log('Language changed to:', lang);
			console.log('New translations - English:', t('language.english'));
			console.log('New translations - Chinese:', t('language.chinese'));
		} catch (error) {
			console.error('Error changing language:', error);
		}
	};

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<button
				onClick={() => handleLanguageChange('en')}
				className={`px-3 py-1 text-sm rounded transition-colors ${
					i18n.language === 'en'
						? 'bg-blue-600 text-white'
						: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
				}`}
				aria-label='Switch to English'
			>
				{t('language.english')}
			</button>
			<button
				onClick={() => handleLanguageChange('zh')}
				className={`px-3 py-1 text-sm rounded transition-colors ${
					i18n.language === 'zh'
						? 'bg-blue-600 text-white'
						: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
				}`}
				aria-label='切换到中文'
			>
				{t('language.chinese')}
			</button>
		</div>
	);
};

export default LanguageSwitcher;
