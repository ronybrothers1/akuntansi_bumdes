import React, { useEffect, useState } from 'react';
import { Download, Search, Calendar, FileSpreadsheet } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../lib/export';

export default function BalanceSheet() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/reports/balance-sheet?as_of_date=${date}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch balance sheet');
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
  const assets = data?.balances?.filter((a: any) => a.type === 'Asset') || [];
  const liabilities = data?.balances?.filter((a: any) => a.type === 'Liability') || [];
  const equity = data?.balances?.filter((a: any) => a.type === 'Equity') || [];
  
  const totalAssets = assets.reduce((sum: number, a: any) => sum + (a.total_debit - a.total_credit), 0);
  const totalLiabilities = liabilities.reduce((sum: number, a: any) => sum + (a.total_credit - a.total_debit), 0);
  const totalEquity = equity.reduce((sum: number, a: any) => sum + (a.total_credit - a.total_debit), 0);
  const currentEarnings = data?.currentEarnings || 0;
  
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity + currentEarnings;

  const getExportRows = () => {
    const rows: any[][] = [];
    
    rows.push([{ content: 'ASET', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }]);
    assets.forEach((a: any) => {
      const balance = a.total_debit - a.total_credit;
      if (balance !== 0) rows.push([`${a.code} - ${a.name}`, formatCurrency(balance)]);
    });
    rows.push([{ content: 'Total Aset', styles: { fontStyle: 'bold' } }, { content: formatCurrency(totalAssets), styles: { fontStyle: 'bold' } }]);
    
    rows.push([{ content: 'KEWAJIBAN', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }]);
    liabilities.forEach((a: any) => {
      const balance = a.total_credit - a.total_debit;
      if (balance !== 0) rows.push([`${a.code} - ${a.name}`, formatCurrency(balance)]);
    });
    rows.push([{ content: 'Total Kewajiban', styles: { fontStyle: 'bold' } }, { content: formatCurrency(totalLiabilities), styles: { fontStyle: 'bold' } }]);

    rows.push([{ content: 'EKUITAS', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }]);
    equity.forEach((a: any) => {
      const balance = a.total_credit - a.total_debit;
      if (balance !== 0) rows.push([`${a.code} - ${a.name}`, formatCurrency(balance)]);
    });
    rows.push(['Laba/Rugi Tahun Berjalan', formatCurrency(currentEarnings)]);
    rows.push([{ content: 'Total Ekuitas', styles: { fontStyle: 'bold' } }, { content: formatCurrency(totalEquity + currentEarnings), styles: { fontStyle: 'bold' } }]);

    rows.push([{ content: 'Total Kewajiban & Ekuitas', styles: { fontStyle: 'bold' } }, { content: formatCurrency(totalLiabilitiesAndEquity), styles: { fontStyle: 'bold' } }]);

    return rows;
  };

  const handleExportPDF = () => {
    exportToPDF(
      'Laporan Posisi Keuangan (Neraca)',
      `Per ${new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      ['Keterangan', 'Nilai (Rp)'],
      getExportRows()
    );
  };

  const handleExportExcel = () => {
    const rows: any[][] = [];
    
    rows.push(['ASET', '']);
    assets.forEach((a: any) => {
      const balance = a.total_debit - a.total_credit;
      if (balance !== 0) rows.push([`${a.code} - ${a.name}`, balance]);
    });
    rows.push(['Total Aset', totalAssets]);
    rows.push(['', '']);
    
    rows.push(['KEWAJIBAN', '']);
    liabilities.forEach((a: any) => {
      const balance = a.total_credit - a.total_debit;
      if (balance !== 0) rows.push([`${a.code} - ${a.name}`, balance]);
    });
    rows.push(['Total Kewajiban', totalLiabilities]);
    rows.push(['', '']);

    rows.push(['EKUITAS', '']);
    equity.forEach((a: any) => {
      const balance = a.total_credit - a.total_debit;
      if (balance !== 0) rows.push([`${a.code} - ${a.name}`, balance]);
    });
    rows.push(['Laba/Rugi Tahun Berjalan', currentEarnings]);
    rows.push(['Total Ekuitas', totalEquity + currentEarnings]);
    rows.push(['', '']);

    rows.push(['Total Kewajiban & Ekuitas', totalLiabilitiesAndEquity]);

    exportToExcel(
      'Neraca',
      ['Keterangan', 'Nilai'],
      rows
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Neraca (Laporan Posisi Keuangan)</h2>
          <p className="text-slate-500 text-sm mt-1">Laporan posisi keuangan BUMDes pada tanggal tertentu.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-500 mr-2" />
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm focus:outline-none text-slate-700"
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
          <h2 className="text-lg font-semibold text-slate-700 mt-1">Laporan Posisi Keuangan (Neraca)</h2>
          <p className="text-sm text-slate-500 mt-1">Per {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Assets Column */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 border-b-2 border-slate-800 pb-2 mb-4">ASET</h3>
            <div className="space-y-2">
              {assets.map((acc: any) => {
                const balance = acc.total_debit - acc.total_credit;
                if (balance === 0) return null;
                return (
                  <div key={acc.id} className="flex justify-between text-sm py-1">
                    <span className="text-slate-700"><span className="text-slate-400 mr-2 font-mono text-xs">{acc.code}</span>{acc.name}</span>
                    <span className="font-mono text-slate-900">{formatCurrency(balance)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t-2 border-slate-800 flex justify-between items-center">
              <span className="font-bold text-slate-900">Total Aset</span>
              <span className="font-bold font-mono text-indigo-700">{formatCurrency(totalAssets)}</span>
            </div>
          </div>

          {/* Liabilities & Equity Column */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 border-b-2 border-slate-800 pb-2 mb-4">KEWAJIBAN</h3>
            <div className="space-y-2">
              {liabilities.map((acc: any) => {
                const balance = acc.total_credit - acc.total_debit;
                if (balance === 0) return null;
                return (
                  <div key={acc.id} className="flex justify-between text-sm py-1">
                    <span className="text-slate-700"><span className="text-slate-400 mr-2 font-mono text-xs">{acc.code}</span>{acc.name}</span>
                    <span className="font-mono text-slate-900">{formatCurrency(balance)}</span>
                  </div>
                );
              })}
              {liabilities.length === 0 || totalLiabilities === 0 ? (
                <div className="text-sm text-slate-500 italic py-1">Tidak ada kewajiban</div>
              ) : null}
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="font-semibold text-slate-800 text-sm">Total Kewajiban</span>
              <span className="font-semibold font-mono text-slate-900 text-sm">{formatCurrency(totalLiabilities)}</span>
            </div>

            <h3 className="text-lg font-bold text-slate-800 border-b-2 border-slate-800 pb-2 mt-8 mb-4">EKUITAS (MODAL)</h3>
            <div className="space-y-2">
              {equity.map((acc: any) => {
                const balance = acc.total_credit - acc.total_debit;
                if (balance === 0) return null;
                return (
                  <div key={acc.id} className="flex justify-between text-sm py-1">
                    <span className="text-slate-700"><span className="text-slate-400 mr-2 font-mono text-xs">{acc.code}</span>{acc.name}</span>
                    <span className="font-mono text-slate-900">{formatCurrency(balance)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-700"><span className="text-slate-400 mr-2 font-mono text-xs">3999</span>Laba/Rugi Tahun Berjalan</span>
                <span className="font-mono text-slate-900">{formatCurrency(currentEarnings)}</span>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="font-semibold text-slate-800 text-sm">Total Ekuitas</span>
              <span className="font-semibold font-mono text-slate-900 text-sm">{formatCurrency(totalEquity + currentEarnings)}</span>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-slate-800 flex justify-between items-center">
              <span className="font-bold text-slate-900">Total Kewajiban & Ekuitas</span>
              <span className="font-bold font-mono text-indigo-700">{formatCurrency(totalLiabilitiesAndEquity)}</span>
            </div>
          </div>
        </div>

        {/* Validation Check */}
        {Math.abs(totalAssets - totalLiabilitiesAndEquity) > 0.01 && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
            Peringatan: Neraca tidak seimbang. Selisih: {formatCurrency(Math.abs(totalAssets - totalLiabilitiesAndEquity))}
          </div>
        )}
      </div>
    </div>
  );
}
