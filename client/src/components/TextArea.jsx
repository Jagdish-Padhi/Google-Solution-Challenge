/**
 * TextArea Component
 * Multi-line text input with character count and resize
 */

const TextArea = ({
	label,
	placeholder = '',
	value,
	onChange,
	error = '',
	disabled = false,
	required = false,
	maxLength = null,
	rows = 4,
	className = '',
	helperText = '',
	...props
}) => {
	const characterCount = value?.length || 0;

	return (
		<div className='w-full'>
			{label && (
				<label className='block text-sm font-medium text-[var(--app-color-text)] mb-2'>
					{label}
					{required && <span className='text-red-600 ml-1'>*</span>}
				</label>
			)}
			<textarea
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				disabled={disabled}
				maxLength={maxLength}
				rows={rows}
				className={`w-full px-4 py-2 border rounded-lg font-medium transition-colors resize-vertical
					${error ? 'border-red-500 text-red-900' : 'border-[var(--app-color-border)] text-[var(--app-color-text)]'}
					placeholder:text-[var(--app-color-text-muted)]
					focus:outline-none focus:ring-2 focus:ring-offset-0
					${error ? 'focus:ring-red-500' : 'focus:ring-[var(--app-color-primary)] focus:border-[var(--app-color-primary)]'}
					disabled:bg-[var(--app-color-surface-elevated)] disabled:cursor-not-allowed
					${className}`}
				{...props}
			/>
			<div className='flex justify-between items-center mt-1'>
				<div>
					{error && <p className='text-sm text-red-600'>{error}</p>}
					{helperText && <p className='text-sm text-[var(--app-color-text-muted)]'>{helperText}</p>}
				</div>
				{maxLength && <p className='text-xs text-[var(--app-color-text-muted)]'>{characterCount}/{maxLength}</p>}
			</div>
		</div>
	);
};

export default TextArea;
