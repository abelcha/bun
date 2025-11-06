import { describe, test, expect } from "bun:test";
import { Database } from "bun:duckdb";

describe("bun:duckdb", () => {
  test("should create a database instance", async () => {
    const db = new Database(":memory:");
    expect(db).toBeDefined();
    expect(db.filename).toBe(":memory:");
    await db.close();
  });

  test("should run a simple query", async () => {
    const db = new Database(":memory:");
    const stmt = await db.query("SELECT 42 as num");
    const result = await stmt.get();
    expect(result).toEqual({ num: 42 });
    await db.close();
  });

  test("should return all rows", async () => {
    const db = new Database(":memory:");
    const stmt = await db.query("SELECT * FROM (VALUES (1, 'a'), (2, 'b'), (3, 'c')) AS t(id, name)");
    const results = await stmt.all();
    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({ id: 1, name: "a" });
    expect(results[1]).toEqual({ id: 2, name: "b" });
    expect(results[2]).toEqual({ id: 3, name: "c" });
    await db.close();
  });

  test("should support prepared statements with parameters", async () => {
    const db = new Database(":memory:");
    
    // Create a table
    await db.run("CREATE TABLE users (id INTEGER, name VARCHAR)");
    await db.run("INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob')");
    
    // Query with parameters
    const stmt = await db.prepare("SELECT * FROM users WHERE id = $1");
    const result = await stmt.get(1);
    expect(result).toEqual({ id: 1, name: "Alice" });
    
    await db.close();
  });

  test("should iterate over results", async () => {
    const db = new Database(":memory:");
    const stmt = await db.query("SELECT * FROM (VALUES (1), (2), (3)) AS t(num)");
    
    const results = [];
    for await (const row of stmt.iterate()) {
      results.push(row);
    }
    
    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({ num: 1 });
    
    await db.close();
  });

  test("should return values as arrays", async () => {
    const db = new Database(":memory:");
    const stmt = await db.query("SELECT * FROM (VALUES (1, 'a'), (2, 'b')) AS t(id, name)");
    const results = await stmt.values();
    
    expect(results).toEqual([
      [1, "a"],
      [2, "b"],
    ]);
    
    await db.close();
  });

  test("should finalize statements", async () => {
    const db = new Database(":memory:");
    const stmt = await db.query("SELECT 1");
    
    expect(stmt.isFinalized).toBe(false);
    stmt.finalize();
    expect(stmt.isFinalized).toBe(true);
    
    // Should throw after finalization
    await expect(stmt.get()).rejects.toThrow("Statement has been finalized");
    
    await db.close();
  });

  test("should support Symbol.dispose", async () => {
    const db = new Database(":memory:");
    const stmt = await db.query("SELECT 1");
    
    {
      using disposableStmt = stmt;
      expect(disposableStmt.isFinalized).toBe(false);
    }
    
    expect(stmt.isFinalized).toBe(true);
    await db.close();
  });
});
