const express = require('express');
const router = express.Router();
const db = require('../services/DatabaseService');
const { authenticateToken, requireTenantAdmin } = require('../middleware/auth');

// Create mailing list/distribution group
router.post('/create', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const { name, email, description, members, is_public } = req.body;
    const tenantId = req.user.tenant_id;

    const query = `
      INSERT INTO email_groups (tenant_id, name, email, description, is_public, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;

    const result = await db.query(query, [
      tenantId, name, email, description, is_public || false, req.user.id
    ]);

    const group = result.rows[0];

    // Add members
    if (members && members.length > 0) {
      await addGroupMembers(group.id, members);
    }

    res.json({ success: true, group });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get tenant groups
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    
    const query = `
      SELECT g.*, 
             COUNT(gm.user_id) as member_count,
             u.username as created_by_username
      FROM email_groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.tenant_id = $1 AND g.is_active = true
      GROUP BY g.id, u.username
      ORDER BY g.created_at DESC
    `;

    const result = await db.query(query, [tenantId]);
    res.json({ groups: result.rows });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get group details with members
router.get('/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const tenantId = req.user.tenant_id;

    const groupQuery = `
      SELECT * FROM email_groups 
      WHERE id = $1 AND tenant_id = $2 AND is_active = true
    `;

    const membersQuery = `
      SELECT gm.*, u.username, u.email, u.full_name
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1 AND gm.is_active = true
    `;

    const [groupResult, membersResult] = await Promise.all([
      db.query(groupQuery, [groupId, tenantId]),
      db.query(membersQuery, [groupId])
    ]);

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = groupResult.rows[0];
    group.members = membersResult.rows;

    res.json({ group });
  } catch (error) {
    console.error('Error fetching group details:', error);
    res.status(500).json({ error: 'Failed to fetch group details' });
  }
});

// Add members to group
router.post('/:groupId/members', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { members } = req.body;
    const tenantId = req.user.tenant_id;

    // Verify group belongs to tenant
    const groupCheck = await db.query(
      'SELECT id FROM email_groups WHERE id = $1 AND tenant_id = $2',
      [groupId, tenantId]
    );

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    await addGroupMembers(groupId, members);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding group members:', error);
    res.status(500).json({ error: 'Failed to add members' });
  }
});

// Remove member from group
router.delete('/:groupId/members/:userId', authenticateToken, requireTenantAdmin, async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const tenantId = req.user.tenant_id;

    // Verify group belongs to tenant
    const groupCheck = await db.query(
      'SELECT id FROM email_groups WHERE id = $1 AND tenant_id = $2',
      [groupId, tenantId]
    );

    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    await db.query(
      'UPDATE group_members SET is_active = false WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing group member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

async function addGroupMembers(groupId, members) {
  for (const member of members) {
    const query = `
      INSERT INTO group_members (group_id, user_id, role, added_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (group_id, user_id) 
      DO UPDATE SET is_active = true, role = $3
    `;
    
    await db.query(query, [groupId, member.user_id, member.role || 'member']);
  }
}

module.exports = router;