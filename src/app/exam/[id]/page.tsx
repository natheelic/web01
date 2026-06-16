import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const examId = resolvedParams.id;
  const examData = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      examQuestions: {
        include: {
          question: {
            include: {
              choices: {
                select: { id: true, text: true }, // Not sending isCorrect to client
              },
            },
          },
        },
      },
    },
  });

  if (!examData) {
    return notFound();
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{examData.title}</h1>
      <p className="mb-8">{examData.description}</p>
      
      <div className="space-y-8">
        {examData.examQuestions.map((eq, index) => (
          <div key={eq.question.id} className="border p-6 rounded shadow-sm">
            <h3 className="font-medium mb-4">{index + 1}. {eq.question.text}</h3>
            <div className="space-y-2">
              {eq.question.choices.map(choice => (
                <label key={choice.id} className="flex items-center space-x-2">
                  <input type="radio" name={`question-${eq.question.id}`} value={choice.id} />
                  <span>{choice.text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button className="mt-8 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Submit Exam
      </button>
    </div>
  );
}
