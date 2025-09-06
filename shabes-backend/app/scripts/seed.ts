
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    await prisma.feedback.deleteMany();
    await prisma.eventMatch.deleteMany();
    await prisma.event.deleteMany();
    await prisma.invite.deleteMany();
    await prisma.userPreferences.deleteMany();
    await prisma.account.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    // Create test admin user
    const adminUser = await prisma.user.create({
      data: {
        name: 'João Silva',
        email: 'john@doe.com',
        phone: '+55 11 99999-0000',
        isAdmin: true,
        preferences: {
          create: {
            maxDistance: 20,
            latitude: -23.5505,
            longitude: -46.6333,
            address: 'São Paulo, SP',
            preferredStartTime: '19:00',
            preferredEndTime: '22:00',
            dietary: 'kosher',
            notes: 'Admin user for testing'
          }
        }
      }
    });

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        name: 'Sarah Cohen',
        email: 'sarah@example.com',
        phone: '+55 11 99999-1111',
        preferences: {
          create: {
            maxDistance: 15,
            latitude: -23.5505,
            longitude: -46.6333,
            address: 'Vila Madalena, São Paulo',
            preferredStartTime: '18:30',
            preferredEndTime: '22:00',
            dietary: 'kosher',
            notes: 'Prefiro eventos com famílias jovens'
          }
        }
      }
    });

    const user2 = await prisma.user.create({
      data: {
        name: 'David Levy',
        email: 'david@example.com',
        phone: '+55 11 99999-2222',
        preferences: {
          create: {
            maxDistance: 10,
            latitude: -23.5629,
            longitude: -46.6544,
            address: 'Jardins, São Paulo',
            preferredStartTime: '19:00',
            preferredEndTime: '23:00',
            dietary: 'traditional',
            notes: 'Gosto de discussões sobre Torah e cultura judaica'
          }
        }
      }
    });

    const user3 = await prisma.user.create({
      data: {
        name: 'Rachel Goldberg',
        email: 'rachel@example.com',
        phone: '+55 11 99999-3333',
        preferences: {
          create: {
            maxDistance: 20,
            latitude: -23.5312,
            longitude: -46.6741,
            address: 'Higienópolis, São Paulo',
            preferredStartTime: '18:00',
            preferredEndTime: '21:30',
            dietary: 'vegetarian',
            notes: 'Adoro conhecer pessoas novas e compartilhar tradições'
          }
        }
      }
    });

    // Create invite codes
    await prisma.invite.createMany({
      data: [
        {
          code: 'SHABBAT2024',
          generatedBy: user2.id,
          isUsed: false
        },
        {
          code: 'COMMUNITY2024',
          generatedBy: user3.id,
          usedBy: user1.id,
          isUsed: true,
          usedAt: new Date('2024-01-15')
        },
        {
          code: 'WELCOME2024',
          generatedBy: adminUser.id,
          isUsed: false
        }
      ]
    });

    // Create events
    const nextFriday = new Date();
    nextFriday.setDate(nextFriday.getDate() + (5 - nextFriday.getDay() + 7) % 7);

    const event1 = await prisma.event.create({
      data: {
        hostId: user2.id,
        title: 'Shabat Familiar em Jardins',
        description: 'Um Shabat caloroso com tradições sefarditas, música e histórias para toda a família.',
        date: nextFriday,
        startTime: '19:00',
        endTime: '22:30',
        maxGuests: 6,
        currentGuests: 2,
        approximateAddress: 'Jardins, São Paulo - SP',
        fullAddress: 'Rua Oscar Freire, 1500 - Jardins, São Paulo - SP',
        latitude: -23.5629,
        longitude: -46.6544,
        dietary: 'kosher',
        ageGroup: 'families',
        language: 'portuguese'
      }
    });

    const followingFriday = new Date(nextFriday);
    followingFriday.setDate(followingFriday.getDate() + 7);

    const event2 = await prisma.event.create({
      data: {
        hostId: user3.id,
        title: 'Shabat para Jovens Profissionais',
        description: 'Uma noite especial para networking e conexões significativas entre jovens da comunidade.',
        date: nextFriday,
        startTime: '18:30',
        endTime: '23:00',
        maxGuests: 8,
        currentGuests: 4,
        approximateAddress: 'Higienópolis, São Paulo - SP',
        fullAddress: 'Rua da Consolação, 2000 - Higienópolis, São Paulo - SP',
        latitude: -23.5312,
        longitude: -46.6741,
        dietary: 'vegetarian',
        ageGroup: 'young-adults',
        language: 'mixed'
      }
    });

    const event3 = await prisma.event.create({
      data: {
        hostId: user1.id,
        title: 'Shabat com Crianças - Vila Madalena',
        description: 'Shabat especialmente pensado para famílias com crianças pequenas, com atividades lúdicas.',
        date: followingFriday,
        startTime: '18:00',
        endTime: '21:00',
        maxGuests: 4,
        currentGuests: 0,
        approximateAddress: 'Vila Madalena, São Paulo - SP',
        fullAddress: 'Rua Harmonia, 800 - Vila Madalena, São Paulo - SP',
        latitude: -23.5505,
        longitude: -46.6333,
        dietary: 'kosher',
        ageGroup: 'families',
        language: 'portuguese'
      }
    });

    // Create event matches
    await prisma.eventMatch.createMany({
      data: [
        {
          eventId: event1.id,
          guestId: user1.id,
          personalMessage: 'Olá! Estou muito interessada em participar do Shabat. Tenho uma filha pequena e adoramos tradições sefarditas.',
          matchScore: 0.85,
          status: 'PENDING'
        },
        {
          eventId: event2.id,
          guestId: user1.id,
          personalMessage: 'Trabalho em tech e adoraria conhecer outros jovens profissionais da comunidade.',
          matchScore: 0.72,
          status: 'CHAT_REQUESTED',
          hostResponse: 'REQUEST_CHAT',
          respondedAt: new Date()
        },
        {
          eventId: event1.id,
          guestId: user3.id,
          personalMessage: 'Shalom! Seria uma honra participar do Shabat em família. Posso ajudar com algo?',
          matchScore: 0.91,
          status: 'ACCEPTED',
          hostResponse: 'ACCEPT',
          respondedAt: new Date(),
          confirmedAt: new Date()
        }
      ]
    });

    console.log('✅ Database seeded successfully!');
    console.log('📧 Test accounts created:');
    console.log('   • Admin: john@doe.com (password: johndoe123)');
    console.log('   • Sarah: sarah@example.com');
    console.log('   • David: david@example.com');
    console.log('   • Rachel: rachel@example.com');
    console.log('🔑 Test invite codes: SHABBAT2024, COMMUNITY2024, WELCOME2024');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
