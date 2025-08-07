import React from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
	className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
	const { i18n, t } = useTranslation();

	const handleLanguageChange = async (lang: string) => {
		try {
			await i18n.changeLanguage(lang);
			localStorage.setItem('i18nextLng', lang);
		} catch (error) {
			console.error('Error changing language:', error);
		}
	};

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<button
				onClick={() => handleLanguageChange('en')}
				className={`px-4 py-2 text-base rounded-lg font-medium transition-all duration-200 ${
					i18n.language === 'en'
						? 'bg-[#FF5A5F] text-white shadow-sm'
						: 'bg-[#EBEBEB] text-[#484848] hover:bg-[#DDDDDD] hover:text-[#FF5A5F]'
				}`}
				aria-label='Switch to English'
			>
				English
			</button>
			<button
				onClick={() => handleLanguageChange('zh')}
				className={`px-4 py-2 text-base rounded-lg font-medium transition-all duration-200 ${
					i18n.language === 'zh'
						? 'bg-[#FF5A5F] text-white shadow-sm'
						: 'bg-[#EBEBEB] text-[#484848] hover:bg-[#DDDDDD] hover:text-[#FF5A5F]'
				}`}
				aria-label='切换到中文'
			>
				中文
			</button>
		</div>
	);
};

export default LanguageSwitcher;
