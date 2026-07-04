@echo off
echo ========================================
echo SSGhub Mail - Continue Testing
echo ========================================

echo ✅ Database setup complete with 16 tables!
echo.
echo Next steps to run:
echo.
echo 1. 00_fix_react_apps.cmd
echo 2. 02_install_dependencies_final.cmd  
echo 3. 03_start_services_fixed.cmd
echo 4. 04_test_audit_worm_fixed.cmd
echo 5. 05_test_dmarc_policy_fixed.cmd
echo 6. 06_test_gdpr_deletion_fixed.cmd
echo 7. 07_test_rate_limiting_fixed.cmd
echo 8. 08_create_test_mbox.cmd
echo 9. 09_test_migration_api_fixed.cmd
echo 10. 10_test_i18n_fixed.cmd
echo 11. 11_final_verification_fixed.cmd
echo.
echo Press any key to run step 1 (fix React apps)...
pause

echo.
echo Running 00_fix_react_apps.cmd...
call 00_fix_react_apps.cmd

echo.
echo Press any key to run step 2 (install dependencies)...
pause
call 02_install_dependencies_final.cmd

echo.
echo Press any key to run step 3 (start services)...
pause
call 03_start_services_fixed.cmd

echo.
echo ✅ Setup complete! Now run testing scripts 4-11 individually.
pause