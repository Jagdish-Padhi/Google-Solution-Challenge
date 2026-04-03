/**
 * Radio Button Component
 * Single selection option from a group
 */

const RadioButton = ({
	value,
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
		<div className='flex items-center gap-3'>
			<input
				id={id}
				type='radio'
				value={value}
				checked={checked}
				onChange={onChange}
				disabled={disabled}
				className={`w-5 h-5 cursor-pointer
					${error ? 'border-red-500' : 'border-[var(--app-color-border)]'}
					accent-[var(--app-color-primary)]
					disabled:opacity-50 disabled:cursor-not-allowed
					${className}`}
				{...props}
			/>
			{label && (
				<label
					htmlFor={id}
					className={`text-sm font-medium cursor-pointer select-none
						${disabled ? 'opacity-50 cursor-not-allowed' : ''}
						${error ? 'text-red-600' : 'text-[var(--app-color-text)]'}`}
				>
					{label}
				</label>
			)}
		</div>
	);
};

export default RadioButton;
