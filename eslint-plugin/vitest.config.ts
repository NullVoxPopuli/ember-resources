/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    include: ['tests/**/*-test.{mts,ts,mjs}'],
  },
})
