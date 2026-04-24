/**
 * Grid Component
 * Responsive grid layout for organizing content
 */

const Grid = ({
	children,
	cols = { default: 1, sm: 1, md: 2, lg: 3, xl: 4 },
	gap = 'gap-6',
	className = '',
	...props
}) => {
	return (
		<div className={`grid ${gap} ${className}`} style={{
			gridTemplateColumns: `repeat(auto-fill, minmax(${cols.minWidth || '250px'}, 1fr))`
		}} {...props}>
			{children}
		</div>
	);
};

export default Grid;
