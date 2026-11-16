import { defineConfig } from 'vite';

// es2022: permite "await" no nível do módulo (usado para iniciar o WebGPU).
export default defineConfig({
  build: { target: 'es2022' },
});
