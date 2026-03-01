import React, { useEffect, useState } from 'react';
import { Download, Calendar, FileSpreadsheet } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../lib/export';

export default function IncomeStatement() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/reports/income-statement?start_date=${startDate}&end_date=${endDate}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch income statement');
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

  if (loading && !data) return <div className="flex items-center justify-center p-12">Loading...</div>;

  // Process data for rendering
  const revenues = data?.balances?.filter((a: any) => a.type === 'Revenue') || [];
  const expenses = data?.balances?.filter((a: any) => a.type === 'Expense') || [];
  
  const totalRevenue = revenues.reduce((sum: number, a: any) => sum + a.balance, 0);
  const totalExpense = expenses.reduce((sum: number, a: any) => sum + Math.abs(a.balance), 0); // Expenses are negative balances (debit - credit)
  
  const netIncome = totalRevenue - totalExpense;

  const getExportRows = () => {
    const rows: any[][] = [];
    
    rows.push([{ content: 'PENDAPATAN', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }]);
    revenues.forEach((a: any) => {
      if (a.balance !== 0) rows.push([`${a.code} - ${a.name}`, formatCurrency(a.balance)]);
    });
    rows.push([{ content: 'Total Pendapatan', styles: { fontStyle: 'bold' } }, { content: formatCurrency(totalRevenue), styles: { fontStyle: 'bold' } }]);
    
    rows.push([{ content: 'BEBAN (PENGELUARAN)', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }]);
    expenses.forEach((a: any) => {
      if (a.balance !== 0) rows.push([`${a.code} - ${a.name}`, formatCurrency(Math.abs(a.balance))]);
    });
    rows.push([{ content: 'Total Beban', styles: { fontStyle: 'bold' } }, { content: formatCurrency(totalExpense), styles: { fontStyle: 'bold' } }]);

    rows.push([{ content: 'LABA (RUGI) BERSIH', styles: { fontStyle: 'bold' } }, { content: formatCurrency(netIncome), styles: { fontStyle: 'bold' } }]);

    return rows;
  };

  const handleExportPDF = () => {
    exportToPDF(
      'Laporan Laba Rugi',
      `Periode ${new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} s/d ${new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      ['Keterangan', 'Nilai (Rp)'],
      getExportRows()
    );
  };

  const handleExportExcel = () => {
    const rows: any[][] = [];
    
    rows.push(['PENDAPATAN', '']);
    revenues.forEach((a: any) => {
      if (a.balance !== 0) rows.push([`${a.code} - ${a.name}`, a.balance]);
    });
    rows.push(['Total Pendapatan', totalRevenue]);
    rows.push(['', '']);
    
    rows.push(['BEBAN (PENGELUARAN)', '']);
    expenses.forEach((a: any) => {
      if (a.balance !== 0) rows.push([`${a.code} - ${a.name}`, Math.abs(a.balance)]);
    });
    rows.push(['Total Beban', totalExpense]);
    rows.push(['', '']);

    rows.push(['LABA (RUGI) BERSIH', netIncome]);

    exportToExcel(
      'Laporan Laba Rugi',
      ['Keterangan', 'Nilai'],
      rows
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Laporan Laba Rugi</h2>
          <p className="text-slate-500 text-sm mt-1">Laporan kinerja keuangan BUMDes untuk periode tertentu.</p>
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wide">BUMDes Maju Bersama</h1>
          <h2 className="text-lg font-semibold text-slate-700 mt-1">Laporan Laba Rugi</h2>
          <p className="text-sm text-slate-500 mt-1">
            Periode {new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} s/d {new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Revenues */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 border-b-2 border-slate-800 pb-2 mb-4">PENDAPATAN</h3>
            <div className="space-y-2 pl-4">
              {revenues.map((acc: any) => {
                if (acc.balance === 0) return null;
                return (
                  <div key={acc.id} className="flex justify-between text-sm py-1">
                    <span className="text-slate-700"><span className="text-slate-400 mr-2 font-mono text-xs">{acc.code}</span>{acc.name}</span>
                    <span className="font-mono text-slate-900">{formatCurrency(acc.balance)}</span>
                  </div>
                );
              })}
              {revenues.length === 0 || totalRevenue === 0 ? (
                <div className="text-sm text-slate-500 italic py-1">Tidak ada pendapatan</div>
              ) : null}
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center pl-4">
              <span className="font-semibold text-slate-800 text-sm">Total Pendapatan</span>
              <span className="font-bold font-mono text-emerald-700 text-sm">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>

          {/* Expenses */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 border-b-2 border-slate-800 pb-2 mb-4">BEBAN (PENGELUARAN)</h3>
            <div className="space-y-2 pl-4">
              {expenses.map((acc: any) => {
                if (acc.balance === 0) return null;
                return (
                  <div key={acc.id} className="flex justify-between text-sm py-1">
                    <span className="text-slate-700"><span className="text-slate-400 mr-2 font-mono text-xs">{acc.code}</span>{acc.name}</span>
                    <span className="font-mono text-slate-900">{formatCurrency(Math.abs(acc.balance))}</span>
                  </div>
                );
              })}
              {expenses.length === 0 || totalExpense === 0 ? (
                <div className="text-sm text-slate-500 italic py-1">Tidak ada beban</div>
              ) : null}
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center pl-4">
              <span className="font-semibold text-slate-800 text-sm">Total Beban</span>
              <span className="font-bold font-mono text-red-700 text-sm">{formatCurrency(totalExpense)}</span>
            </div>
          </div>

          {/* Net Income */}
          <div className="mt-8 pt-4 border-t-4 border-slate-800 flex justify-between items-center bg-slate-50 p-4 rounded-lg">
            <span className="font-bold text-lg text-slate-900 uppercase">Laba (Rugi) Bersih</span>
            <span className={`font-bold font-mono text-xl ${netIncome >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {formatCurrency(netIncome)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
