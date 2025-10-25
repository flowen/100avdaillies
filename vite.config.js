import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: {
    port: 3000,
    open: true,
    watch: {
      usePolling: true, // Use polling instead of fsevents to avoid Node.js v23 issues
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "index.html",
        "001": "001/index.html",
        "002": "002/index.html",
        "003": "003/index.html",
        "004": "004/index.html",
        "005": "005/index.html",
        "006": "006/index.html",
        "007": "007/index.html",
        "008": "008/index.html",
        "009": "009/index.html",
        "010": "010/index.html",
        "011": "011/index.html",
        "012": "012/index.html",
        "013": "013/index.html",
        "014": "014/index.html",
        "015": "015/index.html",
        "016": "016/index.html",
        "017": "017/index.html",
      },
    },
  },
  optimizeDeps: {
    include: ["three", "@superguigui/wagner"],
  },
});
