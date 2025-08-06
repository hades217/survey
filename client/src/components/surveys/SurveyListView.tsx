import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSurveys } from '../../hooks/useSurveys';
import SurveyCard from './SurveyCard';
import { Survey } from '../../types/admin';

type ViewMode = 'card' | 'list';
type SortField = 'title' | 'type' | 'status' | 'createdAt' | 'responseCount';
type SortOrder = 'asc' | 'desc';

const SURVEYS_PER_PAGE = 10;

const SurveyListView: React.FC = () => {
	const { t } = useTranslation();
	const { surveys, error, loading, deleteSurvey, duplicateSurvey, handleSurveyClick, openEditModal } = useSurveys();

	// View and filter state
	const [viewMode, setViewMode] = useState<ViewMode>('card');
	const [searchTerm, setSearchTerm] = useState('');
	const [typeFilter, setTypeFilter] = useState<string>('all');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [dateFilter, setDateFilter] = useState<string>('all');
	const [currentPage, setCurrentPage] = useState(1);
	const [sortField, setSortField] = useState<SortField>('createdAt');
	const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

	console.log('SurveyListView - surveys:', surveys, 'loading:', loading, 'error:', error);

	// Filter and sort surveys
	const filteredAndSortedSurveys = useMemo(() => {
		if (!surveys) return [];

		let filtered = surveys.filter((survey) => {
			// Search filter
			const matchesSearch = survey.title.toLowerCase().includes(searchTerm.toLowerCase());
			
			// Type filter
			const matchesType = typeFilter === 'all' || survey.type === typeFilter;
			
			// Status filter
			const matchesStatus = statusFilter === 'all' || survey.status === statusFilter;
			
			// Date filter
			let matchesDate = true;
			if (dateFilter !== 'all' && survey.createdAt) {
				const surveyDate = new Date(survey.createdAt);
				const now = new Date();
				const daysDiff = Math.floor((now.getTime() - surveyDate.getTime()) / (1000 * 60 * 60 * 24));
				
				switch (dateFilter) {
					case '7days':
						matchesDate = daysDiff <= 7;
						break;
					case '30days':
						matchesDate = daysDiff <= 30;
						break;
					default:
						matchesDate = true;
				}
			}
			
			return matchesSearch && matchesType && matchesStatus && matchesDate;
		});

		// Sort surveys
		filtered.sort((a, b) => {
			let aValue: any, bValue: any;
			
			switch (sortField) {
				case 'title':
					aValue = a.title?.toLowerCase() || '';
					bValue = b.title?.toLowerCase() || '';
					break;
				case 'type':
					aValue = a.type || '';
					bValue = b.type || '';
					break;
				case 'status':
					aValue = a.status || '';
					bValue = b.status || '';
					break;
				case 'createdAt':
					aValue = new Date(a.createdAt || 0).getTime();
					bValue = new Date(b.createdAt || 0).getTime();
					break;
				case 'responseCount':
					aValue = a.responseCount || 0;
					bValue = b.responseCount || 0;
					break;
				default:
					return 0;
			}
			
			if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
			if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
			return 0;
		});

		return filtered;
	}, [surveys, searchTerm, typeFilter, statusFilter, dateFilter, sortField, sortOrder]);

	// Pagination
	const totalPages = Math.ceil(filteredAndSortedSurveys.length / SURVEYS_PER_PAGE);
	const paginatedSurveys = filteredAndSortedSurveys.slice(
		(currentPage - 1) * SURVEYS_PER_PAGE,
		currentPage * SURVEYS_PER_PAGE
	);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			setSortField(field);
			setSortOrder('asc');
		}
	};

	const resetFilters = () => {
		setSearchTerm('');
		setTypeFilter('all');
		setStatusFilter('all');
		setDateFilter('all');
		setCurrentPage(1);
	};

	const getStatusBadge = (status: string) => {
		const statusClasses = {
			active: 'bg-green-100 text-green-800',
			draft: 'bg-yellow-100 text-yellow-800',
			closed: 'bg-red-100 text-red-800'
		};
		
		const statusLabels = {
			active: t('survey.status.active'),
			draft: t('survey.status.draft'),
			closed: t('survey.status.closed')
		};

		return (
			<span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
				{statusLabels[status] || status}
			</span>
		);
	};

	const getTypeBadge = (type: string) => {
		const typeClasses = {
			survey: 'bg-blue-100 text-blue-800',
			assessment: 'bg-green-100 text-green-800',
			quiz: 'bg-purple-100 text-purple-800',
			iq: 'bg-orange-100 text-orange-800'
		};

		const typeLabels = {
			survey: t('survey.type.survey'),
			assessment: t('survey.type.assessment'),
			quiz: t('survey.type.quiz'),
			iq: t('survey.type.iq')
		};

		return (
			<span className={`px-2 py-1 text-xs font-medium rounded-full ${typeClasses[type] || 'bg-gray-100 text-gray-800'}`}>
				{typeLabels[type] || type}
			</span>
		);
	};

	if (loading) {
		return (
			<div className='text-center py-8 text-gray-500'>
				<p>{t('survey.loading')}</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className='text-center py-8 text-red-500'>
				<p>{t('survey.error')}: {error}</p>
			</div>
		);
	}

	if (!surveys || surveys.length === 0) {
		return (
			<div className='text-center py-8 text-gray-500'>
				<p>{t('survey.noSurveys')}</p>
				<p className='text-sm mt-2'>{t('survey.createFirst')}</p>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Header with View Toggle and Filters */}
			<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4'>
				{/* Top Row: Search and View Toggle */}
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
					{/* Search Bar */}
					<div className='flex-1 max-w-md'>
						<div className='relative'>
							<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
								<svg className='h-5 w-5 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
								</svg>
							</div>
							<input
								type='text'
								placeholder={t('survey.searchPlaceholder')}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
							/>
						</div>
					</div>

					{/* View Toggle */}
					<div className='flex items-center bg-gray-100 rounded-lg p-1'>
						<button
							onClick={() => setViewMode('card')}
							className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
								viewMode === 'card'
									? 'bg-white text-gray-900 shadow-sm'
									: 'text-gray-500 hover:text-gray-700'
							}`}
						>
							<svg className='w-4 h-4 inline mr-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' />
							</svg>
							{t('survey.view.cards')}
						</button>
						<button
							onClick={() => setViewMode('list')}
							className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
								viewMode === 'list'
									? 'bg-white text-gray-900 shadow-sm'
									: 'text-gray-500 hover:text-gray-700'
							}`}
						>
							<svg className='w-4 h-4 inline mr-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 10h16M4 14h16M4 18h16' />
							</svg>
							{t('survey.view.list')}
						</button>
					</div>
				</div>

				{/* Filters Row */}
				<div className='flex flex-col sm:flex-row sm:items-center gap-4'>
					<div className='flex flex-wrap gap-4 flex-1'>
						{/* Type Filter */}
						<select
							value={typeFilter}
							onChange={(e) => setTypeFilter(e.target.value)}
							className='px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
						>
							<option value='all'>{t('survey.filter.allTypes')}</option>
							<option value='survey'>{t('survey.type.survey')}</option>
							<option value='assessment'>{t('survey.type.assessment')}</option>
							<option value='quiz'>{t('survey.type.quiz')}</option>
							<option value='iq'>{t('survey.type.iq')}</option>
						</select>

						{/* Status Filter */}
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className='px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
						>
							<option value='all'>{t('survey.filter.allStatus')}</option>
							<option value='active'>{t('survey.status.active')}</option>
							<option value='draft'>{t('survey.status.draft')}</option>
							<option value='closed'>{t('survey.status.closed')}</option>
						</select>

						{/* Date Filter */}
						<select
							value={dateFilter}
							onChange={(e) => setDateFilter(e.target.value)}
							className='px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
						>
							<option value='all'>{t('survey.filter.allTime')}</option>
							<option value='7days'>{t('survey.filter.last7Days')}</option>
							<option value='30days'>{t('survey.filter.last30Days')}</option>
						</select>
					</div>

					{/* Reset Filters */}
					{(searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all') && (
						<button
							onClick={resetFilters}
							className='px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
						>
							{t('survey.filter.reset')}
						</button>
					)}
				</div>

				{/* Results Summary */}
				<div className='text-sm text-gray-600'>
					{t('survey.showing')} {paginatedSurveys.length} {t('survey.of')} {filteredAndSortedSurveys.length} {t('survey.surveys')}
				</div>
			</div>

			{/* Survey Content */}
			{filteredAndSortedSurveys.length === 0 ? (
				<div className='text-center py-8 text-gray-500'>
					<p>{t('survey.noResults')}</p>
					<button
						onClick={resetFilters}
						className='mt-2 text-blue-600 hover:text-blue-800 text-sm underline'
					>
						{t('survey.filter.reset')}
					</button>
				</div>
			) : viewMode === 'card' ? (
				<div className='space-y-6'>
					{paginatedSurveys.map((survey, index) => (
						<SurveyCard key={survey?._id || `survey-${index}`} survey={survey} />
					))}
				</div>
			) : (
				/* List View Table */
				<div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
					<div className='overflow-x-auto'>
						<table className='min-w-full divide-y divide-gray-200'>
							<thead className='bg-gray-50'>
								<tr>
									<th
										scope='col'
										className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
										onClick={() => handleSort('title')}
									>
										<div className='flex items-center space-x-1'>
											<span>{t('survey.table.title')}</span>
											{sortField === 'title' && (
												<svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
													<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
												</svg>
											)}
										</div>
									</th>
									<th
										scope='col'
										className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
										onClick={() => handleSort('type')}
									>
										<div className='flex items-center space-x-1'>
											<span>{t('survey.table.type')}</span>
											{sortField === 'type' && (
												<svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
													<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
												</svg>
											)}
										</div>
									</th>
									<th
										scope='col'
										className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
										onClick={() => handleSort('status')}
									>
										<div className='flex items-center space-x-1'>
											<span>{t('survey.table.status')}</span>
											{sortField === 'status' && (
												<svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
													<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
												</svg>
											)}
										</div>
									</th>
									<th
										scope='col'
										className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
										onClick={() => handleSort('createdAt')}
									>
										<div className='flex items-center space-x-1'>
											<span>{t('survey.table.created')}</span>
											{sortField === 'createdAt' && (
												<svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
													<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
												</svg>
											)}
										</div>
									</th>
									<th
										scope='col'
										className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
										onClick={() => handleSort('responseCount')}
									>
										<div className='flex items-center space-x-1'>
											<span>{t('survey.table.responses')}</span>
											{sortField === 'responseCount' && (
												<svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
													<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 15l7-7 7 7' />
												</svg>
											)}
										</div>
									</th>
									<th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										{t('survey.table.actions')}
									</th>
								</tr>
							</thead>
							<tbody className='bg-white divide-y divide-gray-200'>
								{paginatedSurveys.map((survey) => (
									<tr key={survey._id} className='hover:bg-gray-50'>
										<td className='px-6 py-4 whitespace-nowrap'>
											<div className='flex flex-col'>
												<button
													onClick={() => handleSurveyClick(survey)}
													className='text-sm font-medium text-gray-900 hover:text-blue-600 text-left'
												>
													{survey.title}
												</button>
												{survey.description && (
													<p className='text-sm text-gray-500 mt-1 truncate max-w-xs'>{survey.description}</p>
												)}
											</div>
										</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											{getTypeBadge(survey.type)}
										</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											{getStatusBadge(survey.status)}
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
											{survey.createdAt ? new Date(survey.createdAt).toLocaleDateString() : '-'}
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
											{survey.responseCount || 0}
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
											<div className='flex space-x-2'>
												<button
													onClick={() => handleSurveyClick(survey)}
													className='text-blue-600 hover:text-blue-900'
													title={t('survey.actions.manage')}
												>
													<svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
														<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
													</svg>
												</button>
												<button
													onClick={() => openEditModal(survey)}
													className='text-gray-600 hover:text-gray-900'
													title={t('survey.actions.edit')}
												>
													<svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
														<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' />
													</svg>
												</button>
												<button
													onClick={() => duplicateSurvey(survey._id)}
													className='text-green-600 hover:text-green-900'
													title={t('survey.actions.duplicate')}
												>
													<svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
														<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' />
													</svg>
												</button>
												<button
													onClick={() => deleteSurvey(survey._id)}
													className='text-red-600 hover:text-red-900'
													title={t('survey.actions.delete')}
												>
													<svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
														<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
													</svg>
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Pagination */}
			{totalPages > 1 && (
				<div className='flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg'>
					<div className='flex-1 flex justify-between sm:hidden'>
						<button
							onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
							disabled={currentPage === 1}
							className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{t('pagination.previous')}
						</button>
						<button
							onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
							disabled={currentPage === totalPages}
							className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{t('pagination.next')}
						</button>
					</div>
					<div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
						<div>
							<p className='text-sm text-gray-700'>
								{t('pagination.showing')} <span className='font-medium'>{(currentPage - 1) * SURVEYS_PER_PAGE + 1}</span> {t('pagination.to')}{' '}
								<span className='font-medium'>{Math.min(currentPage * SURVEYS_PER_PAGE, filteredAndSortedSurveys.length)}</span> {t('pagination.of')}{' '}
								<span className='font-medium'>{filteredAndSortedSurveys.length}</span> {t('pagination.results')}
							</p>
						</div>
						<div>
							<nav className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px' aria-label='Pagination'>
								<button
									onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
									disabled={currentPage === 1}
									className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
								>
									<svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
									</svg>
								</button>
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
									<button
										key={page}
										onClick={() => setCurrentPage(page)}
										className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
											page === currentPage
												? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
												: 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
										}`}
									>
										{page}
									</button>
								))}
								<button
									onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
									disabled={currentPage === totalPages}
									className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
								>
									<svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
									</svg>
								</button>
							</nav>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default SurveyListView;
