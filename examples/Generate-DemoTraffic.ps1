param(
    [int]$SuccessCount = 8,
    [int]$ApprovalCount = 2,
    [int]$TransientFailureCount = 2,
    [string]$BaseUrl = "http://localhost:3000"
)

$runId = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

function Send-Workflow {
    param(
        [string]$EventId,
        [string]$EventType,
        [bool]$ApprovalRequired,
        [hashtable]$Payload
    )

    $body = @{
        source = "portfolio-demo-generator"
        eventId = $EventId
        eventType = $EventType
        approvalRequired = $ApprovalRequired
        payload = $Payload
    } | ConvertTo-Json -Depth 6

    Invoke-RestMethod `
        -Uri "$BaseUrl/webhooks/example" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
}

Write-Host "Generating demo traffic run $runId"

for ($i = 1; $i -le $SuccessCount; $i++) {
    $result = Send-Workflow `
        -EventId "demo-$runId-success-$i" `
        -EventType "demo.success" `
        -ApprovalRequired $false `
        -Payload @{
            message = "Successful demo workflow $i"
            batch = $runId
        }

    Write-Host "Success workflow queued: $($result.workflowId)"
}

for ($i = 1; $i -le $ApprovalCount; $i++) {
    $result = Send-Workflow `
        -EventId "demo-$runId-approval-$i" `
        -EventType "demo.approval" `
        -ApprovalRequired $true `
        -Payload @{
            message = "Approval demo workflow $i"
            batch = $runId
        }

    Write-Host "Approval workflow waiting: $($result.workflowId)"

    Start-Sleep -Milliseconds 500

    $approveBody = @{
        decidedBy = "Demo Traffic Generator"
        note = "Automatically approved for observability demonstration"
    } | ConvertTo-Json

    Invoke-RestMethod `
        -Uri "$BaseUrl/workflows/$($result.workflowId)/approve" `
        -Method Post `
        -ContentType "application/json" `
        -Body $approveBody | Out-Null

    Write-Host "Approval workflow approved: $($result.workflowId)"
}

for ($i = 1; $i -le $TransientFailureCount; $i++) {
    $result = Send-Workflow `
        -EventId "demo-$runId-failure-$i" `
        -EventType "demo.transient-failure" `
        -ApprovalRequired $false `
        -Payload @{
            message = "Transient failure demo workflow $i"
            failMode = "transient"
            batch = $runId
        }

    Write-Host "Failure workflow queued: $($result.workflowId)"
}

Write-Host ""
Write-Host "Traffic submitted."
Write-Host "Watch Grafana at http://localhost:3001"
Write-Host "Prometheus at http://localhost:9090"
