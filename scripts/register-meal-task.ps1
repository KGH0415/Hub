# ============================================================
#  register-meal-task.ps1  (run once)
#  Registers a Windows Scheduled Task that runs update-meal.ps1
#  every Monday at 11:30 to auto-refresh the weekly meal plan.
#  Runs in the logged-on user's context so the OneDrive-synced
#  source folder and the per-user claude.exe auth are available.
# ============================================================
$ErrorActionPreference = 'Stop'

$TaskName   = 'CTR-Weekly-Meal-Update'
$ScriptPath = Join-Path $PSScriptRoot 'update-meal.ps1'
if (-not (Test-Path $ScriptPath)) { throw "update-meal.ps1 not found: $ScriptPath" }

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument ('-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "{0}"' -f $ScriptPath)

# Weekly, Monday 11:30 (local time).
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At ([datetime]'11:30')

$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -DontStopOnIdleEnd `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
  -MultipleInstances IgnoreNew

# Run only when this user is logged on (needed for OneDrive files + claude auth).
$principal = New-ScheduledTaskPrincipal `
  -UserId ("{0}\{1}" -f $env:USERDOMAIN, $env:USERNAME) `
  -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName `
  -Action $action -Trigger $trigger -Settings $settings -Principal $principal `
  -Description 'Reads the CTR building weekly meal-plan PPTX from the synced CTR NEWS folder and updates src/data/meal.json via a headless Claude run. Runs every Monday 11:30.' `
  -Force | Out-Null

$t = Get-ScheduledTask -TaskName $TaskName
$info = Get-ScheduledTaskInfo -TaskName $TaskName
"Registered task : $($t.TaskName)  [$($t.State)]"
"Action          : powershell.exe -File $ScriptPath"
"Trigger         : Weekly, Monday 11:30"
"Next run time   : $($info.NextRunTime)"
