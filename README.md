
---

<h1 align="center">✨ Alfiky ID - Base Bot WhatsApp ✨</h1>  

<p align="center">
  <img src="https://cardivo.vercel.app/api?name=Alfiky%20ID&description=🎁%20Base%20WhatsApp%20bot%20type%20case%20and%20plugins%20(cjs,esm,ts)&image=https://files.catbox.moe/j7k8st.jpg&backgroundColor=%23ecf0f1&github=Testyy12&pattern=leaf&colorPattern=%23eaeaea" alt="Alfiky ID Banner">
</p>  

```ascii
   _____  _  _  _____  _____  _____  _____  _____  
  |  _  || || ||  _  ||  _  ||  _  ||  _  ||  _  |  
  | |_| || || || |_| || |_| || |_| || |_| || |_| |  
  |_____|_||_|_|_____|_____||_____|_____||_____|  
```

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge">
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18-green?style=for-the-badge">
  <img src="https://img.shields.io/badge/License-MIT-red?style=for-the-badge">
</p>  

---

## 🔥 WhatsApp Bot Base - Recode Version  

Repositori ini adalah hasil **recode** dari berbagai sumber dengan **penyesuaian fitur, perbaikan bug, dan optimasi performa**. Tujuan utama dari proyek ini adalah membuat **bot WhatsApp berbasis plugins** yang lebih **modular, ringan, dan mudah dikembangkan**.  

Jika ada pertanyaan atau ingin berdiskusi, silakan hubungi saya di [WhatsApp](https://wa.me/6285785313072).  

---

## 🛠️ Perubahan yang Saya Lakukan  

### ✅ **Penambahan Fitur:**  
- **Sistem Plugin Modular** *(CJS, ESM, TS)*
- **Handler.js** untuk memproses pesan lebih rapi  
- **Auto-Reconnect & Session Persistence**  
- **Command Dinamis** dengan metode load per plugin  
- **Dukungan LowDB** sebagai database ringan  
- **Error Handling yang lebih baik**  

### ✏️ **Perubahan:**  
- Mengubah `command.js` menjadi `case.js`  
- Menggunakan `esbuild` untuk **dukungan TypeScript**  
- Perbaikan pada fitur **eval** & optimalisasi kode  
- Penghapusan fitur **usang & tidak digunakan**  
- Memastikan bot lebih stabil dan ringan  

### ❌ **Penghapusan:**  
- Detektor pesan **Baileys yang usang**  
- Kode **tidak terpakai & tidak efisien**  

---

## 🚀 Cara Menjalankan  

### **1️⃣ Clone repository**  
```bash
git clone https://github.com/Testyy12/alfiky-base.git
```

### **2️⃣ Masuk ke direktori proyek**  
```bash
cd alfiky-base
```

### **3️⃣ Install dependencies**  
```bash
npm install
```

### **4️⃣ Jalankan bot**  
```bash
npm start
```

> **⚠️ Note:** Pastikan Node.js **versi 18+** sudah terinstall!  

---

## 🔌 Struktur Plugin  

Alfiky ID mendukung **dua tipe plugin** berikut:  

### **📌 ESM (ECMAScript Module)**  

example.mjs

```js

export default {
    command: "help",
    alias: ["bantuan", "menu"],
    run: async (m, data) => {
        await m.reply("📜 Ini daftar perintah...");
    }
};

```


### **📌 CJS (CommonJS)** 

example.js

```js

const axios = require('axios')

module.exports = {
    command: "help",
    alias: ["bantuan", "menu"],
    run: async (m, data) => {
        await m.reply("📜 Ini daftar perintah...");
    }
};

```

Note: mungkin tidak harus sesuai dengan yang diatas. seperti plugins pada umumnya juga bisa

---

## 🗄️ Database Integration (LowDB)  

Bot ini menggunakan **LowDB** sebagai penyimpanan database yang ringan dan cepat.  


---

## 💻 Kontributor  

<div align="center">

| **Photo** | **Name**              | **Role**                |
|:---------:|:---------------------:|:-----------------------:|
| <img src="https://avatars.githubusercontent.com/u/97213948?v=4" width="80" style="border-radius:50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" /> | **Felice-MD & Zervidas**       | 🛠️ **Core Developer**    |
| <img src="https://avatars.githubusercontent.com/u/198647531?v=4" width="80" style="border-radius:50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" /> | **Alfiann**      | 🎨 **System Architect**  |
| <img src="https://avatars.githubusercontent.com/u/192673517?v=4" width="80" style="border-radius:50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" /> | **Fizzxydev**      | 🚀 **Baileys Creator**   |

</div>

---

## 📜 Terima Kasih Kepada  

🔥 **Proyek ini tidak akan ada tanpa dukungan dari:**  
- **Tuhan Yang Maha Esa**  
- **Orang Tua & Keluarga**  
- **Para Developer WhatsApp Bot**  
- **Komunitas Open Source**  
- **Diri Saya Sendiri 😎**  

---

## ⚠️ Security Notice  
```diff
- NEVER SHARE YOUR SESSION FILE! 
+ Gunakan environment variables untuk data sensitif!
- Lebih Efisien Menggunakan Nomor Bot yang berbeda dari Nomor Owner
```

---

<h3 align="center">🔥 Let's build something awesome! 🚀</h3>  

<p align="center">
  <a href="https://github.com/Testyy12" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repository">
  </a>
</p>  

<p align="center">© 2025 Alfiky ID • All rights reserved 🛡️</p>  

---
