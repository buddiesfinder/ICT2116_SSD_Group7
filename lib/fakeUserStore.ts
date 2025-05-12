// this is a fake user store for testing purposes
// it uses a global variable to store users
type User = {
  email: string;
  password: string;
};

const globalUserStore = globalThis as unknown as {
  users: User[];
};

globalUserStore.users = globalUserStore.users || [];

export function addUser(user: User): boolean {
  const exists = globalUserStore.users.find(u => u.email === user.email);
  if (exists) return false;
  globalUserStore.users.push(user);
  console.log('User added:', user);
  console.log('Current user list:', globalUserStore.users); //debug to see the current user list 
  return true;
}

export function validateUser(email: string, password: string): boolean {
  console.log('Current user list:', globalUserStore.users); //debug to see the current user list
  return globalUserStore.users.some(
    (u) => u.email === email && u.password === password
  );
}
