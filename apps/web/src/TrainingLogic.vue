<script setup lang="ts">
import { computed, ref } from "vue";

type GoalId = "health" | "muscle" | "strength" | "fat-loss";

interface GoalProfile {
  id: GoalId;
  label: string;
  subtitle: string;
  frequency: string;
  sets: string;
  reps: string;
  effort: string;
  rest: string;
  progression: string;
  planHint: string;
}

const logicOpen = ref(true);
const activeGoal = ref<GoalId>("muscle");

const principles = [
  {
    number: "01",
    title: "专项性",
    english: "Specificity",
    summary: "身体会针对你给它的任务产生适应。想提高卧推力量，就需要逐渐练重卧推及其相关肌群；想改善肌耐力，则需要更高的重复次数和更短恢复。",
    application: "先写目标，再选动作和次数。不要只看动作名字是否“高级”。"
  },
  {
    number: "02",
    title: "超负荷",
    english: "Overload",
    summary: "长期使用完全相同的重量、次数和组数，身体适应后进步会停滞。训练必须比当前的舒适区略高，但不需要每次练到力竭。",
    application: "FitPlan 记录重量和次数，就是为了让你看到自己是否真的在逐步增加刺激。"
  },
  {
    number: "03",
    title: "渐进进阶",
    english: "Progression",
    summary: "训练压力应当逐步增加。可以先增加一次重复，再增加少量重量，或增加一组；一次只改变一个变量更容易判断身体是否适应。",
    application: "优先保持动作质量，再追求更快进步。跳跃式加重量最容易破坏动作和恢复。"
  },
  {
    number: "04",
    title: "训练量",
    english: "Volume",
    summary: "训练量可以理解为做了多少有效工作。力量训练常用“有效组数”估算，也要同时看重量、次数、动作幅度和接近力竭的程度。",
    application: "总量要分配到每周，而不是把全部组数堆在同一天。超过恢复能力，更多并不等于更好。"
  },
  {
    number: "05",
    title: "频率与恢复",
    english: "Frequency & recovery",
    summary: "肌肉是在训练后的恢复中适应，不是在训练当下变强。每周训练 2 天和 4 天并不天然谁更好，关键是总训练量、单次疲劳和生活恢复能否匹配。",
    application: "同一肌群每周 2 次左右通常便于分配训练量；睡眠、压力和疼痛会改变你能承受的频率。"
  },
  {
    number: "06",
    title: "个体差异",
    english: "Individualization",
    summary: "训练年龄、动作经验、关节活动度、器械、时间和恢复能力不同，同一个人不同阶段也会变化。计划必须允许调整。",
    application: "先选择你能连续坚持 4–6 周的计划，再用训练记录决定是否增加频率或总量。"
  }
];

const variables = [
  { letter: "F", name: "频率 Frequency", description: "一周练几次、同一肌群练几次。" },
  { letter: "I", name: "强度 Intensity", description: "负荷、RPE/RIR，以及动作有多困难。" },
  { letter: "T", name: "时间 Time", description: "单次训练时长、每组持续时间或总练习时间。" },
  { letter: "T", name: "类型 Type", description: "力量、跑步、单车、柔韧或专项练习。" },
  { letter: "V", name: "总量 Volume", description: "有效组数、总次数或总负重，不只是练了多久。" },
  { letter: "P", name: "进阶 Progression", description: "训练压力如何随适应而逐步提高。" }
];

const goalProfiles: GoalProfile[] = [
  {
    id: "health",
    label: "基础健康",
    subtitle: "先建立可持续的运动习惯",
    frequency: "力量训练每周 2–3 天",
    sets: "每个主要动作 2–3 组",
    reps: "每组 8–15 次",
    effort: "保留约 2–4 次余力",
    rest: "60–120 秒",
    progression: "先稳定动作和每周出勤，再逐步增加一次重复或少量重量。",
    planHint: "适合从全身两练、全身三练或居家训练开始。另需安排步行等有氧活动。"
  },
  {
    id: "muscle",
    label: "增肌",
    subtitle: "用足够训练量覆盖主要肌群",
    frequency: "每个肌群通常每周训练 2 次左右",
    sets: "从可恢复的总量起步，逐周观察",
    reps: "复合动作约 6–12 次，孤立动作约 10–20 次",
    effort: "多数有效组保留约 1–3 次余力",
    rest: "复合动作 2–3 分钟，孤立动作约 1–2 分钟",
    progression: "先增加次数，再增加重量或组数；不要同时把所有变量都拉满。",
    planHint: "全身三练、上下肢分化或推拉腿都能增肌，区别主要是训练量如何分配。"
  },
  {
    id: "strength",
    label: "基础力量",
    subtitle: "提高动作专项表现与技术稳定性",
    frequency: "主要动作每周练 2–3 次",
    sets: "主要动作 3–5 组",
    reps: "常用 3–6 次，必要时降低重量保持动作",
    effort: "多数组保留约 1–3 次余力",
    rest: "主要复合动作通常需要 2–4 分钟",
    progression: "先提高动作稳定性，再少量增加重量；失败组不是每次都必须出现。",
    planHint: "5×5 基础力量更偏力量；上下肢分化可以给主要动作更长的恢复间隔。"
  },
  {
    id: "fat-loss",
    label: "减脂与塑形",
    subtitle: "力量训练保留肌肉，有氧增加消耗",
    frequency: "力量训练每周 2–3 天，有氧按周累计",
    sets: "主要肌群每个动作 2–4 组",
    reps: "每组 8–15 次",
    effort: "保留约 2–3 次余力，优先保证动作质量",
    rest: "60–120 秒，根据呼吸和动作需求调整",
    progression: "靠饮食和总活动量形成能量缺口，力量训练负责保住力量和肌肉。",
    planHint: "可先选全身三练或上下肢分化，并单独累计每周至少 150 分钟中等强度有氧。"
  }
];

const planLogic = [
  {
    name: "全身两练 / 三练",
    bestFor: "时间有限、初学者、希望全身肌群都获得刺激",
    logic: "一次训练覆盖主要动作模式，每周重复 2–3 次。三练通常能更均匀地分配周训练量，但单次疲劳也更高。"
  },
  {
    name: "上下肢分化",
    bestFor: "每周可训练 3–5 次、希望单次更聚焦的人",
    logic: "把上肢和下肢拆开，让单次训练更聚焦，也能增加同一肌群每周被分配训练量的机会。"
  },
  {
    name: "推拉腿分化",
    bestFor: "能稳定训练 3–6 次、已有动作基础的人",
    logic: "推、拉、腿分别对应主要动作模式。训练日更集中，但如果每周只练一次某个部位，训练量分配会较困难。"
  },
  {
    name: "5×5 基础力量",
    bestFor: "想集中提高基础复合动作表现的人",
    logic: "低次数、较长休息、优先动作质量。它不适合把每组都做成力竭训练，也不是唯一的增肌方案。"
  },
  {
    name: "部位专项",
    bestFor: "整体计划稳定后，需要补足某个肌群训练量的人",
    logic: "专项不是用孤立动作替代全身训练，而是在周总量和恢复允许的前提下增加特定部位的有效组数。"
  },
  {
    name: "居家训练",
    bestFor: "器械有限、希望降低开始门槛的人",
    logic: "工具受限不等于没有进阶。可以通过动作难度、节奏、单侧负重、组数和次数逐步增加刺激。"
  }
];

const activeProfile = computed(function () {
  return goalProfiles.find((profile) => profile.id === activeGoal.value) ?? goalProfiles[0];
});
</script>

<template>
  <section class="training-logic-module">
    <div class="logic-module-heading">
      <div>
        <p class="eyebrow">训练底层逻辑</p>
        <h3>计划不是动作清单，而是一组可调整的训练变量</h3>
        <p>从目标出发，经过原则与变量，最后才落到具体动作。先理解这一层，再看计划差异。</p>
      </div>
      <button type="button" class="logic-toggle" @click="logicOpen = !logicOpen">
        {{ logicOpen ? "收起逻辑" : "展开逻辑" }}
      </button>
    </div>

    <div v-if="logicOpen" class="logic-module-body">
      <div class="logic-principles">
        <article v-for="principle in principles" :key="principle.number">
          <div class="logic-number">{{ principle.number }}</div>
          <div>
            <h4>{{ principle.title }}</h4>
            <small>{{ principle.english }}</small>
            <p>{{ principle.summary }}</p>
            <strong>在 FitPlan 中：{{ principle.application }}</strong>
          </div>
        </article>
      </div>

      <div class="fittvp-panel">
        <div>
          <p class="eyebrow">FITT-VP</p>
          <h4>把“我要练”拆成六个可调整变量</h4>
          <p>任何训练计划最终都在调整这六项。动作只是变量落地后的结果。</p>
        </div>
        <div class="fittvp-grid">
          <article v-for="(variable, index) in variables" :key="index">
            <b>{{ variable.letter }}</b>
            <div><strong>{{ variable.name }}</strong><span>{{ variable.description }}</span></div>
          </article>
        </div>
      </div>

      <div class="goal-logic-panel">
        <div class="goal-tabs" role="tablist" aria-label="选择训练目标">
          <button
            v-for="goal in goalProfiles"
            :key="goal.id"
            type="button"
            role="tab"
            :aria-selected="activeGoal === goal.id"
            :class="{ active: activeGoal === goal.id }"
            @click="activeGoal = goal.id"
          >
            {{ goal.label }}
          </button>
        </div>

        <div class="goal-profile">
          <div class="goal-profile-heading">
            <div>
              <p class="eyebrow">目标决定变量顺序</p>
              <h4>{{ activeProfile.label }}</h4>
            </div>
            <p>{{ activeProfile.subtitle }}</p>
          </div>
          <dl>
            <div><dt>频率</dt><dd>{{ activeProfile.frequency }}</dd></div>
            <div><dt>组数</dt><dd>{{ activeProfile.sets }}</dd></div>
            <div><dt>次数</dt><dd>{{ activeProfile.reps }}</dd></div>
            <div><dt>强度</dt><dd>{{ activeProfile.effort }}</dd></div>
            <div><dt>休息</dt><dd>{{ activeProfile.rest }}</dd></div>
            <div><dt>进阶</dt><dd>{{ activeProfile.progression }}</dd></div>
          </dl>
          <p class="goal-plan-hint"><strong>计划建议：</strong>{{ activeProfile.planHint }}</p>
        </div>
      </div>

      <div class="plan-logic-section">
        <div>
          <p class="eyebrow">计划为什么不同</p>
          <h4>不是哪套计划最强，而是哪套变量组合适合你</h4>
        </div>
        <div class="plan-logic-grid">
          <article v-for="plan in planLogic" :key="plan.name">
            <h5>{{ plan.name }}</h5>
            <p><strong>更适合：</strong>{{ plan.bestFor }}</p>
            <p>{{ plan.logic }}</p>
          </article>
        </div>
      </div>

      <div class="logic-decision">
        <p class="eyebrow">每周如何判断进步</p>
        <div class="decision-steps">
          <span><b>1</b> 出勤是否稳定</span>
          <span><b>2</b> 动作是否更稳</span>
          <span><b>3</b> 次数或重量是否小幅增加</span>
          <span><b>4</b> 疲劳是否可恢复</span>
          <span><b>5</b> 4–6 周后再调整计划</span>
        </div>
      </div>

      <div class="logic-evidence">
        <div>
          <strong>公共健康基线</strong>
          <p>成年人每周至少 150 分钟中等强度活动，并每周至少 2 天进行主要肌群的力量训练。</p>
        </div>
        <div>
          <strong>证据来源</strong>
          <a href="https://www.who.int/news-room/fact-sheets/detail/physical-activity" target="_blank" rel="noreferrer">WHO 身体活动建议</a>
          <a href="https://www.cdc.gov/physical-activity-basics/guidelines/index.html" target="_blank" rel="noreferrer">CDC 成人活动与力量训练建议</a>
          <a href="https://acsm.org/trending-topics-resources/physical-activity-guidelines/" target="_blank" rel="noreferrer">ACSM 运动处方指南</a>
          <a href="https://www.nhs.uk/live-well/exercise/strength-exercises/" target="_blank" rel="noreferrer">NHS 力量训练指导</a>
        </div>
      </div>
      <p class="logic-disclaimer">
        以上是一般健康人群的训练教育框架，不替代医生、康复师或教练针对疾病、孕期、疼痛和特殊人群的个体化建议。
      </p>
    </div>
  </section>
</template>
