import { useState } from 'react';
import { Layout, type PageKey } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Members } from '@/pages/Members';
import { Billing } from '@/pages/Billing';
import { Recurring } from '@/pages/Recurring';
import { Payments } from '@/pages/Payments';
import { Accounting } from '@/pages/Accounting';
import { Reports } from '@/pages/Reports';

function App() {
  const [page, setPage] = useState<PageKey>('dashboard');
  const [search, setSearch] = useState('');

  const handleNavigate = (key: PageKey) => {
    setPage(key);
    setSearch('');
  };

  return (
    <Layout
      current={page}
      onNavigate={handleNavigate}
      search={search}
      onSearchChange={setSearch}
    >
      {page === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
      {page === 'members' && <Members search={search} />}
      {page === 'billing' && <Billing search={search} />}
      {page === 'recurring' && <Recurring search={search} />}
      {page === 'payments' && <Payments search={search} />}
      {page === 'accounting' && <Accounting />}
      {page === 'reports' && <Reports />}
    </Layout>
  );
}

export default App;
