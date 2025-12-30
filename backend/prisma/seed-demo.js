import { PrismaClient, Role, SemesterStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const pengajarDemo = {
  email: 'demo.pengajar@hcq.my.id',
  password: 'DemoPengajar!25',
};

const pelajarDemo = {
  email: 'demo.pelajar@hcq.my.id',
  password: 'DemoPelajar!25',
};

async function main() {
  console.log('Seeding database with config: [DEMO]');

  /*
   * Create Sample Pengajar
   */
  const pengajarPassword = await argon2.hash(pengajarDemo.password);
  const pengajar = await prisma.user.upsert({
    where: { email: pengajarDemo.email },
    update: {},
    create: {
      email: pengajarDemo.email,
      password: pengajarPassword,
      nama: 'Ustadzah Fulanah',
      role: Role.PENGAJAR,
    },
  });
  console.log('✅ Pengajar created:', pengajar.email);

  /*
   * Create Sample Pelajar
   */
  const pelajarPassword = await argon2.hash(pelajarDemo.password);
  const pelajar = await prisma.user.upsert({
    where: { email: pelajarDemo.email },
    update: {},
    create: {
      email: pelajarDemo.email,
      password: pelajarPassword,
      nama: 'Aisyah binti Fulan',
      role: Role.PELAJAR,
    },
  });

  console.log('✅ Pelajar created:', pelajar.email);

  /*
   * Create Sample Semester
   */
  const semester = await prisma.semester.upsert({
    where: { nama: 'Semester Demo' },
    update: {},
    create: {
      nama: 'Semester Demo',
      tanggalMulai: new Date(),
      tanggalAkhir: new Date(new Date().setMonth(new Date().getMonth() + 4)),
      status: SemesterStatus.AKTIF,
    },
  });
  console.log('✅ Semester created:', semester.nama);

  /*
   * Create Sample Mata Pelajaran
   */
  const mataPelajaran = await prisma.mataPelajaran.upsert({
    where: { kode: 'DEMO001' },
    update: {},
    create: {
      nama: 'Demo Mata Pelajaran',
      kode: 'DEMO001',
      deskripsi: 'Mata pelajaran untuk keperluan demo dan testing.',
    },
  });
  console.log('✅ Mata Pelajaran created:', mataPelajaran.nama);

  /*
   * Create Sample Kelas
   */
  const kelas = await prisma.kelas.upsert({
    where: { id: '24a7ca65-3c5d-486a-a9f2-7dffb817d16b' },
    update: {},
    create: {
      id: '24a7ca65-3c5d-486a-a9f2-7dffb817d16b',
      namaKelas: 'Kelas Demo',
      mataPelajaranId: mataPelajaran.id,
      semesterId: semester.id,
    },
  });
  /*
   * Enroll Demo Users to Kelas
   */
  await prisma.enrollment.upsert({
    where: {
      userId_kelasId: {
        userId: pengajar.id,
        kelasId: kelas.id,
      },
    },
    update: {},
    create: {
      userId: pengajar.id,
      kelasId: kelas.id,
    },
  });
  console.log('✅ Pengajar enrolled to:', kelas.namaKelas);

  await prisma.enrollment.upsert({
    where: {
      userId_kelasId: {
        userId: pelajar.id,
        kelasId: kelas.id,
      },
    },
    update: {},
    create: {
      userId: pelajar.id,
      kelasId: kelas.id,
    },
  });
  console.log('✅ Pelajar enrolled to:', kelas.namaKelas);

  console.log('🎉 Demo seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Demo seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
