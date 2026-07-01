# 📌 BLUEPRINT APLIKASI

## Pemetaan Data Warga Berbasis Geografis (React Native)

---

## 1. 🎯 Tujuan Aplikasi

Aplikasi ini bertujuan untuk membantu tim survei dalam melakukan pendataan warga secara **terstruktur, real-time, dan berbasis lokasi (GPS)**.

Dengan aplikasi ini:

- Setiap rumah yang sudah didata akan ditandai (pin) di peta
- Data langsung tersimpan ke database realtime
- Tim lain dapat melihat wilayah yang sudah / belum didata
- Menghindari duplikasi pendataan

---

## 2. 👥 Target Pengguna

- Tim survey lapangan
- Admin / koordinator pendataan

---

## 3. ⚙️ Fitur Utama

### 3.1 📍 Pemetaan Lokasi (Map Integration)

- Menampilkan peta berbasis GPS
- Menampilkan semua titik rumah yang sudah didata
- Real-time update pin

### 3.2 ➕ Tambah Data Rumah

- Ambil lokasi otomatis dari GPS
- Form input:
  - Nama Kepala Keluarga
  - Jumlah Anggota
  - Alamat
  - Catatan tambahan
- Tombol "Simpan & Tandai"

### 3.3 🔄 Realtime Sinkronisasi

- Semua data langsung tersimpan dan tampil ke user lain
- Update tanpa refresh

### 3.4 🎯 Status Wilayah

- Marker warna berbeda:
  - 🟢 Sudah didata
  - 🔴 Belum didata (opsional)

### 3.5 🔐 Autentikasi User

- Login (email / akun tim)
- Setelah login bisa langsung masuk tanpa login lagi
- Role:
  - Admin
  - Surveyor

---

## 4. 🧱 Arsitektur Sistem

### Frontend

- React Native
- react-native-maps
- expo-location

### Backend

- Firebase Firestore (Realtime)
- Firebase Auth

---

## 5. 🗂️ Struktur Folder

```
src/
├── components/
├── screens/
├── services/
├── store/
├── utils/
└── navigation/
```

---

## 6. 🧾 Struktur Database

### houses

- nama_kepala_keluarga
- jumlah_anggota
- alamat
- latitude
- longitude
- created_by
- created_at

### users

- name
- email
- role

---

## 7. 🔄 Flow Aplikasi

1. Login
2. Masuk ke peta
3. Tambah data rumah
4. Simpan
5. Marker muncul realtime
6. Bisa ambil koordinat dari semua marker

---

## 8. 🚀 Tahapan Development

### Phase 1

- Login
- Map
- Tambah data

### Phase 2

- Dashboard
- Role user

### Phase 3

- Offline mode
- Export data

---

## 9. ⚠️ Tantangan

- Akurasi GPS
- Internet terbatas
- Data duplikat

---

## ✨ Penutup

Blueprint ini bisa digunakan sebagai panduan awal pengembangan aplikasi.
