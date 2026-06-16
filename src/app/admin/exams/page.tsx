import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function ExamsPage() {
  const exams = await prisma.exam.findMany({
    include: { subject: true }
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Exams Management</h1>
      <div className="space-y-4">
        {exams.map((exam) => (
          <div key={exam.id} className="border p-4 rounded shadow-sm">
            <h2 className="font-semibold">{exam.title}</h2>
            <p className="text-sm text-gray-500">Subject: {exam.subject.name} | Duration: {exam.duration} mins</p>
          </div>
        ))}
        {exams.length === 0 && <p>No exams found.</p>}
      </div>
    </div>
  );
}
