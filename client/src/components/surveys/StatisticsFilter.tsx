import React, { useState, useEffect } from 'react';

interface StatisticsFilterProps {
	onFilter: (filters: {
		name?: string;
		email?: string;
		fromDate?: string;
		toDate?: string;
		status?: string;
	}) => void;
	loading?: boolean;
}

export const StatisticsFilter: React.FC<StatisticsFilterProps> = ({ onFilter, loading = false }) => {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [fromDate, setFromDate] = useState('');
	const [toDate, setToDate] = useState('');
	const [status, setStatus] = useState('');

	// Set default date range to last 30 days
	useEffect(() => {
		const today = new Date();
		const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
		
		setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
		setToDate(today.toISOString().split('T')[0]);
	}, []);

	const handleQuery = () => {
		onFilter({
			name: name.trim() || undefined,
			email: email.trim() || undefined,
			fromDate: fromDate || undefined,
			toDate: toDate || undefined,
			status: status || undefined,
		});
	};

	const handleReset = () => {
		setName('');
		setEmail('');
		setStatus('');
		
		// Reset to default 30 days
		const today = new Date();
		const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
		setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
		setToDate(today.toISOString().split('T')[0]);
		
		onFilter({
			fromDate: thirtyDaysAgo.toISOString().split('T')[0],
			toDate: today.toISOString().split('T')[0],
		});
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleQuery();
		}
	};

	return (
		<div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-4">
			<h4 className="font-semibold text-gray-800 mb-3">筛选条件</h4>
			
			{/* Search inputs row */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						用户名搜索
					</label>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder="输入用户名进行模糊搜索"
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>
				
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						邮箱搜索
					</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder="输入邮箱进行模糊搜索"
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>
			</div>

			{/* Date range and status row */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						开始时间
					</label>
					<input
						type="date"
						value={fromDate}
						onChange={(e) => setFromDate(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>
				
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						结束时间
					</label>
					<input
						type="date"
						value={toDate}
						onChange={(e) => setToDate(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>
				
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						答题状态
					</label>
					<select
						value={status}
						onChange={(e) => setStatus(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="">全部状态</option>
						<option value="completed">已完成</option>
						<option value="incomplete">未完成</option>
					</select>
				</div>
			</div>

			{/* Action buttons */}
			<div className="flex gap-3 pt-2">
				<button
					onClick={handleQuery}
					disabled={loading}
					className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
						loading ? 'opacity-50 cursor-not-allowed' : ''
					}`}
				>
					{loading ? (
						<div className="flex items-center">
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							查询中...
						</div>
					) : (
						'查询'
					)}
				</button>
				
				<button
					onClick={handleReset}
					disabled={loading}
					className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
				>
					重置
				</button>
			</div>
		</div>
	);
};