const plans = {
  "three-days": {
    name: "每周三练",
    note: "稳定完成三次全身训练，记录今天的第一组数据。",
    exercises: ["深蹲", "卧推", "坐姿划船"]
  },
  beginner: {
    name: "新手全身",
    note: "动作质量优先，选择能够稳定完成的重量。",
    exercises: ["徒手深蹲", "俯卧撑", "臀桥"]
  },
  home: {
    name: "居家训练",
    note: "不需要器械，留出能够安全活动的空间。",
    exercises: ["深蹲", "跪姿俯卧撑", "平板支撑"]
  }
};

const STORAGE_KEY = "fitplan_workouts";
const planSection = document.querySelector("#plans");
const recentSection = document.querySelector("#recent");

function readRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(records) ? records : [];
  } catch (error) {
    console.warn("无法读取训练记录", error);
    return [];
  }
}

function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch (error) {
    console.warn("无法保存训练记录", error);
    return false;
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date(value));
}

function exerciseFields(exercise, index) {
  return [
    '<fieldset class="exercise-fieldset">',
    '<legend><span>', String(index + 1).padStart(2, "0"), '</span>', exercise, '</legend>',
    '<div class="exercise-fields">',
    '<label>重量（kg）<input name="weight-', index, '" type="number" min="0" step="0.5" value="0" required></label>',
    '<label>次数<input name="reps-', index, '" type="number" min="1" max="100" value="10" required></label>',
    '<label>组数<input name="sets-', index, '" type="number" min="1" max="20" value="3" required></label>',
    '</div>',
    '</fieldset>'
  ].join("");
}

function openWorkout(planId) {
  const plan = plans[planId];
  if (!plan) return;

  let panel = document.querySelector("#workout-panel");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "workout-panel";
    panel.className = "workout-panel";
    panel.setAttribute("aria-live", "polite");
    planSection.insertAdjacentElement("afterend", panel);
  }

  panel.hidden = false;
  panel.innerHTML = [
    '<div class="workout-heading">',
    '<div><p class="eyebrow">今日训练</p><h2>', plan.name, '</h2><p>', plan.note, '</p></div>',
    '<button class="close-button" type="button" data-close-training aria-label="关闭训练表单">×</button>',
    '</div>',
    '<form id="workout-form">',
    plan.exercises.map(exerciseFields).join(""),
    '<button class="save-workout" type="submit">保存本次训练</button>',
    '</form>'
  ].join("");

  panel.querySelector("[data-close-training]").addEventListener("click", function () {
    panel.hidden = true;
  });

  panel.querySelector("#workout-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const entries = plan.exercises.map(function (exercise, index) {
      return {
        name: exercise,
        weight: Number(formData.get("weight-" + index)),
        reps: Number(formData.get("reps-" + index)),
        sets: Number(formData.get("sets-" + index))
      };
    });

    const record = {
      id: window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : String(Date.now()),
      date: new Date().toISOString(),
      plan: plan.name,
      entries: entries
    };
    const records = readRecords();
    records.unshift(record);

    if (!saveRecords(records)) {
      showToast("浏览器未允许保存记录");
      return;
    }

    renderRecords(records);
    panel.hidden = true;
    showToast("训练记录已保存");
    recentSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderRecords(records) {
  const heading = recentSection.querySelector(".section-heading");
  recentSection.querySelectorAll(".empty-state, .record-list").forEach(function (element) {
    element.remove();
  });

  if (!records.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = '<span class="empty-icon">＋</span><h3>还没有训练记录</h3><p>选择计划并记录你的第一次训练。</p><a href="#plans">开始第一次训练</a>';
    recentSection.appendChild(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "record-list";
  list.innerHTML = records.slice(0, 10).map(function (record) {
    const summary = record.entries.map(function (entry) {
      return "<li><strong>" + entry.name + "</strong><span>" +
        entry.weight + " kg · " + entry.sets + " 组 × " + entry.reps + " 次</span></li>";
    }).join("");

    return '<article class="workout-record"><div class="record-head"><div><p class="eyebrow">' +
      formatDate(record.date) + '</p><h3>' + record.plan + '</h3></div><span class="record-badge">已完成</span></div><ul>' + summary + '</ul></article>';
  }).join("");

  recentSection.insertBefore(list, heading ? heading.nextSibling : null);
}

function showToast(message) {
  let toast = document.querySelector("#fitplan-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "fitplan-toast";
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(function () {
    toast.classList.remove("is-visible");
  }, 2600);
}

document.querySelectorAll("[data-plan]").forEach(function (button) {
  button.addEventListener("click", function () {
    openWorkout(button.dataset.plan);
  });
});

renderRecords(readRecords());
