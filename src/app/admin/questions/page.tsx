import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function QuestionsPage() {
  const questions = await prisma.question.findMany({
    include: { subject: true }
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Questions Management</h1>
      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question.id} className="border p-4 rounded shadow-sm">
            <p className="font-medium">{question.text}</p>
            <p className="text-sm text-gray-500">Subject: {question.subject.name} | Type: {question.type}</p>
          </div>
        ))}
        {questions.length === 0 && <p>No questions found.</p>}
      </div>
    </div>
  );
}
