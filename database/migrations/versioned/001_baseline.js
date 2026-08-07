/**
 * Migration: 001_baseline
 *
 * This migration represents the baseline state of the SSGzone database.
 * All 53 legacy SQL files (01–53) were applied manually before the migration
 * framework was introduced in Phase 1.
 *
 * The UP function is intentionally empty — the schema already exists on the
 * live database. This migration exists solely to anchor the migration history.
 *
 * The DOWN function is intentionally empty — rolling back the entire baseline
 * is a destructive operation that must be done manually with a full DB restore.
 *
 * Legacy files covered by this baseline:
 *   02_enterprise_features.sql
 *   03_enterprise_phase2.sql
 *   04_region_support.sql
 *   05_ip_warmup.sql
 *   054_email_type_column.sql
 *   055_platform_admins_2fa.sql
 *   056_audit_logs.sql
 *   057_email_indexes.sql
 *   058_billing.sql
 *   059_standard_plans.sql
 *   06_dmarc_reporting.sql
 *   060_billing_restructure.sql
 *   07_failover_support.sql
 *   08_encryption_keys.sql
 *   09_signatures_export.sql
 *   10_audit_worm_storage.sql
 *   11_dmarc_custom_policies.sql
 *   12_gdpr_deletion_queue.sql
 *   13_usage_based_limits.sql
 *   14_migration_tools.sql
 *   15_calendar_carddav.sql
 *   16_complete_system_redesign.sql
 *   17_communication_platform.sql
 *   18_tenant_management.sql
 *   19_clean_setup.sql
 *   20_permissions_system.sql
 *   21_seed_pems_saas.sql
 *   22_add_sidebar_header_colors.sql
 *   23_chat_realtime_tables.sql
 *   24_saas_integration.sql
 *   25_deletion_management.sql
 *   26_activity_logs.sql
 *   27_email_storage_schema.sql
 *   28_search_index_schema.sql
 *   29_email_queue_schema.sql
 *   30_webhook_schema.sql
 *   31_rate_limit_tiers.sql
 *   32_audit_logs_indexes.sql
 *   33_cascading_permissions.sql
 *   34_fix_login_system.sql
 *   35_email_storage_webmail_columns.sql
 *   36_video_rooms.sql
 *   37_email_templates.sql
 *   38_developer_portal.sql
 *   39_gdpr_fix.sql
 *   40_phase_j.sql
 *   41_autoresponder.sql
 *   42_email_rules.sql
 *   43_contacts_signatures.sql
 *   45_chat_enhancements.sql
 *   46_notifications.sql
 *   47_tenant_departments.sql
 *   49_support_tickets.sql
 *   50_email_aliases.sql
 *   51_saas_admin_2fa.sql
 *   52_tenant_admin_2fa.sql
 *   53_dns_verified.sql
 *
 * DEPRECATED (excluded — WhatsApp removed per Phase 1 plan):
 *   44_whatsapp.sql
 *   48_fix_whatsapp_tenant_id.sql
 */

exports.up = () => {
  // Intentionally empty — baseline schema already exists on live database.
  // All future schema changes must be added as new numbered migrations.
};

exports.down = () => {
  // Intentionally empty — rolling back the baseline requires a full DB restore.
  // See: docs/planning/DATABASE_PART_01.md for schema reference.
};
