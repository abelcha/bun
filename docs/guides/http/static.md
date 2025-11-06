---
name: Serve static files from a directory
---

To serve all files from a directory, use [`Bun.Glob`](https://bun.com/docs/api/glob) to scan the directory and build a routes object.

```ts
Bun.serve({
  port: 3000,
  routes: Object.fromEntries(
    Array.from(new Bun.Glob("**").scanSync("public")).map(path => [
      "/" + path,
      Bun.file("public/" + path),
    ])
  ),
});
```

---

Alternatively, build the routes object separately for more flexibility.

```ts
const routes = {};
for (const file of new Bun.Glob("**").scanSync("public")) {
  routes["/" + file] = Bun.file("public/" + file);
}

Bun.serve({ port: 3000, routes });
```

---

Mix static files with dynamic API routes.

```ts
Bun.serve({
  port: 3000,
  routes: {
    "/": Bun.file("public/index.html"),
    "/styles.css": Bun.file("public/styles.css"),
    "/api/status": Response.json({ status: "ok" }),
    "/api/time": () => Response.json({ time: Date.now() }),
  },
});
