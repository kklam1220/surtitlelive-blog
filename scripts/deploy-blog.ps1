param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$AllowedChangedPath,

    [switch]$PlanOnly,

    [ValidatePattern('^$|^[0-9a-f]{40}$')]
    [string]$ExpectedDeploymentSha = '',

    [switch]$BootstrapWorkflowOnly
)

$ErrorActionPreference = 'Stop'
# The workflow token must not reach npm scripts or persisted Git credentials.
$deploymentAccessToken = $env:BLOG_DEPLOY_TOKEN
$env:BLOG_DEPLOY_TOKEN = $null
if ($BootstrapWorkflowOnly -and $deploymentAccessToken) {
    throw 'Workflow bootstrap requires the reviewed local controller, not a hosted job token.'
}

# PowerShell Script to Deploy Blog
Write-Host "🚀 Starting Blog Deployment..." -ForegroundColor Green

# Configuration
$MainRepoPath = Get-Location
$BlogSourcePath = if (Test-Path (Join-Path $MainRepoPath 'astro.config.mjs')) { $MainRepoPath.Path } else { Join-Path $MainRepoPath 'blog' }
$TempDeployPath = Join-Path ([System.IO.Path]::GetTempPath()) ("surtitlelive-blog-deploy-" + [System.Guid]::NewGuid().ToString("N"))
$DeploymentRepoUrl = "https://github.com/kklam1220/surtitlelive-blog.git"
$AllowedChangedPatterns = @(
    $AllowedChangedPath.Split(',') |
        ForEach-Object { $_.Trim().Replace('\', '/') } |
        Where-Object { $_ }
)

if ($AllowedChangedPatterns.Count -eq 0 -or $AllowedChangedPatterns -contains '*') {
    throw "AllowedChangedPath must contain one or more narrow, comma-separated repository paths or path patterns; a repository-wide '*' is not allowed."
}

function Assert-SafeTempDeployPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $resolvedMain = [System.IO.Path]::GetFullPath($MainRepoPath.Path)
    $resolvedTemp = [System.IO.Path]::GetFullPath($Path)
    $systemTemp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())

    if (-not $resolvedTemp.StartsWith($systemTemp, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to use deployment temp path outside the system temp directory: $resolvedTemp"
    }

    if ($resolvedTemp.StartsWith($resolvedMain, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to use deployment temp path inside the main workspace: $resolvedTemp"
    }

    if ($resolvedTemp -match '(^|[\\/])\.env($|[\\/])') {
        throw "Refusing to use a protected env path for deployment temp work: $resolvedTemp"
    }
}

Assert-SafeTempDeployPath -Path $TempDeployPath

# 1.5. Verify the local blog build contract before syncing to the deployment repo
Write-Host "Running local blog preflight..."
npm --prefix $BlogSourcePath run blog:i18n:check
if ($LASTEXITCODE -ne 0) {
    Write-Error "Blog localization check failed. Aborting deployment sync."
    exit 1
}

npm --prefix $BlogSourcePath run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Blog build failed. Aborting deployment sync."
    exit 1
}

npm --prefix $BlogSourcePath run build:check
if ($LASTEXITCODE -ne 0) {
    Write-Error "Blog build contract check failed. Aborting deployment sync."
    exit 1
}

$officeLockFiles = Get-ChildItem -Path $BlogSourcePath -Recurse -File | Where-Object { $_.Name -like '~$*' }
if ($officeLockFiles) {
    $relativeLockPaths = $officeLockFiles | ForEach-Object { [System.IO.Path]::GetRelativePath($BlogSourcePath, $_.FullName) }
    Write-Error ("Office lock files must be closed and removed before deployment: " + ($relativeLockPaths -join ', '))
    exit 1
}

$locationPushed = $false
$gitEnvironment = @{}
try {
    if ($deploymentAccessToken) {
        $gitSettings = @{
            GIT_CONFIG_COUNT = '3'
            GIT_CONFIG_KEY_0 = 'http.https://github.com/kklam1220/surtitlelive-blog.git.extraheader'
            GIT_CONFIG_VALUE_0 = 'AUTHORIZATION: basic ' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("x-access-token:$deploymentAccessToken"))
            GIT_CONFIG_KEY_1 = 'credential.helper'
            GIT_CONFIG_VALUE_1 = ''
            GIT_CONFIG_KEY_2 = 'core.askPass'
            GIT_CONFIG_VALUE_2 = ''
            GIT_ASKPASS = ''
            GIT_TERMINAL_PROMPT = '0'
        }
        foreach ($name in $gitSettings.Keys) {
            $gitEnvironment[$name] = [Environment]::GetEnvironmentVariable($name)
            [Environment]::SetEnvironmentVariable($name, $gitSettings[$name])
        }
    }
    # 2. Clone Deployment Repo
    Write-Host "Cloning deployment repository..."
    git clone $DeploymentRepoUrl $TempDeployPath
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $TempDeployPath)) {
        throw "Failed to clone the deployment repository."
    }
    $deploymentHead = git -C $TempDeployPath rev-parse HEAD
    if ($LASTEXITCODE -ne 0 -or ($ExpectedDeploymentSha -and $deploymentHead -ne $ExpectedDeploymentSha)) {
        throw 'Independent Blog baseline changed. Review a fresh plan before publication.'
    }
    Write-Host "Independent Blog baseline: $deploymentHead"

    # 3. Sync Content
    Write-Host "Syncing content from local workspace..."
    if ($BootstrapWorkflowOnly) {
        if (-not $ExpectedDeploymentSha) { throw 'Workflow bootstrap requires the reviewed independent Blog SHA.' }
        $workflowPath = '.github/workflows/deploy-blog.yml'
        $sourceWorkflow = Join-Path $BlogSourcePath $workflowPath
        if (-not (Test-Path -LiteralPath $sourceWorkflow -PathType Leaf)) { throw 'Missing reviewed Blog workflow.' }
        $destinationWorkflow = Join-Path $TempDeployPath $workflowPath
        New-Item -ItemType Directory -Path (Split-Path $destinationWorkflow) -Force | Out-Null
        Copy-Item -LiteralPath $sourceWorkflow -Destination $destinationWorkflow -Force
        $destinationController = Join-Path $TempDeployPath 'scripts/deploy-blog.ps1'
        New-Item -ItemType Directory -Path (Split-Path $destinationController) -Force | Out-Null
        Copy-Item -LiteralPath $PSCommandPath -Destination $destinationController -Force
    }
    else {
        Get-ChildItem -LiteralPath $TempDeployPath -Force -Exclude '.git' | Remove-Item -Recurse -Force
        Get-ChildItem -LiteralPath $BlogSourcePath -Force |
            Where-Object { $_.Name -notin @('node_modules', '.git', 'dist', '.vscode', '.env') -and $_.Name -notlike '.env.*' } |
            Copy-Item -Destination $TempDeployPath -Recurse -Force -Exclude 'node_modules', '.git', 'dist', '.vscode', '.env', '.env.*', '*.log', '*.DS_Store', '~$*'

        # Authoring packages are inputs, not public downloads. Intentional downloads
        # under blog/public remain deployable.
        $contentPackagePath = Join-Path $TempDeployPath "src/content/blog"
        if (Test-Path $contentPackagePath) {
            Get-ChildItem -Path $contentPackagePath -File |
                Where-Object { $_.Extension -in @('.zip', '.htm', '.html') } |
                Remove-Item -Force
            Get-ChildItem -Path $contentPackagePath -Directory -Filter "*_files" |
                Remove-Item -Recurse -Force
        }
    }

    # 4. Stage and verify the declared scope before commit or push.
    Push-Location $TempDeployPath
    $locationPushed = $true
    Write-Host "Staging changes..."
    git add .
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to stage the blog deployment candidate."
    }

    $changes = @(git status --porcelain)
    $changedPaths = @(git diff --cached --name-only)
    if ($LASTEXITCODE -ne 0) { throw 'Failed to read the staged Blog candidate.' }
    Write-Host ("Complete deployment changes:`n - " + ($changedPaths -join "`n - "))
    $unexpectedPaths = @(
        $changedPaths | Where-Object {
            $candidatePath = $_.Replace('\', '/')
            -not ($AllowedChangedPatterns | Where-Object { $candidatePath -like $_ })
        }
    )

    if ($unexpectedPaths.Count -gt 0) {
        throw ("Blog deployment scope check failed. The remote repository would receive undeclared changes:`n - " + ($unexpectedPaths -join "`n - "))
    }
    if ($deploymentAccessToken -and -not $PlanOnly -and ($changedPaths | Where-Object { $_ -like '.github/workflows/*' })) {
        throw 'Install or update Blog workflow definitions through the reviewed local controller path, not the hosted job token.'
    }

    if ($changes) {
        if ($PlanOnly) {
            Write-Host "Plan-only validation passed. No commit or push was performed." -ForegroundColor Green
        }
        else {
            $deploymentLabel = if ($BootstrapWorkflowOnly) { 'workflow setup' } else { 'content update' }
            git commit -m "Deploy: Blog $deploymentLabel $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to commit the blog deployment candidate."
            }
            Write-Host "Pushing to Cloudflare Pages..."
            git push origin main
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to push the blog deployment candidate."
            }
            Write-Host "✅ Deployment triggered successfully!" -ForegroundColor Green
        }
    }
    else {
        Write-Host "No changes detected. Nothing to push." -ForegroundColor Yellow
    }
}
finally {
    foreach ($name in $gitEnvironment.Keys) {
        [Environment]::SetEnvironmentVariable($name, $gitEnvironment[$name])
    }
    $deploymentAccessToken = $null
    if ($locationPushed) {
        Pop-Location
    }
    if (Test-Path $TempDeployPath) {
        Write-Host "Cleaning up..."
        Assert-SafeTempDeployPath -Path $TempDeployPath
        Remove-Item -Path $TempDeployPath -Recurse -Force
    }
}

if (-not $PlanOnly) {
    Write-Host "Done. Check https://blog.surtitlelive.com in 2 minutes." -ForegroundColor Cyan
}
