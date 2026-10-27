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
    id: "pectoralis-major",
    name: "胸大肌",
    englishName: "Pectoralis major",
    group: "胸部",
    view: "front",
    color: "#ef7258",
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
    color: "#ec9c3c",
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
    color: "#8caf51",
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
    color: "#d8ac38",
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
    color: "#c79332",
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
    id: "quadriceps",
    name: "股四头肌",
    englishName: "Quadriceps femoris",
    group: "腿部",
    view: "front",
    color: "#6ca16c",
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
    id: "tibialis-anterior",
    name: "胫骨前肌",
    englishName: "Tibialis anterior",
    group: "小腿",
    view: "front",
    color: "#55978b",
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
    id: "trapezius",
    name: "斜方肌",
    englishName: "Trapezius",
    group: "背部与肩胛",
    view: "back",
    color: "#558fb8",
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
    color: "#de9948",
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
    color: "#7ea252",
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
    color: "#3e83ad",
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
    color: "#8b86b8",
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
    color: "#688e68",
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
    name: "腘绳肌",
    englishName: "Hamstrings",
    group: "大腿后侧",
    view: "back",
    color: "#62946e",
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
    color: "#529687",
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
  }
];

const activeView = ref<MuscleView>("front");
const selectedMuscleId = ref("pectoralis-major");

const visibleMuscles = computed(function () {
  return muscleRegions.filter((muscle) => muscle.view === activeView.value);
});

const selectedMuscle = computed(function () {
  return (
    muscleRegions.find((muscle) => muscle.id === selectedMuscleId.value) ??
    visibleMuscles.value[0] ??
    muscleRegions[0]
  );
});

function setView(view: MuscleView) {
  activeView.value = view;
  selectedMuscleId.value = muscleRegions.find((muscle) => muscle.view === view)?.id ?? "";
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
        <h2>从肌肉位置理解它在训练中的角色</h2>
      </div>
      <p>切换正面和背面，点击人体图上的肌肉或下方名称，查看主要功能、关节动作与对应练习。</p>
    </div>

    <div class="anatomy-toolbar">
      <div role="tablist" aria-label="选择人体视角">
        <button
          type="button"
          role="tab"
          :aria-selected="activeView === 'front'"
          :class="{ active: activeView === 'front' }"
          @click="setView('front')"
        >
          正面观
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeView === 'back'"
          :class="{ active: activeView === 'back' }"
          @click="setView('back')"
        >
          背面观
        </button>
      </div>
      <span>点击肌肉区域或直接点击名称</span>
    </div>

    <div class="anatomy-layout">
      <div class="anatomy-canvas">
        <svg
          viewBox="0 0 700 760"
          role="img"
          :aria-label="activeView === 'front' ? '人体肌肉正面示意图' : '人体肌肉背面示意图'"
        >
          <defs>
            <linearGradient id="bodyFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#efe9df" />
              <stop offset="1" stop-color="#ddd5c8" />
            </linearGradient>
            <filter id="muscleShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#1f3426" flood-opacity=".14" />
            </filter>
          </defs>

          <g class="body-base">
            <ellipse cx="350" cy="73" rx="43" ry="54" />
            <path d="M327 119 L373 119 L382 155 L318 155 Z" />
            <path d="M300 150 Q274 157 269 201 L275 303 Q281 336 304 350 L396 350 Q419 336 425 303 L431 201 Q426 157 400 150 Z" />
            <path d="M281 164 Q251 181 245 235 L218 345 Q222 360 240 354 L261 255 L291 201 Z" />
            <path d="M419 164 Q449 181 455 235 L482 345 Q478 360 460 354 L439 255 L409 201 Z" />
            <path d="M304 346 Q286 366 288 435 L294 536 L311 695 L338 695 L340 545 L350 350 Z" />
            <path d="M396 346 Q414 366 412 435 L406 536 L389 695 L362 695 L360 545 L350 350 Z" />
          </g>

          <g v-if="activeView === 'front'" class="muscle-layer">
            <g
              v-for="muscle in visibleMuscles"
              :key="muscle.id"
              class="muscle-region"
              :class="{ selected: selectedMuscle?.id === muscle.id }"
              @click="selectMuscle(muscle.id)"
            >
              <path
                v-for="(path, index) in muscle.paths"
                :key="index"
                :d="path"
                :fill="muscle.color"
              />
            </g>
          </g>

          <g v-else class="muscle-layer">
            <g
              v-for="muscle in visibleMuscles"
              :key="muscle.id"
              class="muscle-region"
              :class="{ selected: selectedMuscle?.id === muscle.id }"
              @click="selectMuscle(muscle.id)"
            >
              <path
                v-for="(path, index) in muscle.paths"
                :key="index"
                :d="path"
                :fill="muscle.color"
              />
            </g>
          </g>

          <g
            v-for="muscle in visibleMuscles"
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

      <aside v-if="selectedMuscle" class="muscle-info">
        <div class="muscle-info-top">
          <span :style="{ background: selectedMuscle.color }">{{ selectedMuscle.group }}</span>
          <small>{{ activeView === "front" ? "正面观" : "背面观" }}</small>
        </div>
        <h3>{{ selectedMuscle.name }}</h3>
        <p class="muscle-english">{{ selectedMuscle.englishName }}</p>
        <p>{{ selectedMuscle.function }}</p>

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
      </aside>
    </div>

    <div class="muscle-legend" aria-label="当前视角肌肉列表">
      <button
        v-for="muscle in visibleMuscles"
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
      本图为训练教学用的简化示意图，用于定位主要肌群和动作方向，不用于医学诊断，也不代表全部深层肌肉。
    </p>
  </section>
</template>
