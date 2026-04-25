import React from 'react';
import Loader from './loadnet';

const GlobalLoader = ({ showTagline = false, isExiting = false }) => {
	return (
		<div
			className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[var(--app-gradient-auth-login)] ${
				isExiting ? 'animate-loader-exit' : ''
			}`}
			style={{ background: 'var(--app-gradient-auth-login)' }}
		>
			{/* Animated Background Elements */}
			<div className='absolute inset-0 opacity-20'>
				<div className='absolute -left-1/4 -top-1/4 h-1/2 w-1/2 animate-pulse rounded-full bg-teal-500/20 blur-[120px]' />
				<div className='absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 animate-pulse rounded-full bg-indigo-500/20 blur-[120px]' />
			</div>

			<div className='relative flex flex-col items-center gap-12'>
				<div className='scale-150'>
					<Loader size={1.8} color='var(--app-color-primary)' />
				</div>

				{showTagline && (
					<div className='animate-tagline-reveal space-y-2 text-center'>
						<h1 className='text-3xl font-black uppercase tracking-tighter text-white lg:text-4xl italic skew-x-[-6deg]'>
							You Created It. <br />
							<span className='text-teal-400'>Don't Let Someone Else Own It.</span>
						</h1>
						<div className='mx-auto h-[3px] w-12 rounded-full bg-teal-500/50' />
					</div>
				)}
			</div>

			{/* Loading Progress Indicator (Subtle) */}
			{!showTagline && (
				<div className='absolute bottom-12 flex flex-col items-center gap-4'>
					<div className='h-1 w-32 overflow-hidden rounded-full bg-white/10'>
						<div className='h-full w-1/2 animate-[progress_2s_ease-in-out_infinite] bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]' />
					</div>
					<p className='text-[10px] font-bold uppercase tracking-[0.3em] text-white/40'>Establishing Secure Connection</p>
				</div>
			)}
		</div>
	);
};

export default GlobalLoader;
