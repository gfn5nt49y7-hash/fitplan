import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const exercises = [
  {
    name: "徒手深蹲",
    slug: "bodyweight-squat",
    muscleGroup: "腿部与臀部",
    equipment: "无器械",
    instructions: "双脚与肩同宽，脚尖略微向外。向后坐髋并屈膝下蹲，保持膝盖与脚尖方向一致，再平稳站起。",
    safetyNotes: "保持背部中立，不要为了追求深度而失去平衡。出现膝部疼痛时立即停止。"
  },
  {
    name: "跪姿俯卧撑",
    slug: "kneeling-pushup",
    muscleGroup: "胸部与手臂",
    equipment: "无器械",
    instructions: "双膝着地，手掌略宽于肩，身体从头到膝保持一条直线。屈肘下降后推回起始位置。",
    safetyNotes: "避免塌腰和耸肩。如手腕不适，可使用俯卧撑支架或改为墙面俯卧撑。"
  },
  {
    name: "臀桥",
    slug: "glute-bridge",
    muscleGroup: "臀部与后侧链",
    equipment: "无器械",
    instructions: "仰卧屈膝，双脚踩地。收紧臀部抬高髋部，在顶端短暂停留，再缓慢下降。",
    safetyNotes: "不要过度挺腰。主要发力应来自臀部，而不是下背部。"
  },
  {
    name: "哑铃卧推",
    slug: "dumbbell-bench-press",
    muscleGroup: "胸部与手臂",
    equipment: "哑铃与训练凳",
    instructions: "肩胛骨向后下方收紧，将哑铃稳定下放至胸部两侧，再沿可控轨迹推起。",
    safetyNotes: "建议有人保护或使用安全架。不要盲目增加重量。"
  },
  {
    name: "坐姿划船",
    slug: "seated-row",
    muscleGroup: "背部与手臂",
    equipment: "弹力带或器械",
    instructions: "保持躯干稳定，将手柄拉向腹部，肩胛骨向后收拢，再缓慢伸直手臂。",
    safetyNotes: "避免耸肩和用身体后仰借力，保持动作可控。"
  }
];

const plans = [
  {
    name: "每周三练",
    slug: "three-days",
    description: "每周三次全身基础训练，适合刚开始建立习惯的人。",
    difficulty: "beginner",
    estimatedMinutes: 35,
    daysPerWeek: 3,
    exercises: [
      { slug: "bodyweight-squat", position: 1, targetSets: 3, targetReps: 10 },
      { slug: "kneeling-pushup", position: 2, targetSets: 3, targetReps: 8 },
      { slug: "seated-row", position: 3, targetSets: 3, targetReps: 10 }
    ]
  },
  {
    name: "新手全身",
    slug: "beginner-full-body",
    description: "无器械动作优先，重点学习动作姿势和训练节奏。",
    difficulty: "beginner",
    estimatedMinutes: 30,
    daysPerWeek: 2,
    exercises: [
      { slug: "bodyweight-squat", position: 1, targetSets: 2, targetReps: 10 },
      { slug: "kneeling-pushup", position: 2, targetSets: 2, targetReps: 8 },
      { slug: "glute-bridge", position: 3, targetSets: 3, targetReps: 12 }
    ]
  },
  {
    name: "居家训练",
    slug: "home-workout",
    description: "使用自重完成高效训练，适合在家坚持。",
    difficulty: "beginner",
    estimatedMinutes: 25,
    daysPerWeek: 3,
    exercises: [
      { slug: "bodyweight-squat", position: 1, targetSets: 3, targetReps: 12 },
      { slug: "kneeling-pushup", position: 2, targetSets: 3, targetReps: 8 },
      { slug: "glute-bridge", position: 3, targetSets: 3, targetReps: 15 }
    ]
  }
];

async function main() {
  const exerciseIds = new Map<string, string>();

  for (const exercise of exercises) {
    const record = await prisma.exercise.upsert({
      where: { slug: exercise.slug },
      update: { ...exercise, isPublished: true },
      create: { ...exercise, isPublished: true }
    });
    exerciseIds.set(exercise.slug, record.id);
  }

  for (const plan of plans) {
    const planRecord = await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        difficulty: plan.difficulty,
        estimatedMinutes: plan.estimatedMinutes,
        daysPerWeek: plan.daysPerWeek,
        isPublished: true
      },
      create: {
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        difficulty: plan.difficulty,
        estimatedMinutes: plan.estimatedMinutes,
        daysPerWeek: plan.daysPerWeek,
        isPublished: true
      }
    });

    await prisma.planExercise.deleteMany({ where: { planId: planRecord.id } });
    await prisma.planExercise.createMany({
      data: plan.exercises.map((item) => ({
        planId: planRecord.id,
        exerciseId: exerciseIds.get(item.slug) as string,
        dayNumber: 1,
        position: item.position,
        targetSets: item.targetSets,
        targetReps: item.targetReps
      }))
    });
  }

  console.log("FitPlan seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
