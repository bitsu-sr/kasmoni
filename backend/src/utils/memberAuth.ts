import { getRow, runQuery } from './database';

// Generate username from first name and last name
export const generateUsername = (firstName: string, lastName: string): string => {
  const baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  return baseUsername.replace(/[^a-z0-9.]/g, ''); // Remove special characters
};

// Generate unique username by adding number if needed
export const generateUniqueUsername = async (firstName: string, lastName: string): Promise<string> => {
  let username = generateUsername(firstName, lastName);
  let counter = 1;
  
  while (true) {
    const existingUser = await getRow(
      'SELECT id FROM members WHERE username = ?',
      [username]
    );
    
    if (!existingUser) {
      return username;
    }
    
    username = `${generateUsername(firstName, lastName)}${counter}`;
    counter++;
  }
};

// Generate 5-digit unique password
export const generateUniquePassword = async (): Promise<string> => {
  while (true) {
    const password = Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit number
    
    // Check if this password is already used (only check at creation)
    const existingUser = await getRow(
      'SELECT id FROM members WHERE password_hash = ?',
      [password]
    );
    
    if (!existingUser) {
      return password;
    }
  }
};

// Create user account for member
export const createMemberUser = async (memberId: number, firstName: string, lastName: string): Promise<{ username: string; password: string }> => {
  const username = await generateUniqueUsername(firstName, lastName);
  const password = await generateUniquePassword();
  
  // Hash the password
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Update member with user credentials
  await runQuery(
    `UPDATE members 
     SET username = ?, password_hash = ?, role = 'normal_user', is_active = 1, 
         user_created_at = CURRENT_TIMESTAMP, user_updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [username, passwordHash, memberId]
  );
  
  return { username, password };
};

// Update member username (with uniqueness check)
export const updateMemberUsername = async (memberId: number, newUsername: string): Promise<boolean> => {
  // Check if username is already taken
  const existingUser = await getRow(
    'SELECT id FROM members WHERE username = ? AND id != ?',
    [newUsername, memberId]
  );
  
  if (existingUser) {
    return false; // Username already taken
  }
  
  // Update username
  await runQuery(
    'UPDATE members SET username = ?, user_updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newUsername, memberId]
  );
  
  return true;
};

// Update member password
export const updateMemberPassword = async (memberId: number, newPassword: string): Promise<void> => {
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  await runQuery(
    'UPDATE members SET password_hash = ?, user_updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [passwordHash, memberId]
  );
};

// Update member role
export const updateMemberRole = async (memberId: number, newRole: string): Promise<void> => {
  await runQuery(
    'UPDATE members SET role = ?, user_updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newRole, memberId]
  );
};

// Generate new password for existing member
export const generateNewPasswordForMember = async (memberId: number): Promise<string> => {
  const password = await generateUniquePassword();
  
  // Hash the password
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Update member with new password
  await runQuery(
    'UPDATE members SET password_hash = ?, user_updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [passwordHash, memberId]
  );
  
  return password;
};

// Toggle member user account status
export const toggleMemberUserStatus = async (memberId: number): Promise<void> => {
  await runQuery(
    'UPDATE members SET is_active = NOT is_active, user_updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [memberId]
  );
}; 