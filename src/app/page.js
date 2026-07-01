"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import MapWrapper from "../components/MapWrapper";
import Compass from "../components/Compass";
import { collection, addDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { LogOut, Plus, X, MapPin, BarChart3, Users, Home } from "lucide-react";
import styles from "./page.module.css";

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
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Memuat aplikasi...</p>
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

  const totalMembers = houses.reduce((acc, h) => acc + (Number(h.jumlah_anggota) || 0), 0);

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <div className={styles.iconWrapper}>
            <MapPin size={20} color="#0ea5e9" />
          </div>
          <h1>Pemetaan KKN</h1>
          <span className={styles.badge}>{user.role || "Surveyor"}</span>
        </div>
        <div className={styles.headerActions}>
          {user.role === 'admin' && (
            <button onClick={() => setShowAdminDashboard(true)} className={styles.adminButton}>
              <BarChart3 size={18} />
              <span className={styles.adminText}>Statistik Admin</span>
            </button>
          )}
          <span className={styles.userName}>{user.email}</span>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <LogOut size={18} />
            <span className={styles.logoutText}>Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Map Area */}
      <main className={styles.mapContainer}>
        <MapWrapper houses={houses} onMapClick={handleMapClick} />
        <Compass />
      </main>

      {/* Floating Add Button */}
      {!showForm && !showAdminDashboard && (
        <button 
          className={styles.fab}
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setFormData(prev => ({
                    ...prev,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                  }));
                  setShowForm(true);
                },
                () => {
                  setShowForm(true);
                },
                { enableHighAccuracy: true }
              );
            } else {
              setShowForm(true);
            }
          }}
        >
          <Plus size={24} />
          <span>Lokasi Saat Ini</span>
        </button>
      )}

      {/* Form Overlay (Glassmorphism Sidebar/Modal) */}
      {showForm && (
        <div className={styles.formOverlay} onClick={(e) => {
          if(e.target === e.currentTarget) setShowForm(false);
        }}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2>Pendataan Warga</h2>
              <button onClick={() => setShowForm(false)} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Nama Kepala Keluarga</label>
                <input 
                  type="text" 
                  required
                  value={formData.nama_kepala_keluarga}
                  onChange={(e) => setFormData({...formData, nama_kepala_keluarga: e.target.value})}
                  placeholder="Contoh: Bpk. Budi"
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Jumlah Anggota Keluarga</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={formData.jumlah_anggota}
                  onChange={(e) => setFormData({...formData, jumlah_anggota: e.target.value})}
                  placeholder="Contoh: 4"
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Alamat Lengkap</label>
                <textarea 
                  required
                  rows="3"
                  value={formData.alamat}
                  onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                  placeholder="Detail alamat dan catatan..."
                />
              </div>
              
              <div className={styles.coordsDisplay}>
                <div className={styles.coordItem}>
                  <span>Latitude</span>
                  <strong>{formData.latitude ? formData.latitude.toFixed(6) : "Belum diatur"}</strong>
                </div>
                <div className={styles.coordItem}>
                  <span>Longitude</span>
                  <strong>{formData.longitude ? formData.longitude.toFixed(6) : "Belum diatur"}</strong>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || !formData.latitude} 
                className={styles.submitButton}
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Data"}
              </button>
              
              {!formData.latitude && (
                <p className={styles.helperText}>
                  Silakan klik lokasi rumah pada peta terlebih dahulu.
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Admin Dashboard Modal */}
      {showAdminDashboard && (
        <div className={styles.formOverlay} onClick={(e) => {
          if(e.target === e.currentTarget) setShowAdminDashboard(false);
        }}>
          <div className={styles.adminCard}>
            <div className={styles.formHeader}>
              <h2>Dashboard Statistik</h2>
              <button onClick={() => setShowAdminDashboard(false)} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.adminContent}>
              <div className={styles.statGrid}>
                <div className={styles.statBox}>
                  <div className={styles.statIconWrapper} style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
                    <Home size={28} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3>{houses.length}</h3>
                    <p>Total Rumah Terdata</p>
                  </div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statIconWrapper} style={{ backgroundColor: '#f0fdf4', color: '#22c55e' }}>
                    <Users size={28} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3>{totalMembers}</h3>
                    <p>Total Anggota Keluarga</p>
                  </div>
                </div>
              </div>
              <div className={styles.recentList}>
                <h3>Data Terbaru</h3>
                {houses.slice().sort((a, b) => b.created_at?.seconds - a.created_at?.seconds).slice(0, 5).map((house, idx) => (
                  <div key={idx} className={styles.recentItem}>
                    <MapPin size={16} color="#64748b" />
                    <div>
                      <strong>{house.nama_kepala_keluarga}</strong> ({house.jumlah_anggota} orang)
                      <p>{house.alamat}</p>
                    </div>
                  </div>
                ))}
                {houses.length === 0 && <p className={styles.emptyState}>Belum ada data</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
