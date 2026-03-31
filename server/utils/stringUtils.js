const injectVariables = (text, user) => {
    if (!text || !user) return text;
    
    return text.replace(/{(\w+)}/g, (match, key) => {
        // Support {name}, {phone}, {role}, etc.
        return user[key] || match;
    });
};

module.exports = { injectVariables };
