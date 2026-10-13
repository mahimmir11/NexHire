import React from 'react';
import { PublicLayout } from '../../components/public/PublicLayout';
import { HeroSection } from '../../components/public/HeroSection';
import { WhatIsNexHireSection } from '../../components/public/WhatIsNexHireSection';
import { FeaturesSection } from '../../components/public/FeaturesSection';
import { HowItWorksSection } from '../../components/public/HowItWorksSection';
import { RoleBasedSection } from '../../components/public/RoleBasedSection';
import { StatisticsSection } from '../../components/public/StatisticsSection';
import { BlogSectionPreview } from '../../components/public/BlogSectionPreview';
import { AboutSectionPreview } from '../../components/public/AboutSectionPreview';
import { CtaSection } from '../../components/public/CtaSection';

export const HomePage: React.FC = () => {
  return (
    <PublicLayout>
      <HeroSection />
      <WhatIsNexHireSection />
      <FeaturesSection />
      <HowItWorksSection />
      <RoleBasedSection />
      <StatisticsSection />
      <BlogSectionPreview />
      <AboutSectionPreview />
      <CtaSection />
    </PublicLayout>
  );
};
