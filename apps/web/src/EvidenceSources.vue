<script setup lang="ts">
import { computed, ref } from "vue";

type SourceArea = "plans" | "progress" | "library" | "anatomy" | "records";

interface EvidenceSource {
  id: string;
  organization: string;
  title: string;
  url: string;
  supports: string;
  areas: SourceArea[];
}

const props = defineProps<{
  area: SourceArea;
}>();

const sourcesOpen = ref(true);

const sourceCatalog: EvidenceSource[] = [
  {
    id: "nasm-opt",
    organization: "NASM",
    title: "OPT Model：稳定、力量与爆发力的分层训练框架",
    url: "https://www.nasm.org/resource-center/blog/training/nasm-optimum-performance-training",
    supports: "训练分层、稳定性优先、目标与准备度决定进阶、周期性重新评估。",
    areas: ["plans", "progress", "library", "records"]
  },
  {
    id: "nasm-library",
    organization: "NASM",
    title: "NASM Exercise Library",
    url: "https://www.nasm.org/resource-center/exercise-library",
    supports: "动作步骤、目标肌群、训练动作与拉伸动作的分类方式。",
    areas: ["library", "anatomy", "records"]
  },
  {
    id: "ace-periodization",
    organization: "ACE",
    title: "Top 7 Reasons for Using Periodization",
    url: "https://www.acefitness.org/resources/pros/expert-articles/5523/top-7-reasons-for-using-periodization-with-your-clients/",
    supports: "训练量、强度、动作复杂度、急性变量和恢复如何构成周期化计划。",
    areas: ["plans", "progress", "records"]
  },
  {
    id: "ace-library",
    organization: "ACE",
    title: "ACE Exercise Library",
    url: "https://www.acefitness.org/resources/everyone/exercise-library/",
    supports: "按身体部位、器械、难度和动作目标查找练习及动作说明。",
    areas: ["library", "anatomy", "records"]
  },
  {
    id: "acsm-guidelines",
    organization: "ACSM",
    title: "Physical Activity Guidelines",
    url: "https://acsm.org/trending-topics-resources/physical-activity-guidelines/",
    supports: "FITT-VP 运动处方框架、频率、强度、时间、类型、总量与进阶。",
    areas: ["plans", "progress", "library", "records"]
  },
  {
    id: "cdc-adults",
    organization: "CDC",
    title: "成人身体活动与力量训练建议",
    url: "https://www.cdc.gov/physical-activity-basics/guidelines/index.html",
    supports: "成人每周至少 150 分钟中等强度活动，并每周至少 2 天进行肌肉强化活动。",
    areas: ["plans", "progress"]
  },
  {
    id: "who-activity",
    organization: "WHO",
    title: "Physical Activity Fact Sheet",
    url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
    supports: "身体活动的公共健康基线、久坐风险与肌肉强化建议。",
    areas: ["plans", "progress"]
  },
  {
    id: "openstax-anatomy",
    organization: "OpenStax",
    title: "Anatomy and Physiology：肌肉系统",
    url: "https://openstax.org/books/anatomy-and-physiology-2e/pages/11-introduction",
    supports: "骨骼肌结构、肌肉命名、起止点和主要动作的解剖学基础。",
    areas: ["anatomy"]
  },
  {
    id: "nhs-strength",
    organization: "NHS",
    title: "Strength and flexibility exercises",
    url: "https://www.nhs.uk/live-well/exercise/strength-exercises/",
    supports: "主要肌群力量练习、动作安全原则与每周训练安排。",
    areas: ["plans", "library"]
  }
];

const visibleSources = computed(function () {
  return sourceCatalog.filter((source) => source.areas.includes(props.area));
});
</script>

<template>
  <section class="evidence-sources">
    <div class="evidence-heading">
      <div>
        <p class="eyebrow">数据来源与学习依据</p>
        <h3>本模块参考了哪些专业体系</h3>
      </div>
      <button type="button" @click="sourcesOpen = !sourcesOpen">
        {{ sourcesOpen ? "收起来源" : "查看来源" }}
      </button>
    </div>

    <div v-if="sourcesOpen" class="evidence-grid">
      <article v-for="source in visibleSources" :key="source.id">
        <div class="evidence-source-top">
          <span>{{ source.organization }}</span>
          <small>{{ source.id.toUpperCase() }}</small>
        </div>
        <h4>
          <a :href="source.url" target="_blank" rel="noreferrer">{{ source.title }}</a>
        </h4>
        <p>{{ source.supports }}</p>
      </article>
    </div>

    <p class="evidence-disclaimer">
      以上为公开教学资料的参考索引，不代表 NASM、ACE 或其他机构对本产品的认证、合作或背书；FitPlan 没有复制其完整课程、评估流程或专有训练处方。
    </p>
  </section>
</template>
