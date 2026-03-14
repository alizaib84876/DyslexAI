# DyslexAI — Quick start for demo
# Runs run-simple.ps1 (SQLite, no Docker). Use when Docker is unavailable.

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $ScriptDir "scripts\run-simple.ps1")
