import { Brand, Icon } from '../../components/common';

const platformBenefits = [
  'Manage every event from one dashboard',
  'Real-time attendee and performance insights',
  'Enterprise-grade access and data security',
];

export function LoginShowcase() {
  return (
    <section className="login-showcase" aria-label="CONFRA event management">
      <div className="showcase-orb showcase-orb--one" />
      <div className="showcase-orb showcase-orb--two" />

      <Brand variant="light" />

      <div className="showcase-copy">
        <span className="eyebrow"><span /> Built for remarkable events</span>
        <h1>Everything your event needs. <em>One powerful place.</em></h1>
        <p>
          Bring your team, attendees, and event operations together with a workspace
          designed for effortless execution.
        </p>

        <div className="feature-list" aria-label="Platform benefits">
          {platformBenefits.map((benefit) => (
            <div key={benefit}>
              <span><Icon name="check" /></span>
              {benefit}
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-preview" aria-hidden="true">
        <div className="preview-header">
          <span className="preview-avatar">AC</span>
          <div><strong>Annual Conference</strong><small>Event overview</small></div>
          <span className="preview-live"><i /> Live</span>
        </div>
        <div className="preview-stats">
          <div><small>Registrations</small><strong>2,480</strong><span>+18.4%</span></div>
          <div><small>Check-ins</small><strong>1,864</strong><span>75.2%</span></div>
          <div className="preview-chart"><i /><i /><i /><i /><i /><i /><i /></div>
        </div>
      </div>

      <p className="showcase-footer">Trusted event infrastructure · Secure by design</p>
    </section>
  );
}

export default LoginShowcase;
