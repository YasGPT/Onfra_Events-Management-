import { NavLink } from 'react-router-dom';

import { Icon } from '../../components/common';
import type { IconName } from '../../components/common';

interface QuickLink {
  label: string;
  description: string;
  path: string;
  icon: IconName;
}

const links: QuickLink[] = [
  {
    label: 'Manage events',
    description: 'Search, filter and manage events',
    path: '/events',
    icon: 'calendar',
  },
  {
    label: 'Manage attendees',
    description: 'Register attendees and control their access',
    path: '/attendees',
    icon: 'users',
  },
];

/** Jump-off from the dashboard into the modules that are live. */
export function QuickLinks() {
  return (
    <section className="panel">
      <header className="panel__head">
        <span className="panel__icon">
          <Icon name="grid" />
        </span>
        <div>
          <h3>Ready to use</h3>
          <p>These modules are wired to the API</p>
        </div>
      </header>

      <div className="quick-links">
        {links.map((link) => (
          <NavLink key={link.path} className="quick-links__item" to={link.path}>
            <Icon name={link.icon} />
            <span>
              <strong>{link.label}</strong>
              <em>{link.description}</em>
            </span>
            <Icon name="arrow" />
          </NavLink>
        ))}
      </div>
    </section>
  );
}

export default QuickLinks;
