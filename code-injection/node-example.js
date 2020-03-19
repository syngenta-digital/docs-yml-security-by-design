const mysql = require('mysql');
/*
    Simple ODM which stops SQL injection by
    enforcing SQL statements use programmatically,
    deconstructing javascript objects and placing them within
    SQL statements.
*/
class MySQLAdapter {
    constructor(params) {
        const config = params.mysqlConnection || this._parseUri(params.mysqlURI);
        this.connection = mysql.createConnection(config);
        this._modelSchema = params.modelSchema;
        this._modelVersionKey = params.modelVersionKey;
        this._modelIdentifier = params.modelIdentifier;
    }

    select(query) {
        const searchCriteria = [query.columns || ['*'], query.table];
        const queryString = this._buildWhere(
            query,
            'SELECT ?? FROM ??',
            searchCriteria
        );
        return this._getPromise(query, queryString, searchCriteria);
    }

    insert(query) {
        const searchCriteria = [query.table, query.data];
        const queryString = 'INSERT INTO ?? SET ?';
        return this._getPromise(query, queryString, searchCriteria);
    }

    upsert(query) {
        const searchCriteria = [query.table, query.data, query.data];
        const queryString = 'INSERT INTO ?? SET ? ON DUPLICATE KEY UPDATE ?';
        return this._getPromise(query, queryString, searchCriteria);
    }

    update(query) {
        const searchCriteria = [query.table, query.data];
        const queryString = this._buildWhere(
            query,
            'UPDATE ?? SET ?',
            searchCriteria
        );
        return this._getPromise(query, queryString, searchCriteria);
    }

    delete(query) {
        const searchCriteria = [query.table];
        const queryString = this._buildWhere(
            query,
            'DELETE FROM ??',
            searchCriteria
        );
        return this._getPromise(query, queryString, searchCriteria);
    }

    query(queryString, searchCriteria) {
        return this._getPromise({}, queryString, searchCriteria);
    }

    end() {
        this.connection.end();
    }

    _parseUri(uri = '') {
        const parts = uri.split(':');
        const user = parts[1].split('//')[1];
        const hostpass = parts[2].split('@');
        const pass = hostpass[0];
        const host = hostpass[1];
        const db = parts[3].split('/')[1];
        const params = {
            host,
            user,
            password: pass,
            database: db
        };
        return params;
    }

    _buildWhere(query = {}, queryString = '', searchCriteria = []) {
        if (!query.where) {
            return queryString;
        }
        queryString += ' WHERE ';
        const whereString = [];
        for (const where in query.where) {
            if (where) {
                searchCriteria.push(query.where[where]);
                whereString.push(' ? ');
            }
        }
        const operator = query.operator || 'AND';
        queryString += whereString.join(operator);
        return queryString;
    }

    _getPromise(query = {}, queryString = '', searchCriteria = []) {
        return new Promise((resolve, reject) => {
            const statement = this.connection.query(
                queryString,
                searchCriteria,
                (error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                }
            );
            if (query.debug) console.log(statement.sql);
        });
    }
}

module.exports = MySQLAdapter;
