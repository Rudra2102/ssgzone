# SSGhub Mail - Automated Testing Guide

## Testing Execution Order

Run these CMD files in **EXACT SEQUENCE**:

### Phase 1: Setup (Required)
1. **01_setup_database.cmd** - Runs all 5 database migrations
2. **02_install_dependencies.cmd** - Installs required npm packages  
3. **03_start_services.cmd** - Starts all 3 services (API, Admin, Webmail)

### Phase 2: Compliance Testing
4. **04_test_audit_worm.cmd** - Tests WORM audit storage (Task 1.1)
5. **05_test_dmarc_policy.cmd** - Tests custom DMARC policies (Task 1.2)
6. **06_test_gdpr_deletion.cmd** - Tests GDPR deletion (Task 1.3)

### Phase 3: Integration Testing  
7. **07_test_rate_limiting.cmd** - Tests usage-based limits (Task 2.1)
8. **08_create_test_mbox.cmd** - Creates test file for migration
9. **09_test_migration_api.cmd** - Tests migration APIs (Task 2.2)
10. **10_test_i18n.cmd** - Opens browser for i18n testing (Task 2.3)

### Phase 4: Final Verification
11. **11_final_verification.cmd** - Complete system verification

## Prerequisites

- PostgreSQL running with `ssghub_mail` database
- Node.js installed
- curl command available
- All services stopped before starting

## Expected Results

Each script will show:
- ✅ Success messages for passed tests
- ❌ Error messages for failed tests  
- Database verification queries
- API response validation

## Manual Steps Required

- **Migration Tools**: Upload test_mailbox.mbox via Admin Portal
- **Internationalization**: Test language switching in browser
- **Visual Verification**: Check UI components work correctly

## Troubleshooting

If any script fails:
1. Check error message
2. Verify prerequisites
3. Ensure previous scripts completed successfully
4. Check service logs in separate terminal windows

## Success Criteria

All scripts complete with ✅ messages and:
- Database contains expected data
- APIs return correct responses
- UI components function properly
- Error scenarios handled correctly