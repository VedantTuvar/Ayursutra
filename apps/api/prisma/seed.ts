import { PrismaClient, UserRole, SessionStatus, PlanStatus, InventoryCategory, TransactionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed started...');

  // Hash password
  const passwordHash = await bcrypt.hash('Password123!', 12);

  // 1. Create Demo Clinic
  const clinic = await prisma.clinic.upsert({
    where: { slug: 'demo-clinic' },
    update: {},
    create: {
      name: 'Ayurveda Wellness Center',
      slug: 'demo-clinic',
      phone: '+91 98765 43210',
      email: 'contact@demo-clinic.com',
      gstNumber: '27AAAAA1111A1Z1',
      address: {
        street: '101, Lotus Path, Juhu',
        city: 'Mumbai',
        state: 'Maharashtra',
        zip: '400049',
        country: 'India'
      },
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        taxRate: 18
      }
    }
  });
  console.log(`Clinic created: ${clinic.name} (${clinic.id})`);

  // 2. Create Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      clinicId: clinic.id,
      name: 'Admin User',
      email: 'admin@demo.com',
      phone: '9999999991',
      passwordHash,
      role: UserRole.CLINIC_ADMIN,
      isActive: true
    }
  });

  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@demo.com' },
    update: {},
    create: {
      clinicId: clinic.id,
      name: 'Dr. Meera Sharma',
      email: 'doctor@demo.com',
      phone: '9999999992',
      passwordHash,
      role: UserRole.DOCTOR,
      isActive: true
    }
  });

  const therapistUser = await prisma.user.upsert({
    where: { email: 'therapist@demo.com' },
    update: {},
    create: {
      clinicId: clinic.id,
      name: 'Lakshmi Therapist',
      email: 'therapist@demo.com',
      phone: '9999999993',
      passwordHash,
      role: UserRole.THERAPIST,
      isActive: true
    }
  });

  const receptionistUser = await prisma.user.upsert({
    where: { email: 'reception@demo.com' },
    update: {},
    create: {
      clinicId: clinic.id,
      name: 'Ramesh Reception',
      email: 'reception@demo.com',
      phone: '9999999994',
      passwordHash,
      role: UserRole.RECEPTIONIST,
      isActive: true
    }
  });

  console.log('Seeded core staff users.');

  // 3. Seed Panchakarma Therapy Types
  const therapiesData = [
    { name: 'Abhyanga', nameHindi: 'अभ्यंग', category: 'POORVAKARMA', defaultDurationMins: 60, defaultOils: ['Mahanarayan Oil', 'Dhanvantaram Oil'], description: 'Traditional whole body Ayurvedic warm oil massage.', requiresTherapistCount: 1 },
    { name: 'Shirodhara', nameHindi: 'शिरोधारा', category: 'POORVAKARMA', defaultDurationMins: 45, defaultOils: ['Ksheerabala Oil', 'Sesame Oil'], description: 'Continuous pouring of warm oil over the forehead.', requiresTherapistCount: 1 },
    { name: 'Basti', nameHindi: 'बस्ती', category: 'PRADHANKARMA', defaultDurationMins: 30, defaultOils: ['Sesame Oil', 'Castor Oil'], description: 'Medicated herbal enema therapy.', requiresTherapistCount: 1 },
    { name: 'Virechana', nameHindi: 'विरेचन', category: 'PRADHANKARMA', defaultDurationMins: 60, defaultOils: ['Castor Oil'], description: 'Therapeutic purgation cleansing therapy.', requiresTherapistCount: 1 },
    { name: 'Nasya', nameHindi: 'नस्य', category: 'PRADHANKARMA', defaultDurationMins: 30, defaultOils: ['Sesame Oil'], description: 'Nasal administration of medicated oils.', requiresTherapistCount: 1 },
    { name: 'Vamana', nameHindi: 'वमन', category: 'PRADHANKARMA', defaultDurationMins: 90, defaultOils: [], description: 'Therapeutic emesis therapy for Kapha dosha.', requiresTherapistCount: 2 },
    { name: 'Udvartana', nameHindi: 'उद्वर्तन', category: 'POORVAKARMA', defaultDurationMins: 45, defaultOils: [], description: 'Therapeutic dry powder body massage.', requiresTherapistCount: 1 },
    { name: 'Pizhichil', nameHindi: 'पिझिचिल', category: 'POORVAKARMA', defaultDurationMins: 60, defaultOils: ['Mahanarayan Oil'], description: 'Pouring of warm medicated oil with gentle massage.', requiresTherapistCount: 2 },
    { name: 'Navarakizhi', nameHindi: 'नवरकिषि', category: 'POORVAKARMA', defaultDurationMins: 75, defaultOils: [], description: 'Massage using warm cloth boluses filled with medicated rice.', requiresTherapistCount: 2 },
    { name: 'Januvasti', nameHindi: 'जानुबस्ती', category: 'PASCHATKARMA', defaultDurationMins: 30, defaultOils: ['Mahanarayan Oil'], description: 'Warm medicated oil retained over knee joints.', requiresTherapistCount: 1 }
  ];

  const therapies: any[] = [];
  for (const t of therapiesData) {
    const therapy = await prisma.therapyType.create({
      data: {
        clinicId: clinic.id,
        name: t.name,
        nameHindi: t.nameHindi,
        category: t.category,
        defaultDurationMins: t.defaultDurationMins,
        defaultOils: t.defaultOils,
        description: t.description,
        requiresTherapistCount: t.requiresTherapistCount,
        isActive: true
      }
    });
    therapies.push(therapy);
  }
  console.log(`Seeded ${therapies.length} Panchakarma therapy types.`);

  // Create therapist skill links for Lakshmi Therapist
  for (const t of therapies) {
    await prisma.therapistSkill.upsert({
      where: {
        therapistId_therapyTypeId: {
          therapistId: therapistUser.id,
          therapyTypeId: t.id
        }
      },
      update: {},
      create: {
        therapistId: therapistUser.id,
        therapyTypeId: t.id,
        proficiencyLevel: 'EXPERT'
      }
    });
  }

  // 4. Seed Rooms
  const roomsData = [
    { name: 'Room 1', capacity: 1, features: ['heated_table', 'droni'] },
    { name: 'Room 2', capacity: 1, features: ['heated_table', 'shirodhara_stand'] },
    { name: 'Swedana Room', capacity: 2, features: ['steam_chamber'] }
  ];

  const rooms: any[] = [];
  for (const r of roomsData) {
    const room = await prisma.room.create({
      data: {
        clinicId: clinic.id,
        name: r.name,
        capacity: r.capacity,
        features: r.features,
        isActive: true
      }
    });
    rooms.push(room);
  }
  console.log(`Seeded ${rooms.length} clinic droni rooms.`);

  // 5. Seed Inventory Items
  const itemsData = [
    { name: 'Mahanarayan Oil', nameHindi: 'महानारायण तेल', category: InventoryCategory.OIL, unit: 'ml', currentStock: 5000, minimumThreshold: 500, unitCost: 1.2, supplier: 'Kottakkal Arya Vaidya Sala' },
    { name: 'Dhanvantaram Oil', nameHindi: 'धानवंतराम तेल', category: InventoryCategory.OIL, unit: 'ml', currentStock: 3000, minimumThreshold: 300, unitCost: 1.5, supplier: 'Kottakkal Arya Vaidya Sala' },
    { name: 'Ksheerabala Oil', nameHindi: 'क्षीरबला तेल', category: InventoryCategory.OIL, unit: 'ml', currentStock: 2000, minimumThreshold: 200, unitCost: 1.8, supplier: 'Baidyanath' },
    { name: 'Sesame Oil', nameHindi: 'तिल का तेल', category: InventoryCategory.OIL, unit: 'ml', currentStock: 10000, minimumThreshold: 1000, unitCost: 0.5, supplier: 'Local Organic' },
    { name: 'Castor Oil', nameHindi: 'अरंडी का तेल', category: InventoryCategory.OIL, unit: 'ml', currentStock: 2000, minimumThreshold: 200, unitCost: 0.8, supplier: 'Local Organic' },
    { name: 'Triphala Ghee', nameHindi: 'त्रिफला घृत', category: InventoryCategory.GHEE, unit: 'grams', currentStock: 2000, minimumThreshold: 200, unitCost: 2.5, supplier: 'AVP Coimbatore' },
    { name: 'Ashwagandha Powder', nameHindi: 'अश्वगंधा चूर्ण', category: InventoryCategory.HERB, unit: 'grams', currentStock: 1000, minimumThreshold: 100, unitCost: 1.1, supplier: 'Himalaya Wellness' }
  ];

  const inventoryItems: any[] = [];
  for (const item of itemsData) {
    const inv = await prisma.inventoryItem.create({
      data: {
        clinicId: clinic.id,
        name: item.name,
        nameHindi: item.nameHindi,
        category: item.category,
        unit: item.unit,
        currentStock: item.currentStock,
        minimumThreshold: item.minimumThreshold,
        unitCost: item.unitCost,
        supplier: item.supplier,
        isActive: true
      }
    });

    // Record initial transaction
    await prisma.inventoryTransaction.create({
      data: {
        itemId: inv.id,
        type: TransactionType.STOCK_IN,
        quantity: item.currentStock,
        recordedById: adminUser.id,
        notes: 'Initial Seed Stocking'
      }
    });
    inventoryItems.push(inv);
  }
  console.log(`Seeded ${inventoryItems.length} inventory stocks.`);

  // 6. Seed Demo Patients
  const patientUsersData = [
    { name: 'Amit Patel', email: 'amit@demo.com', phone: '9892011122' },
    { name: 'Priya Nair', email: 'priya@demo.com', phone: '9892033344' }
  ];

  const patients: any[] = [];
  for (const pu of patientUsersData) {
    const u = await prisma.user.create({
      data: {
        clinicId: clinic.id,
        name: pu.name,
        email: pu.email,
        phone: pu.phone,
        passwordHash,
        role: UserRole.PATIENT,
        isActive: true
      }
    });

    const isAmit = pu.name === 'Amit Patel';
    const patient = await prisma.patient.create({
      data: {
        userId: u.id,
        clinicId: clinic.id,
        dateOfBirth: isAmit ? new Date(1985, 4, 15) : new Date(1992, 8, 22),
        gender: isAmit ? 'MALE' : 'FEMALE',
        bloodGroup: isAmit ? 'O+' : 'A+',
        symptoms: isAmit ? ['Chronic Back Pain', 'Indigestion'] : ['Insomnia', 'High Anxiety'],
        medicalHistory: isAmit ? 'Mild hypertension diagnosed 2 years ago.' : 'None.',
        allergies: isAmit ? ['Gluten'] : [],
        emergencyContact: {
          name: isAmit ? 'Sunita Patel' : 'Kiran Nair',
          relationship: isAmit ? 'Spouse' : 'Father',
          phone: isAmit ? '9892011123' : '9892033345'
        },
        prakriti: isAmit 
          ? { vata: 45, pitta: 30, kapha: 25, dominance: 'VATA' }
          : { vata: 30, pitta: 45, kapha: 25, dominance: 'PITTA' },
        vikriti: isAmit 
          ? { vata: 60, pitta: 20, kapha: 20, dominance: 'VATA' }
          : { vata: 40, pitta: 50, kapha: 10, dominance: 'PITTA' }
      }
    });
    patients.push(patient);
  }
  console.log(`Seeded ${patients.length} patients with Prakriti/Vikriti profiles.`);

  // 7. Seed Active 14-day Treatment Plan for Amit Patel
  const planStartDate = new Date();
  const planEndDate = new Date();
  planEndDate.setDate(planStartDate.getDate() + 14);

  const plan = await prisma.treatmentPlan.create({
    data: {
      clinicId: clinic.id,
      patientId: patients[0].id,
      doctorId: doctorUser.id,
      name: '14-Day Vata Shamana Panchakarma',
      description: 'Intensive course to pacify aggregated Vata Dosha causing spinal pain and digestive imbalances.',
      startDate: planStartDate,
      endDate: planEndDate,
      status: PlanStatus.ACTIVE,
      dietInstructions: 'Strictly warm, freshly cooked foods. Favor sweet, sour, and salty tastes. Avoid raw foods, cold drinks, and dry snacks. Take warm milk with ghee at bedtime.',
      lifestyleNotes: 'Avoid strenuous exercises and wind/cold drafts. Rest properly. Meditate for 15 mins morning and evening.',
      totalDays: 14
    }
  });
  console.log(`Created Active Treatment Plan: ${plan.name}`);

  // Create Planned Therapies for Amit's plan
  const abhyangaTherapy = therapies.find(t => t.name === 'Abhyanga')!;
  const shirodharaTherapy = therapies.find(t => t.name === 'Shirodhara')!;
  const bastiTherapy = therapies.find(t => t.name === 'Basti')!;

  // Let's schedule planned therapies:
  // Days 1-7: Abhyanga & Shirodhara
  // Days 8-14: Abhyanga & Basti
  const plannedTherapies: any[] = [];
  for (let day = 1; day <= 14; day++) {
    if (day <= 7) {
      const pt1 = await prisma.plannedTherapy.create({
        data: {
          planId: plan.id,
          therapyTypeId: abhyangaTherapy.id,
          dayNumber: day,
          sequenceOrder: 1,
          durationMins: abhyangaTherapy.defaultDurationMins,
          prescribedOils: [{ name: 'Mahanarayan Oil', quantityMl: 150 }],
          notes: 'Focus warm oil massage on the lumbar spine.'
        }
      });
      const pt2 = await prisma.plannedTherapy.create({
        data: {
          planId: plan.id,
          therapyTypeId: shirodharaTherapy.id,
          dayNumber: day,
          sequenceOrder: 2,
          durationMins: shirodharaTherapy.defaultDurationMins,
          prescribedOils: [{ name: 'Ksheerabala Oil', quantityMl: 120 }],
          notes: 'Pour warm oil in a steady stream.'
        }
      });
      plannedTherapies.push(pt1, pt2);
    } else {
      const pt1 = await prisma.plannedTherapy.create({
        data: {
          planId: plan.id,
          therapyTypeId: abhyangaTherapy.id,
          dayNumber: day,
          sequenceOrder: 1,
          durationMins: abhyangaTherapy.defaultDurationMins,
          prescribedOils: [{ name: 'Dhanvantaram Oil', quantityMl: 150 }],
          notes: 'Standard body lubrication.'
        }
      });
      const pt2 = await prisma.plannedTherapy.create({
        data: {
          planId: plan.id,
          therapyTypeId: bastiTherapy.id,
          dayNumber: day,
          sequenceOrder: 2,
          durationMins: bastiTherapy.defaultDurationMins,
          prescribedOils: [{ name: 'Sesame Oil', quantityMl: 100 }],
          notes: 'Anuvasana Basti (oil enema).'
        }
      });
      plannedTherapies.push(pt1, pt2);
    }
  }
  console.log(`Generated Planned Therapies for 14 Days.`);

  // 8. Create Scheduled Sessions for the next 7 days based on planned therapies
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const sessionDate = new Date();
    sessionDate.setDate(sessionDate.getDate() + dayOffset);
    sessionDate.setHours(9, 0, 0, 0); // 9:00 AM

    const dayNum = dayOffset + 1;
    const dayPlanned = plannedTherapies.filter(pt => pt.dayNumber === dayNum);

    let start = new Date(sessionDate);
    for (const pt of dayPlanned) {
      const end = new Date(start);
      end.setMinutes(start.getMinutes() + pt.durationMins);

      // Schedule session
      const sess = await prisma.session.create({
        data: {
          clinicId: clinic.id,
          patientId: patients[0].id,
          plannedTherapyId: pt.id,
          treatmentPlanId: plan.id,
          therapistId: therapistUser.id,
          roomId: rooms[0].id, // Room 1
          scheduledStart: start,
          scheduledEnd: end,
          status: dayOffset === 0 ? SessionStatus.COMPLETED : SessionStatus.SCHEDULED,
          notes: `Day ${dayNum} therapy session.`
        }
      });

      // If completed (Day 1 completed for demo)
      if (dayOffset === 0) {
        // Record Therapist Session Note
        await prisma.sessionNote.create({
          data: {
            sessionId: sess.id,
            recordedById: therapistUser.id,
            vitals: { bp: '120/80', pulse: 72, temp: 98.6 },
            oilsUsed: [{ name: 'Mahanarayan Oil', quantityMl: 150, unit: 'ml' }],
            patientResponse: 'Felt very relaxed. Spinal pain reduced significantly after massage.',
            observations: 'Vata pulse showing signs of balancing. Skin was extremely dry and absorbed oil quickly.',
            followUpInstructions: 'Continue current diet instructions. Keep warm.'
          }
        });

        // Deduct Inventory Stock
        const mahanarayanItem = inventoryItems.find(i => i.name === 'Mahanarayan Oil')!;
        await prisma.inventoryItem.update({
          where: { id: mahanarayanItem.id },
          data: { currentStock: { decrement: 150 } }
        });

        await prisma.inventoryTransaction.create({
          data: {
            itemId: mahanarayanItem.id,
            type: TransactionType.CONSUMED,
            quantity: 150,
            sessionId: sess.id,
            recordedById: therapistUser.id,
            notes: 'Consumed in Abhyanga therapy for Amit Patel'
          }
        });
      }

      // Prepare start time for the next sequence item
      start = new Date(end);
      start.setMinutes(start.getMinutes() + 15); // 15 mins gap
    }
  }

  console.log('Seeded active scheduled sessions for 7 days, including 1 completed session.');
  console.log('Seed completed successfully! 🌿');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
