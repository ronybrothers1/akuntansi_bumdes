import React, { useEffect, useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Building, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
  };

  const stats = [
    { name: 'Total Kas & Bank', value: data?.totalKas || 0, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Total Aset', value: data?.totalAset || 0, icon: Building, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Total Kewajiban', value: data?.totalKewajiban || 0, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
    { name: 'Total Modal', value: data?.totalModal || 0, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Laba/Rugi Berjalan', value: data?.labaRugi || 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];

  // Mock chart data for now
  const chartData = [
    { name: 'Jan', pendapatan: 4000000, beban: 2400000 },
    { name: 'Feb', pendapatan: 3000000, beban: 1398000 },
    { name: 'Mar', pendapatan: 2000000, beban: 9800000 },
    { name: 'Apr', pendapatan: 2780000, beban: 3908000 },
    { name: 'Mei', pendapatan: 1890000, beban: 4800000 },
    { name: 'Jun', pendapatan: 2390000, beban: 3800000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Keuangan</h2>
        <Link to="/journals/create" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
          <Wallet className="w-4 h-4 mr-2" />
          Tambah Transaksi
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(stat.value)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Arus Kas (6 Bulan Terakhir)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(value) => `Rp ${value/1000000}M`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="pendapatan" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Pendapatan" />
                <Bar dataKey="beban" fill="#ef4444" radius={[4, 4, 0, 0]} name="Beban" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Transaksi Terbaru</h3>
            <Link to="/journals" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Lihat Semua</Link>
          </div>
          <div className="space-y-4">
            {data?.recentTransactions?.length > 0 ? (
              data.recentTransactions.map((trx: any) => (
                <div key={trx.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-slate-50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{trx.reference}</p>
                      <p className="text-xs text-slate-500">{new Date(trx.date).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(trx.amount)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      trx.status === 'Posted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {trx.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Belum ada transaksi</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
