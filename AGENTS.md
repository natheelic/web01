# System Instructions & Guidelines for AI Agents: Online Examination System

ไฟล์นี้คือคู่มือและข้อกำหนด (Specification) สำหรับ AI Code Assistant (เช่น Cursor, Windsurf, Copilot) หรือ Development Agent ในการเขียนโค้ดและพัฒนา "ระบบคลังข้อสอบออนไลน์" โดยควบคุมสถาปัตยกรรม เทคโนโลยี และรูปแบบโค้ดให้เป็นไปตามมาตรฐานสูงสุด

---

## 1. Technical Stack Specifications

เอเจนต์ต้องติดตั้งและใช้เวอร์ชันของเครื่องมือตามนี้เท่านั้น:
- **Framework:** Next.js 16 (App Router, Server Components & Server Actions เท่านั้นสำหรับ Data Mutation)
- **Frontend Library:** React 19 (ใช้ React Server Actions, `useActionState`, `useFormStatus` หรือฟีเจอร์ใหม่ของ React 19)
- **Language:** TypeScript 5+ (Strict Mode: ต้องไม่มีการใช้ `any`, ต้องประกาศ Type/Interface ชัดเจนทุกจุด)
- **Styling:** Tailwind CSS v4 (ใช้รูปแบบ CSS-first configuration ใหม่ทั้งหมด ไม่มีไฟล์ `tailwind.config.js`)
- **UI Components:** shadcn/ui (ติดตั้งโดยใช้ CLI ที่เข้ากันได้กับ React 19 / Tailwind v4)
- **Authentication:** NextAuth.js v5 (Auth.js) - รองรับ Session บน Edge/Server Side และการทำ Middleware Protection
- **Database & ORM:** Prisma 7 + PostgreSQL (เชื่อมต่อและดึงข้อมูลจริงผ่าน Prisma Client เท่านั้น)

### 🚨 กฎเหล็ก (Critical Rules)
1. **ห้ามใช้ Mock Data หรือ Hard-code เด็ดขาด:** การดึงข้อมูล คัดกรอง ค้นหา หรือบันทึกผลการเข้าสอบ ต้องผ่าน Prisma Client ไปยังฐานข้อมูล PostgreSQL จริงเท่านั้น
2. **Server-Side Security:** ระบบตรวจข้อสอบ บันทึกคะแนน และดึงข้อสอบเข้าสู่หน้าจอสอบ ต้องประมวลผลบน Server (ผ่าน Server Actions หรือ Server Components) เพื่อป้องกันไม่ให้นักเรียนแฮกดูเฉลยผ่าน Client-side DevTools
3. **Data Validation:** ใช้ `zod` ควบคู่กับการรับค่าใน Server Actions หรือ API Routes ทุกครั้ง

---

## 2. Database Schema (Prisma 7 & PostgreSQL)

ให้ออกแบบและสร้างไฟล์ `prisma/schema.prisma` ตามโครงสร้างนี้ ซึ่งรองรับระบบคลังข้อสอบ ตัวเลือก เกณฑ์คะแนน และการบันทึกคำตอบจริงจากนักเรียน

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  STUDENT
}

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  ESSAY
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}

enum ExamStatus {
  STARTED
  SUBMITTED
  GRADED
}

model User {
  id            String         @id @default(cuid())
  username      String         @unique
  name          String?
  email         String         @unique
  password      String // เข้ารหัสด้วย bcrypt / argon2
  role          Role           @default(STUDENT)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  examsCreated  Exam[]         @relation("ExamCreator")
  studentExams  StudentExam[]
}

model Subject {
  id          String     @id @default(cuid())
  code        String     @unique // รหัสวิชา เช่น CS101
  name        String
  description String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  questions   Question[]
  exams       Exam[]
}

model Question {
  id            String         @id @default(cuid())
  text          String         @db.Text
  type          QuestionType
  difficulty    Difficulty     @default(MEDIUM)
  points        Float          @default(1.0)
  imageUrl      String?        @db.Text
  subjectId     String
  subject       Subject        @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  choices       Choice[]
  examQuestions ExamQuestion[]
  studentAnswers StudentAnswer[]
}

model Choice {
  id             String          @id @default(cuid())
  text           String          @db.Text
  isCorrect      Boolean         @default(false)
  questionId     String
  question       Question        @relation(fields: [questionId], references: [id], onDelete: Cascade)
  studentAnswers StudentAnswer[]
}

model Exam {
  id            String         @id @default(cuid())
  title         String
  description   String?        @db.Text
  duration      Int            // ระยะเวลาทำข้อสอบ (นาที)
  startTime     DateTime       // วันเวลาเริ่มเปิดให้สอบ
  endTime       DateTime       // วันเวลาปิดไม่ให้สอบ
  passingScore  Float          @default(50.0) // เกณฑ์ผ่านคิดเป็นเปอร์เซ็นต์ หรือคะแนนดิบ
  shuffleQuestions Boolean     @default(true)
  shuffleChoices   Boolean     @default(true)
  subjectId     String
  subject       Subject        @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  createdById   String
  createdBy     User           @relation("ExamCreator", fields: [createdById], references: [id])
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  examQuestions ExamQuestion[]
  studentExams  StudentExam[]
}

model ExamQuestion {
  examId     String
  questionId String
  order      Int      @default(0) // สำหรับเรียงข้อในชุดข้อสอบ (ถ้าไม่สลับ)
  
  exam       Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@id([examId, questionId])
}

model StudentExam {
  id          String          @id @default(cuid())
  studentId   String
  examId      String
  startedAt   DateTime        @default(now())
  submittedAt DateTime?
  score       Float           @default(0.0)
  status      ExamStatus      @default(STARTED)
  
  student     User            @relation(fields: [studentId], references: [id], onDelete: Cascade)
  exam        Exam            @relation(fields: [examId], references: [id], onDelete: Cascade)
  answers     StudentAnswer[]

  @@unique([studentId, examId]) // นักเรียนหนึ่งคนเข้าสอบชุดเดิมได้ครั้งเดียวต่อหนึ่งสิทธิ์ (หรือล้างสถานะเพื่อสอบใหม่)
}

model StudentAnswer {
  id            String      @id @default(cuid())
  studentExamId String
  questionId    String
  choiceId      String?     // สำหรับ Multiple Choice / True-False
  essayAnswer   String?     @db.Text // สำหรับข้อสอบบรรยาย อัตนัย
  
  studentExam   StudentExam @relation(fields: [studentExamId], references: [id], onDelete: Cascade)
  question      Question    @relation(fields: [questionId], references: [id], onDelete: Cascade)
  choice        Choice?     @relation(fields: [choiceId], references: [id], onDelete: SetNull)

  @@unique([studentExamId, questionId]) // ป้องกันคำตอบซ้ำในข้อเดิมของรอบการสอบนั้น
}
```

## 3. Core Architectural Modules & Agent Directives

เมื่อ Agent สร้างสถาปัตยกรรมโฟลเดอร์ ให้ยึดตามหลัก Next.js 16 App Router:

### 3.1 Authentication Module (NextAuth v5)

- Setup: สร้าง auth.ts และ middleware.ts ที่ Root หรือ src

- Session Strategy: ใช้ jwt เพื่อดึง Role (ADMIN หรือ STUDENT) มาใส่ใน token และ session object

Agent Directives:

- ออกแบบระบบรักษาความปลอดภัย ห้ามเข้าถึงหน้า /admin/* หาก session.user.role !== 'ADMIN' ให้รีไดเรกต์ไปที่ /dashboard

- หน้าทำข้อสอบ /exam/[id] ต้องตรวจสอบสิทธิ์ว่าอยู่ในช่วงเวลา startTime และ endTime ของชุดข้อสอบนั้นหรือไม่ ผ่าน Database จริงก่อนให้เรนเดอร์ UI

### 3.2 Admin Dashboard (จัดการคลังข้อสอบ)

- Path Structure: /admin/subjects, /admin/questions, /admin/exams

- Data Fetching: ใช้ Async Server Components ดึงข้อสอบร่วมกับ Prisma (e.g. prisma.question.findMany({ include: { subject: true } }))

- Mutations: สร้าง Server Actions ในไฟล์แยก เช่น actions/questions.ts สำหรับฟังก์ชัน createQuestion, updateQuestion, deleteQuestion

- Form Handling: ใช้ฟอร์มจาก shadcn/ui (React Hook Form + Zod) ควบคู่กับ React 19 useActionState เพื่อส่งข้อมูลเข้า Server Actions

### 3.3 Student Examination Core (ระบบสอบสำหรับนักเรียน)

- Path Structure: /dashboard/exams (ดูรายการสอบที่เปิดอยู่), /exam/[id] (หน้าจอทำข้อสอบจริง)

Exam Screen Security (สำคัญมาก):

- เมื่อดึงคำถามออกมา เรนเดอร์โจทย์และตัวเลือก (Choice) แต่ ห้ามส่งฟิลด์ isCorrect ไปยังฝั่ง Client Component โดยเด็ดขาด (ให้ลบฟิลด์นี้ออกจาก query หรือสร้าง Data Transfer Object (DTO) ก่อนส่ง)

- หากมีการตั้งค่า shuffleQuestions หรือ shuffleChoices ให้ใช้ฟังก์ชันสุ่มสลับอาร์เรย์บน Server ก่อนตอบกลับตัวชี้วัดข้อสอบ

- Auto-Save Mechanism: ออกแบบระบบให้ Client Component มี Event ส่งคำตอบไปบันทึกที่ Server (ผ่าน Server Action saveAnswer) แบบ Debounce หรือทุกครั้งที่ผู้ใช้เลือกเปลี่ยนข้อ เพื่อรักษาข้อมูลในตาราง StudentAnswer จริงเสมอเมื่อเน็ตหลุด

Automatic Grading System:

- เมื่อนักเรียนกดส่งข้อสอบ หรือเวลาใน Countdown สิ้นสุดลง ให้เรียก Action submitExam

- ฝั่ง Server จะต้องดึงข้อมูล StudentAnswer ของนักเรียนคนนั้นในรอบนั้น แล้วคำนวณคะแนนกับเฉลย (Choice.isCorrect) ในตารางจริงเพื่ออัปเดตฟิลด์ score และเปลี่ยน status เป็น SUBMITTED ทันที (หรือ GRADED หากไม่มีข้อสอบอัตนัย)

## 4. Coding Style & Performance Rules for Agents

### TypeScript Strict Typing

ห้ามเลี่ยงไปใช้ any หรือทำ Type Casting แบบไม่ปลอดภัย (as unexpectedType)

ทุก API Payload หรือ Server Action Input ต้องมีตัวแปรที่เป็น Type รองรับแน่นอนผ่านการใช้ Inference จาก Zod schema

### Next.js Server Components vs Client Components

ใช้ Server Components เป็นค่าเริ่มต้นเสมอในการดึงข้อมูลตาราง สถิติ และรายละเอียดข้อสอบ

ใช้ Client Components ("use client") เฉพาะจุดที่มี User Interaction เท่านั้น เช่น หน้าจอที่มีเครื่องจับเวลาถอยหลัง (Timer Component) ตัวเลือกสลับหน้าข้อสอบ และหน้าส่งฟอร์ม UI

### Tailwind CSS v4 Standard

ห้ามเขียนคลาสแบบ inline style ยิบย่อยนอกเหนือจาก utility classes

จัดการ State ของปุ่มและฟอร์มผ่าน Tailwind modifier ตัวใหม่ๆ และผสานกับคอมโพเนนต์อะตอมจาก shadcn/ui

### Prisma Query Optimization

หลีกเลี่ยง N+1 Query โดยการทำ include หรือ select ข้อมูลที่จำเป็นมาในคำสั่งเดียว เช่น ดึงตัวเลือกพร้อมโจทย์ในคราวเดียว:

```ts
const examData = await prisma.exam.findUnique({
  where: { id: examId },
  include: {
    examQuestions: {
      include: {
        question: {
          include: {
            choices: {
              select: { id: true, text: true }, // ปลอดภัย ไม่ส่งเฉลย isCorrect ออกไป
            },
          },
        },
      },
    },
  },
});
```

---
*หมายเหตุสำหรับ Agent: หากได้รับคำสั่งให้สร้างโมดูลย่อยใดๆ ในระบบ ให้ตรวจสอบเงื่อนไขความปลอดภัยและโครงสร้างฐานข้อมูลในหน้านี้เป็นเกณฑ์อ้างอิงหลักเสมอ*