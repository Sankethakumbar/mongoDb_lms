const ENGINE = {
    db: { 
        students: [
            {"id":1,"name":"Alice Johnson","age":20,"grade":"A","marks":92,"department":"Computer Science"},
            {"id":2,"name":"Bob Smith","age":22,"grade":"B","marks":78,"department":"Physics"},
            {"id":3,"name":"Charlie Brown","age":21,"grade":"A","marks":88,"department":"Mathematics"}
        ], 
        employees: [
            {"id":1,"name":"John Doe","position":"Engineer","salary":85000.0,"department":"IT"},
            {"id":2,"name":"Jane Roe","position":"Manager","salary":95000.0,"department":"HR"}
        ] 
    },

    async sync() {
        try {
            const sRes = await fetch('http://localhost:8084/api/data/students');
            if (sRes.ok) this.db.students = await sRes.json();
            
            const eRes = await fetch('http://localhost:8084/api/data/employees');
            if (eRes.ok) this.db.employees = await eRes.json();
            
            return true;
        } catch (e) {
            console.error('Sync failed', e);
            return false;
        }
    },

    execute(queryString) {
        try {
            // More robust regex: allows spaces around dots and parentheses
            const match = queryString.trim().match(/^db\s*\.\s*(\w+)\s*\.\s*(\w+)\s*\((.*)\)$/s);
            if (!match) throw new Error("Invalid Syntax. Use db.collection.find({ ... })");

            const [_, colName, op, args] = match;
            
            if (colName === 'system' && op === 'schema') {
                return { success: true, data: { collections: Object.keys(this.db), storage: "MySQL (lms_db)" } };
            }

            const collection = this.db[colName];
            if (!collection) throw new Error(`Collection '${colName}' not found.`);

            let results = [...collection];
            
            // 1. Filtering Logic
            const trimmedArgs = args.trim();
            if (trimmedArgs && trimmedArgs !== '{}') {
                let jsonStr = trimmedArgs.split(',')[0].trim()
                    .replace(/'/g, '"')
                    // Quote unquoted keys (including those starting with $)
                    .replace(/([{,])\s*([\w$]+)\s*:/g, '$1"$2":')
                    // Fix double quotes if they were already there
                    .replace(/"{2,}/g, '"');
                
                if (jsonStr.startsWith('{')) {
                    try {
                        const filter = JSON.parse(jsonStr);
                        results = results.filter(doc => {
                            return Object.keys(filter).every(k => {
                                const val = filter[k];
                                if (typeof val === 'object' && val !== null) {
                                    if (val.$gt !== undefined) return doc[k] > val.$gt;
                                    if (val.$lt !== undefined) return doc[k] < val.$lt;
                                    if (val.$gte !== undefined) return doc[k] >= val.$gte;
                                    if (val.$lte !== undefined) return doc[k] <= val.$lte;
                                    if (val.$ne !== undefined) return doc[k] != val.$ne;
                                    if (val.$in !== undefined && Array.isArray(val.$in)) return val.$in.includes(doc[k]);
                                }
                                return doc[k] == val;
                            });
                        });
                    } catch (e) { 
                        console.warn("Filter parse error", e); 
                        throw new Error("Malformed JSON in query arguments.");
                    }
                }
            }

            // 2. Operation Logic
            if (op === 'count') return { success: true, data: { count: results.length } };
            if (op === 'find') return { success: true, data: results };
            if (op === 'findOne') return { success: true, data: results.length > 0 ? results[0] : null };

            throw new Error(`Operation '${op}' is not supported in this version.`);
        } catch (err) {
            return { success: false, message: err.message };
        }
    }
};
