"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import MapWrapper from "../components/MapWrapper";
import { collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { LogOut, Plus, X, MapPin, BarChart3, Users, Home, Trash2, TrendingUp, Navigation, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  
  const [houses, setHouses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [formData, setFormData] = useState({
    nama_kepala_keluarga: "",
    jumlah_anggota: "",
    alamat: "",
    latitude: "",
    longitude: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    
    // Realtime listener for Firestore
    const unsubscribe = onSnapshot(collection(db, "houses"), (snapshot) => {
      const housesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHouses(housesData);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 size={48} className="text-sky-500 animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Memuat aplikasi...</p>
      </div>
    );
  }

  const handleMapClick = (latlng) => {
    if (user.role === 'surveyor' || user.role === 'admin' || !user.role) {
      setFormData(prev => ({
        ...prev,
        latitude: latlng.lat,
        longitude: latlng.lng
      }));
      setShowForm(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) return;
    
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "houses"), {
        nama_kepala_keluarga: formData.nama_kepala_keluarga,
        jumlah_anggota: Number(formData.jumlah_anggota),
        alamat: formData.alamat,
        latitude: formData.latitude,
        longitude: formData.longitude,
        created_by: user.uid,
        created_at: serverTimestamp()
      });
      
      setShowForm(false);
      setFormData({
        nama_kepala_keluarga: "",
        jumlah_anggota: "",
        alamat: "",
        latitude: "",
        longitude: ""
      });
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Gagal menyimpan data!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      try {
        await deleteDoc(doc(db, "houses", id));
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Gagal menghapus data!");
      }
    }
  };

  const totalMembers = houses.reduce((acc, h) => acc + (Number(h.jumlah_anggota) || 0), 0);
  const avgMembers = houses.length > 0 ? (totalMembers / houses.length).toFixed(1) : 0;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-100 dark:bg-slate-900 relative">
      
      {/* Top Header Floating Glass */}
      <header className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-center px-4 py-3 glass dark:glass-dark rounded-2xl shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full p-1 shadow-sm border border-slate-100">
            <img src="/favicon.svg" alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Pemetaan KKN</h1>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{user.email}</span>
              <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {user.role || "Surveyor"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {user.role === 'admin' && (
            <button 
              onClick={() => setShowAdminDashboard(true)} 
              className="flex items-center space-x-1.5 px-3 py-2 bg-white/60 hover:bg-white dark:bg-slate-800/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all shadow-sm hover:shadow"
            >
              <BarChart3 size={18} className="text-indigo-500" />
              <span className="text-sm font-semibold hidden md:block">Statistik Admin</span>
            </button>
          )}
          
          <button 
            onClick={handleLogout} 
            className="flex items-center space-x-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-all shadow-sm hover:shadow"
          >
            <LogOut size={18} />
            <span className="text-sm font-semibold hidden sm:block">Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Map Area */}
      <main className="flex-1 w-full h-full relative z-0">
        <MapWrapper houses={houses} onMapClick={handleMapClick} />
      </main>

      {/* Floating Action Button */}
      {!showForm && !showAdminDashboard && (
        <button 
          disabled={isLocating}
          onClick={() => {
            if (navigator.geolocation) {
              setIsLocating(true);
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setFormData(prev => ({
                    ...prev,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                  }));
                  setIsLocating(false);
                  setShowForm(true);
                },
                (error) => {
                  console.warn("Geolocation warning:", error);
                  setIsLocating(false);
                  setShowForm(true);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
              );
            } else {
              setShowForm(true);
            }
          }}
          className="absolute bottom-8 right-8 z-[1000] flex items-center space-x-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-5 py-4 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transform transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0"
        >
          <Navigation size={22} className={isLocating ? "animate-spin" : ""} />
          <span className="font-bold hidden sm:block">{isLocating ? "Mencari..." : "Lokasi Saat Ini"}</span>
        </button>
      )}

      {/* Form Overlay (Modal) */}
      {showForm && (
        <div className="absolute inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-300" 
             onClick={(e) => { if(e.target === e.currentTarget) setShowForm(false); }}>
          
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Data Warga</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tambahkan informasi rumah tangga</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Kepala Keluarga</label>
                <input 
                  type="text" 
                  required
                  value={formData.nama_kepala_keluarga}
                  onChange={(e) => setFormData({...formData, nama_kepala_keluarga: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400 text-slate-700 dark:text-slate-200"
                  placeholder="Contoh: Bpk. Budi"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Jumlah Anggota Keluarga</label>
                <input 
                  type="number" 
                  required min="1"
                  value={formData.jumlah_anggota}
                  onChange={(e) => setFormData({...formData, jumlah_anggota: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400 text-slate-700 dark:text-slate-200"
                  placeholder="Contoh: 4"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Alamat Lengkap</label>
                <textarea 
                  required rows="3"
                  value={formData.alamat}
                  onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all placeholder:text-slate-400 text-slate-700 dark:text-slate-200 resize-none"
                  placeholder="Detail alamat dan catatan..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-sky-50 dark:bg-sky-900/20 p-4 rounded-xl border border-sky-100 dark:border-sky-800/30">
                <div>
                  <span className="block text-xs font-semibold text-sky-600 dark:text-sky-400 mb-1">Latitude</span>
                  <strong className="text-sm text-slate-800 dark:text-slate-200">{formData.latitude ? formData.latitude.toFixed(6) : "—"}</strong>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-sky-600 dark:text-sky-400 mb-1">Longitude</span>
                  <strong className="text-sm text-slate-800 dark:text-slate-200">{formData.longitude ? formData.longitude.toFixed(6) : "—"}</strong>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting || !formData.latitude} 
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transform transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <><Loader2 size={18} className="animate-spin mr-2"/> Menyimpan...</>
                  ) : (
                    "Simpan Data"
                  )}
                </button>
                {!formData.latitude && (
                  <p className="text-center text-xs text-amber-600 dark:text-amber-400 mt-3 font-medium">
                    Silakan klik titik lokasi pada peta terlebih dahulu.
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Dashboard Modal */}
      {showAdminDashboard && (
        <div className="absolute inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-300" 
             onClick={(e) => { if(e.target === e.currentTarget) setShowAdminDashboard(false); }}>
          
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Dashboard Statistik</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ringkasan data pendataan KKN</p>
              </div>
              <button onClick={() => setShowAdminDashboard(false)} className="p-2 bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800/30 flex items-center space-x-4">
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                    <Home size={28} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">{houses.length}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rumah Terdata</p>
                  </div>
                </div>
                
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-800/30 flex items-center space-x-4">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                    <Users size={28} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">{totalMembers}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Warga</p>
                  </div>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 border border-amber-100 dark:border-amber-800/30 flex items-center space-x-4">
                  <div className="w-14 h-14 bg-amber-100 dark:bg-amber-800/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
                    <TrendingUp size={28} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">{avgMembers}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rata-rata/Rumah</p>
                  </div>
                </div>
              </div>

              {/* Data List */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Semua Data Terdaftar</h3>
                <div className="space-y-3">
                  {houses.slice().sort((a, b) => b.created_at?.seconds - a.created_at?.seconds).map((house) => (
                    <div key={house.id} className="flex justify-between items-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="mt-1 bg-slate-100 dark:bg-slate-700 p-2 rounded-full">
                          <MapPin size={18} className="text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <strong className="text-slate-800 dark:text-slate-100">{house.nama_kepala_keluarga}</strong>
                            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-medium">
                              {house.jumlah_anggota} orang
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{house.alamat}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">
                            Lat: {house.latitude.toFixed(5)}, Lng: {house.longitude.toFixed(5)}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(house.id)}
                        title="Hapus Data"
                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                  
                  {houses.length === 0 && (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <MapPin size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Belum ada data warga yang terdaftar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
