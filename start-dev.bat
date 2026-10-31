@echo off
rem Double-click to run the website on this PC (http://localhost:4321).
rem 1) gets the latest version from GitHub (git pull)
rem 2) installs packages if needed (npm install)
rem 3) starts the dev server and opens the browser. Close this window to stop.

cd /d "%~dp0"
title SCHS website - local server

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org then try again.
  pause
  exit /b 1
)

set "LOCK_BEFORE="
set "LOCK_AFTER="
where git >nul 2>nul
if errorlevel 1 (
  echo Git not found, skipping update.
) else (
  for /f %%h in ('git rev-parse HEAD:package-lock.json 2^>nul') do set "LOCK_BEFORE=%%h"
  echo Getting the latest version from GitHub...
  git pull
  if errorlevel 1 echo Could not update from GitHub. Starting with the files already on this PC.
  for /f %%h in ('git rev-parse HEAD:package-lock.json 2^>nul') do set "LOCK_AFTER=%%h"
)

set "NEED_INSTALL="
if not exist "node_modules\" set "NEED_INSTALL=1"
if not "%LOCK_BEFORE%"=="%LOCK_AFTER%" set "NEED_INSTALL=1"
if defined NEED_INSTALL (
  echo Installing packages, this can take a few minutes the first time...
  call npm install
  if errorlevel 1 (
    echo npm install failed. See the messages above.
    pause
    exit /b 1
  )
)

echo.
echo Starting the website. The browser opens by itself when it is ready.
echo Keep this window open while you look at the site. Close it to stop.
echo.
call npm run dev -- --open

pause
