const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Inisialisasi struktur plugins global
global.plugins = { 
    before: [],      // Middleware yang dijalankan sebelum command
    after: [],       // Middleware yang dijalankan setelah command
    commands: {}     // Daftar command yang tersedia
};

// Simpan path file plugin untuk memudahkan reload
global.pluginPaths = new Set();

/**
 * Fungsi untuk memuat (load) semua plugin dari folder plugins
 */
global.loadPlugins = async () => {
    // Reset plugins untuk menghindari duplikasi saat hot reload
    global.plugins = { before: [], after: [], commands: {} };
    
    const pluginFolder = path.join(__dirname, "plugins");
    
    // Cetak header saat loading plugins
    console.log(chalk.blue.bold('┌─────────────────────────────────────────────┐'));
    console.log(chalk.blue.bold('│         ') + chalk.cyan.bold('ALFIKY ID - PLUGIN LOADER') + chalk.blue.bold('          │'));
    console.log(chalk.blue.bold('└─────────────────────────────────────────────┘'));
    
    // Ambil semua file plugin dari folder dan subfolder
    const pluginFiles = getAllPluginFiles(pluginFolder);
    
    // Update daftar path plugin untuk sistem watcher
    global.pluginPaths = new Set(pluginFiles);
    
    // Statistik loading
    let loadedCount = 0;
    let failedCount = 0;

    // Proses setiap file plugin
    for (const file of pluginFiles) {
        try {
            // Tentukan apakah plugin adalah ES Module (.mjs) atau CommonJS (.js)
            const isEsm = path.extname(file) === '.mjs';
            
            // Muat plugin berdasarkan jenis module
            const plugin = isEsm 
                ? await loadEsmPlugin(file)
                : loadCommonJsPlugin(file);
            
            // Hanya tambahkan plugin yang valid
            if (plugin && typeof plugin === 'function') {
                registerPlugin(plugin, file);
                loadedCount++;
            }
        } catch (error) {
            console.error(chalk.red('✗ ') + chalk.white(`${file}`) + chalk.red(` - ${error.message}`));
            failedCount++;
        }
    }

    // Cetak statistik
    console.log(chalk.blue.bold('┌─────────────────────────────────────────────┐'));
    console.log(chalk.blue.bold('│ ') + chalk.green.bold(`Loaded: ${loadedCount} plugins`) + chalk.blue.bold(' '.repeat(Math.max(0, 33 - `Loaded: ${loadedCount} plugins`.length))) + ' │');
    console.log(chalk.blue.bold('│ ') + chalk.red.bold(`Failed: ${failedCount} plugins`) + chalk.blue.bold(' '.repeat(Math.max(0, 33 - `Failed: ${failedCount} plugins`.length))) + ' │');
    console.log(chalk.blue.bold('└─────────────────────────────────────────────┘'));
};

/**
 * Mendapatkan semua file plugin termasuk dari subfolder
 * @param {string} dir - Path folder plugin
 * @returns {string[]} - Array berisi path lengkap file plugin
 */
function getAllPluginFiles(dir) {
    let results = [];
    try {
        fs.readdirSync(dir, { withFileTypes: true }).forEach(file => {
            const fullPath = path.join(dir, file.name);
            if (file.isDirectory()) {
                // Rekursif untuk subfolder
                results = results.concat(getAllPluginFiles(fullPath));
            } else if (file.name.endsWith(".js") || file.name.endsWith(".mjs")) {
                // Menggunakan path.resolve untuk memastikan path konsisten
                results.push(path.resolve(fullPath));
            }
        });
    } catch (error) {
        console.error(chalk.red(`Error membaca direktori ${dir}:`, error.message));
    }
    return results;
}

/**
 * Memuat plugin dalam format ES Module
 * @param {string} file - Path file plugin
 * @returns {Function} - Fungsi plugin
 */
async function loadEsmPlugin(file) {
    try {
        // Dapatkan timestamp file untuk memaksa reload (menangani cache browser)
        const timestamp = Date.now();
        const fileUrl = `file://${file}?t=${timestamp}`;
        
        try {
            // Coba hapus dari import cache jika tersedia
            if (global.importCache && global.importCache[file]) {
                delete global.importCache[file];
            }
        } catch (e) {
            // Ignore error jika tidak bisa menghapus cache
        }
        
        // Import module ESM dengan URL yang memiliki query parameter timestamp
        const imported = await import(fileUrl);
        let plugin;
        
        // Periksa berbagai kemungkinan struktur plugin ESM
        if (typeof imported === 'function') {
            plugin = imported;
        } else if (imported.default) {
            if (typeof imported.default === 'function') {
                plugin = imported.default;
            } else if (typeof imported.default === 'object' && imported.default.run) {
                plugin = processObjectPlugin(imported.default, file);
            }
        } else if (imported.run && typeof imported.run === 'function') {
            plugin = processObjectPlugin(imported, file);
        } else {
            throw new Error(`Plugin tidak memiliki format yang valid`);
        }
        
        console.log(chalk.green('✓ ') + chalk.magenta(`[ES Module] `) + chalk.white(`${file}`));
        return plugin;
    } catch (error) {
        console.error(chalk.red('✗ ') + chalk.magenta(`[ES Module] `) + chalk.white(`${file}`) + chalk.red(` - ${error.message}`));
        throw error;
    }
}

/**
 * Memuat plugin dalam format CommonJS
 * @param {string} file - Path file plugin
 * @returns {Function} - Fungsi plugin
 */
function loadCommonJsPlugin(file) {
    try {
        // Hapus semua cache yang mungkin terkait dengan file
        const absolutePath = path.resolve(file);
        
        // Cari semua key cache yang mungkin merujuk ke file yang sama
        Object.keys(require.cache).forEach(cachePath => {
            if (path.resolve(cachePath) === absolutePath) {
                delete require.cache[cachePath];
            }
        });
        
        // Hapus cache untuk hot reload
        delete require.cache[require.resolve(absolutePath)];
        
        // Load file dengan path absolut
        const imported = require(absolutePath);
        let plugin;
        
        // Periksa berbagai kemungkinan struktur plugin CJS
        if (typeof imported === 'function') {
            plugin = imported;
        } else if (imported.default && typeof imported.default === 'function') {
            plugin = imported.default;
        } else if (imported.run && typeof imported.run === 'function') {
            plugin = processObjectPlugin(imported, file);
        } else {
            throw new Error(`Plugin tidak memiliki format yang valid`);
        }
        
        console.log(chalk.green('✓ ') + chalk.yellow(`[JavaScript] `) + chalk.white(`${file}`));
        return plugin;
    } catch (error) {
        console.error(chalk.red('✗ ') + chalk.yellow(`[JavaScript] `) + chalk.white(`${file}`) + chalk.red(` - ${error.message}`));
        throw error;
    }
}

/**
 * Mendaftarkan plugin ke dalam sistem
 * @param {Function} plugin - Fungsi plugin
 * @param {string} file - Path file plugin
 */
function registerPlugin(plugin, file) {
    const normalizedPath = path.resolve(file);
    
    // Periksa apakah plugin adalah middleware
    if (plugin.before) {
        global.plugins.before.push(plugin);
    }
    if (plugin.after) {
        global.plugins.after.push(plugin);
    }
    
    // Tambahkan ke daftar commands jika memiliki command
    if (plugin.command || plugin.commands) {
        global.plugins.commands[normalizedPath] = plugin;
    }
}

/**
 * Memproses plugin dalam format objek
 * @param {Object} pluginObj - Objek plugin
 * @param {string} filePath - Path file plugin
 * @returns {Function} - Fungsi plugin
 */
function processObjectPlugin(pluginObj, filePath) {
    // Membuat fungsi wrapper untuk plugin
    const pluginFunction = async function(m, data) {
        // Periksa pengaturan plugin sebelum menjalankan
        const settings = pluginObj.settings || {};
        
        // Validasi owner-only
        if (settings.owner && !data.isOwner) {
            return m.reply('Perintah ini hanya untuk owner bot!');
        }
        
        // Validasi group-only
        if (settings.group && !data.isGroup) {
            return m.reply('Perintah ini hanya bisa digunakan di dalam grup!');
        }
        
        // Cek apakah command sesuai
        const { command } = data;
        const mainCommand = pluginObj.command;
        const aliases = pluginObj.alias || [];
        
        const isValidCommand = command === mainCommand || aliases.includes(command);
        if (!isValidCommand) return;
        
        // Tampilkan loading message jika diaktifkan
        let loadingMessage;
        if (pluginObj.loading) {
            loadingMessage = await m.reply('Sedang diproses...');
        }
        
        try {
            // Jalankan fungsi run dari plugin
            await pluginObj.run(m, data);
        } catch (error) {
            console.error(chalk.red(`Error menjalankan plugin ${filePath}:`), error);
            m.reply(`Terjadi kesalahan: ${error.message}`);
        } finally {
            // Hapus pesan loading jika ada
            if (loadingMessage && m.deleteMessage) {
                m.deleteMessage(loadingMessage.key);
            }
        }
    };
    
    // Tetapkan properti command ke fungsi wrapper
    pluginFunction.command = pluginObj.command;
    
    // Tambahkan alias sebagai commands tambahan
    if (pluginObj.alias && Array.isArray(pluginObj.alias) && pluginObj.alias.length > 0) {
        pluginFunction.commands = [pluginObj.command, ...pluginObj.alias];
    }
    
    // Tambahkan metadata plugin
    pluginFunction.metadata = {
        category: pluginObj.category || ['uncategorized'],
        description: pluginObj.description || 'Tidak ada deskripsi',
        settings: pluginObj.settings || {},
        loading: pluginObj.loading || false
    };
    
    return pluginFunction;
}

/**
 * Memuat ulang plugin tertentu
 * @param {string} filename - Path file plugin yang akan di-reload
 * @returns {Promise<boolean>} - Status berhasil atau tidak
 */
async function reloadPlugin(filename) {
    try {
        const normalizedPath = path.resolve(filename);
        const isEsm = path.extname(normalizedPath) === '.mjs';
        
        // Muat plugin berdasarkan jenis module
        const plugin = isEsm 
            ? await loadEsmPlugin(normalizedPath)
            : loadCommonJsPlugin(normalizedPath);
        
        // Register ulang plugin jika valid
        if (plugin && typeof plugin === 'function') {
            registerPlugin(plugin, normalizedPath);
            return true;
        }
        return false;
    } catch (error) {
        console.error(chalk.red(`Gagal me-reload plugin ${filename}:`), error.message);
        return false;
    }
}

/**
 * Mengatur watcher untuk file plugin dengan metode yang lebih andal
 */
function setupPluginWatcher() {
    const pluginFolder = path.join(__dirname, 'plugins');
    const debounceTime = 500; // 500ms
    const trackedFiles = new Map(); // Untuk melacak status file
    
    // Dapatkan semua folder dan file untuk pantau
    const allFolders = getAllSubFolders(pluginFolder);
    
    // Fungsi untuk mendapatkan semua subfolder
    function getAllSubFolders(dir) {
        let folders = [dir];
        try {
            const items = fs.readdirSync(dir, { withFileTypes: true });
            for (const item of items) {
                if (item.isDirectory()) {
                    const subDir = path.join(dir, item.name);
                    folders = folders.concat(getAllSubFolders(subDir));
                }
            }
        } catch (error) {
            console.error(chalk.red(`Error membaca subfolder dari ${dir}:`, error.message));
        }
        return folders;
    }
    
    // Inisialisasi watcher untuk semua folder plugin
    for (const folder of allFolders) {
        try {
            fs.watch(folder, { persistent: true }, async (eventType, filename) => {
                if (!filename || !(filename.endsWith('.js') || filename.endsWith('.mjs'))) return;
                
                const fullPath = path.resolve(path.join(folder, filename));
                
                // Hanya proses jika file benar-benar ada
                if (!fs.existsSync(fullPath)) return;
                
                // Verifikasi bahwa ini adalah file yang berbeda (gunakan stat untuk mendapatkan mtime)
                try {
                    const stats = fs.statSync(fullPath);
                    const mtime = stats.mtime.getTime();
                    
                    // Jika sudah ada dalam tracking, periksa apakah waktu modifikasi berubah
                    if (trackedFiles.has(fullPath)) {
                        const lastMtime = trackedFiles.get(fullPath);
                        
                        // Jika tidak ada perubahan mtime, abaikan
                        if (lastMtime === mtime) return;
                        
                        // Update mtime
                        trackedFiles.set(fullPath, mtime);
                    } else {
                        // Tambahkan ke tracking jika belum ada
                        trackedFiles.set(fullPath, mtime);
                    }
                    
                    // Hanya reload file ini, tidak semua plugin
                    console.log(chalk.cyan(`\n[${new Date().toLocaleTimeString()}] `) + 
                        chalk.yellow.bold(`Terdeteksi perubahan pada: ${filename}`));
                    
                    // Tunggu sebentar untuk memastikan file sudah ditulis sepenuhnya
                    setTimeout(async () => {
                        const success = await reloadPlugin(fullPath);
                        if (success) {
                            console.log(chalk.green(`Berhasil me-reload plugin: ${filename}`));
                        } else {
                            console.log(chalk.red(`Gagal me-reload plugin: ${filename}`));
                        }
                    }, debounceTime);
                    
                } catch (error) {
                    console.error(chalk.red(`Error memproses perubahan file ${fullPath}:`), error.message);
                }
            });
        } catch (error) {
            console.error(chalk.red(`Tidak dapat memantau folder ${folder}:`), error.message);
        }
    }
    
    console.log(chalk.green(`Memantau ${allFolders.length} folder untuk perubahan plugin`));
}

// Load plugins saat startup
global.loadPlugins();

// Setup watcher untuk plugin
setupPluginWatcher();

/**
 * Handler utama untuk memproses pesan dan menjalankan plugin yang sesuai
 * @param {Object} m - Objek pesan
 * @param {Object} data - Data tambahan untuk plugin
 */
module.exports = async (m, data) => {
    try {
        const { command } = data;
        
        // Jalankan plugin before
        for (let beforePlugin of global.plugins.before) {
            try {
                await beforePlugin(m, data);
            } catch (error) {
                console.error(chalk.red.bold('Error plugin before:'), error);
            }
        }

        // Cari plugin yang cocok dengan command
        const plugin = Object.values(global.plugins.commands).find(p => {
            // Periksa command tunggal
            if (p.command) {
                if (typeof p.command === 'string') {
                    if (p.command === command) return true;
                } else if (p.command instanceof RegExp) {
                    if (p.command.test(command)) return true;
                }
            }
            
            // Periksa commands array (command + alias)
            if (p.commands && Array.isArray(p.commands)) {
                return p.commands.some(cmd => {
                    if (typeof cmd === 'string') return cmd === command;
                    if (cmd instanceof RegExp) return cmd.test(command);
                    return false;
                });
            }
            
            return false;
        });

        // Jalankan plugin command jika ditemukan
        if (plugin) {
            await plugin(m, data);
        }

        // Jalankan plugin after
        for (let afterPlugin of global.plugins.after) {
            try {
                await afterPlugin(m, data);
            } catch (error) {
                console.error(chalk.red.bold('Error plugin after:'), error);
            }
        }
    } catch (error) {
        console.error(chalk.red.bold('Error handler:'), error);
        m.reply('❌ Terjadi kesalahan pada bot.');
    }
};

// Hot reload untuk handler.js
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.cyan.bold(`\n[${new Date().toLocaleTimeString()}] Update ${__filename}`));
    delete require.cache[file];
    require(file);
});