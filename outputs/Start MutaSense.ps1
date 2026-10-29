$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$taskNodeCommand = Get-Command node -ErrorAction SilentlyContinue
$taskNodePath = if ($taskNodeCommand) { $taskNodeCommand.Source } else { Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
if (-not (Test-Path -LiteralPath $taskNodePath)) { throw 'Node.js is required. Install it from nodejs.org or open this project in Codex.' }
$taskServerPath = Join-Path $taskRoot 'agent-server.cjs'
if (-not (Test-Path -LiteralPath $taskServerPath)) { $taskServerPath = Join-Path $taskRoot 'MutaSense_Local\agent-server.cjs' }
Write-Host 'MutaSense: http://127.0.0.1:8765/MutaSense.html'
Write-Host 'Keep this window running. Choose Cloudflare credentials or your existing Codex sign-in in AI connection.'
& $taskNodePath $taskServerPath
