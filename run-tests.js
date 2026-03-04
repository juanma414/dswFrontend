#!/usr/bin/env node

/*
 * Script para ejecutar tests con Puppeteer Chromium correctamente configurado
 */

const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

try {
  // Obtener la ruta de Puppeteer Chromium
  const chromeCbinPath = puppeteer.executablePath();
  console.log('🔍 Chromium encontrado en:', chromeCbinPath);
  
  // Establecer la variable de entorno
  process.env.CHROME_BIN = chromeCbinPath;
  
  // Obtener argumentos de línea de comandos
  const args = process.argv.slice(2);
  const isHeadless = args.includes('--headless') || args.includes('--watch=false');
  
  // Construir comando
  let command = 'ng test';
  if (isHeadless) {
    command += ' --watch=false';
    console.log('🚀 Ejecutando tests en modo headless (una sola ejecución)...\n');
  } else {
    console.log('🚀 Ejecutando tests en modo watch (se re-ejecutan al cambiar archivos)...\n');
  }
  
  // Ejecutar tests
  execSync(command, {
    stdio: 'inherit',
    env: {
      ...process.env,
      CHROME_BIN: chromeCbinPath
    }
  });
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
