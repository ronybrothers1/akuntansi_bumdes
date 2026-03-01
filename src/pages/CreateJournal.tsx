import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

export default function CreateJournal() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: `JU-${Date.now().toString().slice(-6)}`,
    description: '',
    unit_id: '',
    status: 'Draft',
    details: [
      { account_id: '', debit: 0, credit: 0, description: '' },
      { account_id: '', debit: 0, credit: 0, description: '' }
    ]
  });

  useEffect(() => {
    fetch('/api/accounts')
      .then(res => res.json())
      .then(data => setAccounts(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
    fetch('/api/units')
      .then(res => res.json())
      .then(data => setUnits(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, []);

  const handleAddRow = () => {
    setFormData({
      ...formData,
      details: [...formData.details, { account_id: '', debit: 0, credit: 0, description: '' }]
    });
  };

  const handleRemoveRow = (index: number) => {
    if (formData.details.length <= 2) return; // Minimum 2 rows
    const newDetails = [...formData.details];
    newDetails.splice(index, 1);
    setFormData({ ...formData, details: newDetails });
  };

  const handleDetailChange = (index: number, field: string, value: string | number) => {
    const newDetails = [...formData.details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    
    // Auto-balance logic (if debit is entered, credit is 0, and vice versa)
    if (field === 'debit') {
      newDetails[index].credit = 0;
    } else if (field === 'credit') {
      newDetails[index].debit = 0;
    }
    
    setFormData({ ...formData, details: newDetails });
  };

  const totalDebit = formData.details.reduce((sum, d) => sum + Number(d.debit || 0), 0);
  const totalCredit = formData.details.reduce((sum, d) => sum + Number(d.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isBalanced) {
      alert('Total Debit dan Kredit harus seimbang (sama).');
      return;
    }
    
    // Validate empty accounts
    if (formData.details.some(d => !d.account_id)) {
      alert('Semua baris jurnal harus memilih akun.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Gagal menyimpan jurnal');
      }
      
      alert('Jurnal berhasil disimpan');
      navigate('/journals');
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/journals')}
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tambah Jurnal Umum</h2>
          <p className="text-slate-500 text-sm mt-1">Catat transaksi keuangan secara manual.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header Form */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tanggal Transaksi</label>
            <input 
              type="date" 
              required
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nomor Referensi</label>
            <input 
              type="text" 
              required
              value={formData.reference}
              onChange={e => setFormData({...formData, reference: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Unit Usaha (Opsional)</label>
            <select 
              value={formData.unit_id}
              onChange={e => setFormData({...formData, unit_id: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">-- Semua Unit --</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status Awal</label>
            <select 
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="Draft">Draft (Belum Diposting)</option>
              <option value="Posted">Posted (Langsung Masuk Buku Besar)</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2 lg:col-span-4">
            <label className="text-sm font-medium text-slate-700">Keterangan Jurnal</label>
            <input 
              type="text" 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Contoh: Pembayaran listrik bulan Januari"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Details Form */}
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-slate-700 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center">#</th>
                <th className="px-4 py-3 w-1/3">Akun</th>
                <th className="px-4 py-3">Keterangan Baris</th>
                <th className="px-4 py-3 w-40 text-right">Debit (Rp)</th>
                <th className="px-4 py-3 w-40 text-right">Kredit (Rp)</th>
                <th className="px-4 py-3 w-12 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {formData.details.map((detail, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-center text-slate-400">{index + 1}</td>
                  <td className="px-4 py-3">
                    <select 
                      required
                      value={detail.account_id}
                      onChange={e => handleDetailChange(index, 'account_id', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="">-- Pilih Akun --</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={detail.description}
                      onChange={e => handleDetailChange(index, 'description', e.target.value)}
                      placeholder="Keterangan opsional"
                      className="w-full px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      min="0"
                      value={detail.debit || ''}
                      onChange={e => handleDetailChange(index, 'debit', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-right font-mono"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      min="0"
                      value={detail.credit || ''}
                      onChange={e => handleDetailChange(index, 'credit', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-right font-mono"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      disabled={formData.details.length <= 2}
                      className="text-slate-400 hover:text-red-600 disabled:opacity-30 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-300">
              <tr>
                <td colSpan={3} className="px-4 py-4">
                  <button 
                    type="button"
                    onClick={handleAddRow}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Tambah Baris
                  </button>
                </td>
                <td className="px-4 py-4 text-right font-mono font-bold text-slate-800">
                  {formatCurrency(totalDebit)}
                </td>
                <td className="px-4 py-4 text-right font-mono font-bold text-slate-800">
                  {formatCurrency(totalCredit)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center">
            {!isBalanced && (
              <span className="text-red-600 text-sm font-medium bg-red-50 px-3 py-1 rounded-full border border-red-100">
                Selisih: {formatCurrency(Math.abs(totalDebit - totalCredit))}
              </span>
            )}
            {isBalanced && totalDebit > 0 && (
              <span className="text-emerald-600 text-sm font-medium bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                Jurnal Seimbang (Balance)
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button 
              type="button"
              onClick={() => navigate('/journals')}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors font-medium text-sm"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={loading || !isBalanced || totalDebit === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan Jurnal'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
