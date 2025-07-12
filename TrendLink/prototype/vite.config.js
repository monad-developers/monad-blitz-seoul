import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
<<<<<<< HEAD
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@widget': path.resolve(__dirname, '../widget'),
      '@': path.resolve(__dirname, '.')
    }
  },
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  optimizeDeps: {
    include: ['web3']
  }
})
=======
	plugins: [react()],
	server: {
		port: 8006,
		open: true,
		core: true,
	},
	resolve: {
		extensions: [".js", ".jsx", ".ts", ".tsx"],
		alias: {
			"@widget": path.resolve(__dirname, "../widget"),
			"@": path.resolve(__dirname, "."),
		},
	},
	optimizeDeps: {
		include: ["@web3auth/modal", "@web3auth/base", "@web3auth/ethereum-provider"],
	},
});
>>>>>>> c3b5de3c9a757acd4dcfa124118e517fd3c60fb9
