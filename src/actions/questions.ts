"use server";

import { PrismaClient, Difficulty, QuestionType } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

const questionSchema = z.object({
  text: z.string().min(1),
  type: z.nativeEnum(QuestionType),
  difficulty: z.nativeEnum(Difficulty),
  points: z.number().min(0),
  subjectId: z.string().cuid(),
});

export async function createQuestion(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  
  const parsed = questionSchema.safeParse({
    text: data.text,
    type: data.type,
    difficulty: data.difficulty,
    points: parseFloat(data.points as string),
    subjectId: data.subjectId,
  });

  if (!parsed.success) {
    return { error: "Invalid data" };
  }

  await prisma.question.create({
    data: parsed.data
  });

  revalidatePath('/admin/questions');
  return { success: true };
}
