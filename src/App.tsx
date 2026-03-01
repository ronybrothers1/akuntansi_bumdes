/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Accounts from './pages/Accounts';
import Units from './pages/Units';
import Journals from './pages/Journals';
import CreateJournal from './pages/CreateJournal';
import BalanceSheet from './pages/BalanceSheet';
import IncomeStatement from './pages/IncomeStatement';
import Ledger from './pages/Ledger';
import Receipts from './pages/Receipts';
import Payments from './pages/Payments';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="units" element={<Units />} />
          <Route path="journals" element={<Journals />} />
          <Route path="journals/create" element={<CreateJournal />} />
          <Route path="receipts" element={<Receipts />} />
          <Route path="payments" element={<Payments />} />
          <Route path="balance-sheet" element={<BalanceSheet />} />
          <Route path="income-statement" element={<IncomeStatement />} />
          <Route path="ledger" element={<Ledger />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
