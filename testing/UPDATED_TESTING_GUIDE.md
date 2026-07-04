# SSGhub Mail - Updated Testing Guide

## Issues Fixed:
1. ✅ Missing auth middleware functions added
2. ✅ React apps package.json created
3. ✅ Port configuration updated to 4000 series

## Updated Execution Order:

### **Phase 0: Fix Setup Issues**
0. `00_fix_react_apps.cmd` - Creates proper package.json files

### **Phase 1: Setup (Required)**
1. `01_setup_database.cmd` - Runs all 5 database migrations
2. `02_install_dependencies_final.cmd` - Installs all npm packages properly
3. `03_start_services_fixed.cmd` - Starts all 3 services (ports 4000-4002)

### **Phase 2: Compliance Testing**
4. `04_test_audit_worm_fixed.cmd` - Tests WORM audit storage (Task 1.1)
5. `05_test_dmarc_policy_fixed.cmd` - Tests custom DMARC policies (Task 1.2)
6. `06_test_gdpr_deletion_fixed.cmd` - Tests GDPR deletion (Task 1.3)

### **Phase 3: Integration Testing**
7. `07_test_rate_limiting_fixed.cmd` - Tests usage-based limits (Task 2.1)
8. `08_create_test_mbox.cmd` - Creates test file for migration
9. `09_test_migration_api_fixed.cmd` - Tests migration APIs (Task 2.2)
10. `10_test_i18n_fixed.cmd` - Opens browser for i18n testing (Task 2.3)

### **Phase 4: Final Verification**
11. `11_final_verification_fixed.cmd` - Complete system verification

## Quick Execution:

```cmd
cd d:\Pradeep_Singh\Creations\Softwares\SSGhub\testing

00_fix_react_apps.cmd
01_setup_database.cmd
02_install_dependencies_final.cmd
03_start_services_fixed.cmd
04_test_audit_worm_fixed.cmd
05_test_dmarc_policy_fixed.cmd
06_test_gdpr_deletion_fixed.cmd
07_test_rate_limiting_fixed.cmd
08_create_test_mbox.cmd
09_test_migration_api_fixed.cmd
10_test_i18n_fixed.cmd
11_final_verification_fixed.cmd
```

## Expected Results:
- All services start without errors
- Database migrations complete successfully
- API endpoints return proper JSON responses
- React apps load in browser
- All 6 tasks verified working

## Port Configuration:
- API Gateway: http://localhost:4000
- Admin Portal: http://localhost:4001
- Webmail Client: http://localhost:4002