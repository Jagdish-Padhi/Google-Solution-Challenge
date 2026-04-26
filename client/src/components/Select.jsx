/**
 * Select Component
 * Dropdown select with label and error states
 */

const Select = ({
	label,
	value,
	onChange,
	options = [],
	placeholder = '',
	error = '',
	disabled = false,
	required = false,
	className = '',
	helperText = '',
	...props
}) => {
	return (
		<div className='w-full'>
			{label && (
				<label className='block text-xs font-bold uppercase tracking-widest text-[var(--app-color-text-muted)] mb-2'>
					{label}
					{required && <span className='text-red-600 ml-1'>*</span>}
				</label>
			)}
			<div className="relative group">
				<select
					value={value}
					onChange={onChange}
					disabled={disabled}
					className={`w-full px-4 py-2.5 border rounded-xl font-medium transition-all duration-200 appearance-none
						${error ? 'border-red-400 text-red-900 bg-red-50/30' : 'border-[var(--app-color-border)] text-[var(--app-color-text)] bg-[var(--app-color-surface)]'}
						hover:border-[var(--app-color-primary-soft)] hover:shadow-sm
						focus:outline-none focus:border-[var(--app-color-primary)] focus:shadow-[0_0_0_1px_var(--app-color-primary)]
						disabled:bg-[var(--app-color-surface-elevated)] disabled:cursor-not-allowed
						bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2364748b%27 stroke-width=%272.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-[length:16px_16px] bg-[right_1rem_center] pr-12
						${className}`}
					{...props}
				>
					{placeholder && (
						<option value='' disabled>
							{placeholder}
						</option>
					)}
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>
			{error && <p className='text-xs text-red-600 mt-1.5 font-medium'>{error}</p>}
			{helperText && <p className='text-xs text-[var(--app-color-text-muted)] mt-1.5'>{helperText}</p>}
		</div>
	);
};

export default Select;
