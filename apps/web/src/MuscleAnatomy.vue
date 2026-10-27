<script setup lang="ts">
import { computed, ref } from "vue";

type MuscleView = "front" | "back";

interface MuscleRegion {
  id: string;
  name: string;
  englishName: string;
  group: string;
  view: MuscleView;
  color: string;
  function: string;
  actions: string[];
  exercises: string[];
  paths: string[];
  marker: [number, number];
  label: [number, number];
  align: "start" | "end";
}

const muscleRegions: MuscleRegion[] = [
  {
    id: "masseter",
    name: "咬肌",
    englishName: "Masseter",
    group: "头面部",
    view: "front",
    color: "#9e3b37",
    function: "参与下颌闭合和咀嚼。训练中主要表现为咬合稳定，不建议通过用力咬紧牙关来憋气完成大重量动作。",
    actions: ["下颌上提"],
    exercises: ["深蹲", "卧推", "硬拉"],
    paths: [
      "M321 75 Q303 82 314 109 L329 116 L326 77 Z",
      "M379 75 Q397 82 386 109 L371 116 L374 77 Z"
    ],
    marker: [318, 93],
    label: [28, 92],
    align: "start"
  },
  {
    id: "sternocleidomastoid",
    name: "胸锁乳突肌",
    englishName: "Sternocleidomastoid",
    group: "颈部",
    view: "front",
    color: "#a8403b",
    function: "参与颈部前屈、侧屈和旋转，也在头部保持稳定时提供支持。",
    actions: ["颈部屈曲", "颈部旋转"],
    exercises: ["站姿推举", "深蹲"],
    paths: [
      "M327 121 L339 120 L347 151 L334 147 Z",
      "M373 121 L361 120 L353 151 L366 147 Z"
    ],
    marker: [362, 133],
    label: [672, 112],
    align: "end"
  },
  {
    id: "pectoralis-major",
    name: "胸大肌",
    englishName: "Pectoralis major",
    group: "胸部",
    view: "front",
    color: "#b8463e",
    function: "主要负责肩水平内收和肩内旋，并在卧推、俯卧撑等推类动作中把躯干力量传到手臂。",
    actions: ["肩水平内收", "肩内旋"],
    exercises: ["哑铃卧推", "跪姿俯卧撑", "哑铃飞鸟"],
    paths: [
      "M312 171 Q338 161 349 176 L347 233 Q319 241 301 215 Z",
      "M349 176 Q361 161 388 171 L399 215 Q381 241 353 233 Z"
    ],
    marker: [350, 201],
    label: [28, 205],
    align: "start"
  },
  {
    id: "anterior-deltoid",
    name: "三角肌前束",
    englishName: "Anterior deltoid",
    group: "肩部",
    view: "front",
    color: "#c65b47",
    function: "参与肩屈、肩内旋和向前的推举。它与胸大肌协作，但更强调上臂向前和向上的方向控制。",
    actions: ["肩屈", "肩内旋"],
    exercises: ["哑铃肩上推举", "跪姿俯卧撑"],
    paths: [
      "M287 162 Q262 166 254 194 L272 219 Q288 203 301 181 Z",
      "M413 162 Q438 166 446 194 L428 219 Q412 203 399 181 Z"
    ],
    marker: [270, 190],
    label: [28, 140],
    align: "start"
  },
  {
    id: "biceps-brachii",
    name: "肱二头肌",
    englishName: "Biceps brachii",
    group: "手臂",
    view: "front",
    color: "#b84b43",
    function: "主要负责肘屈，并参与前臂旋后。拉类动作和弯举都需要它，但肱肌等其他结构也会参与肘屈。",
    actions: ["肘屈", "前臂旋后"],
    exercises: ["哑铃弯举", "坐姿划船"],
    paths: [
      "M262 205 Q243 221 240 253 L225 327 Q236 338 248 327 L261 264 L280 210 Z",
      "M438 205 Q457 221 460 253 L475 327 Q464 338 452 327 L439 264 L420 210 Z"
    ],
    marker: [247, 260],
    label: [28, 300],
    align: "start"
  },
  {
    id: "rectus-abdominis",
    name: "腹直肌",
    englishName: "Rectus abdominis",
    group: "核心",
    view: "front",
    color: "#cc5e4c",
    function: "参与躯干屈曲，也会在负重时抵抗腰椎过度伸展。平板支撑更重要的是抗伸展，而不是反复卷腹。",
    actions: ["躯干屈曲", "躯干抗伸展"],
    exercises: ["平板支撑", "死虫式"],
    paths: ["M325 240 L375 240 L381 322 L350 340 L319 322 Z"],
    marker: [350, 286],
    label: [672, 238],
    align: "end"
  },
  {
    id: "external-oblique",
    name: "腹外斜肌",
    englishName: "External oblique",
    group: "核心",
    view: "front",
    color: "#a9433d",
    function: "参与躯干侧屈和旋转，也在单侧负重时抵抗躯干被拉向一侧。",
    actions: ["躯干旋转", "躯干侧屈", "抗旋转"],
    exercises: ["死虫式", "哑铃单臂划船"],
    paths: [
      "M308 236 Q293 258 298 315 L318 327 L318 241 Z",
      "M392 236 Q407 258 402 315 L382 327 L382 241 Z"
    ],
    marker: [303, 281],
    label: [28, 365],
    align: "start"
  },
  {
    id: "forearm-flexors",
    name: "前臂屈肌群",
    englishName: "Forearm flexors",
    group: "前臂",
    view: "front",
    color: "#ad4941",
    function: "控制手腕和手指屈曲、抓握以及前臂稳定。拉类动作中，握力和前臂耐力常会成为限制因素。",
    actions: ["腕屈", "手指屈曲", "抓握"],
    exercises: ["哑铃弯举", "坐姿划船", "高位下拉"],
    paths: [
      "M226 326 Q235 342 247 333 L251 354 Q238 365 224 349 Z",
      "M474 326 Q465 342 453 333 L449 354 Q462 365 476 349 Z"
    ],
    marker: [238, 343],
    label: [672, 318],
    align: "end"
  },
  {
    id: "quadriceps",
    name: "股四头肌",
    englishName: "Quadriceps femoris",
    group: "腿部",
    view: "front",
    color: "#bd5346",
    function: "主要负责膝伸，其中股直肌还参与髋屈。深蹲和箭步蹲站起时都需要它把身体推起。",
    actions: ["膝伸", "髋屈"],
    exercises: ["徒手深蹲", "反向箭步蹲"],
    paths: [
      "M302 368 L342 360 L339 520 L311 528 L294 462 Z",
      "M358 360 L398 368 L406 462 L389 528 L361 520 Z"
    ],
    marker: [322, 444],
    label: [28, 455],
    align: "start"
  },
  {
    id: "sartorius",
    name: "缝匠肌",
    englishName: "Sartorius",
    group: "腿部",
    view: "front",
    color: "#a33d38",
    function: "跨过髋和膝，参与髋屈、髋外展和膝屈。它是细长跨越肌，不等同于整个大腿前侧的发力。",
    actions: ["髋屈", "髋外展", "膝屈"],
    exercises: ["反向箭步蹲", "徒手深蹲"],
    paths: [
      "M317 357 Q302 405 312 512 L321 512 Q311 415 326 361 Z",
      "M383 357 Q398 405 388 512 L379 512 Q389 415 374 361 Z"
    ],
    marker: [317, 445],
    label: [672, 420],
    align: "end"
  },
  {
    id: "tibialis-anterior",
    name: "胫骨前肌",
    englishName: "Tibialis anterior",
    group: "小腿",
    view: "front",
    color: "#963b37",
    function: "主要负责踝背屈，帮助脚尖抬起并控制脚掌落地。深蹲时踝背屈不足，身体可能出现代偿。",
    actions: ["踝背屈", "足踝控制"],
    exercises: ["徒手深蹲", "反向箭步蹲"],
    paths: [
      "M318 548 L340 545 L334 674 L315 674 Z",
      "M360 545 L382 548 L385 674 L366 674 Z"
    ],
    marker: [334, 606],
    label: [28, 606],
    align: "start"
  },
  {
    id: "occipitofrontalis",
    name: "枕额肌",
    englishName: "Occipitofrontalis",
    group: "头面部",
    view: "back",
    color: "#9a3935",
    function: "覆盖额部和枕部，参与抬眉和头皮移动。它不承担主要力量训练作用，但可作为头颈姿势的定位标志。",
    actions: ["抬眉", "头皮移动"],
    exercises: ["姿势与颈部控制练习"],
    paths: ["M350 20 Q393 20 397 69 L369 82 L350 67 L331 82 L303 69 Q307 20 350 20 Z"],
    marker: [350, 52],
    label: [672, 88],
    align: "end"
  },
  {
    id: "trapezius",
    name: "斜方肌",
    englishName: "Trapezius",
    group: "背部与肩胛",
    view: "back",
    color: "#9b3c37",
    function: "负责肩胛骨的上提、后缩和上回旋。举臂时肩胛骨必须转动，否则肩关节活动空间会受限。",
    actions: ["肩胛上提", "肩胛后缩", "肩胛上回旋"],
    exercises: ["哑铃肩上推举", "坐姿划船", "高位下拉"],
    paths: ["M315 145 Q350 136 385 145 L411 181 L350 211 L289 181 Z"],
    marker: [350, 170],
    label: [28, 140],
    align: "start"
  },
  {
    id: "posterior-deltoid",
    name: "三角肌后束",
    englishName: "Posterior deltoid",
    group: "肩部",
    view: "back",
    color: "#c45a46",
    function: "主要参与肩水平外展和肩伸，常在面拉、划船和手臂后摆时发挥作用。",
    actions: ["肩水平外展", "肩伸"],
    exercises: ["绳索面拉", "坐姿划船"],
    paths: [
      "M287 162 Q262 166 254 194 L272 219 Q288 203 301 181 Z",
      "M413 162 Q438 166 446 194 L428 219 Q412 203 399 181 Z"
    ],
    marker: [270, 190],
    label: [28, 200],
    align: "start"
  },
  {
    id: "triceps-brachii",
    name: "肱三头肌",
    englishName: "Triceps brachii",
    group: "手臂",
    view: "back",
    color: "#ad473f",
    function: "主要负责肘伸，部分肌束也参与肩伸。推类动作的最后伸肘阶段尤其依赖它。",
    actions: ["肘伸", "肩伸"],
    exercises: ["绳索下压", "哑铃卧推", "跪姿俯卧撑"],
    paths: [
      "M262 205 Q243 221 240 253 L225 327 Q236 338 248 327 L261 264 L280 210 Z",
      "M438 205 Q457 221 460 253 L475 327 Q464 338 452 327 L439 264 L420 210 Z"
    ],
    marker: [247, 260],
    label: [28, 300],
    align: "start"
  },
  {
    id: "latissimus-dorsi",
    name: "背阔肌",
    englishName: "Latissimus dorsi",
    group: "背部",
    view: "back",
    color: "#8f3532",
    function: "参与肩伸、肩内收和肩内旋，是引体向上、下拉和划船中把上臂拉回躯干的重要结构。",
    actions: ["肩伸", "肩内收", "肩内旋"],
    exercises: ["高位下拉", "坐姿划船", "哑铃单臂划船"],
    paths: [
      "M302 183 Q278 211 286 268 L338 289 L338 204 Z",
      "M398 183 Q422 211 414 268 L362 289 L362 204 Z"
    ],
    marker: [303, 236],
    label: [28, 385],
    align: "start"
  },
  {
    id: "erector-spinae",
    name: "竖脊肌",
    englishName: "Erector spinae",
    group: "脊柱",
    view: "back",
    color: "#7f312f",
    function: "帮助脊柱伸展，并在髋铰链、深蹲和硬拉时抵抗躯干前屈。它负责稳定，不等于必须靠腰部主动发力。",
    actions: ["脊柱伸展", "躯干抗屈曲"],
    exercises: ["哑铃罗马尼亚硬拉", "平板支撑"],
    paths: ["M329 260 L347 260 L347 342 L329 342 Z", "M353 260 L371 260 L371 342 L353 342 Z"],
    marker: [350, 303],
    label: [672, 250],
    align: "end"
  },
  {
    id: "gluteus-maximus",
    name: "臀大肌",
    englishName: "Gluteus maximus",
    group: "臀部",
    view: "back",
    color: "#a0423b",
    function: "是强有力的髋伸肌，也参与髋外旋。臀桥、蹲起和髋铰链站起都需要它产生伸髋力量。",
    actions: ["髋伸", "髋外旋"],
    exercises: ["臀桥", "徒手深蹲", "哑铃罗马尼亚硬拉"],
    paths: [
      "M303 345 Q300 382 339 394 L339 345 Z",
      "M397 345 Q400 382 361 394 L361 345 Z"
    ],
    marker: [320, 369],
    label: [28, 465],
    align: "start"
  },
  {
    id: "hamstrings",
    name: "股二头肌",
    englishName: "Biceps femoris",
    group: "大腿后侧",
    view: "back",
    color: "#ac473f",
    function: "跨越髋和膝，既参与髋伸，也参与膝屈。髋铰链动作能重点训练它的髋伸功能。",
    actions: ["髋伸", "膝屈"],
    exercises: ["哑铃罗马尼亚硬拉", "反向箭步蹲", "臀桥"],
    paths: [
      "M303 397 L338 399 L340 505 L310 512 L295 453 Z",
      "M397 397 L362 399 L360 505 L390 512 L405 453 Z"
    ],
    marker: [322, 452],
    label: [28, 535],
    align: "start"
  },
  {
    id: "gastrocnemius",
    name: "腓肠肌",
    englishName: "Gastrocnemius",
    group: "小腿",
    view: "back",
    color: "#913733",
    function: "主要负责踝跖屈，并参与膝屈。提踵和蹬地时推动身体向上或向前。",
    actions: ["踝跖屈", "膝屈"],
    exercises: ["站姿提踵", "徒手深蹲"],
    paths: [
      "M311 535 L340 532 L334 653 Q318 668 306 650 Z",
      "M389 535 L360 532 L366 653 Q382 668 394 650 Z"
    ],
    marker: [323, 602],
    label: [28, 615],
    align: "start"
  },
  {
    id: "soleus",
    name: "比目鱼肌",
    englishName: "Soleus",
    group: "小腿深层",
    view: "back",
    color: "#86322f",
    function: "位于腓肠肌深层的强踝跖屈肌，在膝弯曲时仍能参与蹬地，并承担站立和小腿耐力的重要任务。",
    actions: ["踝跖屈", "姿势稳定"],
    exercises: ["站姿提踵", "徒手深蹲"],
    paths: [
      "M312 616 L338 606 L329 689 L306 679 Z",
      "M388 616 L362 606 L371 689 L394 679 Z"
    ],
    marker: [319, 649],
    label: [672, 662],
    align: "end"
  }
];

const selectedMuscleId = ref("pectoralis-major");

const muscleViews: Array<{ id: MuscleView; label: string; caption: string }> = [
  { id: "front", label: "正面（浅层）", caption: "Front superficial view" },
  { id: "back", label: "背面（浅层）", caption: "Posterior superficial view" }
];

const selectedMuscle = computed(function () {
  return muscleRegions.find((muscle) => muscle.id === selectedMuscleId.value) ?? muscleRegions[0];
});

const selectedViewLabel = computed(function () {
  return selectedMuscle.value?.view === "front" ? "正面浅层" : "背面浅层";
});

function musclesForView(view: MuscleView) {
  return muscleRegions.filter((muscle) => muscle.view === view);
}

function selectMuscle(id: string) {
  selectedMuscleId.value = id;
}
</script>

<template>
  <section class="anatomy-module">
    <div class="anatomy-heading">
      <div>
        <p class="eyebrow">人体肌肉解剖</p>
        <h2>人体全身肌肉解剖图</h2>
      </div>
      <p>了解肌肉，用好肌肉。正面与背面浅层肌群同时展示，点击肌肉区域或名称查看功能与对应动作。</p>
    </div>

    <div class="anatomy-poster">
      <div class="poster-topbar">
        <div>
          <span>FITPLAN ANATOMY</span>
          <strong>人体全身肌肉解剖</strong>
        </div>
        <p>浅层肌群 · 训练学习示意</p>
      </div>

      <div class="anatomy-atlas-grid">
        <article v-for="view in muscleViews" :key="view.id" class="anatomy-plate">
          <div class="anatomy-plate-title">
            <span>{{ view.label }}</span>
            <small>{{ view.caption }}</small>
          </div>

          <div class="anatomy-canvas atlas-canvas">
            <img
              class="realistic-muscle-image"
              :class="'view-' + view.id"
              src="/assets/muscles-front-back.webp"
              alt=""
              aria-hidden="true"
            />
            <svg
              class="muscle-overlay"
              viewBox="0 0 700 760"
              role="img"
              :aria-label="view.id === 'front' ? '人体全身肌肉正面解剖示意图' : '人体全身肌肉背面解剖示意图'"
            >
              <g
                v-for="muscle in musclesForView(view.id)"
                :key="'label-' + muscle.id"
                class="muscle-callout"
                :class="{ selected: selectedMuscle?.id === muscle.id }"
                @click="selectMuscle(muscle.id)"
              >
                <line
                  :x1="muscle.marker[0]"
                  :y1="muscle.marker[1]"
                  :x2="muscle.label[0] + (muscle.align === 'start' ? 12 : -12)"
                  :y2="muscle.label[1] - 5"
                />
                <circle :cx="muscle.marker[0]" :cy="muscle.marker[1]" r="5" />
                <circle
                  class="muscle-hotspot"
                  :cx="muscle.marker[0]"
                  :cy="muscle.marker[1]"
                  r="15"
                  @click.stop="selectMuscle(muscle.id)"
                />
                <text
                  :x="muscle.label[0]"
                  :y="muscle.label[1]"
                  :text-anchor="muscle.align"
                >
                  {{ muscle.name }}
                </text>
              </g>
            </svg>
          </div>
        </article>
      </div>
    </div>

    <aside v-if="selectedMuscle" class="muscle-info muscle-info-wide">
      <div class="muscle-info-main">
        <div class="muscle-info-top">
          <span :style="{ background: selectedMuscle.color }">{{ selectedMuscle.group }}</span>
          <small>{{ selectedViewLabel }}</small>
        </div>
        <h3>{{ selectedMuscle.name }}</h3>
        <p class="muscle-english">{{ selectedMuscle.englishName }}</p>
        <p>{{ selectedMuscle.function }}</p>
      </div>

      <div class="muscle-info-details">
        <div class="muscle-detail-block">
          <strong>相关关节动作</strong>
          <div>
            <span v-for="action in selectedMuscle.actions" :key="action">{{ action }}</span>
          </div>
        </div>

        <div class="muscle-detail-block">
          <strong>对应动作</strong>
          <div>
            <span v-for="exercise in selectedMuscle.exercises" :key="exercise">{{ exercise }}</span>
          </div>
        </div>
      </div>
    </aside>

    <div class="muscle-legend" aria-label="全部肌肉列表">
      <button
        v-for="muscle in muscleRegions"
        :key="muscle.id"
        type="button"
        :class="{ active: selectedMuscle?.id === muscle.id }"
        @click="selectMuscle(muscle.id)"
      >
        <i :style="{ background: muscle.color }"></i>
        {{ muscle.name }}
      </button>
    </div>

    <p class="anatomy-note">
      本页在医学插画上叠加中文训练标注，用于定位浅层主要肌群和动作方向，不用于医学诊断，也不代表全部深层肌肉、血管和神经结构。
    </p>
    <p class="anatomy-credit">
      解剖插画：OpenStax、Tomáš Kebert 与 umimeto.org，
      <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">
        CC BY-SA 4.0
      </a>
      ；本页裁切并叠加中文训练标注。
      <a
        href="https://commons.wikimedia.org/wiki/File:Muscles_front_and_back.svg"
        target="_blank"
        rel="noreferrer"
      >
        查看原始素材
      </a>
      。
    </p>
  </section>
</template>
