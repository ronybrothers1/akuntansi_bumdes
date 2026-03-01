import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';

export default function Payments() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Pengeluaran Kas</h1>
        <Link
          to="/journals/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Catat Pengeluaran</span>
        </Link>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Modul Khusus Pengeluaran Kas</h2>
          <p className="text-slate-600">
            Saat ini, semua pencatatan transaksi termasuk pengeluaran kas dilakukan melalui menu <strong>Jurnal Umum</strong>. 
            Modul khusus ini sedang dalam tahap pengembangan untuk memudahkan pencatatan secara spesifik.
          </p>
          <div className="pt-4">
            <Link
              to="/journals"
              className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Jurnal Umum</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
