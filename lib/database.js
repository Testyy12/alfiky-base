/*

  !- Credits By Alfian
  
*/

require('../config');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const mongoose = require('mongoose');
let DataBase;

// **Cek apakah menggunakan MongoDB atau JSON**
if (/mongo/.test("database.json")) {
    DataBase = class mongoDB {
        constructor(url, options = { useNewUrlParser: true, useUnifiedTopology: true }) {
            this.url = url;
            this.data = {};
            this._model = {};
            this.options = options;
        }

        read = async () => {
            mongoose.connect(this.url, { ...this.options });
            this.connection = mongoose.connection;
            try {
                const schema = new mongoose.Schema({
                    data: {
                        type: Object,
                        required: true,
                        default: {},
                    }
                });
                this._model = mongoose.model('data', schema);
            } catch {
                this._model = mongoose.model('data');
            }
            this.data = await this._model.findOne({});
            if (!this.data) {
                new this._model({ data: {} }).save();
                this.data = await this._model.findOne({});
            } else return this?.data?.data || this?.data;
        };

        write = async (data) => {
            if (this.data && !this.data.data) return new this._model({ data }).save();
            this._model.findById(this.data._id, (err, docs) => {
                if (!err) {
                    if (!docs.data) docs.data = {};
                    docs.data = data;
                    return docs.save();
                }
            });
        };
    };
} else if (/json/.test("database.json")) {
    DataBase = class dataBase {
        data = {};
        file = path.join(process.cwd(), 'Storage', "database.json");

        read = async () => {
            let data;
            if (fs.existsSync(this.file)) {
                data = JSON.parse(fs.readFileSync(this.file));
            } else {
                fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
                data = this.data;
            }
            return data;
        };

        write = async (data) => {
            this.data = !!data ? data : global.db;
            let dirname = path.dirname(this.file);
            if (!fs.existsSync(dirname)) fs.mkdirSync(dirname, { recursive: true });
            fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
            return this.file;
        };
    };
}

// **Fungsi LoadDataBase untuk mengatur database global**
async function LoadDataBase(fell, m) {
    try {
        const db = new DataBase();
        global.db = await db.read(); // Load database dari JSON/MongoDB

        const botNumber = await fell.decodeJid(fell.user.id);
        const isNumber = x => typeof x === 'number' && !isNaN(x);
        const isBoolean = x => typeof x === 'boolean' && Boolean(x);

        let setBot = global.db.settings || {};
        global.db.settings = {
            anticall: setBot.anticall || false,
            autobio: setBot.autobio || false,
            autoread: setBot.autoread || false,
            autopromosi: setBot.autopromosi || false,
            autotyping: setBot.autotyping || false,
            readsw: setBot.readsw || false,
            owneroffmode: setBot.owneroffmode || false,
        };

        let user = global.db.users[m.sender] || {};
        global.db.users[m.sender] = {
            status_deposit: user.status_deposit || false,
            saldo: user.saldo || 0,
        };

        if (m.isGroup) {
            let group = global.db.groups[m.chat] || {};
            global.db.groups[m.chat] = {
                antilink: group.antilink || false,
                antilink2: group.antilink2 || false,
                welcome: group.welcome || false,
                mute: group.mute || false,
                simi: group.simi || false,
                blacklistjpm: group.blacklistjpm || false,
            };
        }

        await db.write(global.db); // Simpan perubahan ke database

    } catch (e) {
        throw e;
    }
}

module.exports = { LoadDataBase, DataBase };

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update ${__filename}`));
    delete require.cache[file];
    require(file);
});
