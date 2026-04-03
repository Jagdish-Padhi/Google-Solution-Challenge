/**
 * Input Component
 * Reusable text input with label and error states
 * Supports various types: text, email, password, number, etc.
 */

const Input = ({
	label,
	type = 'text',
	placeholder = '',
	value,
	onChange,
	error = '',
	disabled = false,
	required = false,
	className = '',
	helperText = '',
	icon: Icon = null,
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
			<div className='relative'>
				{Icon && <Icon className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--app-color-text-muted)]' />}
				<input
					type={type}
					value={value}
					onChange={onChange}
					placeholder={placeholder}
					disabled={disabled}
					className={`w-full px-4 py-2 ${Icon ? 'pl-10' : ''} border rounded-lg font-medium transition-colors
						${error ? 'border-red-500 text-red-900' : 'border-[var(--app-color-border)] text-[var(--app-color-text)]'}
						placeholder:text-[var(--app-color-text-muted)]
						focus:outline-none focus:ring-2 focus:ring-offset-0
						${error ? 'focus:ring-red-500' : 'focus:ring-[var(--app-color-primary)] focus:border-[var(--app-color-primary)]'}
						disabled:bg-[var(--app-color-surface-elevated)] disabled:cursor-not-allowed
						${className}`}
					{...props}
				/>
			</div>
			{error && <p className='text-sm text-red-600 mt-1'>{error}</p>}
			{helperText && <p className='text-sm text-[var(--app-color-text-muted)] mt-1'>{helperText}</p>}
		</div>
	);
};

export default Input;
