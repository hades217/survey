export interface Survey {
	_id: string;
	title: string;
	description: string;
	slug: string;
	type: 'survey' | 'assessment' | 'quiz' | 'iq';
	questions: {
		text: string;
		type?: 'single_choice' | 'multiple_choice' | 'short_text';
		options?: string[];
		correctAnswer?: number | number[] | string;
		points?: number;
	}[];
	createdAt: string;
	isActive: boolean;
	status: 'draft' | 'active' | 'closed';
	timeLimit?: number;
	maxAttempts?: number;
	instructions?: string;
	navigationMode?: 'step-by-step' | 'paginated' | 'all-in-one';
	sourceType?: 'manual' | 'question_bank';
	questionBankId?: string;
	questionCount?: number;
	scoringSettings?: {
		scoringMode: 'percentage' | 'accumulated';
		totalPoints: number;
		passingThreshold: number;
		showScore: boolean;
		showCorrectAnswers: boolean;
		showScoreBreakdown: boolean;
		customScoringRules: {
			useCustomPoints: boolean;
			defaultQuestionPoints: number;
		};
	};
}

export interface QuestionBank {
	_id: string;
	name: string;
	description: string;
	questions: Question[];
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	questionCount: number;
}

export interface Question {
	_id: string;
	text: string;
	type: 'single_choice' | 'multiple_choice' | 'short_text';
	options?: string[];
	correctAnswer?: number | number[] | string;
	explanation?: string;
	points?: number;
	tags?: string[];
	difficulty?: 'easy' | 'medium' | 'hard';
}

export interface StatsItem {
	question: string;
	options: Record<string, number>;
}

export interface UserResponse {
	_id: string;
	name: string;
	email: string;
	answers: Record<string, string>;
	createdAt: string;
}

export interface StatsSummary {
	totalResponses: number;
	completionRate: number;
	totalQuestions: number;
}

export interface EnhancedStats {
	aggregatedStats: StatsItem[];
	userResponses: UserResponse[];
	summary: StatsSummary;
}

export type TabType = 'list' | 'detail' | 'question-banks';
export type StatsViewType = 'aggregated' | 'individual';

export interface QuestionForm {
	text: string;
	options?: string[];
	type: 'single_choice' | 'multiple_choice' | 'short_text';
	correctAnswer?: number | number[] | string;
	points?: number;
	explanation?: string;
	tags?: string[];
	difficulty?: 'easy' | 'medium' | 'hard';
}

export interface LoginForm {
	username: string;
	password: string;
}

export interface NewSurveyForm {
	title: string;
	description: string;
	slug: string;
	type: 'survey' | 'assessment' | 'quiz' | 'iq';
	questions: {
		text: string;
		type?: 'single_choice' | 'multiple_choice' | 'short_text';
		options?: string[];
		correctAnswer?: number | number[] | string;
		points?: number;
	}[];
	status: 'draft' | 'active' | 'closed';
	timeLimit?: number;
	maxAttempts?: number;
	instructions?: string;
	navigationMode?: 'step-by-step' | 'paginated' | 'all-in-one';
	sourceType?: 'manual' | 'question_bank';
	questionBankId?: string;
	questionCount?: number;
	scoringSettings?: {
		scoringMode: 'percentage' | 'accumulated';
		totalPoints: number;
		passingThreshold: number;
		showScore: boolean;
		showCorrectAnswers: boolean;
		showScoreBreakdown: boolean;
		customScoringRules: {
			useCustomPoints: boolean;
			defaultQuestionPoints: number;
		};
	};
}

export interface QuestionBankForm {
	name: string;
	description: string;
}
