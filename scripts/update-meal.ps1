# ============================================================
#  update-meal.ps1
#  CTR building weekly meal-plan auto-updater.
#  1. Finds the CTR building weekly-menu .pptx in the synced
#     OneDrive folder, unzips it, and pulls the largest image
#     (the photographed menu) from each slide, in slide order.
#  2. Generates 4 rotations of each so a headless Claude agent
#     can pick the upright one and OCR it.
#  3. Invokes `claude -p` to read the images and rewrite
#     src/data/meal.json.
#  Script body is intentionally ASCII-only (this is a CP949
#  Windows); Korean lives in meal-update-prompt.md, read as UTF-8.
# ============================================================
[CmdletBinding()]
param(
  [string]$PptxPath  # optional override; auto-detected if omitted
)

$ErrorActionPreference = 'Stop'
$RepoRoot   = Split-Path $PSScriptRoot -Parent
$WorkBase   = Join-Path $PSScriptRoot '.meal-work'
$LogFile    = Join-Path $PSScriptRoot 'meal-update.log'
$PromptFile = Join-Path $PSScriptRoot 'meal-update-prompt.md'
$MealJson   = Join-Path $RepoRoot 'src\data\meal.json'
$ClaudeExe  = Join-Path $env:USERPROFILE '.local\bin\claude.exe'

function Log([string]$msg) {
  $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $line = "[$ts] $msg"
  Write-Host $line
  # The repo file-watcher may briefly hold the log; retry on transient IO locks.
  for ($i = 0; $i -lt 5; $i++) {
    try { Add-Content -Path $LogFile -Value $line -Encoding UTF8 -ErrorAction Stop; return }
    catch { Start-Sleep -Milliseconds 150 }
  }
}

try {
  Log '=== meal update run started ==='

  # ---- 1. Locate the source .pptx --------------------------------
  if (-not $PptxPath) {
    $ctrRoot = Join-Path $env:USERPROFILE 'CTR'
    if (-not (Test-Path $ctrRoot)) { throw "CTR sync folder not found: $ctrRoot" }
    # "CTR building" = the file whose name contains U+BE4C U+B529 ("building" in Korean)
    $needle = [string]([char]0xBE4C + [char]0xB529)
    $hit = Get-ChildItem -Path $ctrRoot -Recurse -Filter '*.pptx' -File |
           Where-Object { $_.Name -like "*$needle*" } |
           Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $hit) { throw "CTR building weekly-menu .pptx not found under $ctrRoot" }
    $PptxPath = $hit.FullName
  }
  Log "source pptx: $PptxPath ($([math]::Round((Get-Item $PptxPath).Length/1KB)) KB, modified $((Get-Item $PptxPath).LastWriteTime))"

  # ---- 2. Fresh work dir + unzip ---------------------------------
  # Use a unique per-run subdir so we never have to delete a dir whose image
  # files may still be held open (editor file-watcher, AV, a prior run).
  if (-not (Test-Path $WorkBase)) { New-Item -ItemType Directory -Path $WorkBase | Out-Null }
  Get-ChildItem $WorkBase -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    try { Remove-Item $_.FullName -Recurse -Force -ErrorAction Stop } catch { }
  }
  $WorkDir = Join-Path $WorkBase ('run-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
  New-Item -ItemType Directory -Path $WorkDir | Out-Null
  $zipCopy = Join-Path $WorkDir 'src.zip'
  Copy-Item $PptxPath $zipCopy
  $extract = Join-Path $WorkDir 'extract'
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [System.IO.Compression.ZipFile]::ExtractToDirectory($zipCopy, $extract)

  # ---- 3. For each slide, grab the largest referenced image ------
  Add-Type -AssemblyName System.Drawing
  $slideDir = Join-Path $extract 'ppt\slides'
  $slides = Get-ChildItem $slideDir -Filter 'slide*.xml' -File |
            Sort-Object { [int]([regex]::Match($_.Name,'\d+').Value) }
  if (-not $slides) { throw 'no slides found in pptx' }

  $slideIdx = 0
  foreach ($slide in $slides) {
    $slideIdx++
    $relsPath = Join-Path $slide.DirectoryName ("_rels\" + $slide.Name + ".rels")
    if (-not (Test-Path $relsPath)) { Log "slide$slideIdx has no rels; skipping"; continue }
    [xml]$rels = Get-Content $relsPath -Raw
    $imgTargets = $rels.Relationships.Relationship |
      Where-Object { $_.Type -like '*/image' } |
      ForEach-Object {
        $t = $_.Target -replace '^\.\.', 'ppt' -replace '/', '\'
        Join-Path $extract $t
      } | Where-Object { Test-Path $_ }
    if (-not $imgTargets) { Log "slide$slideIdx references no images; skipping"; continue }

    $biggest = $imgTargets | ForEach-Object { Get-Item $_ } |
               Sort-Object Length -Descending | Select-Object -First 1
    $outDir = Join-Path $WorkDir "slide$slideIdx"
    New-Item -ItemType Directory -Path $outDir | Out-Null

    $rotations = @{ 'orig' = $null;
                    'rot90'  = [System.Drawing.RotateFlipType]::Rotate90FlipNone;
                    'rot180' = [System.Drawing.RotateFlipType]::Rotate180FlipNone;
                    'rot270' = [System.Drawing.RotateFlipType]::Rotate270FlipNone }
    foreach ($name in $rotations.Keys) {
      $img = [System.Drawing.Image]::FromFile($biggest.FullName)
      if ($rotations[$name]) { $img.RotateFlip($rotations[$name]) }
      $img.Save((Join-Path $outDir "$name.jpg"), [System.Drawing.Imaging.ImageFormat]::Jpeg)
      $img.Dispose()
    }
    Log "slide$slideIdx -> $($biggest.Name) ($([math]::Round($biggest.Length/1KB)) KB), 4 rotations written to $outDir"
  }

  # ---- 4. Invoke headless Claude to OCR + rewrite meal.json ------
  if (-not (Test-Path $ClaudeExe)) { throw "claude.exe not found: $ClaudeExe" }
  if (-not (Test-Path $PromptFile)) { throw "prompt file not found: $PromptFile" }

  $today = Get-Date -Format 'yyyy-MM-dd'
  $preamble = @"
[context]
- Today is $today.
- Repo root: $RepoRoot
- Slide image folders: $WorkDir  (slide1/, slide2/ each with orig.jpg / rot90.jpg / rot180.jpg / rot270.jpg)
- Target data file to overwrite: $MealJson

Follow the instructions below exactly.

"@
  $promptBody = Get-Content $PromptFile -Raw -Encoding UTF8
  $fullPrompt = $preamble + $promptBody

  Log 'invoking claude (headless) to read menu images and update meal.json ...'
  $outFile = Join-Path $WorkDir 'claude-out.txt'
  $errFile = Join-Path $WorkDir 'claude-err.txt'
  Push-Location $RepoRoot
  try {
    # Feed the (Korean, multi-KB) prompt via STDIN as UTF-8. Passing it as a native
    # command ARGUMENT mangles non-ASCII under Windows PowerShell 5.1; stdin does not.
    # Redirect streams to files; do NOT merge stderr into the pipeline (that would
    # wrap warning lines as terminating NativeCommandErrors under ErrorActionPreference=Stop).
    $ErrorActionPreference = 'Continue'
    $prevEnc = $OutputEncoding
    $OutputEncoding = New-Object System.Text.UTF8Encoding $false
    $fullPrompt | & $ClaudeExe -p `
        --permission-mode acceptEdits `
        --allowedTools 'Read,Write,Edit,Glob' 1> $outFile 2> $errFile
    $claudeExit = $LASTEXITCODE
    $OutputEncoding = $prevEnc
    $ErrorActionPreference = 'Stop'
  } finally {
    Pop-Location
  }
  $claudeOut = (Get-Content $outFile -Raw -Encoding UTF8 -ErrorAction SilentlyContinue)
  $claudeErr = (Get-Content $errFile -Raw -Encoding UTF8 -ErrorAction SilentlyContinue)
  Log ("claude exit=$claudeExit output:`n" + "$claudeOut".Trim())
  if ("$claudeErr".Trim()) { Log ("claude stderr:`n" + "$claudeErr".Trim()) }
  if ($claudeExit -ne 0) { throw "claude exited with code $claudeExit" }

  # ---- 5. Sanity-check the result --------------------------------
  $json = Get-Content $MealJson -Raw -Encoding UTF8 | ConvertFrom-Json
  $c = $json.cafeterias.Count
  $d0 = $json.cafeterias[0].week.Count
  Log "meal.json OK: weekRangeLabel='$($json.weekRangeLabel)', updatedAt='$($json.updatedAt)', cafeterias=$c, days=$d0"

  # ---- 6. Rebuild the app so the new data ships to the site ------
  # Resolve npm robustly (Task Scheduler runs with -NoProfile; PATH may be minimal).
  $npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
  if (-not $npm) { $npm = Join-Path $env:ProgramFiles 'nodejs\npm.cmd' }
  if (-not (Test-Path $npm)) { throw "npm.cmd not found (looked on PATH and at $npm)" }

  Log "running '$npm run build' ..."
  $buildOut = Join-Path $WorkDir 'build-out.txt'
  Push-Location $RepoRoot
  try {
    $ErrorActionPreference = 'Continue'
    & $npm run build 1> $buildOut 2>&1
    $buildExit = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
  } finally {
    Pop-Location
  }
  $buildLog = (Get-Content $buildOut -Raw -Encoding UTF8 -ErrorAction SilentlyContinue)
  Log ("build exit=$buildExit output (tail):`n" + (("$buildLog".Trim() -split "`n") | Select-Object -Last 6 | Out-String).Trim())
  if ($buildExit -ne 0) { throw "npm run build failed with code $buildExit" }

  Log '=== meal update run finished ==='
}
catch {
  Log "ERROR: $($_.Exception.Message)"
  Log ($_.ScriptStackTrace)
  exit 1
}
