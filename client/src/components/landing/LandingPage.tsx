import React from 'react';
import Hero from './Hero';
import Features from './Features';
import UseCases from './UseCases';
import Pricing from './Pricing';
import Testimonials from './Testimonials';
import FinalCTA from './FinalCTA';
import Footer from './Footer';
import LandingNavbar from './LandingNavbar';

const LandingPage: React.FC = () => {
	return (
		<div className='min-h-screen bg-white'>
			<LandingNavbar />
			<main>
				<Hero />
				<section id='features'>
					<Features />
				</section>
				<UseCases />
				<section id='pricing'>
					<Pricing />
				</section>
				<Testimonials />
				<FinalCTA />
			</main>
			<Footer />
		</div>
	);
};

export default LandingPage;
