
const glob = new Bun.Glob("**/*.{png,ttf}")

for (const file of glob.scanSync("test/integration/expo-app/assets/")) {
  console.log(file); // => "index.ts"
}

// console.log(Array.from(glob))
// for (const file of ) {
//   console.log({file})
// }

// Bun.serve({
//   port: 3000,
//   routes: Object.fromEntries(
//     Array.from(new Bun.Glob("**").scanSync("public")).map(path => [
//       "/" + path,
//       Bun.file("public/" + path),
//     ])
//   ),
// });