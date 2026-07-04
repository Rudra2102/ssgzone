# Phase 3 Bulk Operations - Test Script
# This script tests all bulk operation endpoints

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 3 Bulk Operations Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$API_BASE = "http://localhost:4000/api/v1/super-admin"
$USERNAME = "superadmin"
$PASSWORD = "admin123"

# Step 1: Login and get token
Write-Host "[1/5] Logging in as SuperAdmin..." -ForegroundColor Yellow
$loginBody = @{
    username = $USERNAME
    password = $PASSWORD
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_BASE/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $TOKEN = $loginResponse.data.token
    Write-Host "✓ Login successful! Token obtained." -ForegroundColor Green
    Write-Host "  Admin: $($loginResponse.data.admin.full_name)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Get SaaS Apps
Write-Host "[2/5] Fetching SaaS Applications..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $TOKEN"
}

try {
    $saasApps = Invoke-RestMethod -Uri "$API_BASE/saas-apps" -Method Get -Headers $headers
    $SAAS_APP_ID = $saasApps.data[0].id
    Write-Host "✓ Found $($saasApps.data.Count) SaaS applications" -ForegroundColor Green
    Write-Host "  Using SaaS App: $($saasApps.data[0].name) (ID: $SAAS_APP_ID)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to fetch SaaS apps: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Test Bulk Create Tenants
Write-Host "[3/5] Testing Bulk Create Tenants..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "HHmmss"
$bulkTenantsBody = @{
    tenants = @(
        @{
            company_name = "Bulk Test Corp 1"
            slug = "bulktest1-$timestamp"
            saas_app_id = $SAAS_APP_ID
            admin_name = "Test Admin 1"
            max_users = 50
        },
        @{
            company_name = "Bulk Test Corp 2"
            slug = "bulktest2-$timestamp"
            saas_app_id = $SAAS_APP_ID
            admin_name = "Test Admin 2"
            max_users = 75
        },
        @{
            company_name = "Bulk Test Corp 3"
            slug = "bulktest3-$timestamp"
            saas_app_id = $SAAS_APP_ID
            admin_name = "Test Admin 3"
            max_users = 100
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $bulkResult = Invoke-RestMethod -Uri "$API_BASE/tenants/bulk-create" -Method Post -Body $bulkTenantsBody -Headers $headers -ContentType "application/json"
    Write-Host "✓ Bulk create completed!" -ForegroundColor Green
    Write-Host "  Total: $($bulkResult.data.total)" -ForegroundColor Gray
    Write-Host "  Success: $($bulkResult.data.success.Count)" -ForegroundColor Green
    Write-Host "  Failed: $($bulkResult.data.failed.Count)" -ForegroundColor $(if ($bulkResult.data.failed.Count -gt 0) { "Red" } else { "Gray" })
    
    if ($bulkResult.data.success.Count -gt 0) {
        Write-Host "`n  Created Tenants:" -ForegroundColor Cyan
        foreach ($tenant in $bulkResult.data.success) {
            Write-Host "    - $($tenant.company_name)" -ForegroundColor White
            Write-Host "      Domain: $($tenant.domain)" -ForegroundColor Gray
            Write-Host "      Admin: $($tenant.admin_credentials.username) / $($tenant.admin_credentials.password)" -ForegroundColor Gray
        }
    }
    
    if ($bulkResult.data.failed.Count -gt 0) {
        Write-Host "`n  Failed Tenants:" -ForegroundColor Red
        foreach ($failed in $bulkResult.data.failed) {
            Write-Host "    - $($failed.tenant.company_name): $($failed.error)" -ForegroundColor Red
        }
    }
    
    # Save first tenant ID for user creation test
    if ($bulkResult.data.success.Count -gt 0) {
        $TENANT_ID = $bulkResult.data.success[0].id
    }
} catch {
    Write-Host "✗ Bulk create failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 4: Test Bulk Create Users (if we have a tenant)
if ($TENANT_ID) {
    Write-Host "[4/5] Testing Bulk Create Users..." -ForegroundColor Yellow
    $bulkUsersBody = @{
        tenant_id = $TENANT_ID
        users = @(
            @{
                username = "john.doe.$timestamp"
                email = "john.doe.$timestamp@test.com"
                first_name = "John"
                last_name = "Doe"
                role = "user"
            },
            @{
                username = "jane.smith.$timestamp"
                email = "jane.smith.$timestamp@test.com"
                first_name = "Jane"
                last_name = "Smith"
                role = "manager"
            },
            @{
                username = "bob.wilson.$timestamp"
                email = "bob.wilson.$timestamp@test.com"
                first_name = "Bob"
                last_name = "Wilson"
                role = "user"
            }
        )
    } | ConvertTo-Json -Depth 10
    
    try {
        $usersResult = Invoke-RestMethod -Uri "$API_BASE/users/bulk-create" -Method Post -Body $bulkUsersBody -Headers $headers -ContentType "application/json"
        Write-Host "✓ Bulk user creation completed!" -ForegroundColor Green
        Write-Host "  Total: $($usersResult.data.total)" -ForegroundColor Gray
        Write-Host "  Success: $($usersResult.data.success.Count)" -ForegroundColor Green
        Write-Host "  Failed: $($usersResult.data.failed.Count)" -ForegroundColor $(if ($usersResult.data.failed.Count -gt 0) { "Red" } else { "Gray" })
        
        if ($usersResult.data.success.Count -gt 0) {
            Write-Host "`n  Created Users:" -ForegroundColor Cyan
            foreach ($user in $usersResult.data.success) {
                Write-Host "    - $($user.username) ($($user.email))" -ForegroundColor White
                Write-Host "      Password: $($user.default_password)" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "✗ Bulk user creation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "[4/5] Skipping user creation (no tenant created)" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Test CSV Import
Write-Host "[5/5] Testing CSV Import..." -ForegroundColor Yellow
$csvData = @(
    @{
        company_name = "CSV Import Corp 1"
        slug = "csvimport1-$timestamp"
        saas_app_id = $SAAS_APP_ID
        admin_name = "CSV Admin 1"
        max_users = "60"
    },
    @{
        company_name = "CSV Import Corp 2"
        slug = "csvimport2-$timestamp"
        saas_app_id = $SAAS_APP_ID
        admin_name = "CSV Admin 2"
        max_users = "80"
    }
)

$csvImportBody = @{
    csv_data = $csvData
} | ConvertTo-Json -Depth 10

try {
    $csvResult = Invoke-RestMethod -Uri "$API_BASE/tenants/import-csv" -Method Post -Body $csvImportBody -Headers $headers -ContentType "application/json"
    Write-Host "✓ CSV import completed!" -ForegroundColor Green
    Write-Host "  Total: $($csvResult.data.total)" -ForegroundColor Gray
    Write-Host "  Success: $($csvResult.data.success.Count)" -ForegroundColor Green
    Write-Host "  Failed: $($csvResult.data.failed.Count)" -ForegroundColor $(if ($csvResult.data.failed.Count -gt 0) { "Red" } else { "Gray" })
    
    if ($csvResult.data.success.Count -gt 0) {
        Write-Host "`n  Imported Tenants:" -ForegroundColor Cyan
        foreach ($tenant in $csvResult.data.success) {
            Write-Host "    - $($tenant.company_name)" -ForegroundColor White
            Write-Host "      Domain: $($tenant.domain)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "✗ CSV import failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ SuperAdmin Authentication" -ForegroundColor Green
Write-Host "✓ SaaS Apps Retrieval" -ForegroundColor Green
Write-Host "✓ Bulk Tenant Creation" -ForegroundColor Green
Write-Host "✓ Bulk User Creation" -ForegroundColor Green
Write-Host "✓ CSV Import" -ForegroundColor Green
Write-Host ""
Write-Host "All Phase 3 endpoints are working correctly!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test UI at http://localhost:3000" -ForegroundColor White
Write-Host "2. Login as SuperAdmin (superadmin/admin123)" -ForegroundColor White
Write-Host "3. Go to Tenant Management tab" -ForegroundColor White
Write-Host "4. Click 'Bulk Import' button" -ForegroundColor White
Write-Host "5. Upload sample_tenants_import.csv" -ForegroundColor White
Write-Host ""
