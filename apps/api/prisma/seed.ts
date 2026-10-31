import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const exercises = [
  {
    name: "徒手深蹲",
    slug: "bodyweight-squat",
    muscleGroup: "腿部与臀部",
    equipment: "无器械",
    movementTags: ["髋屈与伸", "膝屈与伸", "踝背屈"],
    instructions: "双脚与肩同宽，脚尖略微向外。向后坐髋并屈膝下蹲，保持膝盖与脚尖方向一致，再平稳站起。",
    safetyNotes: "保持背部中立，不要为了追求深度而失去平衡。出现膝部疼痛时立即停止。"
  },
  {
    name: "跪姿俯卧撑",
    slug: "kneeling-pushup",
    muscleGroup: "胸部与手臂",
    equipment: "无器械",
    movementTags: ["肩水平内收", "肘伸", "肩胛前伸"],
    instructions: "双膝着地，手掌略宽于肩，身体从头到膝保持一条直线。屈肘下降后推回起始位置。",
    safetyNotes: "避免塌腰和耸肩。如手腕不适，可使用俯卧撑支架或改为墙面俯卧撑。"
  },
  {
    name: "臀桥",
    slug: "glute-bridge",
    muscleGroup: "臀部与后侧链",
    equipment: "无器械",
    movementTags: ["髋伸", "膝稳定", "骨盆后倾"],
    instructions: "仰卧屈膝，双脚踩地。收紧臀部抬高髋部，在顶端短暂停留，再缓慢下降。",
    safetyNotes: "不要过度挺腰。主要发力应来自臀部，而不是下背部。"
  },
  {
    name: "哑铃卧推",
    slug: "dumbbell-bench-press",
    muscleGroup: "胸部与手臂",
    equipment: "哑铃与训练凳",
    movementTags: ["肩水平内收", "肘伸", "肩胛后缩"],
    instructions: "肩胛骨向后下方收紧，将哑铃稳定下放至胸部两侧，再沿可控轨迹推起。",
    safetyNotes: "建议有人保护或使用安全架。不要盲目增加重量。"
  },
  {
    name: "坐姿划船",
    slug: "seated-row",
    muscleGroup: "背部与手臂",
    equipment: "弹力带或器械",
    movementTags: ["肩水平外展", "肘屈", "肩胛后缩"],
    instructions: "保持躯干稳定，将手柄拉向腹部，肩胛骨向后收拢，再缓慢伸直手臂。",
    safetyNotes: "避免耸肩和用身体后仰借力，保持动作可控。"
  },
  {
    name: "哑铃肩上推举",
    slug: "dumbbell-overhead-press",
    muscleGroup: "肩部与手臂",
    equipment: "哑铃",
    movementTags: ["肩屈/外展", "肘伸", "肩胛上回旋"],
    instructions: "坐姿或站姿保持核心收紧，将哑铃从肩部两侧向上推至手臂接近伸直，再缓慢下降。",
    safetyNotes: "避免腰部过度后仰。肩部疼痛时停止动作并降低重量。"
  },
  {
    name: "高位下拉",
    slug: "lat-pulldown",
    muscleGroup: "背部与手臂",
    equipment: "器械",
    movementTags: ["肩内收", "肘屈", "肩胛下回旋"],
    instructions: "坐稳并保持胸部抬起，将横杆拉向上胸部，肩胛骨向下收拢，再缓慢伸直手臂。",
    safetyNotes: "不要把横杆拉到颈后，也不要用身体大幅后仰借力。"
  },
  {
    name: "哑铃罗马尼亚硬拉",
    slug: "dumbbell-romanian-deadlift",
    muscleGroup: "臀部与后侧链",
    equipment: "哑铃",
    movementTags: ["髋铰链", "髋伸", "膝微屈"],
    instructions: "双手持哑铃，膝盖微屈，向后推髋下放重量，感受大腿后侧拉伸后收紧臀部站起。",
    safetyNotes: "保持背部中立，重量贴近身体。腰部不适时立即停止。"
  },
  {
    name: "反向箭步蹲",
    slug: "reverse-lunge",
    muscleGroup: "腿部与臀部",
    equipment: "无器械",
    movementTags: ["髋屈与伸", "膝屈与伸", "踝稳定"],
    instructions: "一腿向后跨步并屈膝下沉，前脚掌稳定发力返回，左右腿交替完成。",
    safetyNotes: "保持膝盖与脚尖方向一致，可扶墙保持平衡。"
  },
  {
    name: "站姿提踵",
    slug: "standing-calf-raise",
    muscleGroup: "小腿",
    equipment: "无器械",
    movementTags: ["踝跖屈", "足踝稳定"],
    instructions: "站稳后缓慢踮起脚尖，在最高点停留，再控制脚跟下降。",
    safetyNotes: "可以扶墙保持平衡，避免快速弹跳。"
  },
  {
    name: "哑铃弯举",
    slug: "dumbbell-biceps-curl",
    muscleGroup: "手臂",
    equipment: "哑铃",
    movementTags: ["肘屈", "前臂旋后"],
    instructions: "保持上臂贴近身体，屈肘举起哑铃并在顶端收紧，再缓慢下放。",
    safetyNotes: "避免摆动身体借力，手腕保持中立。"
  },
  {
    name: "绳索下压",
    slug: "triceps-pushdown",
    muscleGroup: "手臂",
    equipment: "器械",
    movementTags: ["肘伸", "肩稳定"],
    instructions: "固定上臂位置，将绳索向下压至手臂伸直，再控制返回。",
    safetyNotes: "肘部保持贴近身体，不要用肩部推动重量。"
  },
  {
    name: "平板支撑",
    slug: "plank",
    muscleGroup: "核心",
    equipment: "无器械",
    movementTags: ["躯干抗伸展", "肩胛稳定", "髋伸保持"],
    instructions: "前臂撑地，身体从头到脚保持直线，收紧腹部和臀部并保持自然呼吸。",
    safetyNotes: "不要塌腰或憋气，腰部不适时结束动作。"
  },
  {
    name: "哑铃飞鸟",
    slug: "dumbbell-chest-fly",
    muscleGroup: "胸部与手臂",
    equipment: "哑铃与训练凳",
    movementTags: ["肩水平内收", "肘微屈保持"],
    instructions: "仰卧持哑铃，手肘微屈，将双臂沿弧线向两侧下放，再用胸部发力合拢。",
    safetyNotes: "使用可控重量，肩部不适时缩小活动范围或停止动作。"
  },
  {
    name: "哑铃侧平举",
    slug: "dumbbell-lateral-raise",
    muscleGroup: "肩部与手臂",
    equipment: "哑铃",
    movementTags: ["肩外展", "肩胛上回旋"],
    instructions: "身体站稳，手肘微屈，将哑铃向身体两侧抬至接近肩高，再缓慢下放。",
    safetyNotes: "避免耸肩和摆动借力，不需要刻意抬过肩部。"
  },
  {
    name: "绳索面拉",
    slug: "cable-face-pull",
    muscleGroup: "肩部与背部",
    equipment: "器械",
    movementTags: ["肩水平外展", "肩外旋", "肩胛后缩"],
    instructions: "将绳索拉向面部，手肘向外展开并收拢肩胛骨，再控制返回。",
    safetyNotes: "保持躯干稳定，使用轻到中等重量完成。"
  },
  {
    name: "哑铃单臂划船",
    slug: "dumbbell-one-arm-row",
    muscleGroup: "背部与手臂",
    equipment: "哑铃",
    movementTags: ["肩伸", "肘屈", "肩胛后缩"],
    instructions: "一手支撑训练凳，保持背部平直，将哑铃拉向髋部，再缓慢下放。",
    safetyNotes: "避免躯干旋转和耸肩，左右两侧分别完成。"
  },
  {
    name: "死虫式",
    slug: "dead-bug",
    muscleGroup: "核心",
    equipment: "无器械",
    movementTags: ["躯干抗伸展", "髋屈与伸", "呼吸控制"],
    instructions: "仰卧抬起双臂和双腿，保持腰部贴近地面，交替伸展对侧手臂与腿后返回。",
    safetyNotes: "动作过程中持续收紧腹部，不要憋气或过度挺腰。"
  }
];

const plans = [
  {
    name: "全身两练",
    slug: "full-body-2",
    description: "每周两次全身训练，时间少也能覆盖主要肌群。",
    difficulty: "beginner",
    focus: "full_body",
    estimatedMinutes: 30,
    daysPerWeek: 2,
    exercises: [
      { slug: "bodyweight-squat", position: 1, targetSets: 3, targetReps: 10 },
      { slug: "kneeling-pushup", position: 2, targetSets: 3, targetReps: 8 },
      { slug: "seated-row", position: 3, targetSets: 3, targetReps: 10 },
      { slug: "glute-bridge", position: 4, targetSets: 3, targetReps: 12 },
      { slug: "plank", position: 5, targetSets: 3, targetSeconds: 30 }
    ]
  },
  {
    name: "全身三练",
    slug: "full-body-3",
    description: "每周三次全身基础训练，适合建立稳定训练习惯。",
    difficulty: "beginner",
    focus: "full_body",
    estimatedMinutes: 35,
    daysPerWeek: 3,
    exercises: [
      { slug: "bodyweight-squat", position: 1, targetSets: 3, targetReps: 10 },
      { slug: "dumbbell-bench-press", position: 2, targetSets: 3, targetReps: 8 },
      { slug: "seated-row", position: 3, targetSets: 3, targetReps: 10 },
      { slug: "dumbbell-romanian-deadlift", position: 4, targetSets: 3, targetReps: 8 },
      { slug: "dumbbell-overhead-press", position: 5, targetSets: 3, targetReps: 8 },
      { slug: "plank", position: 6, targetSets: 3, targetSeconds: 30 }
    ]
  },
  {
    name: "上下肢分化",
    slug: "upper-lower",
    description: "上肢和下肢交替训练，每周四练，适合有一定基础的训练者。",
    difficulty: "intermediate",
    focus: "split",
    estimatedMinutes: 45,
    daysPerWeek: 4,
    exercises: [
      { slug: "dumbbell-bench-press", dayNumber: 1, position: 1, targetSets: 4, targetReps: 8 },
      { slug: "seated-row", dayNumber: 1, position: 2, targetSets: 4, targetReps: 10 },
      { slug: "dumbbell-overhead-press", dayNumber: 1, position: 3, targetSets: 3, targetReps: 10 },
      { slug: "dumbbell-biceps-curl", dayNumber: 1, position: 4, targetSets: 3, targetReps: 12 },
      { slug: "bodyweight-squat", dayNumber: 2, position: 1, targetSets: 4, targetReps: 10 },
      { slug: "dumbbell-romanian-deadlift", dayNumber: 2, position: 2, targetSets: 4, targetReps: 8 },
      { slug: "reverse-lunge", dayNumber: 2, position: 3, targetSets: 3, targetReps: 10 },
      { slug: "standing-calf-raise", dayNumber: 2, position: 4, targetSets: 4, targetReps: 15 },
      { slug: "lat-pulldown", dayNumber: 3, position: 1, targetSets: 4, targetReps: 10 },
      { slug: "kneeling-pushup", dayNumber: 3, position: 2, targetSets: 3, targetReps: 10 },
      { slug: "seated-row", dayNumber: 3, position: 3, targetSets: 3, targetReps: 12 },
      { slug: "triceps-pushdown", dayNumber: 3, position: 4, targetSets: 3, targetReps: 12 },
      { slug: "dumbbell-romanian-deadlift", dayNumber: 4, position: 1, targetSets: 4, targetReps: 8 },
      { slug: "reverse-lunge", dayNumber: 4, position: 2, targetSets: 3, targetReps: 12 },
      { slug: "glute-bridge", dayNumber: 4, position: 3, targetSets: 3, targetReps: 15 },
      { slug: "plank", dayNumber: 4, position: 4, targetSets: 3, targetSeconds: 45 }
    ]
  },
  {
    name: "推拉腿分化",
    slug: "push-pull-legs",
    description: "按推、拉、腿分组，每周三练，训练目标更集中。",
    difficulty: "intermediate",
    focus: "split",
    estimatedMinutes: 45,
    daysPerWeek: 3,
    exercises: [
      { slug: "dumbbell-bench-press", dayNumber: 1, position: 1, targetSets: 4, targetReps: 8 },
      { slug: "dumbbell-overhead-press", dayNumber: 1, position: 2, targetSets: 3, targetReps: 10 },
      { slug: "kneeling-pushup", dayNumber: 1, position: 3, targetSets: 3, targetReps: 12 },
      { slug: "triceps-pushdown", dayNumber: 1, position: 4, targetSets: 3, targetReps: 12 },
      { slug: "seated-row", dayNumber: 2, position: 1, targetSets: 4, targetReps: 10 },
      { slug: "lat-pulldown", dayNumber: 2, position: 2, targetSets: 4, targetReps: 10 },
      { slug: "dumbbell-biceps-curl", dayNumber: 2, position: 3, targetSets: 3, targetReps: 12 },
      { slug: "bodyweight-squat", dayNumber: 3, position: 1, targetSets: 4, targetReps: 10 },
      { slug: "dumbbell-romanian-deadlift", dayNumber: 3, position: 2, targetSets: 3, targetReps: 8 },
      { slug: "reverse-lunge", dayNumber: 3, position: 3, targetSets: 3, targetReps: 10 },
      { slug: "standing-calf-raise", dayNumber: 3, position: 4, targetSets: 4, targetReps: 15 }
    ]
  },
  {
    name: "5×5 基础力量",
    slug: "five-by-five",
    description: "围绕复合动作完成五组五次，优先建立基础力量。",
    difficulty: "intermediate",
    focus: "strength",
    estimatedMinutes: 40,
    daysPerWeek: 3,
    exercises: [
      { slug: "bodyweight-squat", dayNumber: 1, position: 1, targetSets: 5, targetReps: 5 },
      { slug: "dumbbell-bench-press", dayNumber: 1, position: 2, targetSets: 5, targetReps: 5 },
      { slug: "seated-row", dayNumber: 1, position: 3, targetSets: 5, targetReps: 5 },
      { slug: "bodyweight-squat", dayNumber: 2, position: 1, targetSets: 5, targetReps: 5 },
      { slug: "dumbbell-overhead-press", dayNumber: 2, position: 2, targetSets: 5, targetReps: 5 },
      { slug: "dumbbell-romanian-deadlift", dayNumber: 2, position: 3, targetSets: 3, targetReps: 5 }
    ]
  },
  {
    name: "居家训练",
    slug: "home-workout",
    description: "无需器械，用自重动作完成低门槛全身训练。",
    difficulty: "beginner",
    focus: "full_body",
    estimatedMinutes: 25,
    daysPerWeek: 3,
    exercises: [
      { slug: "bodyweight-squat", position: 1, targetSets: 3, targetReps: 12 },
      { slug: "kneeling-pushup", position: 2, targetSets: 3, targetReps: 8 },
      { slug: "glute-bridge", position: 3, targetSets: 3, targetReps: 15 },
      { slug: "reverse-lunge", position: 4, targetSets: 3, targetReps: 10 },
      { slug: "plank", position: 5, targetSets: 3, targetSeconds: 30 }
    ]
  },
  {
    name: "胸部训练",
    slug: "chest-workout",
    description: "围绕水平推和胸部内收，适合单独安排胸部训练日。",
    difficulty: "intermediate",
    focus: "chest",
    estimatedMinutes: 40,
    daysPerWeek: 2,
    exercises: [
      { slug: "dumbbell-bench-press", position: 1, targetSets: 4, targetReps: 8 },
      { slug: "kneeling-pushup", position: 2, targetSets: 3, targetReps: 10 },
      { slug: "dumbbell-chest-fly", position: 3, targetSets: 3, targetReps: 12 },
      { slug: "triceps-pushdown", position: 4, targetSets: 3, targetReps: 12 }
    ]
  },
  {
    name: "肩部训练",
    slug: "shoulder-workout",
    description: "覆盖肩上推举、侧平举和肩后束，兼顾力量与稳定性。",
    difficulty: "intermediate",
    focus: "shoulders",
    estimatedMinutes: 35,
    daysPerWeek: 2,
    exercises: [
      { slug: "dumbbell-overhead-press", position: 1, targetSets: 4, targetReps: 8 },
      { slug: "dumbbell-lateral-raise", position: 2, targetSets: 3, targetReps: 12 },
      { slug: "cable-face-pull", position: 3, targetSets: 3, targetReps: 15 },
      { slug: "plank", position: 4, targetSets: 3, targetSeconds: 30 }
    ]
  },
  {
    name: "背部训练",
    slug: "back-workout",
    description: "结合垂直拉与水平拉，训练背阔肌、上背和手臂协同。",
    difficulty: "intermediate",
    focus: "back",
    estimatedMinutes: 40,
    daysPerWeek: 2,
    exercises: [
      { slug: "seated-row", position: 1, targetSets: 4, targetReps: 10 },
      { slug: "lat-pulldown", position: 2, targetSets: 4, targetReps: 10 },
      { slug: "dumbbell-one-arm-row", position: 3, targetSets: 3, targetReps: 12 },
      { slug: "cable-face-pull", position: 4, targetSets: 3, targetReps: 15 },
      { slug: "dumbbell-biceps-curl", position: 5, targetSets: 3, targetReps: 12 }
    ]
  },
  {
    name: "腿部训练",
    slug: "leg-workout",
    description: "覆盖大腿前侧、后侧、臀部和提踵动作，建立下肢力量。",
    difficulty: "intermediate",
    focus: "legs",
    estimatedMinutes: 45,
    daysPerWeek: 2,
    exercises: [
      { slug: "bodyweight-squat", position: 1, targetSets: 4, targetReps: 10 },
      { slug: "dumbbell-romanian-deadlift", position: 2, targetSets: 4, targetReps: 8 },
      { slug: "reverse-lunge", position: 3, targetSets: 3, targetReps: 10 },
      { slug: "glute-bridge", position: 4, targetSets: 3, targetReps: 15 },
      { slug: "standing-calf-raise", position: 5, targetSets: 4, targetReps: 15 }
    ]
  },
  {
    name: "手臂训练",
    slug: "arm-workout",
    description: "集中训练肱二头肌和肱三头肌，可作为上肢训练的补充。",
    difficulty: "beginner",
    focus: "arms",
    estimatedMinutes: 30,
    daysPerWeek: 2,
    exercises: [
      { slug: "dumbbell-biceps-curl", position: 1, targetSets: 4, targetReps: 12 },
      { slug: "triceps-pushdown", position: 2, targetSets: 4, targetReps: 12 },
      { slug: "kneeling-pushup", position: 3, targetSets: 3, targetReps: 10 }
    ]
  },
  {
    name: "核心训练",
    slug: "core-workout",
    description: "用静态支撑和抗伸展动作训练腹部与躯干稳定性。",
    difficulty: "beginner",
    focus: "core",
    estimatedMinutes: 25,
    daysPerWeek: 3,
    exercises: [
      { slug: "plank", position: 1, targetSets: 3, targetSeconds: 30 },
      { slug: "dead-bug", position: 2, targetSets: 3, targetReps: 10 },
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
        focus: plan.focus,
        isCustom: false,
        estimatedMinutes: plan.estimatedMinutes,
        daysPerWeek: plan.daysPerWeek,
        isPublished: true
      },
      create: {
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        difficulty: plan.difficulty,
        focus: plan.focus,
        isCustom: false,
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
        dayNumber: "dayNumber" in item ? item.dayNumber : 1,
        position: item.position,
        targetSets: item.targetSets,
        targetReps: "targetReps" in item ? item.targetReps : null,
        targetSeconds: "targetSeconds" in item ? item.targetSeconds : null
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
