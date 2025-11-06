/**
 * Fast DuckDB driver for Bun.js
 *
 * @example
 * ```ts
 * import { Database } from 'bun:duckdb';
 *
 * const db = new Database('app.db');
 * const stmt = await db.query('SELECT * FROM users WHERE name = $1');
 * const results = await stmt.all('John');
 * // => [{ id: 1, name: 'John' }]
 * ```
 *
 * The following types can be used when binding parameters:
 *
 * | JavaScript type | DuckDB type            |
 * | --------------- | ---------------------- |
 * | `string`        | `VARCHAR`              |
 * | `number`        | `INTEGER` or `DOUBLE`  |
 * | `boolean`       | `BOOLEAN`              |
 * | `Uint8Array`    | `BLOB`                 |
 * | `Buffer`        | `BLOB`                 |
 * | `bigint`        | `BIGINT`               |
 * | `null`          | `NULL`                 |
 */
declare module "bun:duckdb" {
  /**
   * A DuckDB database
   *
   * @example
   * ```ts
   * const db = new Database("mydb.ddb");
   * await db.run("CREATE TABLE foo (bar VARCHAR)");
   * await db.run("INSERT INTO foo VALUES ($1)", ["baz"]);
   * const stmt = await db.query("SELECT * FROM foo");
   * console.log(await stmt.all());
   * ```
   *
   * @example
   *
   * Open an in-memory database
   *
   * ```ts
   * const db = new Database(":memory:");
   * await db.run("CREATE TABLE foo (bar VARCHAR)");
   * await db.run("INSERT INTO foo VALUES ($1)", ["hiiiiii"]);
   * const stmt = await db.query("SELECT * FROM foo");
   * console.log(await stmt.all());
   * ```
   *
   * @example
   *
   * Open read-only
   *
   * ```ts
   * const db = new Database("mydb.ddb", {readonly: true});
   * ```
   *
   * @category Database
   */
  export class Database implements Disposable {
    /**
     * Open or create a DuckDB database
     *
     * @param filename The filename of the database to open. Pass an empty string (`""`) or `":memory:"` or undefined for an in-memory database.
     * @param options Configuration options for opening the database
     */
    constructor(
      filename?: string,
      options?: {
        /**
         * Open the database as read-only (no write operations).
         */
        readonly?: boolean;
        /**
         * Allow creating a new database
         */
        create?: boolean;
        /**
         * When set to `true`, integers are returned as `bigint` types.
         *
         * When set to `false`, integers are returned as `number` types.
         *
         * @default false
         */
        safeIntegers?: boolean;
      },
    );

    /**
     * This is an alias of `new Database()`
     *
     * See {@link Database}
     */
    static open(
      filename: string,
      options?: {
        readonly?: boolean;
        create?: boolean;
        safeIntegers?: boolean;
      },
    ): Database;

    /**
     * The filename passed when `new Database()` was called
     *
     * @example
     * ```ts
     * const db = new Database("mydb.ddb");
     * console.log(db.filename); // "mydb.ddb"
     * ```
     */
    readonly filename: string;

    /**
     * Is the database in a transaction?
     *
     * @example
     * ```ts
     * const db = new Database(":memory:");
     * console.log(db.inTransaction); // false
     * ```
     */
    readonly inTransaction: boolean;

    /**
     * Prepare a SQL statement (returned statements must be awaited)
     *
     * @example
     * ```ts
     * const db = new Database(":memory:");
     * const stmt = await db.prepare("SELECT $1 + $1");
     * const result = await stmt.get(1);
     * console.log(result); // { "1 + 1": 2 }
     * ```
     *
     * @param sql The SQL statement to prepare
     * @param params Optional parameters for the query
     * @param flags Optional flags (reserved for future use)
     */
    prepare(sql: string, params?: any[], flags?: number): Promise<Statement>;

    /**
     * Create a SQL query (returned statements must be awaited)
     *
     * @example
     * ```ts
     * const db = new Database(":memory:");
     * const stmt = await db.query("SELECT 42");
     * const result = await stmt.get();
     * console.log(result); // { 42: 42 }
     * ```
     *
     * @param sql The SQL query
     */
    query(sql: string): Promise<Statement>;

    /**
     * Execute a SQL statement that doesn't return results
     *
     * @example
     * ```ts
     * const db = new Database(":memory:");
     * await db.run("CREATE TABLE foo (bar VARCHAR)");
     * await db.run("INSERT INTO foo VALUES ($1)", ["baz"]);
     * ```
     *
     * @param sql The SQL statement to execute
     * @param params Optional parameters for the query
     */
    run(
      sql: string,
      ...params: any[]
    ): Promise<{
      changes: number;
      lastInsertRowid: number;
    }>;

    /**
     * Close the database connection
     *
     * @param throwOnError If true, throw an error if closing fails
     */
    close(throwOnError?: boolean): Promise<void>;

    /**
     * Implements `Symbol.dispose` for use with the `using` keyword
     *
     * @example
     * ```ts
     * {
     *   using db = new Database(":memory:");
     *   await db.run("SELECT 42");
     * } // db is automatically closed
     * ```
     */
    [Symbol.dispose](): void;
  }

  /**
   * A prepared statement
   *
   * @example
   * ```ts
   * const db = new Database(":memory:");
   * const stmt = await db.prepare("SELECT $1");
   * const result = await stmt.get(42);
   * console.log(result); // { $1: 42 }
   * ```
   */
  export class Statement implements Disposable {
    /**
     * Has this statement been finalized?
     */
    readonly isFinalized: boolean;

    /**
     * The column names in the result set
     */
    readonly columnNames: string[];

    /**
     * The number of parameters in the query
     */
    readonly paramsCount: number;

    /**
     * Get the first result as an object
     *
     * @example
     * ```ts
     * const stmt = await db.query("SELECT * FROM users WHERE id = $1");
     * const user = await stmt.get(1);
     * console.log(user); // { id: 1, name: 'John' }
     * ```
     *
     * @param params Parameters to bind to the query
     */
    get(...params: any[]): Promise<any>;

    /**
     * Get all results as an array of objects
     *
     * @example
     * ```ts
     * const stmt = await db.query("SELECT * FROM users");
     * const users = await stmt.all();
     * console.log(users); // [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
     * ```
     *
     * @param params Parameters to bind to the query
     */
    all(...params: any[]): Promise<any[]>;

    /**
     * Iterate over results
     *
     * @example
     * ```ts
     * const stmt = await db.query("SELECT * FROM users");
     * for await (const user of stmt.iterate()) {
     *   console.log(user);
     * }
     * ```
     *
     * @param params Parameters to bind to the query
     */
    iterate(...params: any[]): AsyncIterableIterator<any>;

    /**
     * Get all results as an array of arrays
     *
     * @example
     * ```ts
     * const stmt = await db.query("SELECT id, name FROM users");
     * const rows = await stmt.values();
     * console.log(rows); // [[1, 'John'], [2, 'Jane']]
     * ```
     *
     * @param params Parameters to bind to the query
     */
    values(...params: any[]): Promise<any[][]>;

    /**
     * Execute the statement
     *
     * @example
     * ```ts
     * const stmt = await db.prepare("INSERT INTO users (name) VALUES ($1)");
     * const result = await stmt.run('John');
     * console.log(result.changes); // 1
     * ```
     *
     * @param params Parameters to bind to the query
     */
    run(
      ...params: any[]
    ): Promise<{
      changes: number;
      lastInsertRowid: number;
    }>;

    /**
     * Finalize the statement and free resources
     */
    finalize(): void;

    /**
     * Get the SQL string of the statement
     */
    toString(): string;

    /**
     * Get JSON representation of the statement
     */
    toJSON(): {
      sql: string;
      isFinalized: boolean;
      paramsCount: number;
      columnNames: string[];
    };

    /**
     * Implements `Symbol.dispose` for use with the `using` keyword
     */
    [Symbol.dispose](): void;
  }

  /**
   * DuckDB constants
   */
  export const constants: {
    DUCKDB_OPEN_READONLY: number;
    DUCKDB_OPEN_READWRITE: number;
    DUCKDB_OPEN_CREATE: number;
  };

  /**
   * Error thrown by DuckDB operations
   */
  export class DuckDBError extends Error {
    code: string;
    constructor(message: string, code?: string);
  }

  export { Database as default };
}
