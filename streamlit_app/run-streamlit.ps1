param(
    [string]$ApiKey = $env:ELEVENLABS_API_KEY,
    [string]$ProId = $env:ELEVENLABS_AGENT_PRO_ID,
    [string]$ConId = $env:ELEVENLABS_AGENT_CON_ID
)

$dotenv = Join-Path $PSScriptRoot ".env"
if (Test-Path $dotenv) {
  Get-Content $dotenv | ForEach-Object {
    if (-not $_ -or $_.Trim().StartsWith("#")) { return }
    $parts = $_ -split "=", 2
    if ($parts.Length -eq 2) {
      $name = $parts[0].Trim()
      $value = $parts[1].Trim()
      [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
  }
  $ApiKey = $env:ELEVENLABS_API_KEY
  $ProId  = $env:ELEVENLABS_AGENT_PRO_ID
  $ConId  = $env:ELEVENLABS_AGENT_CON_ID
}

$py = Get-Command py -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command python -ErrorAction SilentlyContinue }
if (-not $py) {
  # Try common install locations
  $candidates = @()
  $paths = @(
    Join-Path $env:LOCALAPPDATA "Programs\Python",
    "C:\\Program Files",
    "C:\\Program Files (x86)"
  )
  foreach ($p in $paths) {
    if (Test-Path $p) {
      $candidates += Get-ChildItem -Path $p -Filter python.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
    }
  }
  if ($candidates.Count -gt 0) {
    $pyExec = ($candidates | Sort-Object | Select-Object -Last 1)
    $py = [pscustomobject]@{ Path = $pyExec }
  }
}
if (-not $py) { Write-Host "Python not found. Install Python 3.11+ and retry."; exit 1 }

# Install dependencies
$rootReq = Join-Path $PSScriptRoot "..\requirements.txt"
if (Test-Path $rootReq) {
  & $py.Path -m pip install --upgrade pip | Write-Output
  & $py.Path -m pip install -r $rootReq | Write-Output
} else {
  & $py.Path -m pip install --upgrade pip streamlit requests google-cloud-texttospeech python-dotenv supabase openai | Write-Output
}

Write-Host ("Key set: " + [bool]$env:ELEVENLABS_API_KEY)
Write-Host ("PRO agent set: " + [bool]$env:ELEVENLABS_AGENT_PRO_ID)
Write-Host ("CON agent set: " + [bool]$env:ELEVENLABS_AGENT_CON_ID)

$app = Join-Path $PSScriptRoot "app.py"
& $py.Path -m streamlit run $app --server.enableCORS false --server.enableXsrfProtection false --server.headless true


