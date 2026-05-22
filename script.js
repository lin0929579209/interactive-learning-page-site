const roles = {
  warehouse: {
    title: "倉庫作業注意事項",
    summary: "交付採購前，倉庫要確認提單、憑單蓋章與版本正確；運費分攤也要依差異金額使用正確處理方式。",
    tasks: [
      ["安捷倫提單", "確認是否已 KEY 入系統。"],
      ["進貨憑單", "確認倉管人員已完成蓋章。"],
      ["最新版本", "交付採購前先確認進貨憑單是否為最新版本；交付後有修改，必須重新列印並交付最新版本。"],
      ["運費分攤", "使用正航系統「批次變更單價」。台幣 2 元以下、外幣 0.02 以下，統一調整於第一、第二項目中；超過則 KEY 入 Excel 對照。"]
    ]
  },
  purchase: {
    title: "採購作業注意事項",
    summary: "採購需確認發票、進貨單、系統資料與付款資訊正確，並在送交會計前備齊文件與簽章。",
    tasks: [
      ["發票提供", "手開發票、三聯式收銀機統一發票提供二聯；非感熱紙電子發票提供兩張；感熱紙電子發票提供本張一張及影本兩張。"],
      ["進貨單初檢", "收到進貨單先檢查安捷倫提單號碼是否有誤或空白，以及倉庫人員是否蓋章；有問題退回倉管。"],
      ["一致性檢查", "安捷倫進貨單使用 RPA；其他廠商需檢查品名、數量、金額是否與發票一致。"],
      ["系統發票", "系統發票 KEY 完後，再次確認發票格式、字軌、號碼及金額。"],
      ["付款與急件", "沖暫付款、預付貨款、暫估購料時確認付款方式與備註單號；急件確認付款日，無法如期出款時同步修改確定付款日並於紙本修改蓋章。"],
      ["送交會計", "備齊進貨憑單、廠商出貨單或報價單、發票，並確認修改處及左下角採購人員已簽名或蓋章。"]
    ]
  },
  accounting: {
    title: "會計退件回覆時限",
    summary: "退件後需依時間點完成回覆，急件出款與月底關帳必須優先處理，避免影響付款與結帳。",
    tasks: [
      ["上午退件", "請於當日下午 16:30 前提供。"],
      ["下午退件", "請於隔日上午 11:00 前提供。"],
      ["急件與月底", "急件出款或月底關帳退回後，請立即優先處理。"]
    ]
  }
};

const checks = [
  "安捷倫提單已 KEY 入系統，且號碼不空白、不錯誤。",
  "進貨憑單已由倉管蓋章，且是最新版本。",
  "發票份數與類型符合規定。",
  "品名、數量、金額已依廠商類型完成檢查。",
  "系統發票格式、字軌、號碼及金額已再次確認。",
  "送交會計文件已備齊，簽名或蓋章位置完整。",
  "急件付款日、確定付款日與紙本修改蓋章一致。"
];

const scenarios = [
  {
    prompt: "交付採購後，進貨憑單內容又被修改了。下一步應該怎麼做？",
    choices: ["口頭通知採購即可", "重新列印最新版本並提供給負責採購人員", "等會計退件再補"],
    answer: 1,
    feedback: "正確。交付後若有任何修改，務必重新列印並提供最新版本。"
  },
  {
    prompt: "運費分攤差異為台幣 3 元，應如何處理？",
    choices: ["調整於第一、第二項目中", "不用處理", "KEY 入 Excel 進行對照"],
    answer: 2,
    feedback: "正確。台幣超過 2 元時，要將金額 KEY 入 Excel 對照。"
  },
  {
    prompt: "下午收到會計退件，回覆期限是什麼時候？",
    choices: ["當日下午 16:30 前", "隔日上午 11:00 前", "月底前即可"],
    answer: 1,
    feedback: "正確。下午退件請於隔日上午 11:00 前提供。"
  }
];

const quiz = [
  {
    q: "安捷倫進貨單應使用哪一項方式檢查？",
    options: ["人工逐筆即可", "RPA 檢查", "只看發票金額"],
    answer: 1
  },
  {
    q: "感熱紙電子發票需要提供哪些資料？",
    options: ["感熱紙本發票一張與影印兩張", "只提供影本一張", "只提供電子檔"],
    answer: 0
  },
  {
    q: "除安捷倫外，其他廠商需檢查什麼是否與發票一致？",
    options: ["品名、數量及金額", "付款日與備註", "倉庫人員姓名"],
    answer: 0
  },
  {
    q: "上午退件的回覆期限為何？",
    options: ["當日下午 16:30 前", "隔日上午 11:00 前", "三天內"],
    answer: 0
  },
  {
    q: "廠商出貨單或報價單無法提供時，應如何處理？",
    options: ["略過即可", "於進貨憑單備註說明原因", "改附電子郵件截圖即可"],
    answer: 1
  }
];

let scenarioIndex = 0;
const completed = new Set();

function renderRole(roleKey) {
  const role = roles[roleKey];
  const panel = document.querySelector("#rolePanel");
  panel.innerHTML = `
    <div class="roleGrid">
      <div class="roleSummary">
        <p class="eyebrow">目前角色</p>
        <h2>${role.title}</h2>
        <p>${role.summary}</p>
      </div>
      <div class="taskList">
        ${role.tasks.map(task => `
          <div class="taskItem">
            <strong>${task[0]}</strong>
            <p>${task[1]}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  completed.add(`role-${roleKey}`);
  updateProgress();
}

function renderChecklist() {
  const box = document.querySelector("#checklist");
  box.innerHTML = checks.map((item, index) => `
    <label class="checkRow">
      <input type="checkbox" data-check="${index}">
      <span>${item}</span>
    </label>
  `).join("");

  box.addEventListener("change", event => {
    if (event.target.matches("input[type='checkbox']")) {
      const id = `check-${event.target.dataset.check}`;
      if (event.target.checked) {
        completed.add(id);
      } else {
        completed.delete(id);
      }
      updateProgress();
    }
  });
}

function renderScenario() {
  const data = scenarios[scenarioIndex];
  const box = document.querySelector("#scenario");
  box.innerHTML = `
    <p class="scenarioPrompt">${data.prompt}</p>
    <div class="choiceGrid">
      ${data.choices.map((choice, index) => `
        <button class="choice" type="button" data-choice="${index}">${choice}</button>
      `).join("")}
    </div>
    <p class="feedback"></p>
  `;
}

function renderQuiz() {
  const list = document.querySelector("#quizList");
  list.innerHTML = quiz.map((item, qIndex) => `
    <div class="question">
      <h3>${qIndex + 1}. ${item.q}</h3>
      ${item.options.map((option, oIndex) => `
        <label class="optionLine">
          <input type="radio" name="q${qIndex}" value="${oIndex}">
          ${option}
        </label>
      `).join("")}
    </div>
  `).join("");
}

function updateProgress() {
  const total = 3 + checks.length + scenarios.length + 1;
  const percent = Math.round((completed.size / total) * 100);
  document.querySelector("#progressText").textContent = `${Math.min(percent, 100)}%`;
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(item => item.classList.remove("active"));
    tab.classList.add("active");
    renderRole(tab.dataset.role);
  });
});

document.querySelector("#scenario").addEventListener("click", event => {
  if (!event.target.matches(".choice")) return;
  const selected = Number(event.target.dataset.choice);
  const data = scenarios[scenarioIndex];
  const buttons = document.querySelectorAll(".choice");
  buttons.forEach(button => button.disabled = true);
  event.target.classList.add(selected === data.answer ? "correct" : "wrong");
  buttons[data.answer].classList.add("correct");
  document.querySelector(".feedback").textContent = selected === data.answer ? data.feedback : `再確認一下：${data.feedback}`;
  completed.add(`scenario-${scenarioIndex}`);
  updateProgress();

  window.setTimeout(() => {
    scenarioIndex = (scenarioIndex + 1) % scenarios.length;
    renderScenario();
  }, 1800);
});

document.querySelector("#submitQuiz").addEventListener("click", () => {
  let score = 0;
  quiz.forEach((item, index) => {
    const selected = document.querySelector(`input[name="q${index}"]:checked`);
    if (selected && Number(selected.value) === item.answer) score += 1;
  });
  document.querySelector("#quizResult").textContent = `你答對 ${score} / ${quiz.length} 題。${score === quiz.length ? "已掌握重點，可以上線執行。" : "請回到上方角色重點再複習一次。"}`;
  if (score === quiz.length) completed.add("quiz");
  updateProgress();
});

renderRole("warehouse");
renderChecklist();
renderScenario();
renderQuiz();
