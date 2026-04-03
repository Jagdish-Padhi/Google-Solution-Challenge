/**
 * Toggle Component
 * Switch/Toggle button for boolean states
 */

const Toggle = ({
	checked = false,
	onChange,
	disabled = false,
	label = '',
	className = '',
	id,
	...props
}) => {
	return (
		<div className='flex items-center gap-3'>
			<button
				id={id}
				onClick={() => !disabled && onChange(!checked)}
				disabled={disabled}
				className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors
					${checked ? 'bg-[var(--app-color-primary)]' : 'bg-[var(--app-color-border)]'}
					disabled:opacity-50 disabled:cursor-not-allowed
					focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--app-color-primary)]
					${className}`}
				{...props}
				type='button'
			>
				<span
					className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
						${checked ? 'translate-x-6' : 'translate-x-1'}`}
				/>
			</button>
			{label && <label htmlFor={id} className='text-sm font-medium text-[var(--app-color-text)]'>{label}</label>}
		</div>
	);
};

export default Toggle;
