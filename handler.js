const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const chalk = require('chalk');

global.plugins = { before: [], after: [], commands: {} };

global.loadPlugins = async () => {
    // Reset plugins to avoid duplication during hot reload
    global.plugins = { before: [], after: [], commands: {} };
    
    const pluginFolder = path.join(__dirname, "plugins");

    // Function to read all plugin files including subfolders
    const getAllPluginFiles = (dir) => {
        let results = [];
        fs.readdirSync(dir, { withFileTypes: true }).forEach(file => {
            const fullPath = path.join(dir, file.name);
            if (file.isDirectory()) {
                results = results.concat(getAllPluginFiles(fullPath)); // Recursive for subfolders
            } else if (file.name.endsWith(".js") || file.name.endsWith(".ts") || file.name.endsWith(".mjs")) {
                results.push(fullPath);
            }
        });
        return results;
    };

    // Get all plugin files
    const allPluginFiles = getAllPluginFiles(pluginFolder);
    
    // Create file priority map: .ts files have higher priority than .js with same name
    const fileMap = new Map();
    
    for (const file of allPluginFiles) {
        const ext = path.extname(file);
        const baseFileName = path.basename(file, ext);
        const dirName = path.dirname(file);
        const fileKey = path.join(dirName, baseFileName);
        
        // If we already have a .ts file, don't add .js version
        if (ext === '.js' && fileMap.has(fileKey) && fileMap.get(fileKey).endsWith('.ts')) {
            continue;
        }
        
        // Otherwise, add or update the file (this will overwrite .js with .ts if both exist)
        fileMap.set(fileKey, file);
    }
    
    // Get the final unique list of files to process
    const pluginFiles = Array.from(fileMap.values());

    console.log(chalk.blue.bold('┌─────────────────────────────────────────────┐'));
    console.log(chalk.blue.bold('│         ') + chalk.cyan.bold('ALFIKY ID - PLUGIN LOADER') + chalk.blue.bold('          │'));
    console.log(chalk.blue.bold('└─────────────────────────────────────────────┘'));
    
    let loadedCount = 0;
    let failedCount = 0;

    for (const file of pluginFiles) {
        const ext = path.extname(file);
        
        try {
            let plugin;
            
            if (ext === '.ts') {
                // Compile TypeScript to memory instead of creating physical .js file
                try {
                    // Compile with esbuild
                    const result = await esbuild.build({
                        entryPoints: [file],
                        write: false, // Don't write to disk
                        bundle: true,
                        platform: 'node',
                        format: 'cjs',
                        target: 'node14',
                        loader: { '.ts': 'ts' },
                        external: ['fs', 'path', 'chalk', 'esbuild'],
                    });
                    
                    // Create a temp module from the compiled code
                    const compiledCode = result.outputFiles[0].text;
                    const tempModule = { exports: {} };
                    const moduleFn = new Function('module', 'exports', 'require', compiledCode);
                    moduleFn(tempModule, tempModule.exports, require);
                    
                    // Determine the entry point
                    const exported = tempModule.exports;
                    if (typeof exported === 'function') {
                        plugin = exported;
                    } else if (exported.default && typeof exported.default === 'function') {
                        plugin = exported.default;
                    } else if (exported.__esModule && exported.default && typeof exported.default === 'function') {
                        plugin = exported.default;
                    } else {
                        throw new Error(`Plugin ${file} does not export a valid function`);
                    }
                    
                    console.log(chalk.green('✓ ') + chalk.cyan(`[TypeScript] `) + chalk.white(`${file}`));
                    loadedCount++;
                } catch (error) {
                    console.error(chalk.red('✗ ') + chalk.yellow(`[TypeScript] `) + chalk.white(`${file}`) + chalk.red(` - ${error.message}`));
                    failedCount++;
                }
            } else if (ext === '.mjs') {
                try {
                    const imported = await import(`file://${file}`);
                    
                    if (typeof imported === 'function') {
                        plugin = imported;
                    } else if (imported.default && typeof imported.default === 'function') {
                        plugin = imported.default;
                    } else {
                        throw new Error(`Plugin ${file} does not export a function`);
                    }
                    
                    console.log(chalk.green('✓ ') + chalk.magenta(`[ES Module] `) + chalk.white(`${file}`));
                    loadedCount++;
                } catch (error) {
                    console.error(chalk.red('✗ ') + chalk.magenta(`[ES Module] `) + chalk.white(`${file}`) + chalk.red(` - ${error.message}`));
                    failedCount++;
                }
            } else if (ext === '.js') {
                try {
                    delete require.cache[require.resolve(file)];
                    const imported = require(file);
                    
                    if (typeof imported === 'function') {
                        plugin = imported;
                    } else if (imported.default && typeof imported.default === 'function') {
                        plugin = imported.default;
                    } else {
                        throw new Error(`Plugin ${file} does not export a function`);
                    }
                    
                    console.log(chalk.green('✓ ') + chalk.yellow(`[JavaScript] `) + chalk.white(`${file}`));
                    loadedCount++;
                } catch (error) {
                    console.error(chalk.red('✗ ') + chalk.yellow(`[JavaScript] `) + chalk.white(`${file}`) + chalk.red(` - ${error.message}`));
                    failedCount++;
                }
            }

            // Only add valid plugins
            if (plugin && typeof plugin === 'function') {
                if (plugin.before) {
                    global.plugins.before.push(plugin);
                }
                if (plugin.after) {
                    global.plugins.after.push(plugin);
                }
                if (plugin.command) {
                    global.plugins.commands[file] = plugin;
                }
            }

        } catch (error) {
            console.error(chalk.red('✗ ') + chalk.white(`${file}`) + chalk.red(` - ${error.message}`));
            failedCount++;
        }
    }

    console.log(chalk.blue.bold('┌─────────────────────────────────────────────┐'));
    console.log(chalk.blue.bold('│ ') + chalk.green.bold(`Loaded: ${loadedCount} plugins`) + chalk.blue.bold(' '.repeat(Math.max(0, 33 - `Loaded: ${loadedCount} plugins`.length))) + ' │');
    console.log(chalk.blue.bold('│ ') + chalk.red.bold(`Failed: ${failedCount} plugins`) + chalk.blue.bold(' '.repeat(Math.max(0, 33 - `Failed: ${failedCount} plugins`.length))) + ' │');
    console.log(chalk.blue.bold('└─────────────────────────────────────────────┘'));
};

// Load plugins at startup
global.loadPlugins();

// Monitor changes in the plugins folder with recursive flag
const pluginFolder = path.join(__dirname, 'plugins');

// Use a debounce mechanism to avoid multiple reloads for the same change
let changeTimeout = null;
const debounceTime = 1000; // 1 second

fs.watch(pluginFolder, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.mjs'))) {
        // Clear previous timeout if it exists
        if (changeTimeout) {
            clearTimeout(changeTimeout);
        }
        
        // Set new timeout
        changeTimeout = setTimeout(() => {
            console.log(chalk.cyan(`\n[${new Date().toLocaleTimeString()}] `) + chalk.yellow.bold(`Detected change in plugin: ${filename}`));
            global.loadPlugins();
            changeTimeout = null;
        }, debounceTime);
    }
});

module.exports = async (m, data) => {
    try {
        const { command } = data;
        
        // Run before plugins
        for (let beforePlugin of global.plugins.before) {
            try {
                await beforePlugin(m, data);
            } catch (error) {
                console.error(chalk.red.bold('Before plugin error:'), error);
            }
        }

        // Find plugin matching the command
        const plugin = Object.values(global.plugins.commands).find(p => 
            Array.isArray(p.command) ? p.command.includes(command) : 
            p.command instanceof RegExp ? p.command.test(command) : 
            p.command === command
        );

        // Run command plugin if found
        if (plugin) {
            await plugin(m, data);
        }

        // Run after plugins
        for (let afterPlugin of global.plugins.after) {
            try {
                await afterPlugin(m, data);
            } catch (error) {
                console.error(chalk.red.bold('After plugin error:'), error);
            }
        }
    } catch (error) {
        console.error(chalk.red.bold('Handler error:'), error);
        m.reply('❌ An error occurred in the bot.');
    }
};

// Hot reload for handler.js
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.cyan.bold(`\n[${new Date().toLocaleTimeString()}] Update ${__filename}`));
    delete require.cache[file];
    require(file);
});