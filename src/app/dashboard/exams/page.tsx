import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export default async function DashboardExamsPage() {
  const exams = await prisma.exam.findMany({
    include: { subject: true },
    where: {
      startTime: { lte: new Date() },
      endTime: { gte: new Date() }
    }
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Available Exams</h1>
      <div className="space-y-4">
        {exams.map((exam) => (
          <div key={exam.id} className="border p-4 rounded shadow-sm">
            <h2 className="font-semibold">{exam.title}</h2>
            <p className="text-sm text-gray-500">{exam.subject.name} - {exam.duration} mins</p>
            <a href={`/exam/${exam.id}`} className="text-blue-500 hover:underline mt-2 inline-block">Take Exam</a>
          </div>
        ))}
        {exams.length === 0 && <p>No available exams currently.</p>}
      </div>
    </div>
  );
}
