require("../settings.js");
const axios = require("axios");

class OrderKuota {
    constructor() {
        this.apitoken = global.apiOrderKuota;
        this.urlQris = global.qrisOrderKuota;
        this.merchantId = global.merchantIdOrderKuota;
    }

    async createPayment(amount) {
        const response = await axios(`https://rest.cloudkuimages.xyz/api/orkut/createpayment?apikey=mahiru&amount=${amount}&codeqr=${this.urlQris}`);
        if (response.status !== true) throw new Error("Error")
        if (!response.data || !response.data.result) throw new Error("Invalid response structure");
        return response.data.result;
    }
    
    async cekStatus() {
        const response = await axios(`https://rest.cloudkuimages.xyz/api/orkut/cekstatus?apikey=mahiru&merchant=${this.merchantId}&keyorkut=${this.apitoken}`);
        if (response.status !== true) throw new Error("Error")
        return response.data;
    }
}

module.exports = { OrderKuota };