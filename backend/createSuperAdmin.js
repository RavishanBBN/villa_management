// Create Super Admin User Script
// Run this once to create the super admin account

const { User } = require('./src/models');

async function createSuperAdmin() {
  try {
    // Check if super admin already exists
    const existingAdmin = await User.findOne({
      where: { role: 'super_admin' }
    });

    if (existingAdmin) {
      console.log('✅ Super admin already exists:');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.firstName} ${existingAdmin.lastName}`);
      return;
    }

    // Create super admin
    const superAdmin = await User.create({
      username: 'admin',
      email: 'admin@halcyonrest.com',
      password: 'admin123', // CHANGE THIS PASSWORD immediately after first login!
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      phone: '+94 123456789',
      status: 'active',
      permissions: [] // Super admin has all permissions by default
    });

    console.log('🎉 Super admin created successfully!');
    console.log('=====================================');
    console.log('📧 Email: admin@halcyonrest.com');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin123');
    console.log('=====================================');
    console.log('⚠️  IMPORTANT: Change the password immediately after first login!');
    console.log('');
    console.log('You can now login at: http://localhost:3003');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    process.exit();
  }
}

createSuperAdmin();
