/**
 * FormGroup Component
 * Wrapper for grouping related form fields
 */

const FormGroup = ({
	children,
	title = '',
	subtitle = '',
	className = '',
	...props
}) => {
	return (
		<div className={`space-y-4 ${className}`} {...props}>
			{(title || subtitle) && (
				<div className='mb-4'>
					{title && <h3 className='text-lg font-semibold text-[var(--app-color-text)]'>{title}</h3>}
					{subtitle && <p className='text-sm text-[var(--app-color-text-muted)] mt-1'>{subtitle}</p>}
				</div>
			)}
			{children}
		</div>
	);
};

export default FormGroup;
