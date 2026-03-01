import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';

export default function Accounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [formData, setFormData] = useState({ code: '', name: '', type: 'Asset' });
  const [error, setError] = useState('');

  const fetchAccounts = () => {
    setLoading(true);
    fetch('/api/accounts')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch accounts');
        return res.json();
      })
      .then(data => {
        setAccounts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setAccounts([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenModal = (account?: any) => {
    if (account) {
      setEditingAccount(account);
      setFormData({ code: account.code, name: account.name, type: account.type });
    } else {
      setEditingAccount(null);
      setFormData({ code: '', name: '', type: 'Asset' });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.code || !formData.name || !formData.type) {
      setError('Semua kolom harus diisi');
      return;
    }

    try {
      const url = editingAccount ? `/api/accounts/${editingAccount.id}` : '/api/accounts';
      const method = editingAccount ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Terjadi kesalahan');
      }

      fetchAccounts();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus akun ini?')) return;

    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Terjadi kesalahan');
      }
      fetchAccounts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.code.includes(searchTerm) || 
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && accounts.length === 0) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Chart of Accounts</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola daftar akun (perkiraan) untuk pembukuan BUMDes.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Akun
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari akun..." 
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
                <th className="px-6 py-3">Kode Akun</th>
                <th className="px-6 py-3">Nama Akun</th>
                <th className="px-6 py-3">Tipe</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-800">{account.code}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{account.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      account.type === 'Asset' ? 'bg-blue-100 text-blue-700' :
                      account.type === 'Liability' ? 'bg-red-100 text-red-700' :
                      account.type === 'Equity' ? 'bg-purple-100 text-purple-700' :
                      account.type === 'Revenue' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {account.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {account.is_system ? (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Sistem</span>
                    ) : (
                      <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Kustom</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {!account.is_system && (
                      <>
                        <button 
                          onClick={() => handleOpenModal(account)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-1" 
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button 
                          onClick={() => handleDelete(account.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1" 
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data akun ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">
                {editingAccount ? 'Edit Akun' : 'Tambah Akun Baru'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kode Akun</label>
                <input 
                  type="text" 
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="Contoh: 1110"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Akun</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contoh: Kas di Tangan"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Akun</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="Asset">Asset (Aset/Harta)</option>
                  <option value="Liability">Liability (Kewajiban/Hutang)</option>
                  <option value="Equity">Equity (Ekuitas/Modal)</option>
                  <option value="Revenue">Revenue (Pendapatan)</option>
                  <option value="Expense">Expense (Beban/Pengeluaran)</option>
                </select>
              </div>
              
              <div className="pt-4 flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
