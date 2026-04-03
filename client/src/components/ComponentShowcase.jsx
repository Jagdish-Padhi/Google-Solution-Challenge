/**
 * Component Showcase / Example Page
 * Demonstrates all available components and their usage
 * 
 * Usage: Import this component and add it to a route to see all components in action
 * Example: <Route path="/components" element={<ComponentShowcase />} />
 */

import { useState } from 'react';
import {
	Button,
	Input,
	TextArea,
	Select,
	Card,
	Badge,
	Alert,
	Spinner,
	Checkbox,
	Toggle,
	RadioButton,
	FormGroup,
	Container,
	Header,
	PageHeader,
	Grid,
	Table,
	StatCard,
	ListItem,
	Avatar,
	EmptyState,
	Pagination,
	Modal,
	Breadcrumb,
	Skeleton,
	Collapse,
	ProgressBar,
	Chip,
	Toast,
} from './index';

const ComponentShowcase = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedTab, setSelectedTab] = useState('buttons');
	const [toasts, setToasts] = useState([]);

	const addToast = (type, message) => {
		const id = Date.now();
		setToasts((prev) => [...prev, { id, type, message }]);
	};

	const removeToast = (id) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	};

	return (
		<>
			<Header
				logo='SportShield Components'
				navItems={[{ label: 'Home', href: '/' }]}
				userMenu={<Avatar initials='JD' />}
			/>

			<Container className='py-8'>
				<PageHeader title='UI Component Showcase' subtitle='Complete component library with examples' />

				{/* Navigation */}
				<div className='flex gap-2 mb-8 flex-wrap'>
					{['buttons', 'inputs', 'cards', 'layout', 'data', 'advanced'].map((tab) => (
						<Button
							key={tab}
							variant={selectedTab === tab ? 'primary' : 'secondary'}
							size='sm'
							onClick={() => setSelectedTab(tab)}
						>
							{tab.charAt(0).toUpperCase() + tab.slice(1)}
						</Button>
					))}
				</div>

				{/* Buttons Section */}
				{selectedTab === 'buttons' && (
					<div className='space-y-8'>
						<Card title='Buttons' subtitle='Various button variants and states'>
							<div className='space-y-6'>
								<div>
									<h4 className='text-sm font-semibold mb-3'>Primary Buttons</h4>
									<div className='flex flex-wrap gap-3'>
										<Button variant='primary' size='sm'>
											Small
										</Button>
										<Button variant='primary' size='md'>
											Medium
										</Button>
										<Button variant='primary' size='lg'>
											Large
										</Button>
										<Button variant='primary' loading>
											Loading
										</Button>
										<Button variant='primary' disabled>
											Disabled
										</Button>
									</div>
								</div>

								<div>
									<h4 className='text-sm font-semibold mb-3'>Other Variants</h4>
									<div className='flex flex-wrap gap-3'>
										<Button variant='secondary'>Secondary</Button>
										<Button variant='tertiary'>Tertiary</Button>
										<Button variant='success'>Success</Button>
										<Button variant='danger'>Danger</Button>
									</div>
								</div>
							</div>
						</Card>

						<Card title='Badges' subtitle='Status indicators and labels'>
							<div className='flex flex-wrap gap-3'>
								<Badge variant='default'>Default</Badge>
								<Badge variant='primary'>Primary</Badge>
								<Badge variant='success'>Active</Badge>
								<Badge variant='warning'>Warning</Badge>
								<Badge variant='danger'>Error</Badge>
								<Badge variant='info'>Info</Badge>
								<Badge variant='outline'>Outline</Badge>
							</div>
						</Card>

						<Card title='Alerts' subtitle='Notification and alert messages'>
							<div className='space-y-3'>
								<Alert type='success' title='Success!' message='Operation completed successfully.' />
								<Alert type='error' title='Error' message='Something went wrong. Please try again.' />
								<Alert type='warning' title='Warning' message='Please check your input before proceeding.' />
								<Alert type='info' message='This is an informational message.' />
							</div>
						</Card>

						<Card title='Spinner' subtitle='Loading states'>
							<div className='flex gap-8'>
								<Spinner size='sm' />
								<Spinner size='md' />
								<Spinner size='lg' variant='secondary' />
								<Spinner size='xl' />
							</div>
						</Card>
					</div>
				)}

				{/* Input Section */}
				{selectedTab === 'inputs' && (
					<div className='space-y-8'>
						<Card title='Text Inputs'>
							<FormGroup title='Input Fields' subtitle='Different input types'>
								<Input label='Full Name' placeholder='Enter your name' />
								<Input label='Email' type='email' placeholder='user@example.com' />
								<Input label='With Error' error='Email is required' />
								<Input label='With Helper Text' helperText='Enter a valid email address' />
							</FormGroup>
						</Card>

						<Card title='Text Area'>
							<TextArea
								label='Description'
								placeholder='Enter description here...'
								rows={4}
								maxLength={500}
								helperText='Maximum 500 characters'
							/>
						</Card>

						<Card title='Select & Dropdowns'>
							<Select
								label='Category'
								options={[
									{ value: 'sports', label: 'Sports' },
									{ value: 'health', label: 'Health' },
									{ value: 'fitness', label: 'Fitness' },
								]}
								placeholder='Select a category'
							/>
						</Card>

						<Card title='Checkboxes'>
							<div className='space-y-3'>
								<Checkbox label='I agree to terms' />
								<Checkbox label='Subscribe to updates' />
								<Checkbox label='Disabled checkbox' disabled />
							</div>
						</Card>

						<Card title='Radio Buttons'>
							<div className='space-y-3'>
								<RadioButton label='Option 1' value='opt1' />
								<RadioButton label='Option 2' value='opt2' />
								<RadioButton label='Option 3' value='opt3' />
							</div>
						</Card>

						<Card title='Toggle Switches'>
							<div className='space-y-3'>
								<Toggle label='Enable notifications' />
								<Toggle label='Dark mode' />
								<Toggle label='Disabled toggle' disabled />
							</div>
						</Card>
					</div>
				)}

				{/* Cards Section */}
				{selectedTab === 'cards' && (
					<div className='space-y-8'>
						<Card title='Basic Card' subtitle='Standard card component'>
							<p>This is a card with default styling. Cards are versatile containers for content.</p>
						</Card>

						<Card title='Elevated Card' elevated={true} subtitle='With elevated styling'>
							<p>This card has elevation enabled for more prominence.</p>
						</Card>

						<Card
							title='Card with Footer'
							footer={
								<div className='flex gap-3'>
									<Button size='sm'>Action 1</Button>
									<Button size='sm' variant='secondary'>
										Action 2
									</Button>
								</div>
							}
						>
							<p>This card includes a footer with action buttons.</p>
						</Card>

						<div>
							<h3 className='text-lg font-semibold mb-4'>StatCards</h3>
							<Grid>
								<StatCard label='Total Users' value='1,234' trend='+12%' trendUp={true} />
								<StatCard label='Active Sessions' value='567' trend='-5%' trendUp={false} />
								<StatCard label='Total Revenue' value='$12,450' trend='+8%' trendUp={true} />
							</Grid>
						</div>
					</div>
				)}

				{/* Layout Section */}
				{selectedTab === 'layout' && (
					<div className='space-y-8'>
						<Card title='Grid Layout'>
							<Grid>
								<Card title='Item 1'>Grid item content</Card>
								<Card title='Item 2'>Grid item content</Card>
								<Card title='Item 3'>Grid item content</Card>
								<Card title='Item 4'>Grid item content</Card>
							</Grid>
						</Card>

						<Card title='Breadcrumbs'>
							<Breadcrumb
								items={[
									{ label: 'Home', href: '/' },
									{ label: 'Components', href: '/components' },
									{ label: 'Showcase' },
								]}
							/>
						</Card>

						<Card title='List Items'>
							<ListItem title='Item 1' description='Description for item 1' value='$100' />
							<ListItem title='Item 2' description='Description for item 2' value='$200' />
							<ListItem title='Item 3' description='Description for item 3' value='$300' divider={false} />
						</Card>

						<Card title='Avatars'>
							<div className='flex gap-4'>
								<Avatar initials='JD' size='sm' />
								<Avatar initials='AB' size='md' />
								<Avatar initials='XY' size='lg' />
							</div>
						</Card>

						<Card title='FormGroup'>
							<FormGroup title='User Information' subtitle='Enter your details'>
								<Input label='Full Name' />
								<Input label='Email' type='email' />
								<Input label='Phone' type='tel' />
							</FormGroup>
						</Card>
					</div>
				)}

				{/* Data Section */}
				{selectedTab === 'data' && (
					<div className='space-y-8'>
						<Card title='Table'>
							<Table
								columns={[
									{ key: 'name', label: 'Name' },
									{ key: 'email', label: 'Email' },
									{ key: 'status', label: 'Status' },
								]}
								data={[
									{ name: 'John Doe', email: 'john@example.com', status: 'Active' },
									{ name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
									{ name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' },
								]}
							/>
						</Card>

						<Card title='Empty State'>
							<EmptyState title='No data found' message='Start by creating your first item.' />
						</Card>

						<Card title='Pagination'>
							<Pagination currentPage={1} totalPages={5} onPageChange={() => {}} hasNextPage={true} />
						</Card>

						<Card title='Progress Bar'>
							<div className='space-y-6'>
								<div>
									<p className='text-sm font-semibold mb-3'>Basic Progress</p>
									<ProgressBar value={60} max={100} label='60%' />
								</div>
								<div>
									<p className='text-sm font-semibold mb-3'>Color Variants</p>
									<ProgressBar value={40} max={100} color='success' label='Success' />
									<ProgressBar value={70} max={100} color='warning' label='Warning' className='mt-4' />
									<ProgressBar value={90} max={100} color='danger' label='Danger' className='mt-4' />
								</div>
							</div>
						</Card>
					</div>
				)}

				{/* Advanced Section */}
				{selectedTab === 'advanced' && (
					<div className='space-y-8'>
						<Card title='Skeleton Loading'>
							<div className='space-y-3'>
								<Skeleton count={3} height='1rem' />
							</div>
						</Card>

						<Card title='Collapse/Accordion'>
							<Collapse
								items={[
									{ title: 'Section 1', content: 'Content for section 1' },
									{ title: 'Section 2', content: 'Content for section 2' },
									{ title: 'Section 3', content: 'Content for section 3' },
								]}
							/>
						</Card>

						<Card title='Chips'>
							<div className='flex flex-wrap gap-2'>
								<Chip label='React' />
								<Chip label='Tailwind' onRemove={() => {}} />
								<Chip label='Remove me' variant='primary' onRemove={() => {}} />
								<Chip label='Outline' variant='outline' />
							</div>
						</Card>

						<Card title='Modal & Toast'>
							<div className='space-y-4'>
								<Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
								<Button onClick={() => addToast('success', 'Success message!')}>
									Show Toast
								</Button>
								<Button onClick={() => addToast('error', 'Error message!')} variant='danger'>
									Show Error
								</Button>
							</div>
						</Card>
					</div>
				)}
			</Container>

			{/* Modal Example */}
			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title='Example Modal'
				footer={
					<>
						<Button variant='secondary' size='sm' onClick={() => setIsModalOpen(false)}>
							Cancel
						</Button>
						<Button size='sm' onClick={() => setIsModalOpen(false)}>
							Confirm
						</Button>
					</>
				}
			>
				<p>This is an example modal. You can include any content here and define custom actions in the footer.</p>
			</Modal>

			{/* Toast Container */}
			<div className='fixed bottom-4 right-4 space-y-2 z-50'>
				{toasts.map((toast) => (
					<Toast
						key={toast.id}
						type={toast.type}
						message={toast.message}
						id={toast.id}
						onClose={removeToast}
						duration={5000}
					/>
				))}
			</div>
		</>
	);
};

export default ComponentShowcase;
