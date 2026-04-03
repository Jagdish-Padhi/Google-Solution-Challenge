/**
 * Select Component
 * Dropdown select with label and error states
 */

const Select = ({
	label,
	value,
	onChange,
	options = [],
	placeholder = 'Select an option',
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
				<label className='block text-sm font-medium text-[var(--app-color-text)] mb-2'>
					{label}
					{required && <span className='text-red-600 ml-1'>*</span>}
				</label>
			)}
			<select
				value={value}
				onChange={onChange}
				disabled={disabled}
				className={`w-full px-4 py-2 border rounded-lg font-medium transition-colors appearance-none
					${error ? 'border-red-500 text-red-900' : 'border-[var(--app-color-border)] text-[var(--app-color-text)]'}
					placeholder:text-[var(--app-color-text-muted)]
					focus:outline-none focus:ring-2 focus:ring-offset-0
					${error ? 'focus:ring-red-500' : 'focus:ring-[var(--app-color-primary)] focus:border-[var(--app-color-primary)]'}
					disabled:bg-[var(--app-color-surface-elevated)] disabled:cursor-not-allowed
					bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%230f172a%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-right pr-10
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
			{error && <p className='text-sm text-red-600 mt-1'>{error}</p>}
			{helperText && <p className='text-sm text-[var(--app-color-text-muted)] mt-1'>{helperText}</p>}
		</div>
	);
};

export default Select;
