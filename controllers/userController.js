const { pool } = require('../config/database');

/**
 * Controlador para manejar las operaciones relacionadas con usuarios (solo admin).
 */
class UserController {
  /**
   * Obtiene todos los usuarios del sistema (solo admin).
   * @async
   * @function getAllUsers
   * @param {Object} req - Objeto de solicitud de Express.
   * @param {Object} res - Objeto de respuesta de Express.
   * @returns {Object} - Respuesta JSON con todos los usuarios.
   */
  static async getAllUsers(req, res) {
    try {
      console.log('🔍 Admin solicitando lista de usuarios:', req.user.email);

      const [users] = await pool.execute(`
        SELECT 
          id, 
          name, 
          email, 
          role, 
          created_at,
          updated_at
        FROM users 
        ORDER BY created_at DESC
      `);

      const [roleStats] = await pool.execute(`
        SELECT 
          role,
          COUNT(*) as count
        FROM users 
        GROUP BY role
      `);

      const stats = {
        total: users.length,
        byRole: roleStats.reduce((acc, item) => {
          acc[item.role] = item.count;
          return acc;
        }, {})
      };

      console.log('✅ Lista de usuarios obtenida:', {
        total: users.length,
        roles: stats.byRole
      });

      res.json({
        success: true,
        users,
        stats,
        message: `${users.length} usuarios encontrados`
      });

    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualiza el rol de un usuario específico (solo admin).
   * @async
   * @function updateUserRole
   * @param {Object} req - Objeto de solicitud de Express.
   * @param {Object} res - Objeto de respuesta de Express.
   * @returns {Object} - Respuesta JSON con el resultado de la operación.
   */
  static async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const adminId = req.user.id;

      console.log('🔄 Actualizando rol de usuario:', {
        userId: id,
        newRole: role,
        adminId: adminId
      });

      const validRoles = ['admin', 'seller', 'client'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Rol inválido. Roles válidos: ${validRoles.join(', ')}`
        });
      }

      const [userCheck] = await pool.execute(
        'SELECT id, name, email, role FROM users WHERE id = ?',
        [id]
      );

      if (userCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const targetUser = userCheck[0];

      if (parseInt(id) === adminId && role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'No puedes cambiar tu propio rol de administrador'
        });
      }

      if (targetUser.role === role) {
        return res.status(400).json({
          success: false,
          message: `El usuario ya tiene el rol de ${role}`
        });
      }

      const [result] = await pool.execute(
        'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
        [role, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se pudo actualizar el usuario'
        });
      }

      const [updatedUser] = await pool.execute(
        'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );

      console.log('✅ Rol actualizado exitosamente:', {
        userId: id,
        userName: targetUser.name,
        previousRole: targetUser.role,
        newRole: role
      });

      res.json({
        success: true,
        message: `Rol de ${targetUser.name} actualizado de ${targetUser.role} a ${role}`,
        user: updatedUser[0]
      });

    } catch (error) {
      console.error('❌ Error actualizando rol de usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene estadísticas básicas de usuarios (solo admin).
   * @async
   * @function getUserStats
   * @param {Object} req - Objeto de solicitud de Express.
   * @param {Object} res - Objeto de respuesta de Express.
   * @returns {Object} - Respuesta JSON con estadísticas.
   */
  static async getUserStats(req, res) {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
          SUM(CASE WHEN role = 'seller' THEN 1 ELSE 0 END) as sellers,
          SUM(CASE WHEN role = 'client' THEN 1 ELSE 0 END) as clients,
          SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_today,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_this_week
        FROM users
      `);

      res.json({
        success: true,
        stats: stats[0]
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = UserController;