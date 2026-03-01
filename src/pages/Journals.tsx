import React, { useEffect, useState } from 'react';
import { Plus, Search, FileText, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

import { Link } from 'react-router-dom';

export default function Journals() {
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/journals')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch journals');
        return res.json();
      })
      .then(data => {
        setJournals(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setJournals([]);
        setLoading(false);
      });
  }, []);

  const handlePost = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin memposting jurnal ini? Jurnal yang diposting tidak dapat diubah.')) return;
    
    try {
      await fetch(`/api/journals/${id}/post`, { method: 'PUT' });
      setJournals(journals.map(j => j.id === id ? { ...j, status: 'Posted' } : j));
    } catch (error) {
      console.error(error);
      alert('Gagal memposting jurnal');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
  };

  const filteredJournals = journals.filter(j => 
    j.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Jurnal Umum</h2>
          <p className="text-slate-500 text-sm mt-1">Daftar transaksi jurnal umum BUMDes.</p>
        </div>
        <Link to="/journals/create" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Jurnal
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari referensi/keterangan..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Referensi</th>
                <th className="px-6 py-3">Keterangan</th>
                <th className="px-6 py-3">Unit Usaha</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredJournals.map((journal) => (
                <tr key={journal.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{format(new Date(journal.date), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{journal.reference}</td>
                  <td className="px-6 py-4 max-w-xs truncate" title={journal.description}>{journal.description || '-'}</td>
                  <td className="px-6 py-4">{journal.unit_name || '-'}</td>
                  <td className="px-6 py-4 text-right font-mono font-medium">{formatCurrency(journal.total_amount || 0)}</td>
                  <td className="px-6 py-4 text-center">
                    {journal.status === 'Posted' ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Posted
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors" title="Detail">
                      <FileText className="w-4 h-4 inline" />
                    </button>
                    {journal.status === 'Draft' && (
                      <button 
                        onClick={() => handlePost(journal.id)}
                        className="text-slate-400 hover:text-emerald-600 transition-colors" 
                        title="Post Jurnal"
                      >
                        <CheckCircle className="w-4 h-4 inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredJournals.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data jurnal ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
