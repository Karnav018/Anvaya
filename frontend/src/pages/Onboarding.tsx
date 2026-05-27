import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrgStore } from '../store/orgStore';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';

export default function Onboarding() {
  const navigate = useNavigate();
  const orgs = useOrgStore((s) => s.orgs);
  const setActiveOrg = useOrgStore((s) => s.setActiveOrg);

  // If the user already has at least one org, bounce to it.
  useEffect(() => {
    if (orgs.length > 0) {
      const target = orgs[0];
      setActiveOrg(target.slug);
      navigate(`/o/${target.slug}/dashboard`, { replace: true });
    }
  }, [orgs, navigate, setActiveOrg]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <OnboardingWizard />
    </div>
  );
}
