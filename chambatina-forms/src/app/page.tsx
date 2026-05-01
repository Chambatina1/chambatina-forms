'use client';

import { useState, type FormEvent } from 'react';

const CUBAN_PROVINCES = [
  'PINAR DEL RÍO',
  'ARTEMISA',
  'LA HABANA',
  'MAYABEQUE',
  'MATANZAS',
  'VILLA CLARA',
  'CIENFUEGOS',
  'SANCTI SPÍRITUS',
  'CIEGO DE ÁVILA',
  'CAMAGÜEY',
  'LAS TUNAS',
  'HOLGUÍN',
  'GRANMA',
  'SANTIAGO DE CUBA',
  'GUANTÁNAMO',
  'ISLA DE LA JUVENTUD',
];

type FormData = {
  name: string;
  identity: string;
  phone: string;
  province: string;
  address: string;
  weight: string;
  packages: string;
  description: string;
};

export default function Home() {
  const [form, setForm] = useState<FormData>({
    name: '',
    identity: '',
    phone: '',
    province: '',
    address: '',
    weight: '',
    packages: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; trackingNumber?: string; message?: string; error?: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Convert to uppercase in real-time as user types
    setForm(prev => ({ ...prev, [e.target.name]: value.toUpperCase() }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        setResult({ success: true, trackingNumber: data.trackingNumber, message: data.message });
        // Reset form
        setForm({ name: '', identity: '', phone: '', province: '', address: '', weight: '', packages: '', description: '' });
      } else {
        setResult({ success: false, error: data.error || 'Error desconocido' });
      }
    } catch {
      setResult({ success: false, error: 'Error de conexión. Intente de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">CHAMBATINA MIAMI</h1>
        <p className="text-gray-500 mt-1 text-sm uppercase tracking-wider">Formulario de Registro de Envío</p>
        <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Embarcador: CHAMBATINA MIAMI
        </div>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Destinatario Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              DATOS DEL DESTINATARIO
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo del Destinatario *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="EJ: JUAN PÉREZ GARCÍA"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carnet de Identidad *
                </label>
                <input
                  type="text"
                  name="identity"
                  value={form.identity}
                  onChange={handleChange}
                  required
                  placeholder="EJ: 90010112345"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="EJ: +53 55551234"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia *
                </label>
                <select
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                >
                  <option value="">SELECCIONE UNA PROVINCIA</option>
                  {CUBAN_PROVINCES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección Completa *
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  placeholder="EJ: CALLE 10 #5 ENTRE 3 Y 5, REPARTO..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Envío Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              DATOS DEL ENVÍO
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso Total (LB) *
                </label>
                <input
                  type="number"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  required
                  min="0.1"
                  step="0.1"
                  placeholder="EJ: 5.5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad de Bultos *
                </label>
                <input
                  type="number"
                  name="packages"
                  value={form.packages}
                  onChange={handleChange}
                  required
                  min="1"
                  step="1"
                  placeholder="EJ: 2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción de la Mercancía
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="EJ: ROPA, ZAPATOS, ELECTRÓNICA..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder:text-gray-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Embarcador Info (read-only) */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-sm">EMBARCADOR:</span>
              <span className="text-sm font-bold">CHAMBATINA MIAMI</span>
            </div>
            <p className="text-green-700 text-xs mt-1 ml-7">
              El embarcador se registra automáticamente con cada envío.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                REGISTRANDO ENVÍO...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                REGISTRAR ENVÍO
              </>
            )}
          </button>
        </form>
      </div>

      {/* Success/Error Result */}
      {result && (
        <div className={`w-full max-w-2xl mt-6 p-6 rounded-2xl border-2 ${
          result.success
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          {result.success ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-800 uppercase">¡Envío Registrado Exitosamente!</h3>
              <div className="mt-4 bg-white rounded-xl p-4 border border-green-200">
                <p className="text-sm text-green-600 font-medium">Número de Seguimiento:</p>
                <p className="text-3xl font-mono font-bold text-green-800 tracking-widest mt-1">
                  {result.trackingNumber}
                </p>
              </div>
              <p className="text-sm text-green-600 mt-3">
                Guarde su número de seguimiento para rastrear su envío.
              </p>
              <p className="text-xs text-green-500 mt-1">
                Embarcador: CHAMBATINA MIAMI
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-800 uppercase">Error al Registrar</h3>
              <p className="text-sm text-red-600 mt-2">{result.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-400">
        <p>© 2026 CHAMBATINA MIAMI — Todos los derechos reservados</p>
        <p className="mt-1">Todos los datos se almacenan en MAYÚSCULAS</p>
      </div>
    </div>
  );
}
