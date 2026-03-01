import React, { useEffect, useState } from 'react';
import { Download, Calendar, Search, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { exportToPDF, exportToExcel } from '../lib/export';

export default function Ledger() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetch('/api/accounts')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch accounts');
        return res.json();
      })
      .then(data => {
        setAccounts(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) setSelectedAccount(data[0].id.toString());
      })
      .catch(err => {
        console.error(err);
        setAccounts([]);
      });
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchData();
    }
  }, [selectedAccount, startDate, endDate]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/reports/ledger?account_id=${selectedAccount}&start_date=${startDate}&end_date=${endDate}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch ledger');
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setData(null);
        setLoading(false);
      });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
  };

  let runningBalance = data?.openingBalance || 0;

  const getExportRows = () => {
    const rows: any[][] = [];
    
    // Saldo Awal
    rows.push([
      format(new Date(startDate), 'dd MMM yyyy'),
      '-',
      'Saldo Awal',
      '-',
      '-',
      formatCurrency(data?.openingBalance || 0)
    ]);

    let currentBalance = data?.openingBalance || 0;

    // Transaksi
    if (data?.transactions?.length > 0) {
      data.transactions.forEach((trx: any) => {
        currentBalance += (trx.debit - trx.credit);
        rows.push([
          format(new Date(trx.date), 'dd MMM yyyy'),
          trx.reference,
          trx.detail_desc || trx.journal_desc || '-',
          trx.debit > 0 ? formatCurrency(trx.debit) : '-',
          trx.credit > 0 ? formatCurrency(trx.credit) : '-',
          formatCurrency(currentBalance)
        ]);
      });
    }

    // Saldo Akhir
    rows.push([
      format(new Date(endDate), 'dd MMM yyyy'),
      '-',
      'Saldo Akhir',
      formatCurrency(data?.transactions?.reduce((sum: number, t: any) => sum + t.debit, 0) || 0),
      formatCurrency(data?.transactions?.reduce((sum: number, t: any) => sum + t.credit, 0) || 0),
      formatCurrency(currentBalance)
    ]);

    return rows;
  };

  const handleExportPDF = () => {
    const account = accounts.find(a => a.id.toString() === selectedAccount);
    const accountName = account ? `${account.code} - ${account.name}` : '';

    exportToPDF(
      `Buku Besar: ${accountName}`,
      `Periode ${format(new Date(startDate), 'dd MMM yyyy')} s/d ${format(new Date(endDate), 'dd MMM yyyy')}`,
      ['Tanggal', 'Referensi', 'Keterangan', 'Debit (Rp)', 'Kredit (Rp)', 'Saldo (Rp)'],
      getExportRows()
    );
  };

  const handleExportExcel = () => {
    const account = accounts.find(a => a.id.toString() === selectedAccount);
    const accountName = account ? `${account.code} - ${account.name}` : '';
    
    const rows: any[][] = [];
    
    // Saldo Awal
    rows.push([
      format(new Date(startDate), 'dd MMM yyyy'),
      '-',
      'Saldo Awal',
      0,
      0,
      data?.openingBalance || 0
    ]);

    let currentBalance = data?.openingBalance || 0;

    // Transaksi
    if (data?.transactions?.length > 0) {
      data.transactions.forEach((trx: any) => {
        currentBalance += (trx.debit - trx.credit);
        rows.push([
          format(new Date(trx.date), 'dd MMM yyyy'),
          trx.reference,
          trx.detail_desc || trx.journal_desc || '-',
          trx.debit || 0,
          trx.credit || 0,
          currentBalance
        ]);
      });
    }

    // Saldo Akhir
    rows.push([
      format(new Date(endDate), 'dd MMM yyyy'),
      '-',
      'Saldo Akhir',
      data?.transactions?.reduce((sum: number, t: any) => sum + t.debit, 0) || 0,
      data?.transactions?.reduce((sum: number, t: any) => sum + t.credit, 0) || 0,
      currentBalance
    ]);

    exportToExcel(
      `Buku Besar - ${accountName}`,
      ['Tanggal', 'Referensi', 'Keterangan', 'Debit', 'Kredit', 'Saldo'],
      rows
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Buku Besar</h2>
          <p className="text-slate-500 text-sm mt-1">Laporan rincian transaksi per akun.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm space-x-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm focus:outline-none text-slate-700 bg-transparent w-32"
            />
            <span className="text-slate-400">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm focus:outline-none text-slate-700 bg-transparent w-32"
            />
          </div>
          <button onClick={handleExportPDF} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-sm">
            <Download className="w-4 h-4 mr-2" />
            PDF
          </button>
          <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center shadow-sm">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-slate-700">Pilih Akun:</label>
            <select 
              value={selectedAccount} 
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-64 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Referensi</th>
                <th className="px-6 py-3">Keterangan</th>
                <th className="px-6 py-3 text-right">Debit</th>
                <th className="px-6 py-3 text-right">Kredit</th>
                <th className="px-6 py-3 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Saldo Awal */}
              <tr className="bg-slate-50 font-medium text-slate-700">
                <td className="px-6 py-4" colSpan={3}>Saldo Awal per {format(new Date(startDate), 'dd MMM yyyy')}</td>
                <td className="px-6 py-4 text-right">-</td>
                <td className="px-6 py-4 text-right">-</td>
                <td className="px-6 py-4 text-right font-mono">{formatCurrency(data?.openingBalance || 0)}</td>
              </tr>
              
              {/* Transaksi */}
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : data?.transactions?.length > 0 ? (
                data.transactions.map((trx: any, idx: number) => {
                  runningBalance += (trx.debit - trx.credit);
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">{format(new Date(trx.date), 'dd MMM yyyy')}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{trx.reference}</td>
                      <td className="px-6 py-4 max-w-xs truncate" title={trx.detail_desc || trx.journal_desc}>
                        {trx.detail_desc || trx.journal_desc || '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-800">{trx.debit > 0 ? formatCurrency(trx.debit) : '-'}</td>
                      <td className="px-6 py-4 text-right font-mono text-slate-800">{trx.credit > 0 ? formatCurrency(trx.credit) : '-'}</td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">{formatCurrency(runningBalance)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada transaksi pada periode ini.
                  </td>
                </tr>
              )}
              
              {/* Saldo Akhir */}
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="px-6 py-4" colSpan={3}>Saldo Akhir per {format(new Date(endDate), 'dd MMM yyyy')}</td>
                <td className="px-6 py-4 text-right font-mono text-slate-700">
                  {formatCurrency(data?.transactions?.reduce((sum: number, t: any) => sum + t.debit, 0) || 0)}
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-700">
                  {formatCurrency(data?.transactions?.reduce((sum: number, t: any) => sum + t.credit, 0) || 0)}
                </td>
                <td className="px-6 py-4 text-right font-mono text-indigo-700">{formatCurrency(runningBalance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
