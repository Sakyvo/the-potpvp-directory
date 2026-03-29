(async function() {
  'use strict';

  async function loadMaintenanceState() {
    try {
      const url = new URL('maintenance.json', location.href);
      url.searchParams.set('_', Date.now().toString());
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) return { active: false };
      const data = await res.json();
      return { active: !!data.active };
    } catch {
      return { active: false };
    }
  }

  const maintenanceState = await loadMaintenanceState();
  if (!maintenanceState.active) {
    location.replace('./');
    return;
  }

  const isAdmin = !!(await CodebergAPI.verifySavedToken());
  if (isAdmin) location.replace('./');
})();
