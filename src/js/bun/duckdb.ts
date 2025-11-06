// Hardcoded module "duckdb"
// Wrapper around @duckdb/node-api to provide a bun:sqlite-compatible API

import type { DuckDBInstance, DuckDBConnection, DuckDBResult, DuckDBDataChunk } from "@duckdb/node-api";

let duckdbModule: any;

function loadDuckDBModule() {
  if (!duckdbModule) {
    try {
      duckdbModule = require("@duckdb/node-api");
    } catch (err) {
      throw new Error(
        'DuckDB support requires the "@duckdb/node-api" package to be installed. Run: bun add @duckdb/node-api',
      );
    }
  }
  return duckdbModule;
}

const defineProperties = Object.defineProperties;
const toStringTag = Symbol.toStringTag;
const isArray = Array.isArray;

class Statement {
  #connection: DuckDBConnection;
  #sql: string;
  #finalized = false;

  constructor(connection: DuckDBConnection, sql: string) {
    this.#connection = connection;
    this.#sql = sql;
  }

  get isFinalized() {
    return this.#finalized;
  }

  get columnNames() {
    // DuckDB doesn't provide column names until we run the query
    // This will be populated after first execution
    return [];
  }

  get paramsCount() {
    // Count $1, $2, etc. in the SQL string
    const matches = this.#sql.match(/\$\d+/g);
    return matches ? matches.length : 0;
  }

  async get(...params: any[]) {
    if (this.#finalized) {
      throw new Error("Statement has been finalized");
    }

    const prepared = await this.#connection.prepare(this.#sql);
    
    // Bind parameters if provided
    if (params.length > 0) {
      const bindParams = isArray(params[0]) ? params[0] : params;
      for (let i = 0; i < bindParams.length; i++) {
        const value = bindParams[i];
        if (value === null || value === undefined) {
          prepared.bindNull(i + 1);
        } else if (typeof value === "number") {
          if (Number.isInteger(value)) {
            prepared.bindInteger(i + 1, value);
          } else {
            prepared.bindDouble(i + 1, value);
          }
        } else if (typeof value === "string") {
          prepared.bindVarchar(i + 1, value);
        } else if (typeof value === "boolean") {
          prepared.bindBoolean(i + 1, value);
        } else if (typeof value === "bigint") {
          prepared.bindBigInt(i + 1, value);
        } else {
          // Default to varchar for objects
          prepared.bindVarchar(i + 1, String(value));
        }
      }
    }

    const result = await prepared.run();
    const chunk = await result.fetchChunk();
    
    if (chunk.rowCount === 0) {
      return undefined;
    }

    // Convert first row to object
    const row: any = {};
    const columns = chunk.getColumns();
    const columnNames = result.columnNames();
    
    for (let i = 0; i < columnNames.length; i++) {
      row[columnNames[i]] = columns[i][0];
    }

    return row;
  }

  async all(...params: any[]) {
    if (this.#finalized) {
      throw new Error("Statement has been finalized");
    }

    const prepared = await this.#connection.prepare(this.#sql);
    
    // Bind parameters if provided
    if (params.length > 0) {
      const bindParams = isArray(params[0]) ? params[0] : params;
      for (let i = 0; i < bindParams.length; i++) {
        const value = bindParams[i];
        if (value === null || value === undefined) {
          prepared.bindNull(i + 1);
        } else if (typeof value === "number") {
          if (Number.isInteger(value)) {
            prepared.bindInteger(i + 1, value);
          } else {
            prepared.bindDouble(i + 1, value);
          }
        } else if (typeof value === "string") {
          prepared.bindVarchar(i + 1, value);
        } else if (typeof value === "boolean") {
          prepared.bindBoolean(i + 1, value);
        } else if (typeof value === "bigint") {
          prepared.bindBigInt(i + 1, value);
        } else {
          prepared.bindVarchar(i + 1, String(value));
        }
      }
    }

    const result = await prepared.run();
    const reader = await this.#connection.runAndReadAll(this.#sql);
    const rows = reader.getRows();
    const columnNames = result.columnNames();

    // Convert rows to objects
    return rows.map(row => {
      const obj: any = {};
      for (let i = 0; i < columnNames.length; i++) {
        obj[columnNames[i]] = row[i];
      }
      return obj;
    });
  }

  async *iterate(...params: any[]) {
    if (this.#finalized) {
      throw new Error("Statement has been finalized");
    }

    const results = await this.all(...params);
    for (const row of results) {
      yield row;
    }
  }

  async values(...params: any[]) {
    if (this.#finalized) {
      throw new Error("Statement has been finalized");
    }

    const prepared = await this.#connection.prepare(this.#sql);
    
    // Bind parameters
    if (params.length > 0) {
      const bindParams = isArray(params[0]) ? params[0] : params;
      for (let i = 0; i < bindParams.length; i++) {
        const value = bindParams[i];
        if (value === null || value === undefined) {
          prepared.bindNull(i + 1);
        } else if (typeof value === "number") {
          if (Number.isInteger(value)) {
            prepared.bindInteger(i + 1, value);
          } else {
            prepared.bindDouble(i + 1, value);
          }
        } else if (typeof value === "string") {
          prepared.bindVarchar(i + 1, value);
        } else if (typeof value === "boolean") {
          prepared.bindBoolean(i + 1, value);
        } else if (typeof value === "bigint") {
          prepared.bindBigInt(i + 1, value);
        } else {
          prepared.bindVarchar(i + 1, String(value));
        }
      }
    }

    const result = await prepared.run();
    const reader = await this.#connection.runAndReadAll(this.#sql);
    return reader.getRows();
  }

  async run(...params: any[]) {
    if (this.#finalized) {
      throw new Error("Statement has been finalized");
    }

    const prepared = await this.#connection.prepare(this.#sql);
    
    // Bind parameters
    if (params.length > 0) {
      const bindParams = isArray(params[0]) ? params[0] : params;
      for (let i = 0; i < bindParams.length; i++) {
        const value = bindParams[i];
        if (value === null || value === undefined) {
          prepared.bindNull(i + 1);
        } else if (typeof value === "number") {
          if (Number.isInteger(value)) {
            prepared.bindInteger(i + 1, value);
          } else {
            prepared.bindDouble(i + 1, value);
          }
        } else if (typeof value === "string") {
          prepared.bindVarchar(i + 1, value);
        } else if (typeof value === "boolean") {
          prepared.bindBoolean(i + 1, value);
        } else if (typeof value === "bigint") {
          prepared.bindBigInt(i + 1, value);
        } else {
          prepared.bindVarchar(i + 1, String(value));
        }
      }
    }

    await prepared.run();

    return {
      changes: 0, // DuckDB doesn't easily expose this
      lastInsertRowid: 0, // DuckDB uses different mechanisms
    };
  }

  finalize() {
    this.#finalized = true;
  }

  toString() {
    return this.#sql;
  }

  get [toStringTag]() {
    return `"${this.#sql}"`;
  }

  toJSON() {
    return {
      sql: this.#sql,
      isFinalized: this.#finalized,
      paramsCount: this.paramsCount,
      columnNames: this.columnNames,
    };
  }

  [Symbol.dispose]() {
    if (!this.#finalized) {
      this.finalize();
    }
  }
}

class Database {
  #instance: DuckDBInstance | null = null;
  #connection: DuckDBConnection | null = null;
  #filename: string;
  #options: any;
  #closed = false;
  #initPromise: Promise<void> | null = null;

  constructor(filename?: string, options?: any) {
    this.#filename = filename || ":memory:";
    this.#options = options || {};
    this.#initPromise = this.#initialize();
  }

  async #initialize() {
    const duckdb = loadDuckDBModule();
    
    const config: any = {};
    
    // Map options to DuckDB config
    if (this.#options.readonly) {
      config.access_mode = "READ_ONLY";
    }
    
    if (this.#filename === ":memory:") {
      this.#instance = await duckdb.DuckDBInstance.create(":memory:", config);
    } else {
      this.#instance = await duckdb.DuckDBInstance.create(this.#filename, config);
    }
    
    this.#connection = await this.#instance.connect();
  }

  async #ensureInitialized() {
    if (this.#initPromise) {
      await this.#initPromise;
    }
    if (this.#closed) {
      throw new Error("Database connection is closed");
    }
    if (!this.#connection) {
      throw new Error("Database connection not initialized");
    }
  }

  get filename() {
    return this.#filename;
  }

  get inTransaction() {
    // DuckDB doesn't expose transaction state easily
    return false;
  }

  async query(sql: string) {
    await this.#ensureInitialized();
    return new Statement(this.#connection!, sql);
  }

  async prepare(sql: string, params?: any[], flags?: number) {
    await this.#ensureInitialized();
    return new Statement(this.#connection!, sql);
  }

  async run(sql: string, ...params: any[]) {
    await this.#ensureInitialized();
    const stmt = new Statement(this.#connection!, sql);
    return await stmt.run(...params);
  }

  async close(throwOnError = false) {
    if (this.#closed) {
      return;
    }
    
    this.#closed = true;
    
    try {
      // DuckDB connections close automatically when they're garbage collected
      this.#connection = null;
      this.#instance = null;
    } catch (err) {
      if (throwOnError) {
        throw err;
      }
    }
  }

  [Symbol.dispose]() {
    // Note: close() is async, but Symbol.dispose must be sync
    // We'll just mark as closed and let GC handle cleanup
    this.#closed = true;
    this.#connection = null;
    this.#instance = null;
  }

  static open(filename: string, options?: any) {
    return new Database(filename, options);
  }
}

class DuckDBError extends Error {
  code: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "DuckDBError";
    this.code = code || "DUCKDB_ERROR";
  }

  static [Symbol.hasInstance](instance: any) {
    return instance?.name === "DuckDBError";
  }
}

const constants = {
  // DuckDB doesn't have the same constants as SQLite
  // But we'll provide some compatibility shims
  DUCKDB_OPEN_READONLY: 1,
  DUCKDB_OPEN_READWRITE: 2,
  DUCKDB_OPEN_CREATE: 4,
};

export default {
  __esModule: true,
  Database,
  Statement,
  constants,
  default: Database,
  DuckDBError,
};
