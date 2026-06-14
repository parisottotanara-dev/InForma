@echo off
title InForma
rem Avvia il mini server locale e apre l'app nel browser.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
