class Function {

     example = async (prefix, command, teks) => {
        return `\n *Usage Examples:*\n Type *${prefix + command}* ${teks}\n`
    }
    
    sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
    
 static runtime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
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