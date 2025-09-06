const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Inicializa o cliente do Prisma
const prisma = new PrismaClient();

async function main() {
  console.log('A iniciar o processo de seeding...');

  // 1. Defina os seus utilizadores de teste com senhas em texto plano
  const usersToSeed = [
    { id: 'admin-user', email: 'john@doe.com', password: 'johndoe123', name: 'João Silva', phone: '+55 11 99999-0000', isAdmin: true },
    { id: 'guilherme-felberg', email: 'guilherme@aquitemshabes.com', password: 'guilherme123', name: 'Guilherme Felberg', phone: '+55 11 99888-7777', isAdmin: false },
    { id: 'user-1', email: 'sarah@example.com', password: 'demo123', name: 'Sarah Cohen', phone: '+55 11 99999-1111', isAdmin: false },
    { id: 'user-2', email: 'david@example.com', password: 'demo123', name: 'David Levy', phone: '+55 11 99999-2222', isAdmin: false },
    { id: 'user-3', email: 'rachel@example.com', password: 'demo123', name: 'Rachel Goldberg', phone: '+55 11 99999-3333', isAdmin: false }
  ];

  for (const userData of usersToSeed) {
    // 2. Encripte a senha de cada utilizador
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // 3. Insira o utilizador na base de dados com a senha encriptada
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        phone: userData.phone,
        isAdmin: userData.isAdmin,
      },
    });
    console.log(`Utilizador ${userData.name} criado/atualizado com sucesso.`);
  }

  console.log('Seeding concluído com sucesso!');
}

// Executa a função principal e garante que a conexão com a base de dados é fechada no final
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
