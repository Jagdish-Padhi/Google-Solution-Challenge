/**
 * Checkbox Component
 * Accessible checkbox with label
 */

const Checkbox = ({
	checked = false,
	onChange,
	label = '',
	disabled = false,
	error = false,
	className = '',
	id,
	...props
}) => {
	return (
		<div className='flex items-start gap-3'>
			<div className='flex items-center h-6'>
				<input
					id={id}
					type='checkbox'
					checked={checked}
					onChange={onChange}
					disabled={disabled}
					className={`w-5 h-5 rounded cursor-pointer 
						${error ? 'border-red-500 text-red-600' : 'border-[var(--app-color-border)] text-[var(--app-color-primary)]'}
						accent-[var(--app-color-primary)]
						disabled:opacity-50 disabled:cursor-not-allowed
						${className}`}
					{...props}
				/>
			</div>
			{label && (
				<label
					htmlFor={id}
					className={`text-sm font-medium leading-6 cursor-pointer select-none
						${disabled ? 'opacity-50 cursor-not-allowed' : ''}
						${error ? 'text-red-600' : 'text-[var(--app-color-text)]'}`}
				>
					{label}
				</label>
			)}
		</div>
	);
};

export default Checkbox;
