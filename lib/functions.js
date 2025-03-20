class Function {

     example = async (prefix, command, teks) => {
        return `\n *Usage Examples:*\n Type *${prefix + command}* ${teks}\n`
    }
    
    sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
    
        runtime = async (seconds) => {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}


    urlToCode = (url) => {
        try {
            if (!url) return 'Please provide a URL';
            
            // Convert URL to character codes
            const charCodes = Array.from(url).map(char => char.charCodeAt(0));
            
            // Convert character codes back to string using fromCharCode
            const encoded = String.fromCharCode(...charCodes);
            
            return {
                original: url,
                encoded: encoded,
                codes: charCodes
            };
        } catch (error) {
            return `Error converting URL: ${error.message}`;
        }
    }

}

module.exports = new Function();