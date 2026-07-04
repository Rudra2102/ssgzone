# SSGhub Mail - Final Testing Guide

## Issue Fixed: Missing Base Schema

The database needs the base schema before running new migrations.

## **FINAL Execution Order (13 Steps):**

### **Phase 0: Database & Setup**
0. `01_create_database.cmd` - Create database
1. `01_setup_database_complete.cmd` - Run ALL migrations (base + new)
2. `00_fix_react_apps.cmd` - Fix React package.json files

### **Phase 1: Dependencies & Services**
3. `02_install_dependencies_final.cmd` - Install all packages
4. `03_start_services_fixed.cmd` - Start services (ports 4000-4002)

### **Phase 2: Compliance Testing**
5. `04_test_audit_worm_fixed.cmd` - WORM audit storage
6. `05_test_dmarc_policy_fixed.cmd` - Custom DMARC policies
7. `06_test_gdpr_deletion_fixed.cmd` - GDPR deletion

### **Phase 3: Integration Testing**
8. `07_test_rate_limiting_fixed.cmd` - Usage-based limits
9. `08_create_test_mbox.cmd` - Create test file
10. `09_test_migration_api_fixed.cmd` - Migration APIs
11. `10_test_i18n_fixed.cmd` - Internationalization

### **Phase 4: Final Verification**
12. `11_final_verification_fixed.cmd` - Complete verification

## **Execute Commands:**

```cmd
cd d:\Pradeep_Singh\Creations\Softwares\SSGhub\testing

01_create_database.cmd
01_setup_database_complete.cmd
00_fix_react_apps.cmd
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

## **Expected Results:**
- Database created with all tables
- All services start without errors
- All 6 tasks verified working
- Complete system ready for production

## **Prerequisites:**
- PostgreSQL running
- Node.js installed
- curl available