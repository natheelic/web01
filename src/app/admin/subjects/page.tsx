import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function SubjectsPage() {
  const subjects = await prisma.subject.findMany();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Subjects Management</h1>
      <div className="space-y-4">
        {subjects.map((subject) => (
          <div key={subject.id} className="border p-4 rounded shadow-sm">
            <h2 className="font-semibold">{subject.code} - {subject.name}</h2>
            <p className="text-gray-600">{subject.description}</p>
          </div>
        ))}
        {subjects.length === 0 && <p>No subjects found.</p>}
      </div>
    </div>
  );
}
